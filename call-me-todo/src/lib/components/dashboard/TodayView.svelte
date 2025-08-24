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
		<div class="space-y-1">
			<!-- Simple unified task list -->
			{#each [...groupedTasks.overdue, ...groupedTasks.morning, ...groupedTasks.afternoon, ...groupedTasks.evening] as task}
				{@const isOverdue = groupedTasks.overdue.includes(task)}
				{@const isUrgent = task.priority === 'urgent'}
				<div class="flex items-center gap-3 py-3 px-4 hover:bg-gray-50 border-b border-gray-100 group">
					<!-- Status indicator -->
					<div class="w-2 h-2 rounded-full flex-shrink-0 {isOverdue ? 'bg-red-500' : isUrgent ? 'bg-orange-500' : 'bg-gray-300'}"></div>
					
					<!-- Task content -->
					<div class="flex-1 min-w-0">
						<div class="flex items-baseline gap-2">
							<h4 class="font-medium text-gray-900 truncate">{task.title}</h4>
							<span class="text-sm text-gray-500 flex-shrink-0">{formatTime(task.scheduled_at)}</span>
						</div>
						{#if isOverdue}
							<p class="text-xs text-red-600 mt-0.5">Overdue</p>
						{/if}
					</div>
					
					<!-- Single action -->
					<button 
						on:click={() => testReminder(task.id)}
						class="opacity-0 group-hover:opacity-100 px-2 py-1 text-xs text-gray-600 hover:text-gray-900 border border-gray-300 rounded hover:border-gray-400 transition-all flex-shrink-0"
					>
						Call
					</button>
				</div>
			{/each}
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