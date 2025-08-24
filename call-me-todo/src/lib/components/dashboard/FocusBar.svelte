<script lang="ts">
	import type { Database } from '$lib/database.types';
	
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

<div class="flex flex-wrap gap-3">
	<!-- Overdue Tasks -->
	{#if overdueTasks.length > 0}
		<div class="flex items-center px-4 py-2 bg-red-50 border border-red-200 rounded-lg">
			<div class="flex items-center text-red-700">
				<span class="text-lg mr-2">🔥</span>
				<div>
					<span class="font-semibold">Overdue</span>
					<span class="mx-1">•</span>
					<span class="text-sm">{truncateTaskList(overdueTasks)}</span>
				</div>
			</div>
			<span class="ml-3 bg-red-100 text-red-700 text-xs px-2 py-1 rounded-full font-medium">
				{overdueTasks.length}
			</span>
		</div>
	{/if}
	
	<!-- Due Today -->
	{#if todayTasks.length > 0}
		<div class="flex items-center px-4 py-2 bg-orange-50 border border-orange-200 rounded-lg">
			<div class="flex items-center text-orange-700">
				<span class="text-lg mr-2">⏰</span>
				<div>
					<span class="font-semibold">Due Today</span>
					<span class="mx-1">•</span>
					<span class="text-sm">{todayTasks.length} tasks remaining</span>
				</div>
			</div>
			<span class="ml-3 bg-orange-100 text-orange-700 text-xs px-2 py-1 rounded-full font-medium">
				{todayTasks.length}
			</span>
		</div>
	{/if}
	
	<!-- Calls Pending -->
	{#if callsPending.length > 0}
		<div class="flex items-center px-4 py-2 bg-blue-50 border border-blue-200 rounded-lg">
			<div class="flex items-center text-blue-700">
				<span class="text-lg mr-2">📞</span>
				<div>
					<span class="font-semibold">Calls Pending</span>
					<span class="mx-1">•</span>
					<span class="text-sm">{callsPending.length} reminders scheduled</span>
				</div>
			</div>
			<span class="ml-3 bg-blue-100 text-blue-700 text-xs px-2 py-1 rounded-full font-medium">
				{callsPending.length}
			</span>
		</div>
	{/if}
	
	<!-- All Clear State -->
	{#if overdueTasks.length === 0 && todayTasks.length === 0 && callsPending.length === 0 && tasks.length > 0}
		<div class="flex items-center px-4 py-2 bg-green-50 border border-green-200 rounded-lg">
			<div class="flex items-center text-green-700">
				<span class="text-lg mr-2">✅</span>
				<span class="font-semibold">All caught up!</span>
				<span class="ml-2 text-sm">No overdue or pending tasks</span>
			</div>
		</div>
	{/if}
	
	<!-- Empty State -->
	{#if tasks.length === 0}
		<div class="flex items-center px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg">
			<div class="flex items-center text-gray-600">
				<span class="text-lg mr-2">📝</span>
				<span class="font-medium">Ready to get organized!</span>
				<span class="ml-2 text-sm">Add your first task above</span>
			</div>
		</div>
	{/if}
</div>