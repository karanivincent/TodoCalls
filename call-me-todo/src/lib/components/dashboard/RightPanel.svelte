<script lang="ts">
	import Icon from '@iconify/svelte';
	import { onMount } from 'svelte';
	
	import type { Database } from '$lib/database.types';
	
	type Task = Database['public']['Tables']['tasks']['Row'];
	
	export let triggerCron: () => Promise<void> = async () => {};
	export let onDateSelect: (date: Date) => void = () => {};
	export let tasks: Task[] = [];
	export let selectedDate: Date = new Date();
	export let userTimezone: string = 'UTC';
	export let loading: boolean = false;
	
	// Calculate voice stats from tasks
	$: voiceStats = {
		callsScheduledToday: tasks.filter(t => {
			const taskDate = new Date(t.scheduled_at);
			return taskDate.toDateString() === currentDate.toDateString();
		}).length,
		successfulCallsThisWeek: tasks.filter(t => t.status === 'completed').length
	};
	
	const projectStats = [
		{ name: 'Work', completed: 8, total: 12, color: '#3b82f6' },
		{ name: 'Personal', completed: 3, total: 5, color: '#8b5cf6' }
	];
	
	// Calendar state
	let currentDate = new Date();
	let displayMonth = new Date(selectedDate);
	
	// Get calendar data
	$: monthStart = new Date(displayMonth.getFullYear(), displayMonth.getMonth(), 1);
	$: monthEnd = new Date(displayMonth.getFullYear(), displayMonth.getMonth() + 1, 0);
	$: startDate = new Date(monthStart);
	$: {
		// Adjust to start from Sunday
		const day = startDate.getDay();
		startDate.setDate(startDate.getDate() - day);
	}
	
	$: calendarDays = generateCalendarDays(startDate, monthStart, monthEnd);
	$: monthYearString = displayMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
	
	function generateCalendarDays(start: Date, monthStart: Date, monthEnd: Date) {
		const days = [];
		const current = new Date(start);
		
		for (let i = 0; i < 42; i++) { // 6 weeks
			days.push({
				date: new Date(current),
				isCurrentMonth: current >= monthStart && current <= monthEnd,
				isToday: isSameDay(current, currentDate),
				isSelected: isSameDay(current, selectedDate)
			});
			current.setDate(current.getDate() + 1);
		}
		
		return days;
	}
	
	function isSameDay(date1: Date, date2: Date) {
		return date1.getFullYear() === date2.getFullYear() &&
		       date1.getMonth() === date2.getMonth() &&
		       date1.getDate() === date2.getDate();
	}
	
	function previousMonth() {
		displayMonth = new Date(displayMonth.getFullYear(), displayMonth.getMonth() - 1);
	}
	
	function nextMonth() {
		displayMonth = new Date(displayMonth.getFullYear(), displayMonth.getMonth() + 1);
	}
	
	function selectDate(date: Date) {
		onDateSelect(date);
	}
	
	function goToToday() {
		const today = new Date();
		displayMonth = new Date(today);
		onDateSelect(today);
	}
	
	// Format time for display
	function formatTime(dateString: string): string {
		const date = new Date(dateString);
		return date.toLocaleTimeString('en-US', { 
			hour: 'numeric', 
			minute: '2-digit',
			timeZone: userTimezone
		});
	}
	
	// Update display month when selected date changes
	$: if (selectedDate) {
		displayMonth = new Date(selectedDate);
	}
	
	// Format selected date for display
	$: selectedDateString = selectedDate.toLocaleDateString('en-US', { 
		weekday: 'long',
		month: 'long', 
		day: 'numeric',
		year: 'numeric'
	});
	
	// Check if selected date is today
	$: isToday = selectedDate.toDateString() === currentDate.toDateString();
</script>

<div class="h-full flex flex-col">
	<!-- Calendar Widget -->
	<div class="p-6 border-b border-gray-200">
		<div class="flex items-center justify-between mb-4">
			<h3 class="text-sm font-semibold text-gray-900">Calendar</h3>
			<button 
				on:click={goToToday}
				class="text-xs text-orange-600 hover:text-orange-700 font-medium"
			>
				Today
			</button>
		</div>
		
		<!-- Mini Calendar Header with Navigation -->
		<div class="flex items-center justify-between mb-3">
			<button 
				on:click={previousMonth}
				class="p-1 hover:bg-gray-100 rounded transition-colors"
				aria-label="Previous month"
			>
				<Icon icon="heroicons:chevron-left" class="w-4 h-4 text-gray-600" />
			</button>
			<h4 class="text-sm font-medium text-gray-900">{monthYearString}</h4>
			<button 
				on:click={nextMonth}
				class="p-1 hover:bg-gray-100 rounded transition-colors"
				aria-label="Next month"
			>
				<Icon icon="heroicons:chevron-right" class="w-4 h-4 text-gray-600" />
			</button>
		</div>
		
		<!-- Calendar Grid -->
		<div class="grid grid-cols-7 gap-1 text-center mb-4">
			<!-- Day headers -->
			{#each ['S', 'M', 'T', 'W', 'T', 'F', 'S'] as day}
				<div class="text-xs font-medium text-gray-500 py-1">{day}</div>
			{/each}
			
			<!-- Calendar days -->
			{#each calendarDays as day}
				<button 
					on:click={() => selectDate(day.date)}
					class="w-8 h-8 text-xs rounded-full transition-all relative"
					class:bg-orange-600={day.isSelected}
					class:text-white={day.isSelected}
					class:bg-orange-100={day.isToday && !day.isSelected}
					class:text-orange-700={day.isToday && !day.isSelected}
					class:font-semibold={day.isToday}
					class:text-gray-900={day.isCurrentMonth && !day.isSelected && !day.isToday}
					class:text-gray-400={!day.isCurrentMonth}
					class:hover:bg-gray-100={!day.isSelected && !day.isToday}
					disabled={!day.isCurrentMonth}
				>
					{day.date.getDate()}
					{#if day.isToday}
						<span class="absolute bottom-0.5 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-orange-600 rounded-full"></span>
					{/if}
				</button>
			{/each}
		</div>
		
		<!-- Selected Date Info -->
		<div class="mb-3 pb-3 border-b border-gray-100">
			<p class="text-xs font-medium text-gray-900">
				{isToday ? 'Today' : selectedDateString}
			</p>
			<p class="text-xs text-gray-500">
				{tasks.length} {tasks.length === 1 ? 'task' : 'tasks'} scheduled
			</p>
		</div>
		
		<!-- Tasks for Selected Date -->
		{#if loading}
			<div class="flex items-center justify-center py-8">
				<div class="animate-spin rounded-full h-6 w-6 border-b-2 border-orange-600"></div>
			</div>
		{:else if tasks.length > 0}
			<div class="space-y-2">
				<h5 class="text-xs font-medium text-gray-700">Scheduled Tasks</h5>
				<div class="space-y-2 max-h-48 overflow-y-auto">
					{#each tasks as task}
						<div class="flex items-start text-sm p-2 rounded-lg hover:bg-gray-50 transition-colors">
							<Icon 
								icon="heroicons:phone" 
								class="w-4 h-4 mt-0.5 mr-2 flex-shrink-0 {task.status === 'completed' ? 'text-green-600' : 'text-blue-600'}" 
							/>
							<div class="flex-1 min-w-0">
								<p class="text-gray-900 text-xs font-medium truncate">{task.title}</p>
								<p class="text-gray-500 text-xs">
									{formatTime(task.scheduled_at)}
									{#if task.status === 'completed'}
										<span class="ml-1 text-green-600">✓</span>
									{/if}
								</p>
							</div>
						</div>
					{/each}
				</div>
			</div>
		{:else}
			<div class="text-center py-4">
				<Icon icon="heroicons:calendar-days" class="w-8 h-8 text-gray-300 mx-auto mb-2" />
				<p class="text-xs text-gray-500">No tasks scheduled</p>
			</div>
		{/if}
	</div>
	
	<!-- Voice Status & Controls -->
	<div class="p-6 border-b border-gray-200">
		<h3 class="text-sm font-semibold text-gray-900 mb-4 flex items-center">
			<Icon icon="heroicons:phone" class="w-4 h-4 mr-2 text-orange-600" />
			Voice Dashboard
		</h3>
		
		<!-- Voice Stats -->
		<div class="space-y-3 mb-4">
			<div class="flex items-center justify-between text-sm">
				<span class="flex items-center text-gray-600">
					<Icon icon="heroicons:phone-arrow-up-right" class="w-4 h-4 mr-2" />
					Calls scheduled today
				</span>
				<span class="font-medium text-gray-900">{voiceStats.callsScheduledToday}</span>
			</div>
			<div class="flex items-center justify-between text-sm">
				<span class="flex items-center text-gray-600">
					<Icon icon="heroicons:check-circle" class="w-4 h-4 mr-2 text-green-600" />
					Successful this week
				</span>
				<span class="font-medium text-gray-900">{voiceStats.successfulCallsThisWeek}</span>
			</div>
		</div>
		
		<!-- Voice Actions -->
		<div class="space-y-2">
			<button 
				on:click={triggerCron}
				class="w-full px-3 py-2 bg-orange-600 text-white text-sm rounded-lg hover:bg-orange-700 transition-colors"
			>
				Check Due Reminders
			</button>
			<button class="w-full px-3 py-2 bg-gray-100 text-gray-700 text-sm rounded-lg hover:bg-gray-200 transition-colors">
				Voice Review Session
			</button>
		</div>
	</div>
	
	<!-- Project Quick Stats -->
	<div class="p-6">
		<h3 class="text-sm font-semibold text-gray-900 mb-4">Project Progress</h3>
		
		<div class="space-y-4">
			{#each projectStats as project}
				<div>
					<div class="flex items-center justify-between mb-1">
						<div class="flex items-center">
							<div 
								class="w-3 h-3 rounded-full mr-2"
								style="background-color: {project.color}"
							></div>
							<span class="text-sm font-medium text-gray-900">{project.name}</span>
						</div>
						<span class="text-xs text-gray-500">{project.completed}/{project.total}</span>
					</div>
					<div class="w-full bg-gray-200 rounded-full h-2">
						<div 
							class="h-2 rounded-full"
							style="background-color: {project.color}; width: {(project.completed / project.total) * 100}%"
						></div>
					</div>
				</div>
			{/each}
		</div>
	</div>
</div>