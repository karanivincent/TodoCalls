import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { createServerClient } from '@supabase/ssr';
import { env as publicEnv } from '$env/dynamic/public';
import { parseTaskFromNaturalLanguage } from '$lib/ai/parser';
import { formatInTimezone } from '$lib/utils/timezone';

export const POST: RequestHandler = async ({ request, cookies }) => {
  try {
    const { input, phoneNumber, timezone: requestTimezone } = await request.json();
    
    if (!input) {
      return json({ error: 'Input text is required' }, { status: 400 });
    }

    // Create a proper server client with cookie handling
    const supabase = createServerClient(publicEnv.PUBLIC_SUPABASE_URL, publicEnv.PUBLIC_SUPABASE_ANON_KEY, {
      cookies: {
        getAll() {
          return cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookies.set(name, value, { ...options, path: '/' })
          );
        }
      }
    });
    
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      console.error('Auth error:', authError);
      return json({ error: 'Unauthorized - Please log in' }, { status: 401 });
    }

    // Get user's phone number and timezone
    let userPhoneNumber = phoneNumber;
    
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('phone_number, timezone')
      .eq('id', user.id)
      .single();
    
    if (!userPhoneNumber) {
      userPhoneNumber = profile?.phone_number;
    }
    
    // Prioritize request timezone, then profile, then default
    const userTimezone = requestTimezone || profile?.timezone || 'Africa/Nairobi';

    if (!userPhoneNumber) {
      return json({ 
        error: 'Phone number not found. Please add your phone number in settings.' 
      }, { status: 400 });
    }

    // Parse the natural language input with timezone
    const parsedTask = await parseTaskFromNaturalLanguage(input, userPhoneNumber, userTimezone);

    // Handle recipient phone numbers (for MVP, we'll use the user's phone for all)
    // In the future, this would look up family members' phone numbers
    let taskPhoneNumber = parsedTask.phoneNumber || userPhoneNumber;
    
    // For non-self recipients, we'd normally look up their number
    // For MVP, we'll just use the user's number with a note about the recipient
    if (parsedTask.recipient !== 'me' && !parsedTask.phoneNumber) {
      // Add recipient to task title for clarity
      parsedTask.title = `For ${parsedTask.recipient}: ${parsedTask.title}`;
      taskPhoneNumber = userPhoneNumber;
    }

    // Create the task in Supabase
    const { data: task, error: taskError } = await supabase
      .from('tasks')
      .insert({
        user_id: user.id,
        title: parsedTask.title,
        phone_number: taskPhoneNumber,
        scheduled_at: parsedTask.scheduledAt.toISOString(),
        status: 'pending'
      })
      .select()
      .single();

    if (taskError) {
      console.error('Error creating task:', taskError);
      return json({ error: 'Failed to create task' }, { status: 500 });
    }

    // Format the scheduled time in user's timezone for the response
    const formattedTime = formatInTimezone(task.scheduled_at, userTimezone);
    
    return json({
      success: true,
      task,
      parsed: {
        ...parsedTask,
        phoneNumber: taskPhoneNumber
      },
      message: `Task scheduled for ${formattedTime}`
    });

  } catch (error: any) {
    console.error('Error in task creation:', error);
    return json({ 
      error: error.message || 'Failed to create task' 
    }, { status: 500 });
  }
};