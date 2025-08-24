<script lang="ts">
	import type { Database } from '$lib/database.types';
	import { getUserTimezone, formatTimeInTimezone, getHourInTimezone, isSameDayInTimezone, getStartOfDayInTimezone, getEndOfDayInTimezone } from '$lib/utils/timezone';
	
	type Task = Database['public']['Tables']['tasks']['Row'];
	
	export let tasks: Task[] = [];
	export let loading: boolean = false;
	export let userTimezone: string = 'UTC';
	export let testReminder: (taskId: string) => Promise<void>;
	
	// Timeline hours - dynamically calculated based on tasks
	let hours: Array<{ time: string; hour: number; isExtended?: boolean }> = [];
	
	// Default time range: 5 AM to 11 PM (18 hours)
	const DEFAULT_START_HOUR = 5;  // 5 AM
	const DEFAULT_END_HOUR = 23;   // 11 PM
	
	function generateHours(startHour: number, endHour: number) {
		const hourArray = [];
		
		for (let hour = startHour; hour <= endHour; hour++) {
			// Handle AM/PM formatting properly
			let timeLabel;
			if (hour === 0) {
				timeLabel = '12 AM';
			} else if (hour === 12) {
				timeLabel = '12 PM';
			} else if (hour < 12) {
				timeLabel = `${hour} AM`;
			} else {
				timeLabel = `${hour - 12} PM`;
			}
			
			hourArray.push({
				time: timeLabel,
				hour: hour,
				isExtended: hour < DEFAULT_START_HOUR || hour > DEFAULT_END_HOUR
			});
		}
		
		return hourArray;
	}
	
	function updateHoursBasedOnTasks() {
		if (tasks.length === 0) {
			// No tasks, show default range
			hours = generateHours(DEFAULT_START_HOUR, DEFAULT_END_HOUR);
			return;
		}
		
		// Find the earliest and latest task times
		let earliestHour = DEFAULT_START_HOUR;
		let latestHour = DEFAULT_END_HOUR;
		
		tasks.forEach(task => {
			const taskHour = getHourInTimezone(task.scheduled_at, userTimezone);
			if (taskHour < earliestHour) {
				earliestHour = taskHour;
			}
			if (taskHour > latestHour) {
				latestHour = taskHour;
			}
		});
		
		// Ensure we have a valid range and don't go below 0 or above 23
		earliestHour = Math.max(0, Math.min(earliestHour, DEFAULT_START_HOUR));
		latestHour = Math.min(23, Math.max(latestHour, DEFAULT_END_HOUR));
		
		hours = generateHours(earliestHour, latestHour);
	}
	
	// Get current hour for timeline indicator
	let currentHour = new Date().getHours();
	
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
	
	// Update timeline when tasks change
	$: if (tasks) {
		updateHoursBasedOnTasks();
	}
	
	// Update current hour every minute
	setInterval(() => {
		currentHour = new Date().getHours();
	}, 60000);
</script>

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
			{#each hours as { time, hour, isExtended }}
				<div class="flex items-start mb-6 relative" class:opacity-75={isExtended}>
					<!-- Time Label -->
					<div class="w-20 text-sm font-medium" 
						class:text-gray-400={isExtended}
						class:text-gray-500={!isExtended}>
						{time}
						{#if isExtended}
							<span class="text-xs text-gray-400 ml-1" title="Extended hours">•</span>
						{/if}
					</div>
					
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