<script lang="ts">
	import type { Database } from '$lib/database.types';
	import { formatTimeInTimezone } from '$lib/utils/timezone';
	import Icon from '@iconify/svelte';
	
	type Task = Database['public']['Tables']['tasks']['Row'];
	
	export let tasks: Task[] = [];
	export let loading: boolean = false;
	export let userTimezone: string = 'UTC';
	export let testReminder: (taskId: string) => Promise<void>;
	
	// Priority colors and icons
	function getPriorityStyle(priority: string | null) {
		switch (priority) {
			case 'urgent':
				return {
					bg: 'bg-red-100',
					text: 'text-red-700',
					border: 'border-red-300',
					icon: 'heroicons:fire'
				};
			case 'high':
				return {
					bg: 'bg-orange-100',
					text: 'text-orange-700', 
					border: 'border-orange-300',
					icon: 'heroicons:bolt'
				};
			case 'medium':
				return {
					bg: 'bg-blue-100',
					text: 'text-blue-700',
					border: 'border-blue-300', 
					icon: 'heroicons:clipboard-document-list'
				};
			case 'low':
				return {
					bg: 'bg-gray-100',
					text: 'text-gray-600',
					border: 'border-gray-300',
					icon: 'heroicons:pencil'
				};
			default:
				return {
					bg: 'bg-gray-100',
					text: 'text-gray-600',
					border: 'border-gray-300',
					icon: 'heroicons:clipboard-document-list'
				};
		}
	}
	
	// Group tasks by status and time
	$: groupedTasks = {
		overdue: tasks.filter(task => {
			const now = new Date();
			const taskDate = new Date(task.scheduled_at);
			return task.status === 'pending' && taskDate < now;
		}),
		morning: tasks.filter(task => {
			const today = new Date();
			const now = new Date();
			const taskDate = new Date(task.scheduled_at);
			const hour = taskDate.getHours();
			return task.status === 'pending' && 
				   taskDate.toDateString() === today.toDateString() &&
				   taskDate > now && // Not overdue
				   hour >= 5 && hour < 12;
		}),
		afternoon: tasks.filter(task => {
			const today = new Date();
			const now = new Date();
			const taskDate = new Date(task.scheduled_at);
			const hour = taskDate.getHours();
			return task.status === 'pending' && 
				   taskDate.toDateString() === today.toDateString() &&
				   taskDate > now && // Not overdue
				   hour >= 12 && hour < 17;
		}),
		evening: tasks.filter(task => {
			const today = new Date();
			const now = new Date();
			const taskDate = new Date(task.scheduled_at);
			const hour = taskDate.getHours();
			return task.status === 'pending' && 
				   taskDate.toDateString() === today.toDateString() &&
				   taskDate > now && // Not overdue
				   hour >= 17;
		}),
		completed: tasks.filter(task => task.status === 'completed')
	};
	
	function formatTime(date: string) {
		return formatTimeInTimezone(date, userTimezone);
	}
	
	function formatRelativeTime(date: string) {
		const now = new Date();
		const taskDate = new Date(date);
		const diffMs = now.getTime() - taskDate.getTime();
		const diffMins = Math.floor(diffMs / 60000);
		const diffHours = Math.floor(diffMs / 3600000);
		const diffDays = Math.floor(diffMs / 86400000);
		
		if (diffDays > 1) return `${diffDays} days ago`;
		if (diffDays === 1) return 'Yesterday';
		if (diffHours > 1) return `${diffHours} hours ago`;
		if (diffHours === 1) return '1 hour ago';
		if (diffMins > 1) return `${diffMins} mins ago`;
		return 'Just now';
	}
</script>

<div class="p-4">
	{#if loading}
		<div class="flex justify-center py-8">
			<div class="animate-spin rounded-full h-6 w-6 border-b-2 border-orange-600"></div>
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
		{@const allTasks = [...groupedTasks.overdue, ...groupedTasks.morning, ...groupedTasks.afternoon, ...groupedTasks.evening]}
		{@const nextTask = allTasks.find(t => new Date(t.scheduled_at) > new Date())}
		{@const upcomingTasks = [...groupedTasks.morning, ...groupedTasks.afternoon, ...groupedTasks.evening]}
		
		<div class="space-y-6">
			<!-- Next Action Highlight -->
			{#if nextTask}
				{@const isOverdue = new Date(nextTask.scheduled_at) < new Date()}
				<div class="bg-gradient-to-r {isOverdue ? 'from-red-50 to-orange-50 border-red-300' : 'from-blue-50 to-indigo-50 border-blue-300'} border rounded-xl p-5 shadow-sm">
					<div class="flex items-center gap-4">
						<div class="w-12 h-12 {isOverdue ? 'bg-red-100' : 'bg-blue-100'} rounded-full flex items-center justify-center">
							<Icon icon="heroicons:phone" class="w-6 h-6 {isOverdue ? 'text-red-600' : 'text-blue-600'}" />
						</div>
						<div class="flex-1">
							<div class="flex items-center gap-2">
								<div class="font-semibold text-gray-900">Next Call: {nextTask.title}</div>
								{#if isOverdue}
									<span class="px-2 py-0.5 bg-red-100 text-red-700 text-xs font-medium rounded-full">Overdue</span>
								{/if}
							</div>
							<div class="text-sm {isOverdue ? 'text-red-600 font-medium' : 'text-gray-600'}">
								{isOverdue ? formatRelativeTime(nextTask.scheduled_at) : formatTime(nextTask.scheduled_at)}
							</div>
						</div>
						<button 
							on:click={() => testReminder(nextTask.id)}
							class="px-4 py-2 {isOverdue ? 'bg-red-600 hover:bg-red-700' : 'bg-blue-600 hover:bg-blue-700'} text-white font-medium rounded-lg transition-colors shadow-sm"
						>
							Call Now
						</button>
					</div>
				</div>
			{/if}

			<!-- Overdue Section -->
			{#if groupedTasks.overdue.length > 0}
				<div class="space-y-3">
					<div class="flex items-center gap-2">
						<div class="w-3 h-3 bg-red-500 rounded-full"></div>
						<h3 class="font-semibold text-red-900">Overdue ({groupedTasks.overdue.length})</h3>
					</div>
					<div class="relative pl-6">
						<!-- Timeline line -->
						<div class="absolute left-1.5 top-0 bottom-0 w-0.5 bg-red-200"></div>
						
						{#each groupedTasks.overdue as task, index}
							<div class="relative flex items-center gap-4 pb-4 group hover:bg-red-50/50 -mx-2 px-2 rounded">
								<!-- Timeline dot -->
								<div class="absolute -left-6 w-3 h-3 bg-red-500 rounded-full border-2 border-white"></div>
								
								<!-- Avatar -->
								<div class="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center text-red-600 text-sm font-semibold ml-2">
									{task.title.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()}
								</div>
								
								<!-- Content -->
								<div class="flex-1 min-w-0">
									<div class="flex items-center gap-1.5">
										<Icon icon="heroicons:phone" class="w-4 h-4 text-gray-500" />
										<span class="font-semibold text-gray-900">{task.title}</span>
									</div>
								</div>
								
								<!-- Time -->
								<div class="text-sm text-red-600 font-medium">
									{formatRelativeTime(task.scheduled_at)}
								</div>
								
								<!-- Action -->
								<button 
									on:click={() => testReminder(task.id)}
									class="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700 transition-colors"
								>
									Call Now
								</button>
							</div>
						{/each}
					</div>
				</div>
			{/if}

			<!-- Upcoming Section -->
			{#if upcomingTasks.length > 0}
				<div class="space-y-3">
					<div class="flex items-center gap-2">
						<div class="w-3 h-3 bg-blue-500 rounded-full"></div>
						<h3 class="font-semibold text-gray-900">Upcoming ({upcomingTasks.length})</h3>
					</div>
					<div class="relative pl-6">
						<!-- Timeline line -->
						<div class="absolute left-1.5 top-0 bottom-0 w-0.5 bg-gray-200"></div>
						
						{#each upcomingTasks as task, index}
							<div class="relative flex items-center gap-4 pb-4 group hover:bg-gray-50 -mx-2 px-2 rounded">
								<!-- Timeline dot -->
								<div class="absolute -left-6 w-3 h-3 bg-gray-400 rounded-full border-2 border-white"></div>
								
								<!-- Avatar -->
								<div class="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 text-sm font-semibold ml-2">
									{task.title.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()}
								</div>
								
								<!-- Content -->
								<div class="flex-1 min-w-0">
									<div class="flex items-center gap-1.5">
										<Icon icon="heroicons:phone" class="w-4 h-4 text-gray-500" />
										<span class="font-semibold text-gray-900">{task.title}</span>
									</div>
									{#if task.priority === 'urgent'}
										<div class="text-xs text-orange-600 font-medium ml-5">Urgent</div>
									{/if}
								</div>
								
								<!-- Time -->
								<div class="text-sm text-gray-500">
									{formatTime(task.scheduled_at)}
								</div>
								
								<!-- Action -->
								<button 
									on:click={() => testReminder(task.id)}
									class="opacity-0 group-hover:opacity-100 px-2 py-1 text-gray-600 hover:bg-gray-100 text-xs rounded transition-all"
								>
									Call
								</button>
							</div>
						{/each}
					</div>
				</div>
			{/if}
			<!-- Completed tasks (simple footer) -->
			{#if groupedTasks.completed.length > 0}
				<div class="pt-4 mt-6 border-t border-gray-200">
					<div class="flex items-center justify-between text-sm text-gray-500">
						<span>{groupedTasks.completed.length} completed today</span>
						<Icon icon="heroicons:check-circle" class="w-4 h-4" />
					</div>
				</div>
			{/if}
		</div>
	{/if}
</div>