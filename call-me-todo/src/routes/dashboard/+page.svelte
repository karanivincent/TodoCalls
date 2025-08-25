<script lang="ts">
	import { onMount } from 'svelte';
	import { createSupabaseClient } from '$lib/supabase';
	import type { Database } from '$lib/database.types';
	import { toast } from '$lib/stores/toast';
	import { getUserTimezone, getStartOfDayInTimezone, getEndOfDayInTimezone } from '$lib/utils/timezone';
	
	// New dashboard components
	import DashboardLayout from '$lib/components/dashboard/DashboardLayout.svelte';
	import RightPanel from '$lib/components/dashboard/RightPanel.svelte';
	import FocusBar from '$lib/components/dashboard/FocusBar.svelte';
	import MainContent from '$lib/components/dashboard/MainContent.svelte';
	
	type Task = Database['public']['Tables']['tasks']['Row'];
	
	let supabase = createSupabaseClient();
	let user: any = null;
	let userName = '';
	let userTimezone = 'Africa/Nairobi';
	let tasks: Task[] = [];
	let selectedDateTasks: Task[] = [];
	let loading = true;
	let loadingSelectedDate = false;
	let currentView: 'today' | 'timeline' | 'list' = 'today';
	let selectedDate = new Date();
	
	onMount(async () => {
		// Get user data (already checked in layout)
		const { data: { user: currentUser } } = await supabase.auth.getUser();
		user = currentUser;
		
		// Get user's full name and timezone
		if (user?.user_metadata?.full_name) {
			userName = user.user_metadata.full_name;
		} else {
			userName = user?.email?.split('@')[0] || 'User';
		}
		
		// Get user's timezone from profile
		const { data: profile } = await supabase
			.from('user_profiles')
			.select('timezone')
			.eq('id', user.id)
			.single();
		
		if (profile?.timezone) {
			userTimezone = profile.timezone;
		} else {
			// Auto-detect and save timezone if not set
			const detectedTimezone = getUserTimezone();
			userTimezone = detectedTimezone;
			
			// Update profile with detected timezone
			await supabase
				.from('user_profiles')
				.update({ timezone: detectedTimezone })
				.eq('id', user.id);
		}
		
		// Load tasks
		await loadTasks();
		loading = false;
		
		// Listen for task updates from QuickAddBar
		const handleTaskUpdate = () => {
			loadTasks();
		};
		window.addEventListener('taskListUpdate', handleTaskUpdate);
		
		return () => {
			window.removeEventListener('taskListUpdate', handleTaskUpdate);
		};
	});
	
	async function loadTasks() {
		// Get today's date range in user's timezone (converted to UTC for database query)
		const startOfToday = getStartOfDayInTimezone(userTimezone);
		const endOfToday = getEndOfDayInTimezone(userTimezone);
		
		console.log('Loading tasks for today:', {
			userTimezone,
			startOfToday: startOfToday.toISOString(),
			endOfToday: endOfToday.toISOString(),
			localStart: startOfToday.toLocaleString('en-US', { timeZone: userTimezone }),
			localEnd: endOfToday.toLocaleString('en-US', { timeZone: userTimezone })
		});
		
		const { data, error } = await supabase
			.from('tasks')
			.select('*')
			.eq('user_id', user.id)
			.gte('scheduled_at', startOfToday.toISOString())
			.lte('scheduled_at', endOfToday.toISOString())
			.order('scheduled_at', { ascending: true });
		
		if (error) {
			console.error('Error loading tasks:', error);
			toast.show('Failed to load tasks', 'error');
		} else {
			tasks = data || [];
			selectedDateTasks = tasks; // Initially, selected date is today
			console.log(`Loaded ${tasks.length} tasks for today`);
		}
	}
	
	async function loadTasksForDate(date: Date) {
		loadingSelectedDate = true;
		
		// Create date range for the selected date
		const startOfDay = new Date(date);
		startOfDay.setHours(0, 0, 0, 0);
		
		const endOfDay = new Date(date);
		endOfDay.setHours(23, 59, 59, 999);
		
		console.log('Loading tasks for selected date:', {
			date: date.toLocaleDateString(),
			startOfDay: startOfDay.toISOString(),
			endOfDay: endOfDay.toISOString()
		});
		
		try {
			const { data, error } = await supabase
				.from('tasks')
				.select('*')
				.eq('user_id', user.id)
				.gte('scheduled_at', startOfDay.toISOString())
				.lte('scheduled_at', endOfDay.toISOString())
				.order('scheduled_at', { ascending: true });
			
			if (error) {
				console.error('Error loading tasks for date:', error);
				toast.show('Failed to load tasks for selected date', 'error');
			} else {
				selectedDateTasks = data || [];
				console.log(`Loaded ${selectedDateTasks.length} tasks for ${date.toLocaleDateString()}`);
				
				// Check if the selected date is today
				const today = new Date();
				if (date.toDateString() === today.toDateString()) {
					// If it's today, update the main tasks array too
					tasks = selectedDateTasks;
				}
			}
		} finally {
			loadingSelectedDate = false;
		}
	}
	
	async function testReminder(taskId: string) {
		console.log('🎯 [FRONTEND] Starting test reminder for task:', taskId);
		try {
			console.log('🎯 [FRONTEND] Sending POST to /api/tasks/test-reminder...');
			const response = await fetch('/api/tasks/test-reminder', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ taskId })
			});
			
			console.log('🎯 [FRONTEND] Response status:', response.status);
			const result = await response.json();
			console.log('🎯 [FRONTEND] Response data:', result);
			
			if (result.success) {
				console.log('🎯 [FRONTEND] ✅ Test call initiated successfully, SID:', result.callSid);
				toast.show('Test call initiated! Your phone should ring shortly.', 'success');
			} else {
				console.error('🎯 [FRONTEND] ❌ Test call failed:', result.error);
				toast.show(result.error || 'Failed to initiate test call', 'error');
			}
		} catch (error) {
			console.error('🎯 [FRONTEND] ❌ Exception in testReminder:', error);
			toast.show('Failed to initiate test call', 'error');
		}
	}
	
	// Manual check for due reminders - useful for troubleshooting
	async function triggerCron() {
		try {
			toast.show('Checking for overdue reminders...', 'info');
			
			const response = await fetch('/api/test-cron?call=true');
			const result = await response.json();
			
			if (result.cronExecution?.tasksProcessed > 0) {
				toast.success(`Found and triggered ${result.cronExecution.tasksProcessed} overdue reminder(s)`);
				// Reload tasks to show updates
				await loadTasks();
			} else if (result.cronExecution?.tasksProcessed === 0) {
				toast.info('No overdue reminders found - all caught up! 🎉');
			} else if (result.cronExecution) {
				toast.info('Reminder check completed');
				// Still reload in case status changed
				await loadTasks();
			} else {
				toast.info('System check completed');
			}
		} catch (error) {
			console.error('Error checking reminders:', error);
			toast.error('Failed to check for overdue reminders');
		}
	}
	
	function handleViewChange(newView: 'today' | 'timeline' | 'list') {
		currentView = newView;
	}
	
	async function handleDateSelect(date: Date) {
		selectedDate = date;
		console.log('Date selected:', date);
		
		if (user) {
			await loadTasksForDate(date);
		}
	}
</script>

<DashboardLayout 
	{currentView}
	{user} 
	{tasks} 
	{loading} 
	{userTimezone} 
	{loadTasks} 
	{testReminder} 
	{triggerCron}
>	
	<!-- Focus Bar -->
	<FocusBar 
		slot="focus-bar" 
		{tasks} 
		{userTimezone}
	/>
	
	<!-- Main Content -->
	<MainContent 
		slot="main-content" 
		{currentView} 
		{tasks} 
		{loading} 
		{userTimezone} 
		{testReminder} 
		{triggerCron}
	/>
	
	<!-- Right Panel -->
	<RightPanel 
		slot="right-panel" 
		{triggerCron}
		onDateSelect={handleDateSelect}
		tasks={selectedDateTasks}
		{selectedDate}
		{userTimezone}
		loading={loadingSelectedDate}
	/>
</DashboardLayout>