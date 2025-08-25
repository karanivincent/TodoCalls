import OpenAI from 'openai';
import { env } from '$env/dynamic/private';
import type { Priority } from '$lib/database.types.enhanced';

export interface EnhancedParsedTask {
  title: string;
  description?: string;
  recipient: string;
  phoneNumber?: string;
  scheduledAt: Date;
  dueDate?: Date;
  priority: Priority;
  tags: string[];
  projectName?: string;
  estimatedDuration?: number; // in minutes
  energyLevel?: 'low' | 'medium' | 'high';
  confidence: number;
}

export async function parseTaskFromNaturalLanguageEnhanced(
  input: string, 
  userPhoneNumber: string,
  userTimezone: string = 'Africa/Nairobi',
  availableProjects: { name: string; id: string }[] = []
): Promise<EnhancedParsedTask> {
  // Initialize OpenAI client inside the function
  const openai = new OpenAI({
    apiKey: env.OPENAI_API_KEY
  });
  
  // Get current UTC time
  const now = new Date();
  const userLocalTime = now.toLocaleString('en-US', { 
    timeZone: userTimezone,
    dateStyle: 'full',
    timeStyle: 'long'
  });
  
  const projectNames = availableProjects.map(p => p.name).join(', ');
  
  try {
    const systemPrompt = `You are an advanced task parser for a productivity app. The user is located in ${userTimezone} timezone.
    
CURRENT TIME CONTEXT:
- Current UTC time: ${now.toISOString()}
- Current time in user's ${userTimezone}: ${userLocalTime}
- User's phone number: ${userPhoneNumber}
- Available projects: ${projectNames || 'Personal, Work, Family'}

Parse the input and return a JSON object with:
- title: The main task description (what needs to be done)
- description: Additional details if provided (optional)
- recipient: Who should receive the call ("me" for self, or person's name)
- phoneNumber: Phone number to call (use ${userPhoneNumber} for "me")
- scheduledAt: ISO datetime string in UTC for reminders
- dueDate: ISO datetime string in UTC for when task should be completed (optional)
- priority: "low", "medium", "high", or "urgent"
- tags: Array of relevant tags/categories
- projectName: Which project this belongs to (match from: ${projectNames || 'Personal, Work, Family'})
- estimatedDuration: Estimated minutes to complete (optional)
- energyLevel: "low", "medium", or "high" energy required (optional)
- confidence: 0-1 score of parsing confidence

PRIORITY DETECTION:
- "urgent", "asap", "immediately", "critical" → "urgent"
- "high priority", "important", "soon", "!!" → "high"
- "low priority", "whenever", "not urgent" → "low"  
- Default → "medium"

PROJECT DETECTION:
- Look for explicit mentions: "work project", "for family", "personal task"
- Infer from context: "meeting" → Work, "doctor" → Personal, "mom" → Family
- Match to available projects: ${projectNames}

TAG DETECTION:
- Extract keywords like: #urgent, @waiting, meetings, health, calls, etc.
- Common categories: work, family, health, shopping, calls, meetings

TIME PARSING (same as before):
1. "in X minutes/hours" = add X to current UTC time
2. "at 3pm" = 3pm TODAY in user's ${userTimezone}, converted to UTC
3. "tomorrow at 9am" = 9am tomorrow in ${userTimezone}, converted to UTC
4. "due by Friday" = Friday end of day in ${userTimezone}
5. Default reminder to 1 hour from now if no time specified

Examples:
- "urgent work meeting prep at 2pm" → priority: urgent, project: Work, scheduledAt: 2pm UTC
- "call mom about doctor appointment tomorrow" → project: Family, tags: ["calls", "health"]
- "low priority: organize photos this weekend" → priority: low, dueDate: weekend`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: input }
      ],
      response_format: { type: 'json_object' },
      temperature: 0.3,
      max_tokens: 400
    });

    const result = JSON.parse(completion.choices[0].message.content || '{}');
    
    // Validate and process the result
    const scheduledAt = new Date(result.scheduledAt);
    if (isNaN(scheduledAt.getTime())) {
      scheduledAt.setTime(now.getTime() + 60 * 60 * 1000); // 1 hour from now
    }

    const dueDate = result.dueDate ? new Date(result.dueDate) : undefined;
    if (dueDate && isNaN(dueDate.getTime())) {
      // Invalid due date, ignore it
    }

    // Validate priority
    const validPriorities: Priority[] = ['low', 'medium', 'high', 'urgent'];
    const priority: Priority = validPriorities.includes(result.priority) 
      ? result.priority 
      : 'medium';

    return {
      title: result.title || input,
      description: result.description || undefined,
      recipient: result.recipient || 'me',
      phoneNumber: result.phoneNumber || userPhoneNumber,
      scheduledAt,
      dueDate,
      priority,
      tags: Array.isArray(result.tags) ? result.tags : [],
      projectName: result.projectName || undefined,
      estimatedDuration: result.estimatedDuration || undefined,
      energyLevel: ['low', 'medium', 'high'].includes(result.energyLevel) 
        ? result.energyLevel 
        : undefined,
      confidence: result.confidence || 0.8
    };
  } catch (error) {
    console.error('Error parsing enhanced task:', error);
    
    // Fallback to enhanced fallback parser
    return enhancedFallbackParser(input, userPhoneNumber, userTimezone, availableProjects);
  }
}

function enhancedFallbackParser(
  input: string, 
  userPhoneNumber: string, 
  userTimezone: string,
  availableProjects: { name: string; id: string }[] = []
): EnhancedParsedTask {
  const now = new Date();
  let scheduledAt = new Date(now.getTime() + 60 * 60 * 1000); // Default 1 hour from now
  
  // Priority detection
  let priority: Priority = 'medium';
  if (/urgent|asap|immediately|critical|!!!/i.test(input)) {
    priority = 'urgent';
  } else if (/high.?priority|important|soon|!!/i.test(input)) {
    priority = 'high';
  } else if (/low.?priority|whenever|not.urgent/i.test(input)) {
    priority = 'low';
  }

  // Project detection
  let projectName: string | undefined;
  const inputLower = input.toLowerCase();
  
  // Check for explicit project mentions
  for (const project of availableProjects) {
    if (inputLower.includes(project.name.toLowerCase())) {
      projectName = project.name;
      break;
    }
  }
  
  // Fallback project detection
  if (!projectName) {
    if (/work|meeting|office|client|boss/i.test(input)) {
      projectName = 'Work';
    } else if (/mom|dad|family|kids|home/i.test(input)) {
      projectName = 'Family';
    } else {
      projectName = 'Personal';
    }
  }

  // Tag extraction
  const tags: string[] = [];
  if (/call|phone|ring/i.test(input)) tags.push('calls');
  if (/meeting|appointment/i.test(input)) tags.push('meetings');
  if (/doctor|health|medical/i.test(input)) tags.push('health');
  if (/shop|buy|purchase/i.test(input)) tags.push('shopping');
  if (/urgent/i.test(input)) tags.push('urgent');

  // Time parsing (simplified version)
  const timeMatch = input.match(/at (\d{1,2}):?(\d{2})?\s*(am|pm)?/i);
  if (timeMatch) {
    let hours = parseInt(timeMatch[1]);
    const minutes = timeMatch[2] ? parseInt(timeMatch[2]) : 0;
    const period = timeMatch[3]?.toLowerCase();
    
    if (period === 'pm' && hours < 12) hours += 12;
    if (period === 'am' && hours === 12) hours = 0;
    
    scheduledAt = new Date(now);
    scheduledAt.setHours(hours, minutes, 0, 0);
    
    // If time is in the past, assume tomorrow
    if (scheduledAt < now) {
      scheduledAt.setDate(scheduledAt.getDate() + 1);
    }
  }

  // Extract recipient
  let recipient = 'me';
  const recipientMatch = input.match(/(?:remind|tell|call)\s+(\w+)/i);
  if (recipientMatch && recipientMatch[1].toLowerCase() !== 'me') {
    recipient = recipientMatch[1];
  }

  // Clean up title
  let title = input
    .replace(/^(remind|tell|call)\s+/i, '')
    .replace(/\s+(me|mom|dad|john|sarah)\s+/i, ' ')
    .replace(/\s+to\s+/i, ' ')
    .replace(/\s+at\s+\d+:?\d*\s*(am|pm)?/i, '')
    .replace(/(urgent|high.?priority|low.?priority)/i, '')
    .trim();

  return {
    title: title || input,
    recipient,
    phoneNumber: recipient === 'me' ? userPhoneNumber : undefined,
    scheduledAt,
    priority,
    tags,
    projectName,
    confidence: 0.6
  };
}

// Backward compatibility - export the original function too
export async function parseTaskFromNaturalLanguage(
  input: string,
  userPhoneNumber: string,
  userTimezone: string = 'Africa/Nairobi'
): Promise<{
  title: string;
  recipient: string;
  phoneNumber?: string;
  scheduledAt: Date;
  confidence: number;
}> {
  const enhanced = await parseTaskFromNaturalLanguageEnhanced(
    input,
    userPhoneNumber,
    userTimezone
  );

  return {
    title: enhanced.title,
    recipient: enhanced.recipient,
    phoneNumber: enhanced.phoneNumber,
    scheduledAt: enhanced.scheduledAt,
    confidence: enhanced.confidence
  };
}