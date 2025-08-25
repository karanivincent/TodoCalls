import { json } from '@sveltejs/kit';
import { createServerClient } from '@supabase/ssr';
import { env as publicEnv } from '$env/dynamic/public';
import { db, projects, tasks } from '$lib/db';
import { eq, and, count, sql } from 'drizzle-orm';
import type { ProjectCreate, ProjectUpdate } from '$lib/database.types.enhanced';
import type { RequestHandler } from './$types';

// GET /api/projects - Get all user projects with task counts
export const GET: RequestHandler = async ({ url, cookies }) => {
  try {
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
    
    // Get user from session
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return json({ error: 'Unauthorized' }, { status: 401 });
    }

    const includeArchived = url.searchParams.get('includeArchived') === 'true';
    
    // Query projects with task counts using Drizzle
    const projectsWithCounts = await db
      .select({
        id: projects.id,
        name: projects.name,
        description: projects.description,
        color: projects.color,
        is_archived: projects.is_archived,
        created_at: projects.created_at,
        total_tasks: count(tasks.id),
        pending_tasks: count(sql`CASE WHEN ${tasks.status} = 'pending' THEN 1 END`),
        completed_tasks: count(sql`CASE WHEN ${tasks.status} = 'completed' THEN 1 END`),
        overdue_tasks: count(sql`CASE WHEN ${tasks.status} = 'pending' AND ${tasks.scheduled_at} < NOW() THEN 1 END`),
      })
      .from(projects)
      .leftJoin(tasks, eq(tasks.project_id, projects.id))
      .where(
        and(
          eq(projects.user_id, user.id),
          includeArchived ? undefined : eq(projects.is_archived, false)
        )
      )
      .groupBy(projects.id)
      .orderBy(projects.created_at);

    return json({
      success: true,
      projects: projectsWithCounts
    });

  } catch (error) {
    console.error('Unexpected error in GET /api/projects:', error);
    return json({ error: 'Internal server error' }, { status: 500 });
  }
};

// POST /api/projects - Create a new project
export const POST: RequestHandler = async ({ request, cookies }) => {
  try {
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
    
    // Get user from session
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { name, description, color } = body;

    // Validate required fields
    if (!name || name.trim().length === 0) {
      return json({ error: 'Project name is required' }, { status: 400 });
    }

    if (name.length > 50) {
      return json({ error: 'Project name must be 50 characters or less' }, { status: 400 });
    }

    // Validate color format if provided
    if (color && !/^#[0-9A-Fa-f]{6}$/.test(color)) {
      return json({ error: 'Color must be a valid hex color (e.g., #ff0000)' }, { status: 400 });
    }

    const projectData: ProjectCreate = {
      user_id: user.id,
      name: name.trim(),
      description: description?.trim() || undefined,
      color: color || '#6366f1' // Default to indigo
    };

    const [project] = await db
      .insert(projects)
      .values(projectData)
      .returning();

    return json({
      success: true,
      project
    });

  } catch (error) {
    console.error('Unexpected error in POST /api/projects:', error);
    return json({ error: 'Internal server error' }, { status: 500 });
  }
};