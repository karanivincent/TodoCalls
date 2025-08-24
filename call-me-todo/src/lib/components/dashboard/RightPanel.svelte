<script lang="ts">
	export let triggerCron: () => Promise<void> = async () => {};
	
	// Mock data for now - will be real data later
	const upcomingEvents = [
		{ time: '2:00 PM', title: 'Team Meeting' },
		{ time: '4:30 PM', title: 'Doctor Appointment' }
	];
	
	const voiceStats = {
		callsScheduledToday: 2,
		successfulCallsThisWeek: 3
	};
	
	const projectStats = [
		{ name: 'Work', completed: 8, total: 12, color: '#3b82f6' },
		{ name: 'Personal', completed: 3, total: 5, color: '#8b5cf6' }
	];
	
	// Get current date for mini calendar
	const today = new Date();
	const currentMonth = today.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
	const currentDate = today.getDate();
</script>

<div class="h-full flex flex-col">
	<!-- Calendar Widget -->
	<div class="p-6 border-b border-gray-200">
		<h3 class="text-sm font-semibold text-gray-900 mb-4">Calendar</h3>
		
		<!-- Mini Calendar Header -->
		<div class="text-center mb-3">
			<h4 class="text-sm font-medium text-gray-900">{currentMonth}</h4>
		</div>
		
		<!-- Calendar Grid (simplified for now) -->
		<div class="grid grid-cols-7 gap-1 text-center mb-4">
			<!-- Day headers -->
			{#each ['S', 'M', 'T', 'W', 'T', 'F', 'S'] as day}
				<div class="text-xs font-medium text-gray-500 py-1">{day}</div>
			{/each}
			
			<!-- Calendar days (simplified) -->
			{#each Array(35) as _, i}
				{@const dayNum = i - 6 + currentDate}
				<button 
					class="w-8 h-8 text-xs rounded-full transition-colors"
					class:bg-orange-600={dayNum === currentDate}
					class:text-white={dayNum === currentDate}
					class:text-gray-900={dayNum !== currentDate && dayNum > 0 && dayNum <= 31}
					class:text-gray-400={dayNum <= 0 || dayNum > 31}
					class:hover:bg-gray-100={dayNum !== currentDate}
				>
					{dayNum > 0 && dayNum <= 31 ? dayNum : ''}
				</button>
			{/each}
		</div>
		
		<!-- Upcoming Events -->
		{#if upcomingEvents.length > 0}
			<div class="space-y-2">
				<h5 class="text-xs font-medium text-gray-700">Today's Events</h5>
				{#each upcomingEvents as event}
					<div class="flex items-center text-sm">
						<div class="w-2 h-2 bg-blue-500 rounded-full mr-3"></div>
						<div class="flex-1">
							<p class="text-gray-900 text-xs">{event.title}</p>
							<p class="text-gray-500 text-xs">{event.time}</p>
						</div>
					</div>
				{/each}
			</div>
		{/if}
	</div>
	
	<!-- Voice Status & Controls -->
	<div class="p-6 border-b border-gray-200">
		<h3 class="text-sm font-semibold text-gray-900 mb-4 flex items-center">
			<svg class="w-4 h-4 mr-2 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"/>
			</svg>
			Voice Dashboard
		</h3>
		
		<!-- Voice Stats -->
		<div class="space-y-3 mb-4">
			<div class="flex items-center justify-between text-sm">
				<span class="text-gray-600">📞 Calls scheduled today</span>
				<span class="font-medium text-gray-900">{voiceStats.callsScheduledToday}</span>
			</div>
			<div class="flex items-center justify-between text-sm">
				<span class="text-gray-600">✅ Successful this week</span>
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