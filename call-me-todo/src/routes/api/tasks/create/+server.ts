import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { createServerClient } from '@supabase/ssr';
import { env as publicEnv } from '$env/dynamic/public';
import { parseTaskFromNaturalLanguage } from '$lib/ai/parser.enhanced';
import { formatInTimezone } from '$lib/utils/timezone';

export const POST: RequestHandler = async ({ request, cookies }) => {
  try {
    const { input, phoneNumber, timezone: requestTimezone, project_id, priority } = await request.json();
    
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

    // Get primary verified phone number using Supabase
    const { data: primaryPhone, error: phoneError } = await supabase
      .from('phone_numbers')
      .select('phone_number, is_verified')
      .eq('user_id', user.id)
      .eq('is_primary', true)
      .eq('is_verified', true)
      .limit(1)
      .single();
    
    if (phoneError || !primaryPhone) {
      return json({ 
        error: 'No verified phone number found. Please add and verify a phone number in settings first.' 
      }, { status: 400 });
    }
    
    const userPhoneNumber = primaryPhone.phone_number;
    
    // Use request timezone or default
    const userTimezone = requestTimezone || 'Africa/Nairobi';

    // Parse the natural language input with timezone and enhanced features
    const parsedTask = await parseTaskFromNaturalLanguage(input, userPhoneNumber, userTimezone);

    // Handle recipient phone numbers (for MVP, we'll use the user's phone for all)
    let taskPhoneNumber = parsedTask.phoneNumber || userPhoneNumber;
    
    // For non-self recipients, add recipient to task title for clarity
    if (parsedTask.recipient !== 'me' && !parsedTask.phoneNumber) {
      parsedTask.title = `For ${parsedTask.recipient}: ${parsedTask.title}`;
      taskPhoneNumber = userPhoneNumber;
    }

    // Use provided project_id or find by name if parsed
    let projectId: string | null = project_id || null;
    if (!projectId && parsedTask.projectName) {
      const { data: project } = await supabase
        .from('projects')
        .select('id')
        .eq('user_id', user.id)
        .eq('name', parsedTask.projectName)
        .eq('is_archived', false)
        .limit(1)
        .single();
      
      projectId = project?.id || null;
    }

    // Create the enhanced task using Supabase
    const taskData = {
      user_id: user.id,
      title: parsedTask.title,
      phone_number: taskPhoneNumber,
      scheduled_at: parsedTask.scheduledAt.toISOString(),
      status: 'pending',
      description: parsedTask.description || null,
      priority: priority || parsedTask.priority, // Use provided priority or parsed one
      tags: parsedTask.tags,
      project_id: projectId,
      estimated_duration: parsedTask.estimatedDuration || null,
      retry_count: 0
    };

    const { data: task, error: taskError } = await supabase
      .from('tasks')
      .insert(taskData)
      .select()
      .single();

    if (taskError || !task) {
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
        phoneNumber: taskPhoneNumber,
        projectId
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