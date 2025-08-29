import type { SupabaseClient } from '@supabase/supabase-js';
import type { WhatsAppSessionManager } from './session-manager';
import { WhatsAppAIHandler } from './ai-handler';
import { WhatsAppMediaProcessor } from './media-processor';
import { parseTaskFromNaturalLanguageEnhanced } from '$lib/ai/parser.enhanced';
import type { SessionContext } from '$lib/db/whatsapp-schema';

export interface ProcessMessageOptions {
  sessionId: string;
  phoneNumber: string;
  message?: string;
  mediaUrl?: string;
  mediaContentType?: string;
  caption?: string;
}

export interface MessageResponse {
  message: string;
  mediaUrl?: string;
  buttons?: Array<{ id: string; title: string }>;
  listItems?: Array<{ id: string; title: string; description?: string }>;
}

export class WhatsAppMessageProcessor {
  private supabase: SupabaseClient;
  private sessionManager: WhatsAppSessionManager;
  private aiHandler: WhatsAppAIHandler;
  private mediaProcessor: WhatsAppMediaProcessor;

  constructor(supabase: SupabaseClient, sessionManager: WhatsAppSessionManager) {
    this.supabase = supabase;
    this.sessionManager = sessionManager;
    this.aiHandler = new WhatsAppAIHandler(supabase);
    this.mediaProcessor = new WhatsAppMediaProcessor(supabase);
  }

  async processTextMessage(options: ProcessMessageOptions): Promise<MessageResponse> {
    const { sessionId, phoneNumber, message } = options;

    if (!message) {
      return {
        message: "I didn't receive any text. Please send me a task, question, or command.",
      };
    }

    // Get session context
    const session = await this.sessionManager.getSession(sessionId);
    if (!session) {
      return {
        message: "Session expired. Please start a new conversation.",
      };
    }

    const context = session.context as SessionContext || {};

    // Check for special commands
    const command = this.detectCommand(message);
    if (command) {
      return await this.handleCommand(command, session);
    }

    // Check if we're in a multi-turn conversation
    if (context.currentState !== 'idle') {
      return await this.handleConversationState(session, message);
    }

    // Process as new intent
    const intent = await this.aiHandler.detectIntent(message);
    console.log('🤖 Detected intent:', intent);

    switch (intent.type) {
      case 'create_task':
        return await this.handleCreateTask(session, message, intent);
      
      case 'list_tasks':
        return await this.handleListTasks(session, intent);
      
      case 'complete_task':
        return await this.handleCompleteTask(session, message, intent);
      
      case 'update_task':
        return await this.handleUpdateTask(session, message, intent);
      
      case 'greeting':
        return await this.handleGreeting(session);
      
      case 'help':
        return await this.handleHelp(session);
      
      case 'signup':
        return await this.handleSignup(session);
      
      default:
        return await this.aiHandler.generateResponse(message, context);
    }
  }

  async processMediaMessage(options: ProcessMessageOptions): Promise<MessageResponse> {
    const { sessionId, phoneNumber, mediaUrl, mediaContentType, caption } = options;

    if (!mediaUrl) {
      return {
        message: "I didn't receive any media. Please try sending the image again.",
      };
    }

    const session = await this.sessionManager.getSession(sessionId);
    if (!session) {
      return {
        message: "Session expired. Please start a new conversation.",
      };
    }

    // Process the media
    const mediaResult = await this.mediaProcessor.processMedia({
      userId: session.userId,
      phoneNumber,
      mediaUrl,
      mediaContentType: mediaContentType || 'image/jpeg',
      caption,
    });

    if (!mediaResult.success) {
      return {
        message: `Sorry, I couldn't process your ${mediaResult.mediaType}. ${mediaResult.error || 'Please try again.'}`,
      };
    }

    // Generate response based on what was extracted
    if (mediaResult.extractedTasks && mediaResult.extractedTasks.length > 0) {
      const taskList = mediaResult.extractedTasks.map((t, i) => `${i + 1}. ${t.title}`).join('\n');
      return {
        message: `I found ${mediaResult.extractedTasks.length} task(s) in your ${mediaResult.mediaType}:\n\n${taskList}\n\nShould I add all of these tasks? Reply 'yes' to confirm or tell me which numbers to add.`,
      };
    }

    if (mediaResult.receiptData) {
      const { vendor, amount, date } = mediaResult.receiptData;
      return {
        message: `I see a receipt from ${vendor} for $${amount} dated ${date}.\n\nShould I:\n1️⃣ Create a payment reminder\n2️⃣ Save for expense tracking\n3️⃣ Both\n4️⃣ Just save the receipt`,
      };
    }

    if (mediaResult.contactData) {
      const { name, company, email, phone } = mediaResult.contactData;
      return {
        message: `Contact detected:\n👤 ${name}${company ? ` - ${company}` : ''}\n${email ? `📧 ${email}\n` : ''}${phone ? `📱 ${phone}\n` : ''}\n\nShould I:\n1️⃣ Create a follow-up reminder\n2️⃣ Save contact details\n3️⃣ Both`,
      };
    }

    return {
      message: `I've saved your ${mediaResult.mediaType}. ${mediaResult.extractedText ? `I can see: "${mediaResult.extractedText.substring(0, 100)}..."` : 'However, I couldn\'t extract any text from it.'}\n\nYou can ask me to create tasks from this image or just keep it for reference.`,
    };
  }

  private detectCommand(message: string): string | null {
    const lowerMessage = message.toLowerCase().trim();
    
    const commands: { [key: string]: string[] } = {
      'help': ['help', 'commands', 'what can you do', '?'],
      'list': ['list', 'show tasks', 'what do i have', 'my tasks', 'today'],
      'signup': ['sign up', 'signup', 'register', 'create account'],
      'settings': ['settings', 'preferences', 'config'],
      'delete_all': ['delete all', 'clear all', 'remove everything'],
    };

    for (const [command, triggers] of Object.entries(commands)) {
      if (triggers.some(trigger => lowerMessage.includes(trigger))) {
        return command;
      }
    }

    return null;
  }

  private async handleCommand(command: string, session: any): Promise<MessageResponse> {
    switch (command) {
      case 'help':
        return await this.handleHelp(session);
      
      case 'list':
        return await this.handleListTasks(session, { type: 'list_tasks', confidence: 1 });
      
      case 'signup':
        return await this.handleSignup(session);
      
      case 'settings':
        return {
          message: `⚙️ Your Settings:\n\n📱 Phone: ${session.phoneNumber}\n👤 Account: ${session.sessionType}\n🔔 Reminders: Enabled\n🗣️ Language: English\n\nWhat would you like to change?`,
        };
      
      case 'delete_all':
        // Set conversation state to confirm deletion
        await this.sessionManager.updateContext(session.id, {
          currentState: 'confirming',
          pendingAction: { type: 'delete_all' },
        });
        return {
          message: `⚠️ Are you sure you want to delete ALL your tasks? This cannot be undone.\n\nReply 'yes' to confirm or 'no' to cancel.`,
        };
      
      default:
        return { message: "I didn't understand that command. Send 'help' to see what I can do." };
    }
  }

  private async handleConversationState(session: any, message: string): Promise<MessageResponse> {
    const context = session.context as SessionContext;

    switch (context.currentState) {
      case 'collecting_task':
        return await this.continueTaskCollection(session, message, context);
      
      case 'confirming':
        return await this.handleConfirmation(session, message, context);
      
      case 'processing_image':
        return await this.handleImageTaskSelection(session, message, context);
      
      default:
        // Reset to idle if unknown state
        await this.sessionManager.updateContext(session.id, { currentState: 'idle' });
        return await this.processTextMessage({ sessionId: session.id, phoneNumber: session.phoneNumber, message });
    }
  }

  private async handleCreateTask(session: any, message: string, intent: any): Promise<MessageResponse> {
    // Parse the task from natural language
    const userPhone = session.phoneNumber;
    const parsedTask = await parseTaskFromNaturalLanguageEnhanced(
      message,
      userPhone,
      'Africa/Nairobi' // TODO: Get from user profile
    );

    // For guest users, check task limit
    if (session.sessionType === 'guest') {
      const taskCount = session.tempTaskCount || 0;
      if (taskCount >= 10) {
        return {
          message: `You've reached the 10-task limit for guest accounts.\n\nTo continue adding tasks, please sign up for a free account. Reply 'signup' to get started!`,
        };
      }
    }

    // Create the task
    const { data: task, error } = await this.supabase
      .from('tasks')
      .insert({
        user_id: session.userId || session.id, // Use session ID for guests
        title: parsedTask.title,
        description: parsedTask.description,
        phone_number: parsedTask.phoneNumber || userPhone,
        scheduled_at: parsedTask.scheduledAt.toISOString(),
        due_date: parsedTask.dueDate?.toISOString(),
        priority: parsedTask.priority,
        tags: parsedTask.tags,
        source: 'whatsapp',
      })
      .select()
      .single();

    if (error) {
      console.error('Failed to create task:', error);
      return {
        message: "Sorry, I couldn't create that task. Please try again or contact support if the issue persists.",
      };
    }

    // Update task count for guest users
    if (session.sessionType === 'guest') {
      await this.sessionManager.updateSession(session.id, {
        tempTaskCount: (session.tempTaskCount || 0) + 1,
      });
    }

    const formattedTime = new Date(parsedTask.scheduledAt).toLocaleString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });

    return {
      message: `✅ Task created!\n\n📋 "${parsedTask.title}"\n⏰ Reminder: ${formattedTime}\n📱 Call to: ${parsedTask.phoneNumber === userPhone ? 'You' : parsedTask.recipient}\n🎯 Priority: ${parsedTask.priority}\n\nI'll call ${parsedTask.phoneNumber === userPhone ? 'you' : parsedTask.recipient} at the scheduled time.`,
    };
  }

  private async handleListTasks(session: any, intent: any): Promise<MessageResponse> {
    const userId = session.userId || session.id;
    
    // Get today's tasks
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const { data: tasks, error } = await this.supabase
      .from('tasks')
      .select('*')
      .eq('user_id', userId)
      .gte('scheduled_at', today.toISOString())
      .lt('scheduled_at', tomorrow.toISOString())
      .eq('status', 'pending')
      .order('scheduled_at', { ascending: true });

    if (error) {
      console.error('Failed to fetch tasks:', error);
      return {
        message: "Sorry, I couldn't fetch your tasks. Please try again.",
      };
    }

    if (!tasks || tasks.length === 0) {
      return {
        message: "You don't have any tasks scheduled for today. Send me a task to get started!",
      };
    }

    const taskList = tasks.map((task, i) => {
      const time = new Date(task.scheduled_at).toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      });
      const priority = task.priority === 'urgent' ? '🔴' : task.priority === 'high' ? '🟡' : '';
      return `${i + 1}. ${time} - ${task.title} ${priority}`;
    }).join('\n');

    return {
      message: `📅 Today's Tasks (${tasks.length}):\n\n${taskList}\n\nReply with a number to complete a task, or send me a new task to add.`,
    };
  }

  private async handleCompleteTask(session: any, message: string, intent: any): Promise<MessageResponse> {
    // Extract task identifier from message
    const taskIdentifier = this.extractTaskIdentifier(message);
    
    if (!taskIdentifier) {
      return {
        message: "Please specify which task to complete. You can say 'complete task 1' or 'done with grocery shopping'.",
      };
    }

    const userId = session.userId || session.id;
    
    // Find and update the task
    const { data: task, error } = await this.supabase
      .from('tasks')
      .update({ 
        status: 'completed',
        completed_at: new Date().toISOString(),
      })
      .eq('user_id', userId)
      .eq('status', 'pending')
      .ilike('title', `%${taskIdentifier}%`)
      .select()
      .single();

    if (error || !task) {
      return {
        message: `I couldn't find a task matching "${taskIdentifier}". Send 'list' to see your current tasks.`,
      };
    }

    return {
      message: `✅ Great job! I've marked "${task.title}" as complete.\n\nYou're making great progress today! 🎉`,
    };
  }

  private async handleUpdateTask(session: any, message: string, intent: any): Promise<MessageResponse> {
    return {
      message: "Task update feature coming soon! For now, you can complete tasks or create new ones.",
    };
  }

  private async handleGreeting(session: any): Promise<MessageResponse> {
    const greeting = session.sessionType === 'guest' 
      ? `👋 Hello! I'm your AI task assistant from TeliTask.\n\nI can help you:\n• Create task reminders\n• Process photos of receipts or todo lists\n• Manage your schedule\n\nSend me a task or photo to get started!`
      : `👋 Welcome back! How can I help you today?\n\nYou can:\n• Send a task\n• View today's tasks (say 'list')\n• Send a photo to process\n• Get help (say 'help')`;

    return { message: greeting };
  }

  private async handleHelp(session: any): Promise<MessageResponse> {
    const helpMessage = `📚 Here's what I can do:\n\n📝 **Create Tasks**\n"Remind me to call mom at 3pm"\n"Add task: Submit report by Friday"\n\n📋 **View Tasks**\n"List my tasks"\n"What do I have today?"\n\n✅ **Complete Tasks**\n"Done with grocery shopping"\n"Complete task 1"\n\n📷 **Process Photos**\nSend receipts, handwritten lists, or business cards\n\n🎤 **Voice Notes**\nSend voice messages to create tasks\n\n⚙️ **Commands**\n• help - Show this menu\n• list - View today's tasks\n• signup - Create an account\n• settings - View settings\n\nJust send me any task or question!`;

    return { message: helpMessage };
  }

  private async handleSignup(session: any): Promise<MessageResponse> {
    if (session.sessionType !== 'guest') {
      return {
        message: "You already have an account! You're all set to use TeliTask.",
      };
    }

    // Set conversation state to collect email
    await this.sessionManager.updateContext(session.id, {
      currentState: 'collecting_task',
      partialTask: { title: 'signup' }, // Reusing task collection for signup flow
    });

    return {
      message: `Let's get you signed up! 🎉\n\nPlease share your email address to create your account:`,
    };
  }

  private async continueTaskCollection(session: any, message: string, context: SessionContext): Promise<MessageResponse> {
    // Handle signup flow if that's what we're collecting
    if (context.partialTask?.title === 'signup') {
      return await this.handleSignupEmail(session, message);
    }

    // Regular task collection flow
    // TODO: Implement multi-turn task creation
    return {
      message: "Task collection in progress. This feature is coming soon!",
    };
  }

  private async handleSignupEmail(session: any, email: string): Promise<MessageResponse> {
    // Validate email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return {
        message: "That doesn't look like a valid email address. Please try again:",
      };
    }

    // Create user account
    // TODO: Implement actual signup with Supabase Auth
    
    // For now, just simulate success
    await this.sessionManager.updateContext(session.id, {
      currentState: 'idle',
      partialTask: undefined,
    });

    await this.sessionManager.updateSession(session.id, {
      sessionType: 'registered',
    });

    return {
      message: `✅ Account created!\n\n📧 Email: ${email}\n📱 Phone: ${session.phoneNumber}\n\nYou now have:\n• Unlimited tasks\n• Call reminders\n• Photo storage\n• Web dashboard access\n\nAll your guest tasks have been saved. Welcome to TeliTask! 🎉`,
    };
  }

  private async handleConfirmation(session: any, message: string, context: SessionContext): Promise<MessageResponse> {
    const response = message.toLowerCase().trim();
    const pendingAction = context.pendingAction;

    if (!pendingAction) {
      await this.sessionManager.updateContext(session.id, { currentState: 'idle' });
      return { message: "No pending action to confirm." };
    }

    if (response === 'yes' || response === 'y') {
      // Execute the pending action
      if (pendingAction.type === 'delete_all') {
        const userId = session.userId || session.id;
        await this.supabase
          .from('tasks')
          .delete()
          .eq('user_id', userId);

        await this.sessionManager.updateContext(session.id, {
          currentState: 'idle',
          pendingAction: undefined,
        });

        return {
          message: "✅ All tasks have been deleted. You have a fresh start!",
        };
      }
    }

    // Cancel the action
    await this.sessionManager.updateContext(session.id, {
      currentState: 'idle',
      pendingAction: undefined,
    });

    return {
      message: "Action cancelled. How else can I help you?",
    };
  }

  private async handleImageTaskSelection(session: any, message: string, context: SessionContext): Promise<MessageResponse> {
    // TODO: Implement image task selection
    return {
      message: "Image task selection coming soon!",
    };
  }

  private extractTaskIdentifier(message: string): string | null {
    // Try to extract task number (e.g., "task 1", "1", "#1")
    const numberMatch = message.match(/(?:task\s*)?#?(\d+)/i);
    if (numberMatch) {
      return numberMatch[1];
    }

    // Try to extract task title keywords
    const keywords = message.toLowerCase()
      .replace(/^(done|complete|finish|completed|finished)\s+(with\s+)?/i, '')
      .trim();

    return keywords.length > 2 ? keywords : null;
  }

  async logConversation(data: {
    sessionId: string;
    phoneNumber: string;
    messageType: 'inbound' | 'outbound';
    messageFormat: string;
    messageContent: string;
    mediaId?: string;
    intent?: string;
    confidenceScore?: number;
  }): Promise<void> {
    try {
      await this.supabase
        .from('whatsapp_conversations')
        .insert({
          session_id: data.sessionId,
          phone_number: data.phoneNumber,
          message_type: data.messageType,
          message_format: data.messageFormat,
          message_content: data.messageContent,
          media_id: data.mediaId,
          intent: data.intent,
          confidence_score: data.confidenceScore,
        });
    } catch (error) {
      console.error('Failed to log conversation:', error);
    }
  }
}