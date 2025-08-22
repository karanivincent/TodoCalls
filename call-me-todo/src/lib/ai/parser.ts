import OpenAI from 'openai';
import { env } from '$env/dynamic/private';

const openai = new OpenAI({
  apiKey: env.OPENAI_API_KEY
});

export interface ParsedTask {
  title: string;
  recipient: string;
  phoneNumber?: string;
  scheduledAt: Date;
  confidence: number;
}

export async function parseTaskFromNaturalLanguage(input: string, userPhoneNumber: string): Promise<ParsedTask> {
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth();
  const currentDate = now.getDate();
  
  try {
    const systemPrompt = `You are a task parser for a reminder app. Extract task information from natural language.
    
Current date/time: ${now.toLocaleString()}
User's phone number: ${userPhoneNumber}

Parse the input and return a JSON object with:
- title: The task description (what needs to be done)
- recipient: Who should receive the call ("me" for self, or the person's name)
- phoneNumber: The phone number to call (use ${userPhoneNumber} for "me")
- scheduledAt: ISO datetime string for when to make the reminder call
- confidence: 0-1 score of parsing confidence

Time parsing rules:
- "in X minutes/hours" = add to current time
- "at 3pm" = today at 3pm (unless that's past, then tomorrow)
- "tomorrow at 9am" = tomorrow at 9am
- "Monday at 2pm" = next Monday at 2pm
- Default to 1 hour from now if no time specified

Examples:
"Remind me to take medication in 30 minutes" -> Call user in 30 min
"Tell Mom to pick up groceries at 5pm" -> Call Mom at 5pm today
"Call John about the meeting tomorrow at 9am" -> Call John tomorrow 9am`;

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
    return fallbackParser(input, userPhoneNumber);
  }
}

function fallbackParser(input: string, userPhoneNumber: string): ParsedTask {
  const now = new Date();
  let scheduledAt = new Date(now.getTime() + 60 * 60 * 1000); // Default 1 hour
  
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