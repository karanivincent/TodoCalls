<script lang="ts">
	export let currentView: 'today' | 'timeline' | 'list' = 'today';
	export let onViewChange: (view: 'today' | 'timeline' | 'list') => void = () => {};
	export let taskCounts: {
		today: number;
		upcoming: number;
		completed: number;
		overdue: number;
	} = { today: 0, upcoming: 0, completed: 0, overdue: 0 };
	
	// Mock projects for now - will be real data later
	const projects = [
		{ id: '1', name: 'Personal', color: '#8b5cf6', taskCount: 5 },
		{ id: '2', name: 'Work', color: '#3b82f6', taskCount: 3 },
		{ id: '3', name: 'Family', color: '#ec4899', taskCount: 2 }
	];
	
	function handleViewChange(view: 'today' | 'timeline' | 'list') {
		currentView = view;
		onViewChange(view);
	}
</script>

<div class="h-full flex flex-col">
	<!-- Primary Views -->
	<div class="p-4">
		<nav class="space-y-1">
			<button
				class="w-full flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors"
				class:bg-orange-50={currentView === 'today'}
				class:text-orange-700={currentView === 'today'}
				class:border-orange-200={currentView === 'today'}
				class:border={currentView === 'today'}
				class:text-gray-700={currentView !== 'today'}
				class:hover:bg-gray-50={currentView !== 'today'}
				on:click={() => handleViewChange('today')}
			>
				<svg class="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"/>
				</svg>
				Today
				{#if taskCounts.today > 0}
					<span class="ml-auto bg-orange-100 text-orange-600 text-xs px-2 py-1 rounded-full">
						{taskCounts.today}
					</span>
				{/if}
			</button>
			
			<button
				class="w-full flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors"
				class:bg-orange-50={currentView === 'timeline'}
				class:text-orange-700={currentView === 'timeline'}
				class:border-orange-200={currentView === 'timeline'}
				class:border={currentView === 'timeline'}
				class:text-gray-700={currentView !== 'timeline'}
				class:hover:bg-gray-50={currentView !== 'timeline'}
				on:click={() => handleViewChange('timeline')}
			>
				<svg class="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/>
				</svg>
				Timeline
			</button>
			
			<button
				class="w-full flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors"
				class:bg-orange-50={currentView === 'list'}
				class:text-orange-700={currentView === 'list'}
				class:border-orange-200={currentView === 'list'}
				class:border={currentView === 'list'}
				class:text-gray-700={currentView !== 'list'}
				class:hover:bg-gray-50={currentView !== 'list'}
				on:click={() => handleViewChange('list')}
			>
				<svg class="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 10h16M4 14h16M4 18h16"/>
				</svg>
				List
			</button>
			
			<button class="w-full flex items-center px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-lg transition-colors">
				<svg class="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2v0a2 2 0 01-2-2v-5a2 2 0 00-2-2H8z"/>
				</svg>
				Upcoming
				{#if taskCounts.upcoming > 0}
					<span class="ml-auto bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded-full">
						{taskCounts.upcoming}
					</span>
				{/if}
			</button>
		</nav>
	</div>
	
	<!-- Projects Section -->
	<div class="px-4 py-2 border-t border-gray-200">
		<div class="flex items-center justify-between mb-3">
			<h3 class="text-xs font-semibold text-gray-500 uppercase tracking-wider">Projects</h3>
			<button class="text-gray-400 hover:text-gray-600">
				<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
				</svg>
			</button>
		</div>
		
		<div class="space-y-1">
			{#each projects as project}
				<button class="w-full flex items-center px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-lg transition-colors">
					<div 
						class="w-3 h-3 rounded-full mr-3"
						style="background-color: {project.color}"
					></div>
					{project.name}
					{#if project.taskCount > 0}
						<span class="ml-auto bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded-full">
							{project.taskCount}
						</span>
					{/if}
				</button>
			{/each}
			
			<button class="w-full flex items-center px-3 py-2 text-sm font-medium text-gray-500 hover:bg-gray-50 rounded-lg transition-colors">
				<svg class="w-4 h-4 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
				</svg>
				Add Project
			</button>
		</div>
	</div>
	
	<!-- Voice Status Section -->
	<div class="mt-auto p-4 border-t border-gray-200">
		<div class="bg-orange-50 rounded-lg p-3">
			<div class="flex items-center text-sm text-orange-700 mb-2">
				<svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"/>
				</svg>
				Voice Status
			</div>
			<p class="text-xs text-orange-600 mb-2">Next call in 25 min</p>
			<button class="w-full px-3 py-1 bg-orange-600 text-white text-xs rounded-md hover:bg-orange-700 transition-colors">
				Test Call Now
			</button>
		</div>
	</div>
</div>