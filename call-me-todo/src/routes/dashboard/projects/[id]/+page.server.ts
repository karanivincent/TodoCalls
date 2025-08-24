import type { PageServerLoad } from './$types';
import { error } from '@sveltejs/kit';
import { createServerClient } from '@supabase/ssr';
import { env as publicEnv } from '$env/dynamic/public';

export const load: PageServerLoad = async ({ params, cookies }) => {
	const projectId = params.id;
	
	// Create Supabase client
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
		throw error(401, 'Unauthorized');
	}
	
	// Fetch project details
	const { data: project, error: projectError } = await supabase
		.from('projects')
		.select('*')
		.eq('id', projectId)
		.eq('user_id', user.id)
		.single();
	
	if (projectError || !project) {
		throw error(404, 'Project not found');
	}
	
	// Fetch tasks for this project
	const { data: tasks, error: tasksError } = await supabase
		.from('tasks')
		.select('*')
		.eq('project_id', projectId)
		.eq('user_id', user.id)
		.order('created_at', { ascending: false });
	
	if (tasksError) {
		console.error('Error fetching tasks:', tasksError);
	}
	
	return {
		project,
		tasks: tasks || []
	};
};