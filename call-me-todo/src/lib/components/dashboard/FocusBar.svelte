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

<div class="flex gap-4 text-sm">
	<!-- Overdue -->
	{#if overdueTasks.length > 0}
		<div class="flex items-center gap-2 text-red-600">
			<div class="w-2 h-2 bg-red-500 rounded-full"></div>
			<span class="font-medium">Overdue</span>
			<span class="bg-red-100 text-red-700 px-2 py-0.5 rounded-full text-xs">
				{overdueTasks.length}
			</span>
		</div>
	{/if}
	
	<!-- Due Today -->
	{#if todayTasks.length > 0}
		<div class="flex items-center gap-2 text-orange-600">
			<div class="w-2 h-2 bg-orange-500 rounded-full"></div>
			<span class="font-medium">Due Today</span>
			<span class="bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full text-xs">
				{todayTasks.length}
			</span>
		</div>
	{/if}
	
	<!-- Calls Pending -->
	{#if callsPending.length > 0}
		<div class="flex items-center gap-2 text-blue-600">
			<div class="w-2 h-2 bg-blue-500 rounded-full"></div>
			<span class="font-medium">Calls Pending</span>
			<span class="bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full text-xs">
				{callsPending.length}
			</span>
		</div>
	{/if}
	
	<!-- All Clear State -->
	{#if overdueTasks.length === 0 && todayTasks.length === 0 && callsPending.length === 0 && tasks.length > 0}
		<div class="flex items-center gap-2 text-green-600">
			<div class="w-2 h-2 bg-green-500 rounded-full"></div>
			<span class="font-medium">All caught up!</span>
		</div>
	{/if}
	
	<!-- Empty State -->
	{#if tasks.length === 0}
		<div class="flex items-center gap-2 text-gray-500">
			<div class="w-2 h-2 bg-gray-400 rounded-full"></div>
			<span class="font-medium">Ready to get organized!</span>
		</div>
	{/if}
</div>