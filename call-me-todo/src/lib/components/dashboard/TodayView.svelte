<script lang="ts">
	import type { Database } from '$lib/database.types';
	import { formatTimeInTimezone } from '$lib/utils/timezone';
	
	type Task = Database['public']['Tables']['tasks']['Row'];
	
	export let tasks: Task[] = [];
	export let loading: boolean = false;
	export let userTimezone: string = 'UTC';
	export let testReminder: (taskId: string) => Promise<void>;
	
	// Group tasks by status and time
	$: groupedTasks = {
		overdue: tasks.filter(task => {
			const now = new Date();
			const taskDate = new Date(task.scheduled_at);
			return task.status === 'pending' && taskDate < now;
		}),
		morning: tasks.filter(task => {
			const today = new Date();
			const taskDate = new Date(task.scheduled_at);
			const hour = taskDate.getHours();
			return task.status === 'pending' && 
				   taskDate.toDateString() === today.toDateString() &&
				   hour >= 5 && hour < 12;
		}),
		afternoon: tasks.filter(task => {
			const today = new Date();
			const taskDate = new Date(task.scheduled_at);
			const hour = taskDate.getHours();
			return task.status === 'pending' && 
				   taskDate.toDateString() === today.toDateString() &&
				   hour >= 12 && hour < 17;
		}),
		evening: tasks.filter(task => {
			const today = new Date();
			const taskDate = new Date(task.scheduled_at);
			const hour = taskDate.getHours();
			return task.status === 'pending' && 
				   taskDate.toDateString() === today.toDateString() &&
				   hour >= 17;
		}),
		completed: tasks.filter(task => task.status === 'completed')
	};
	
	function formatTime(date: string) {
		return formatTimeInTimezone(date, userTimezone);
	}
</script>

<div class="p-6">
	{#if loading}
		<div class="flex justify-center py-12">
			<div class="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600"></div>
		</div>
	{:else if tasks.length === 0}
		<!-- Empty State -->
		<div class="text-center py-16">
			<svg class="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" 
					d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"/>
			</svg>
			<h3 class="text-lg font-medium text-gray-900 mb-2">
				Ready to seize the day!
			</h3>
			<p class="text-gray-500 mb-6 max-w-sm mx-auto">
				Add your first task to get started with voice-powered reminders
			</p>
			<p class="text-sm text-gray-400">Try: "Remind me to call mom at 3pm"</p>
		</div>
	{:else}
		<div class="space-y-6">
			<!-- Overdue Tasks (Highest Priority) -->
			{#if groupedTasks.overdue.length > 0}
				<div class="bg-red-50 rounded-lg border border-red-200 p-4">
					<div class="flex items-center mb-3">
						<span class="text-red-600 text-xl mr-2">🔥</span>
						<h3 class="text-lg font-semibold text-red-800">
							Overdue ({groupedTasks.overdue.length})
						</h3>
					</div>
					<div class="space-y-3">
						{#each groupedTasks.overdue as task}
							<div class="bg-white rounded-lg p-3 border border-red-200">
								<div class="flex items-start justify-between">
									<div class="flex-1">
										<h4 class="font-medium text-gray-900 mb-1">{task.title}</h4>
										<p class="text-sm text-red-600">Due {formatTime(task.scheduled_at)}</p>
									</div>
									<div class="flex items-center gap-2">
										<button 
											on:click={() => testReminder(task.id)}
											class="px-3 py-1 bg-red-600 text-white text-xs rounded-md hover:bg-red-700 transition-colors"
											title="Test reminder call now"
										>
											📞 Call Now
										</button>
										<button class="text-gray-400 hover:text-gray-600">
											<svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
												<path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z"/>
											</svg>
										</button>
									</div>
								</div>
							</div>
						{/each}
					</div>
				</div>
			{/if}
			
			<!-- Morning Tasks -->
			{#if groupedTasks.morning.length > 0}
				<div class="bg-orange-50 rounded-lg border border-orange-200 p-4">
					<div class="flex items-center mb-3">
						<span class="text-orange-600 text-xl mr-2">🌅</span>
						<h3 class="text-lg font-semibold text-orange-800">
							Morning ({groupedTasks.morning.length})
						</h3>
					</div>
					<div class="space-y-3">
						{#each groupedTasks.morning as task}
							<div class="bg-white rounded-lg p-3 border border-orange-200">
								<div class="flex items-start justify-between">
									<div class="flex-1">
										<h4 class="font-medium text-gray-900 mb-1">{task.title}</h4>
										<p class="text-sm text-orange-600">{formatTime(task.scheduled_at)}</p>
									</div>
									<div class="flex items-center gap-2">
										<button 
											on:click={() => testReminder(task.id)}
											class="px-3 py-1 bg-orange-100 text-orange-700 text-xs rounded-md hover:bg-orange-200 transition-colors"
											title="Test reminder call now"
										>
											📞 Test Call
										</button>
										<button class="text-gray-400 hover:text-gray-600">
											<svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
												<path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z"/>
											</svg>
										</button>
									</div>
								</div>
							</div>
						{/each}
					</div>
				</div>
			{/if}
			
			<!-- Afternoon Tasks -->
			{#if groupedTasks.afternoon.length > 0}
				<div class="bg-blue-50 rounded-lg border border-blue-200 p-4">
					<div class="flex items-center mb-3">
						<span class="text-blue-600 text-xl mr-2">☀️</span>
						<h3 class="text-lg font-semibold text-blue-800">
							Afternoon ({groupedTasks.afternoon.length})
						</h3>
					</div>
					<div class="space-y-3">
						{#each groupedTasks.afternoon as task}
							<div class="bg-white rounded-lg p-3 border border-blue-200">
								<div class="flex items-start justify-between">
									<div class="flex-1">
										<h4 class="font-medium text-gray-900 mb-1">{task.title}</h4>
										<p class="text-sm text-blue-600">{formatTime(task.scheduled_at)}</p>
									</div>
									<div class="flex items-center gap-2">
										<button 
											on:click={() => testReminder(task.id)}
											class="px-3 py-1 bg-blue-100 text-blue-700 text-xs rounded-md hover:bg-blue-200 transition-colors"
											title="Test reminder call now"
										>
											📞 Test Call
										</button>
										<button class="text-gray-400 hover:text-gray-600">
											<svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
												<path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z"/>
											</svg>
										</button>
									</div>
								</div>
							</div>
						{/each}
					</div>
				</div>
			{/if}
			
			<!-- Evening Tasks -->
			{#if groupedTasks.evening.length > 0}
				<div class="bg-indigo-50 rounded-lg border border-indigo-200 p-4">
					<div class="flex items-center mb-3">
						<span class="text-indigo-600 text-xl mr-2">🌆</span>
						<h3 class="text-lg font-semibold text-indigo-800">
							Evening ({groupedTasks.evening.length})
						</h3>
					</div>
					<div class="space-y-3">
						{#each groupedTasks.evening as task}
							<div class="bg-white rounded-lg p-3 border border-indigo-200">
								<div class="flex items-start justify-between">
									<div class="flex-1">
										<h4 class="font-medium text-gray-900 mb-1">{task.title}</h4>
										<p class="text-sm text-indigo-600">{formatTime(task.scheduled_at)}</p>
									</div>
									<div class="flex items-center gap-2">
										<button 
											on:click={() => testReminder(task.id)}
											class="px-3 py-1 bg-indigo-100 text-indigo-700 text-xs rounded-md hover:bg-indigo-200 transition-colors"
											title="Test reminder call now"
										>
											📞 Test Call
										</button>
										<button class="text-gray-400 hover:text-gray-600">
											<svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
												<path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z"/>
											</svg>
										</button>
									</div>
								</div>
							</div>
						{/each}
					</div>
				</div>
			{/if}
			
			<!-- Completed Tasks (Collapsible) -->
			{#if groupedTasks.completed.length > 0}
				<details class="bg-green-50 rounded-lg border border-green-200">
					<summary class="p-4 cursor-pointer">
						<div class="flex items-center">
							<span class="text-green-600 text-xl mr-2">✅</span>
							<h3 class="text-lg font-semibold text-green-800">
								Completed Today ({groupedTasks.completed.length})
							</h3>
						</div>
					</summary>
					<div class="px-4 pb-4 space-y-2">
						{#each groupedTasks.completed as task}
							<div class="bg-white rounded-lg p-3 border border-green-200 opacity-75">
								<div class="flex items-center">
									<span class="text-green-600 mr-2">✓</span>
									<h4 class="font-medium text-gray-700">{task.title}</h4>
									<span class="ml-auto text-sm text-green-600">{formatTime(task.scheduled_at)}</span>
								</div>
							</div>
						{/each}
					</div>
				</details>
			{/if}
		</div>
	{/if}
</div>