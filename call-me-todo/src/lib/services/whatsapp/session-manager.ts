import type { SupabaseClient } from '@supabase/supabase-js';
import type { WhatsAppSession, SessionContext } from '$lib/db/whatsapp-schema';

export class WhatsAppSessionManager {
  private supabase: SupabaseClient;
  private sessionCache: Map<string, WhatsAppSession> = new Map();

  constructor(supabase: SupabaseClient) {
    this.supabase = supabase;
  }

  async getOrCreateSession(phoneNumber: string): Promise<WhatsAppSession> {
    // Check cache first
    const cached = this.sessionCache.get(phoneNumber);
    if (cached && this.isSessionValid(cached)) {
      return cached;
    }

    // Try to get existing session from database
    const { data: existingSession, error: fetchError } = await this.supabase
      .from('whatsapp_sessions')
      .select('*')
      .eq('phone_number', phoneNumber)
      .single();

    if (existingSession && !fetchError) {
      // Check if session is expired
      if (this.isSessionValid(existingSession)) {
        this.sessionCache.set(phoneNumber, existingSession);
        return existingSession;
      } else {
        // Session expired, update status
        await this.updateSession(existingSession.id, { 
          session_status: 'expired' 
        });
      }
    }

    // Check if this phone number belongs to an existing user
    const { data: userProfile } = await this.supabase
      .from('user_profiles')
      .select('id')
      .eq('whatsapp_number', phoneNumber)
      .single();

    // Create new session
    const newSession = {
      phone_number: phoneNumber,
      user_id: userProfile?.id || null,
      session_type: userProfile ? 'registered' : 'guest',
      session_status: 'active',
      context: this.createDefaultContext(),
      conversation_state: 'idle',
      temp_task_count: 0,
      last_interaction: new Date().toISOString(),
      expires_at: this.calculateExpiryDate(userProfile ? 'registered' : 'guest'),
    };

    const { data: createdSession, error: createError } = await this.supabase
      .from('whatsapp_sessions')
      .insert(newSession)
      .select()
      .single();

    if (createError) {
      console.error('Failed to create session:', createError);
      throw new Error('Failed to create WhatsApp session');
    }

    this.sessionCache.set(phoneNumber, createdSession);

    // Send welcome message for new sessions
    if (!userProfile) {
      await this.sendWelcomeMessage(phoneNumber);
    }

    return createdSession;
  }

  async getSession(sessionId: string): Promise<WhatsAppSession | null> {
    const { data, error } = await this.supabase
      .from('whatsapp_sessions')
      .select('*')
      .eq('id', sessionId)
      .single();

    if (error || !data) {
      return null;
    }

    return data;
  }

  async updateSession(sessionId: string, updates: Partial<WhatsAppSession>): Promise<void> {
    const { error } = await this.supabase
      .from('whatsapp_sessions')
      .update({
        ...updates,
        last_interaction: new Date().toISOString(),
      })
      .eq('id', sessionId);

    if (error) {
      console.error('Failed to update session:', error);
      throw new Error('Failed to update session');
    }

    // Clear cache entry
    for (const [phone, session] of this.sessionCache.entries()) {
      if (session.id === sessionId) {
        this.sessionCache.delete(phone);
        break;
      }
    }
  }

  async updateContext(sessionId: string, contextUpdate: Partial<SessionContext>): Promise<void> {
    const session = await this.getSession(sessionId);
    if (!session) {
      throw new Error('Session not found');
    }

    const currentContext = (session.context as SessionContext) || this.createDefaultContext();
    const newContext = {
      ...currentContext,
      ...contextUpdate,
    };

    // Add to conversation history if there's a state change
    if (contextUpdate.currentState && contextUpdate.currentState !== currentContext.currentState) {
      newContext.conversationHistory.push({
        role: 'assistant',
        content: `State changed to: ${contextUpdate.currentState}`,
        timestamp: new Date().toISOString(),
      });
    }

    await this.updateSession(sessionId, { context: newContext });
  }

  async addToConversationHistory(
    sessionId: string, 
    role: 'user' | 'assistant', 
    content: string
  ): Promise<void> {
    const session = await this.getSession(sessionId);
    if (!session) {
      throw new Error('Session not found');
    }

    const context = (session.context as SessionContext) || this.createDefaultContext();
    
    // Keep only last 20 messages for context
    if (context.conversationHistory.length >= 20) {
      context.conversationHistory.shift();
    }

    context.conversationHistory.push({
      role,
      content,
      timestamp: new Date().toISOString(),
    });

    await this.updateSession(sessionId, { context });
  }

  async linkSessionToUser(sessionId: string, userId: string): Promise<void> {
    await this.updateSession(sessionId, {
      user_id: userId,
      session_type: 'registered',
      expires_at: this.calculateExpiryDate('registered'),
    });

    // Migrate any guest tasks to the user
    await this.migrateGuestTasks(sessionId, userId);
  }

  private async migrateGuestTasks(sessionId: string, userId: string): Promise<void> {
    // Update all tasks created with session ID to use the actual user ID
    const { error } = await this.supabase
      .from('tasks')
      .update({ user_id: userId })
      .eq('user_id', sessionId);

    if (error) {
      console.error('Failed to migrate guest tasks:', error);
    }

    // Also migrate any media
    const { error: mediaError } = await this.supabase
      .from('whatsapp_media')
      .update({ user_id: userId })
      .eq('phone_number', (await this.getSession(sessionId))?.phone_number);

    if (mediaError) {
      console.error('Failed to migrate guest media:', mediaError);
    }
  }

  private isSessionValid(session: WhatsAppSession): boolean {
    if (session.session_status === 'expired' || session.session_status === 'inactive') {
      return false;
    }

    const expiryDate = new Date(session.expires_at);
    const now = new Date();
    
    return now < expiryDate;
  }

  private calculateExpiryDate(sessionType: 'guest' | 'registered' | 'premium'): string {
    const now = new Date();
    
    switch (sessionType) {
      case 'guest':
        // Guest sessions expire after 7 days
        now.setDate(now.getDate() + 7);
        break;
      case 'registered':
        // Registered sessions expire after 30 days of inactivity
        now.setDate(now.getDate() + 30);
        break;
      case 'premium':
        // Premium sessions expire after 90 days of inactivity
        now.setDate(now.getDate() + 90);
        break;
    }

    return now.toISOString();
  }

  private createDefaultContext(): SessionContext {
    return {
      currentState: 'idle',
      conversationHistory: [],
      userPreferences: {
        confirmBeforeCreate: true,
        language: 'en',
      },
    };
  }

  private async sendWelcomeMessage(phoneNumber: string): Promise<void> {
    // This would typically trigger a WhatsApp template message
    // For now, we'll just log it
    console.log(`📱 Welcome message queued for ${phoneNumber}`);
  }

  async cleanupExpiredSessions(): Promise<void> {
    const { error } = await this.supabase
      .from('whatsapp_sessions')
      .update({ session_status: 'expired' })
      .lt('expires_at', new Date().toISOString())
      .eq('session_status', 'active');

    if (error) {
      console.error('Failed to cleanup expired sessions:', error);
    }

    // Clear cache
    this.sessionCache.clear();
  }

  async getSessionStats(userId: string): Promise<{
    totalSessions: number;
    activeSessions: number;
    totalMessages: number;
    totalMedia: number;
  }> {
    // Get session stats
    const { data: sessions } = await this.supabase
      .from('whatsapp_sessions')
      .select('id, session_status')
      .eq('user_id', userId);

    const activeSessions = sessions?.filter(s => s.session_status === 'active').length || 0;

    // Get message count
    const { count: messageCount } = await this.supabase
      .from('whatsapp_conversations')
      .select('*', { count: 'exact', head: true })
      .in('session_id', sessions?.map(s => s.id) || []);

    // Get media count
    const { count: mediaCount } = await this.supabase
      .from('whatsapp_media')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId);

    return {
      totalSessions: sessions?.length || 0,
      activeSessions,
      totalMessages: messageCount || 0,
      totalMedia: mediaCount || 0,
    };
  }
}