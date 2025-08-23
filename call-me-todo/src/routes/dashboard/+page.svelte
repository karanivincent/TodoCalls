<script lang="ts">
	import { onMount } from 'svelte';
	import { createSupabaseClient } from '$lib/supabase';
	import type { Database } from '$lib/database.types';
	import { toast } from '$lib/stores/toast';
	import { fade } from 'svelte/transition';
	import { getUserTimezone, formatTimeInTimezone, getHourInTimezone, isSameDayInTimezone, getStartOfDayInTimezone, getEndOfDayInTimezone } from '$lib/utils/timezone';
	
	type Task = Database['public']['Tables']['tasks']['Row'];
	
	let supabase = createSupabaseClient();
	let user: any = null;
	let userName = '';
	let userTimezone = 'Africa/Nairobi';
	let tasks: Task[] = [];
	let loading = true;
	
	// Timeline hours
	const hours = Array.from({ length: 13 }, (_, i) => {
		const hour = i + 7; // Start at 7 AM
		return {
			time: hour <= 12 ? `${hour} AM` : `${hour - 12} PM`,
			hour: hour
		};
	});
	
	// Get current hour for timeline indicator
	let currentHour = new Date().getHours();
	
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
		
		// Update current hour every minute
		const interval = setInterval(() => {
			currentHour = new Date().getHours();
		}, 60000);
		
		return () => {
			clearInterval(interval);
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
			console.log(`Loaded ${tasks.length} tasks for today`);
		}
	}
	
	function getTasksForHour(hour: number) {
		const today = new Date();
		
		return tasks.filter(task => {
			// Convert UTC time to user's timezone for display
			const taskHour = getHourInTimezone(task.scheduled_at, userTimezone);
			
			// Double-check that task is actually from today (additional safety check)
			const isToday = isSameDayInTimezone(task.scheduled_at, today, userTimezone);
			
			return taskHour === hour && isToday;
		});
	}
	
	function formatTime(date: string) {
		// Format time in user's timezone
		return formatTimeInTimezone(date, userTimezone);
	}
	
	// Mock data for stats
	let stats = {
		completedToday: 5,
		totalToday: 8,
		delegatedActive: 3,
		familyCompliance: 85
	};
	
	async function testReminder(taskId: string) {
		try {
			const response = await fetch('/api/tasks/test-reminder', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ taskId })
			});
			
			const result = await response.json();
			if (result.success) {
				toast.show('Test call initiated! Your phone should ring shortly.', 'success');
			} else {
				toast.show(result.error || 'Failed to initiate test call', 'error');
			}
		} catch (error) {
			console.error('Error testing reminder:', error);
			toast.show('Failed to initiate test call', 'error');
		}
	}
	
	// Manual cron trigger for testing in preview deployments
	async function triggerCron() {
		try {
			const response = await fetch('/api/test-cron');
			const result = await response.json();
			
			if (result.cronResult?.tasksProcessed > 0) {
				toast.show(`Processed ${result.cronResult.tasksProcessed} due tasks`, 'success');
			} else {
				toast.show('No tasks are currently due', 'info');
			}
		} catch (error) {
			console.error('Error triggering cron:', error);
			toast.show('Failed to check for due tasks', 'error');
		}
	}
</script>

<div class="p-8 max-w-7xl mx-auto">
	<!-- Header with Stats -->
	<div class="mb-8">
		<div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
			<div>
				<h1 class="text-2xl font-semibold text-gray-900">
					Welcome back, {userName}!
				</h1>
				<p class="text-gray-500 mt-1">Here's your schedule for today</p>
			</div>
			
			<!-- Clean Stats -->
			<div class="flex gap-6">
				<div class="text-center">
					<div class="text-3xl font-semibold text-gray-900">
						{stats.completedToday}/{stats.totalToday}
					</div>
					<div class="text-xs text-gray-500 mt-1">Completed Today</div>
				</div>
				<div class="text-center">
					<div class="text-3xl font-semibold text-gray-900">
						{stats.delegatedActive}
					</div>
					<div class="text-xs text-gray-500 mt-1">Delegated</div>
				</div>
				<div class="text-center hidden sm:block">
					<div class="text-3xl font-semibold text-gray-900">
						{stats.familyCompliance}%
					</div>
					<div class="text-xs text-gray-500 mt-1">Compliance</div>
				</div>
			</div>
		</div>
	</div>
	
	<!-- Main Content Grid -->
	<div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
		<!-- Timeline View (2 columns on lg) -->
		<div class="lg:col-span-2">
			<div class="bg-white rounded-lg border border-gray-200">
				<div class="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
					<h2 class="text-base font-medium text-gray-900">
						Today • {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
					</h2>
					<div class="flex items-center gap-2">
						<!-- Manual cron trigger for preview deployments -->
						<button 
							on:click={triggerCron}
							class="px-3 py-1 text-xs bg-purple-50 text-purple-700 hover:bg-purple-100 rounded-md transition-colors flex items-center gap-1"
							title="Check for due tasks (for testing in preview)"
						>
							<svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
							</svg>
							Check Due
						</button>
						<button class="p-1 hover:bg-gray-50 rounded transition-colors">
							<svg class="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"/>
							</svg>
						</button>
					</div>
				</div>
				
				<div class="p-6">
					{#if loading}
						<div class="flex justify-center py-12">
							<div class="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600"></div>
						</div>
					{:else if tasks.length === 0}
						<!-- Clean Empty State -->
						<div class="text-center py-16">
							<svg class="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" 
									d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"/>
							</svg>
							<h3 class="text-lg font-medium text-gray-900 mb-2">
								No reminders scheduled for today
							</h3>
							<p class="text-gray-500 mb-6 max-w-sm mx-auto">
								Start organizing your day with AI-powered reminders
							</p>
							<button class="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors">
								Create Your First Reminder
							</button>
							<p class="text-sm text-gray-400 mt-4">Or try: "Call me at 3pm about lunch"</p>
						</div>
					{:else}
						<!-- Timeline -->
						<div class="relative">
							{#each hours as { time, hour }}
								<div class="flex items-start mb-6 relative">
									<!-- Time Label -->
									<div class="w-20 text-sm text-gray-500 font-medium">{time}</div>
									
									<!-- Timeline Line -->
									<div class="relative flex-1">
										<div class="absolute top-3 left-0 right-0 border-t border-gray-200"></div>
										
										<!-- Current Time Indicator -->
										{#if hour === currentHour}
											<div class="absolute top-3 left-0 flex items-center">
												<div class="w-3 h-3 bg-orange-500 rounded-full"></div>
												<span class="ml-2 text-xs font-medium text-orange-600">NOW</span>
											</div>
										{/if}
										
										<!-- Tasks for this hour -->
										<div class="relative ml-6">
											{#each getTasksForHour(hour) as task}
												<div class="mb-3 bg-white border border-gray-200 rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow">
													<div class="flex items-start justify-between">
														<div class="flex-1">
															<div class="flex items-center gap-2 mb-1">
																{#if task.status === 'completed'}
																	<span class="text-green-600">✓</span>
																{:else if task.status === 'missed'}
																	<span class="text-red-600">❌</span>
																{:else}
																	<span class="text-blue-600">⏰</span>
																{/if}
																<h4 class="font-medium text-gray-900">{task.title}</h4>
															</div>
															<p class="text-sm text-gray-600">{formatTime(task.scheduled_at)}</p>
															{#if task.status === 'pending'}
																<button 
																	on:click={() => testReminder(task.id)}
																	class="mt-2 text-xs px-2 py-1 bg-orange-100 text-orange-700 rounded hover:bg-orange-200 transition-colors"
																	title="Test reminder call now"
																>
																	📞 Test Call
																</button>
															{/if}
														</div>
														<button class="text-gray-400 hover:text-gray-600">
															<svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
																<path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z"/>
															</svg>
														</button>
													</div>
												</div>
											{/each}
										</div>
									</div>
								</div>
							{/each}
						</div>
					{/if}
				</div>
			</div>
		</div>
		
		<!-- Right Sidebar -->
		<div class="space-y-6">
			<!-- Upcoming Section -->
			<div class="bg-white rounded-lg border border-gray-200">
				<div class="px-6 py-4 border-b border-gray-200">
					<h3 class="text-base font-medium text-gray-900">Upcoming</h3>
					<p class="text-xs text-gray-500 mt-1">Next 3 days</p>
				</div>
				<div class="p-6">
					<div class="space-y-4">
						<div class="flex items-start gap-3">
							<svg class="w-5 h-5 text-blue-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"/>
							</svg>
							<div class="flex-1">
								<p class="text-sm font-medium text-gray-900">Team Standup</p>
								<p class="text-xs text-gray-500">Tomorrow, 9:00 AM</p>
							</div>
							<span class="px-2 py-1 text-xs bg-blue-50 text-blue-700 rounded">Work</span>
						</div>
						<div class="flex items-start gap-3">
							<svg class="w-5 h-5 text-pink-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"/>
							</svg>
							<div class="flex-1">
								<p class="text-sm font-medium text-gray-900">Mom's Medication</p>
								<p class="text-xs text-gray-500">Tomorrow, 9:00 AM</p>
							</div>
							<span class="px-2 py-1 text-xs bg-pink-50 text-pink-700 rounded">Family</span>
						</div>
						<div class="flex items-start gap-3">
							<svg class="w-5 h-5 text-blue-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"/>
							</svg>
							<div class="flex-1">
								<p class="text-sm font-medium text-gray-900">Client Follow-up</p>
								<p class="text-xs text-gray-500">Friday, 2:00 PM</p>
							</div>
							<span class="px-2 py-1 text-xs bg-blue-50 text-blue-700 rounded">Work</span>
						</div>
					</div>
				</div>
			</div>
			
			<!-- AI Insights -->
			<div class="bg-white rounded-lg border border-gray-200">
				<div class="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
					<div class="flex items-center gap-2">
						<svg class="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"/>
						</svg>
						<h3 class="text-base font-medium text-gray-900">AI Insights</h3>
					</div>
					<span class="px-2 py-0.5 text-xs bg-purple-50 text-purple-700 rounded">Smart</span>
				</div>
				<div class="p-6">
					<div class="space-y-3">
						<div class="bg-gray-50 rounded-lg p-3">
							<p class="text-sm text-gray-700">Mom responds best at 9:15 AM</p>
							<button class="text-xs text-purple-600 hover:text-purple-700 mt-1">
								Apply suggestion →
							</button>
						</div>
						<div class="bg-gray-50 rounded-lg p-3">
							<p class="text-sm text-gray-700">John is usually busy MWF 2-3 PM</p>
							<button class="text-xs text-purple-600 hover:text-purple-700 mt-1">
								Adjust schedule →
							</button>
						</div>
					</div>
				</div>
			</div>
		</div>
	</div>
</div>
