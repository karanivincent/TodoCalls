<script lang="ts">
	import type { Database } from '$lib/database.types';
	import Icon from '@iconify/svelte';
	
	type Task = Database['public']['Tables']['tasks']['Row'];
	
	export let tasks: Task[] = [];
	export let userTimezone: string = 'UTC';
	
	// Calculate focus items from tasks
	$: overdueTasks = tasks.filter(task => {
		const now = new Date();
		const taskDate = new Date(task.scheduled_at);
		return task.status === 'pending' && taskDate < now;
	});
	
	$: todayTasks = tasks.filter(task => {
		const today = new Date();
		const taskDate = new Date(task.scheduled_at);
		return task.status === 'pending' && 
			   taskDate.toDateString() === today.toDateString();
	});
	
	$: callsPending = tasks.filter(task => 
		task.status === 'pending' && task.notify_by_phone
	);
	
	function truncateTaskList(taskList: Task[], maxLength = 3) {
		const names = taskList.slice(0, maxLength).map(task => task.title);
		if (taskList.length > maxLength) {
			names.push(`+${taskList.length - maxLength} more`);
		}
		return names.join(', ');
	}
</script>

<div class="flex gap-3">
	<!-- Overdue -->
	{#if overdueTasks.length > 0}
		<div class="flex items-center gap-2 px-3 py-1.5 bg-red-50 rounded-lg">
			<div class="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
			<span class="text-sm font-medium text-red-900">Overdue</span>
			<span class="text-sm font-bold text-red-700">
				{overdueTasks.length}
			</span>
		</div>
	{/if}
	
	<!-- Due Today -->
	{#if todayTasks.length > 0}
		<div class="flex items-center gap-2 px-3 py-1.5 bg-orange-50 rounded-lg">
			<div class="w-2 h-2 bg-orange-500 rounded-full"></div>
			<span class="text-sm font-medium text-orange-900">Due Today</span>
			<span class="text-sm font-bold text-orange-700">
				{todayTasks.length}
			</span>
		</div>
	{/if}
	
	<!-- Calls Pending -->
	{#if callsPending.length > 0}
		<div class="flex items-center gap-2 px-3 py-1.5 bg-blue-50 rounded-lg">
			<div class="w-2 h-2 bg-blue-500 rounded-full"></div>
			<span class="text-sm font-medium text-blue-900">Calls Pending</span>
			<span class="text-sm font-bold text-blue-700">
				{callsPending.length}
			</span>
		</div>
	{/if}
	
	<!-- All Clear State -->
	{#if overdueTasks.length === 0 && todayTasks.length === 0 && callsPending.length === 0 && tasks.length > 0}
		<div class="flex items-center gap-2 px-3 py-1.5 bg-green-50 rounded-lg">
			<Icon icon="heroicons:check-circle" class="w-4 h-4 text-green-600" />
			<span class="text-sm font-medium text-green-900">All caught up!</span>
		</div>
	{/if}
	
	<!-- Empty State -->
	{#if tasks.length === 0}
		<div class="flex items-center gap-2 px-3 py-1.5 bg-gray-50 rounded-lg">
			<Icon icon="heroicons:sparkles" class="w-4 h-4 text-gray-600" />
			<span class="text-sm font-medium text-gray-700">Ready to get organized!</span>
		</div>
	{/if}
</div>