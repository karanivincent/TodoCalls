import OpenAI from 'openai';
import { env } from '$env/dynamic/private';

export interface ParsedTask {
  title: string;
  recipient: string;
  phoneNumber?: string;
  scheduledAt: Date;
  confidence: number;
}

export async function parseTaskFromNaturalLanguage(
  input: string, 
  userPhoneNumber: string,
  userTimezone: string = 'Africa/Nairobi'
): Promise<ParsedTask> {
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
  
  try {
    const systemPrompt = `You are a task parser for a reminder app. The user is located in ${userTimezone} timezone.
    
CURRENT TIME CONTEXT:
- Current UTC time: ${now.toISOString()}
- Current time in user's ${userTimezone}: ${userLocalTime}
- User's phone number: ${userPhoneNumber}

Parse the input and return a JSON object with:
- title: The task description (what needs to be done)
- recipient: Who should receive the call ("me" for self, or the person's name)
- phoneNumber: The phone number to call (use ${userPhoneNumber} for "me")
- scheduledAt: ISO datetime string in UTC (IMPORTANT: Must be in UTC format)
- confidence: 0-1 score of parsing confidence

CRITICAL TIME PARSING RULES:
1. "in X minutes/hours" = add X to current UTC time (${now.toISOString()})
2. "at 3pm" = 3pm TODAY in user's ${userTimezone}, converted to UTC
   - If that time has already passed today, use tomorrow
3. "tomorrow at 9am" = 9am tomorrow in user's ${userTimezone}, converted to UTC
4. "Monday at 2pm" = next Monday at 2pm in user's ${userTimezone}, converted to UTC
5. Default to 1 hour from now if no time specified

IMPORTANT: When user mentions a specific time (like "3pm" or "10:30am"), they mean that time in THEIR timezone (${userTimezone}), not UTC!
You must convert times from ${userTimezone} to UTC for the scheduledAt field.

Examples for user in ${userTimezone}:
- "call in 10 minutes" at 12:00 UTC → scheduledAt: 12:10 UTC
- "call at 3pm" when it's morning in ${userTimezone} → convert 3pm ${userTimezone} to UTC
- "call tomorrow at 9am" → convert 9am ${userTimezone} tomorrow to UTC`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: input }
      ],
      response_format: { type: 'json_object' },
      temperature: 0.3,
      max_tokens: 200
    });

    const result = JSON.parse(completion.choices[0].message.content || '{}');
    
    // Validate and process the result
    const scheduledAt = new Date(result.scheduledAt);
    if (isNaN(scheduledAt.getTime())) {
      // Fallback to 1 hour from now
      scheduledAt.setTime(now.getTime() + 60 * 60 * 1000);
    }

    return {
      title: result.title || input,
      recipient: result.recipient || 'me',
      phoneNumber: result.phoneNumber || userPhoneNumber,
      scheduledAt,
      confidence: result.confidence || 0.7
    };
  } catch (error) {
    console.error('Error parsing task:', error);
    
    // Fallback parsing with simple regex
    return fallbackParser(input, userPhoneNumber, userTimezone);
  }
}

function fallbackParser(input: string, userPhoneNumber: string, userTimezone: string = 'Africa/Nairobi'): ParsedTask {
  const now = new Date(); // Current UTC time
  let scheduledAt = new Date(now.getTime() + 60 * 60 * 1000); // Default 1 hour from now in UTC
  
  // Try to extract time
  const timePatterns = [
    { regex: /in (\d+) minutes?/i, unit: 'minutes' },
    { regex: /in (\d+) hours?/i, unit: 'hours' },
    { regex: /at (\d{1,2}):?(\d{2})?\s*(am|pm)?/i, unit: 'time' }
  ];
  
  for (const pattern of timePatterns) {
    const match = input.match(pattern.regex);
    if (match) {
      if (pattern.unit === 'minutes') {
        scheduledAt = new Date(now.getTime() + parseInt(match[1]) * 60 * 1000);
      } else if (pattern.unit === 'hours') {
        scheduledAt = new Date(now.getTime() + parseInt(match[1]) * 60 * 60 * 1000);
      } else if (pattern.unit === 'time') {
        let hours = parseInt(match[1]);
        const minutes = match[2] ? parseInt(match[2]) : 0;
        const period = match[3]?.toLowerCase();
        
        if (period === 'pm' && hours < 12) hours += 12;
        if (period === 'am' && hours === 12) hours = 0;
        
        scheduledAt = new Date(now);
        scheduledAt.setHours(hours, minutes, 0, 0);
        
        // If time is in the past, assume tomorrow
        if (scheduledAt < now) {
          scheduledAt.setDate(scheduledAt.getDate() + 1);
        }
      }
      break;
    }
  }
  
  // Extract recipient
  let recipient = 'me';
  const recipientPatterns = [
    /remind (\w+) to/i,
    /tell (\w+) to/i,
    /call (\w+) about/i
  ];
  
  for (const pattern of recipientPatterns) {
    const match = input.match(pattern);
    if (match && match[1].toLowerCase() !== 'me') {
      recipient = match[1];
      break;
    }
  }
  
  // Clean up title
  let title = input
    .replace(/^(remind|tell|call)\s+/i, '')
    .replace(/\s+(me|mom|dad|john|sarah)\s+/i, ' ')
    .replace(/\s+to\s+/i, ' ')
    .replace(/\s+at\s+\d+:?\d*\s*(am|pm)?/i, '')
    .replace(/\s+in\s+\d+\s+(minutes?|hours?)/i, '')
    .trim();
  
  return {
    title: title || input,
    recipient,
    phoneNumber: recipient === 'me' ? userPhoneNumber : undefined,
    scheduledAt,
    confidence: 0.5
  };
}