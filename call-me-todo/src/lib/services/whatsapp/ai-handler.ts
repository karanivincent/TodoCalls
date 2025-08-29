import OpenAI from 'openai';
import { env } from '$env/dynamic/private';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { SessionContext } from '$lib/db/whatsapp-schema';

export interface Intent {
  type: string;
  confidence: number;
  entities?: any;
}

export class WhatsAppAIHandler {
  private openai: OpenAI;
  private supabase: SupabaseClient;

  constructor(supabase: SupabaseClient) {
    this.supabase = supabase;
    this.openai = new OpenAI({
      apiKey: env.OPENAI_API_KEY,
    });
  }

  async detectIntent(message: string): Promise<Intent> {
    try {
      const systemPrompt = `You are an intent detection system for a task management app. Analyze the user's message and return a JSON object with the detected intent.

Possible intents:
- create_task: User wants to create a new task/reminder
- list_tasks: User wants to see their tasks
- complete_task: User wants to mark a task as done
- update_task: User wants to modify an existing task
- delete_task: User wants to remove a task
- greeting: User is greeting or saying hello
- help: User needs assistance or information
- signup: User wants to create an account
- settings: User wants to change preferences
- unknown: Cannot determine clear intent

Return format:
{
  "type": "intent_name",
  "confidence": 0.0-1.0,
  "entities": {
    "task_title": "extracted task if present",
    "time": "extracted time if present",
    "other": "any other relevant entities"
  }
}`;

      const completion = await this.openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: message }
        ],
        response_format: { type: 'json_object' },
        temperature: 0.3,
        max_tokens: 200,
      });

      const result = JSON.parse(completion.choices[0].message.content || '{}');
      
      return {
        type: result.type || 'unknown',
        confidence: result.confidence || 0.5,
        entities: result.entities || {},
      };
    } catch (error) {
      console.error('Intent detection failed:', error);
      return {
        type: 'unknown',
        confidence: 0,
      };
    }
  }

  async generateResponse(message: string, context: SessionContext, userInfo?: any): Promise<any> {
    try {
      const conversationHistory = context.conversationHistory.slice(-10); // Last 10 messages
      
      // Build user context string
      let userContext = '';
      if (userInfo && userInfo.email) {
        userContext = `
User Information:
- Name: ${userInfo.name || 'Not set'}
- Email: ${userInfo.email}
- Phone Numbers: ${userInfo.phoneNumbers?.map((p: any) => `${p.phone_number} (${p.label || 'no label'})`).join(', ') || 'None'}
- Account Type: Registered User
`;
      } else if (context.isNewUser) {
        userContext = `
User Information:
- This is a NEW user who hasn't registered yet
- They're using WhatsApp for the first time
- Encourage them to sign up for full features
- Limit: 10 tasks for guest accounts
`;
      } else {
        userContext = `
User Information:
- Guest user (not registered)
- Can create up to 10 tasks
- Encourage sign up for unlimited tasks
`;
      }
      
      const systemPrompt = `You are TeliTask, a friendly and helpful AI assistant for task management via WhatsApp. 

Key capabilities:
- Create and manage tasks with natural language
- Process photos (receipts, handwritten lists, business cards)
- Set phone call reminders
- Help users stay organized

${userContext}

Personality:
- Friendly and conversational (use emojis appropriately)
- Concise but helpful
- Proactive with suggestions
- Encouraging when users complete tasks
- If asked about user's personal info (name, email, phone), provide it from the context above

Current context:
- User type: ${context.currentState === 'idle' ? 'Regular user' : 'In conversation'}
- Previous messages: ${conversationHistory.length} messages in history

Guidelines:
- Keep responses under 300 characters when possible
- If user asks "who am I" or similar, tell them their name, email, and registered phone numbers
- Use WhatsApp formatting: *bold*, _italic_, ~strikethrough~
- Suggest helpful actions based on context
- If unsure, ask clarifying questions
- For guest users, occasionally mention benefits of signing up`;

      const messages: any[] = [
        { role: 'system', content: systemPrompt }
      ];

      // Add conversation history
      conversationHistory.forEach(msg => {
        messages.push({
          role: msg.role === 'user' ? 'user' : 'assistant',
          content: msg.content,
        });
      });

      // Add current message
      messages.push({ role: 'user', content: message });

      const completion = await this.openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages,
        temperature: 0.7,
        max_tokens: 300,
      });

      const response = completion.choices[0].message.content || "I'm not sure how to help with that. Try saying 'help' to see what I can do.";

      return {
        message: response,
      };
    } catch (error) {
      console.error('Failed to generate AI response:', error);
      return {
        message: "I'm having trouble understanding. Could you rephrase that or try saying 'help'?",
      };
    }
  }

  async analyzeImage(imageUrl: string, extractedText?: string): Promise<{
    type: 'receipt' | 'business_card' | 'task_list' | 'document' | 'screenshot' | 'other';
    confidence: number;
    description: string;
    suggestedActions: string[];
  }> {
    try {
      const systemPrompt = `Analyze the extracted text from an image and determine:
1. The type of image (receipt, business_card, task_list, document, screenshot, other)
2. Confidence level (0-1)
3. Brief description of contents
4. Suggested actions for the user

Return as JSON:
{
  "type": "image_type",
  "confidence": 0.0-1.0,
  "description": "brief description",
  "suggestedActions": ["action1", "action2"]
}`;

      const userPrompt = extractedText 
        ? `Extracted text from image:\n${extractedText}`
        : "No text could be extracted from the image";

      const completion = await this.openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        response_format: { type: 'json_object' },
        temperature: 0.3,
        max_tokens: 300,
      });

      const result = JSON.parse(completion.choices[0].message.content || '{}');
      
      return {
        type: result.type || 'other',
        confidence: result.confidence || 0.5,
        description: result.description || 'Image uploaded successfully',
        suggestedActions: result.suggestedActions || ['Save for reference'],
      };
    } catch (error) {
      console.error('Image analysis failed:', error);
      return {
        type: 'other',
        confidence: 0,
        description: 'Could not analyze image',
        suggestedActions: ['Try sending a clearer image'],
      };
    }
  }

  async extractTasksFromText(text: string): Promise<Array<{
    title: string;
    dueDate?: string;
    priority?: string;
  }>> {
    try {
      const systemPrompt = `Extract tasks from the following text. This could be from a handwritten list, meeting notes, or any text containing action items.

Return a JSON array of tasks:
[
  {
    "title": "task description",
    "dueDate": "ISO date string if mentioned",
    "priority": "low/medium/high/urgent if determinable"
  }
]

If no clear tasks are found, return an empty array.`;

      const completion = await this.openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: text }
        ],
        response_format: { type: 'json_object' },
        temperature: 0.3,
        max_tokens: 500,
      });

      const result = JSON.parse(completion.choices[0].message.content || '{"tasks": []}');
      return result.tasks || [];
    } catch (error) {
      console.error('Task extraction failed:', error);
      return [];
    }
  }

  async extractReceiptData(text: string): Promise<{
    vendor: string;
    amount: number;
    date: string;
    items?: Array<{ name: string; price: number }>;
  } | null> {
    try {
      const systemPrompt = `Extract receipt information from the text. Return JSON:
{
  "vendor": "store/company name",
  "amount": total amount as number,
  "date": "ISO date string",
  "items": [{"name": "item", "price": amount}] (optional)
}

Return null if this doesn't appear to be a receipt.`;

      const completion = await this.openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: text }
        ],
        response_format: { type: 'json_object' },
        temperature: 0.2,
        max_tokens: 400,
      });

      const result = JSON.parse(completion.choices[0].message.content || '{}');
      
      if (result.vendor && result.amount) {
        return result;
      }
      
      return null;
    } catch (error) {
      console.error('Receipt extraction failed:', error);
      return null;
    }
  }

  async extractContactData(text: string): Promise<{
    name: string;
    company?: string;
    email?: string;
    phone?: string;
    title?: string;
  } | null> {
    try {
      const systemPrompt = `Extract contact information from the text (likely a business card). Return JSON:
{
  "name": "person's name",
  "company": "company name",
  "email": "email address",
  "phone": "phone number",
  "title": "job title"
}

Return null if no contact information is found.`;

      const completion = await this.openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: text }
        ],
        response_format: { type: 'json_object' },
        temperature: 0.2,
        max_tokens: 300,
      });

      const result = JSON.parse(completion.choices[0].message.content || '{}');
      
      if (result.name) {
        return result;
      }
      
      return null;
    } catch (error) {
      console.error('Contact extraction failed:', error);
      return null;
    }
  }

  async generateTaskSuggestions(
    userHistory: any[],
    currentTime: Date
  ): Promise<string[]> {
    try {
      // Analyze user patterns and suggest relevant tasks
      const dayOfWeek = currentTime.toLocaleDateString('en-US', { weekday: 'long' });
      const timeOfDay = currentTime.getHours() < 12 ? 'morning' : 
                        currentTime.getHours() < 17 ? 'afternoon' : 'evening';

      const suggestions = [];

      // Time-based suggestions
      if (timeOfDay === 'morning') {
        suggestions.push("Review today's priorities");
        suggestions.push("Check calendar for meetings");
      } else if (timeOfDay === 'evening') {
        suggestions.push("Plan tomorrow's tasks");
        suggestions.push("Review today's accomplishments");
      }

      // Day-based suggestions
      if (dayOfWeek === 'Friday') {
        suggestions.push("Weekly review and planning");
        suggestions.push("Clear inbox before weekend");
      } else if (dayOfWeek === 'Monday') {
        suggestions.push("Set weekly goals");
        suggestions.push("Team standup preparation");
      }

      // Pattern-based suggestions (would analyze userHistory in production)
      if (userHistory.length > 5) {
        suggestions.push("Review overdue tasks");
      }

      return suggestions.slice(0, 3); // Return top 3 suggestions
    } catch (error) {
      console.error('Failed to generate suggestions:', error);
      return [];
    }
  }

  async generateDailySummary(tasks: any[]): Promise<string> {
    const taskCount = tasks.length;
    
    if (taskCount === 0) {
      return "Good morning! ☀️ You have a clear schedule today. A perfect opportunity to tackle something new or take a well-deserved break!";
    }

    const urgentTasks = tasks.filter(t => t.priority === 'urgent' || t.priority === 'high');
    const firstTask = tasks[0];
    const firstTaskTime = new Date(firstTask.scheduled_at).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });

    let summary = `Good morning! ☀️\n\n📊 Today's Overview:\n`;
    summary += `• ${taskCount} task${taskCount > 1 ? 's' : ''} scheduled\n`;
    
    if (urgentTasks.length > 0) {
      summary += `• ${urgentTasks.length} high priority 🔴\n`;
    }
    
    summary += `\n🎯 First task at ${firstTaskTime}:\n"${firstTask.title}"\n`;
    
    if (taskCount > 3) {
      summary += `\n💪 You've got this! Break it down one task at a time.`;
    } else {
      summary += `\n✨ Light day ahead - perfect for deep focus!`;
    }

    return summary;
  }
}