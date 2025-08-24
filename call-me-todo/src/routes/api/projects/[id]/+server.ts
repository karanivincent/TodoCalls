import { json } from '@sveltejs/kit';
import { createSupabaseClient } from '$lib/supabase';
import type { ProjectUpdate } from '$lib/database.types.enhanced';
import type { RequestHandler } from './$types';

// GET /api/projects/[id] - Get a specific project
export const GET: RequestHandler = async ({ params }) => {
  try {
    const supabase = createSupabaseClient();
    
    // Get user from session
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: project, error } = await supabase
      .from('projects')
      .select('*')
      .eq('id', params.id)
      .eq('user_id', user.id)
      .single();

    if (error) {
      console.error('Error fetching project:', error);
      return json({ error: 'Project not found' }, { status: 404 });
    }

    return json({
      success: true,
      project
    });

  } catch (error) {
    console.error('Unexpected error in GET /api/projects/[id]:', error);
    return json({ error: 'Internal server error' }, { status: 500 });
  }
};

// PUT /api/projects/[id] - Update a project
export const PUT: RequestHandler = async ({ params, request }) => {
  try {
    const supabase = createSupabaseClient();
    
    // Get user from session
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { name, description, color, is_archived } = body;

    // Validate fields if provided
    if (name !== undefined) {
      if (!name || name.trim().length === 0) {
        return json({ error: 'Project name cannot be empty' }, { status: 400 });
      }
      if (name.length > 50) {
        return json({ error: 'Project name must be 50 characters or less' }, { status: 400 });
      }
    }

    if (color && !/^#[0-9A-Fa-f]{6}$/.test(color)) {
      return json({ error: 'Color must be a valid hex color (e.g., #ff0000)' }, { status: 400 });
    }

    const updateData: ProjectUpdate = {};
    if (name !== undefined) updateData.name = name.trim();
    if (description !== undefined) updateData.description = description?.trim() || null;
    if (color !== undefined) updateData.color = color;
    if (is_archived !== undefined) updateData.is_archived = is_archived;

    const { data: project, error } = await supabase
      .from('projects')
      .update(updateData)
      .eq('id', params.id)
      .eq('user_id', user.id)
      .select()
      .single();

    if (error) {
      console.error('Error updating project:', error);
      return json({ error: 'Failed to update project' }, { status: 500 });
    }

    return json({
      success: true,
      project
    });

  } catch (error) {
    console.error('Unexpected error in PUT /api/projects/[id]:', error);
    return json({ error: 'Internal server error' }, { status: 500 });
  }
};

// DELETE /api/projects/[id] - Archive a project (soft delete)
export const DELETE: RequestHandler = async ({ params }) => {
  try {
    const supabase = createSupabaseClient();
    
    // Get user from session
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if project has active tasks
    const { data: activeTasks, error: tasksError } = await supabase
      .from('tasks')
      .select('id')
      .eq('project_id', params.id)
      .eq('user_id', user.id)
      .in('status', ['pending', 'in_progress']);

    if (tasksError) {
      console.error('Error checking project tasks:', tasksError);
      return json({ error: 'Failed to check project status' }, { status: 500 });
    }

    if (activeTasks && activeTasks.length > 0) {
      return json({ 
        error: `Cannot delete project with ${activeTasks.length} active task(s). Complete or move tasks first.` 
      }, { status: 400 });
    }

    // Archive the project (soft delete)
    const { data: project, error } = await supabase
      .from('projects')
      .update({ is_archived: true })
      .eq('id', params.id)
      .eq('user_id', user.id)
      .select()
      .single();

    if (error) {
      console.error('Error archiving project:', error);
      return json({ error: 'Failed to archive project' }, { status: 500 });
    }

    // Update any remaining tasks to remove project association
    await supabase
      .from('tasks')
      .update({ project_id: null })
      .eq('project_id', params.id)
      .eq('user_id', user.id);

    return json({
      success: true,
      project
    });

  } catch (error) {
    console.error('Unexpected error in DELETE /api/projects/[id]:', error);
    return json({ error: 'Internal server error' }, { status: 500 });
  }
};