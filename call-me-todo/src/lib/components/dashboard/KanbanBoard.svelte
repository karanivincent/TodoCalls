<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import Icon from '@iconify/svelte';
	import type { Database } from '$lib/database.types';
	
	type Task = Database['public']['Tables']['tasks']['Row'];
	
	export let groupedTasks: {
		todo: Task[];
		inProgress: Task[];
		completed: Task[];
	};
	export let project: any;
	
	const dispatch = createEventDispatcher();
	
	let showCompleted = false;
	
	function getPriorityColor(priority: string | null) {
		switch (priority) {
			case 'urgent':
				return 'bg-red-500';
			case 'high':
				return 'bg-orange-500';
			case 'medium':
				return 'bg-blue-500';
			case 'low':
				return 'bg-gray-400';
			default:
				return 'bg-gray-300';
		}
	}
	
	function formatDate(date: string) {
		const d = new Date(date);
		const now = new Date();
		const diffTime = d.getTime() - now.getTime();
		const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
		
		if (diffDays < 0) {
			return `${Math.abs(diffDays)} days overdue`;
		} else if (diffDays === 0) {
			return 'Due today';
		} else if (diffDays === 1) {
			return 'Due tomorrow';
		} else {
			return `Due in ${diffDays} days`;
		}
	}
	
	function handleTestReminder(taskId: string) {
		dispatch('testReminder', { taskId });
	}
	
	function handleUpdateStatus(taskId: string, status: string) {
		dispatch('updateStatus', { taskId, status });
	}
</script>

<div class="grid grid-cols-1 md:grid-cols-3 gap-6">
	<!-- To Do Column -->
	<div class="bg-gray-50 rounded-lg p-4">
		<div class="flex items-center justify-between mb-4">
			<h3 class="font-semibold text-gray-900 flex items-center gap-2">
				<Icon icon="heroicons:clipboard-document-list" class="w-5 h-5 text-gray-600" />
				To Do
			</h3>
			<span class="text-sm text-gray-500 bg-gray-200 px-2 py-1 rounded-full">
				{groupedTasks.todo.length}
			</span>
		</div>
		
		<div class="space-y-3">
			{#each groupedTasks.todo as task}
				<div class="bg-white rounded-lg p-4 shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
					<!-- Priority Indicator -->
					<div class="flex items-start gap-2 mb-2">
						<div class="w-2 h-2 rounded-full mt-1.5 {getPriorityColor(task.priority)}"></div>
						<h4 class="flex-1 font-medium text-gray-900">{task.title}</h4>
					</div>
					
					<!-- Task Meta -->
					<div class="space-y-1 text-sm ml-4">
						{#if task.scheduled_at}
							<div class="flex items-center gap-1 text-gray-600">
								<Icon icon="heroicons:calendar" class="w-4 h-4" />
								<span class="{new Date(task.scheduled_at) < new Date() ? 'text-red-600 font-medium' : ''}">
									{formatDate(task.scheduled_at)}
								</span>
							</div>
						{/if}
						
						{#if task.tags && task.tags.length > 0}
							<div class="flex flex-wrap gap-1 mt-2">
								{#each task.tags as tag}
									<span class="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded">
										#{tag}
									</span>
								{/each}
							</div>
						{/if}
					</div>
					
					<!-- Actions -->
					<div class="flex items-center gap-2 mt-3">
						<button
							on:click={() => handleTestReminder(task.id)}
							class="flex-1 px-3 py-1.5 bg-orange-600 text-white text-sm rounded hover:bg-orange-700 transition-colors"
						>
							<Icon icon="heroicons:phone" class="w-4 h-4 inline mr-1" />
							Call
						</button>
						<button
							on:click={() => handleUpdateStatus(task.id, 'completed')}
							class="p-1.5 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded transition-colors"
							aria-label="Mark complete"
						>
							<Icon icon="heroicons:check" class="w-4 h-4" />
						</button>
					</div>
				</div>
			{/each}
			
			{#if groupedTasks.todo.length === 0}
				<div class="text-center py-8 text-gray-500">
					<Icon icon="heroicons:clipboard-document-check" class="w-8 h-8 mx-auto mb-2 text-gray-300" />
					<p class="text-sm">No tasks to do</p>
				</div>
			{/if}
		</div>
	</div>
	
	<!-- In Progress Column -->
	<div class="bg-blue-50 rounded-lg p-4">
		<div class="flex items-center justify-between mb-4">
			<h3 class="font-semibold text-gray-900 flex items-center gap-2">
				<Icon icon="heroicons:arrow-path" class="w-5 h-5 text-blue-600" />
				In Progress
			</h3>
			<span class="text-sm text-gray-500 bg-blue-200 px-2 py-1 rounded-full">
				{groupedTasks.inProgress.length}
			</span>
		</div>
		
		<div class="space-y-3">
			{#each groupedTasks.inProgress as task}
				<div class="bg-white rounded-lg p-4 shadow-sm border border-blue-200 hover:shadow-md transition-shadow">
					<!-- Priority Indicator -->
					<div class="flex items-start gap-2 mb-2">
						<div class="w-2 h-2 rounded-full mt-1.5 {getPriorityColor(task.priority)}"></div>
						<h4 class="flex-1 font-medium text-gray-900">{task.title}</h4>
					</div>
					
					<!-- Task Meta -->
					<div class="space-y-1 text-sm ml-4">
						{#if task.scheduled_at}
							<div class="flex items-center gap-1 text-gray-600">
								<Icon icon="heroicons:clock" class="w-4 h-4" />
								<span>{new Date(task.scheduled_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
							</div>
						{/if}
						
						{#if task.tags && task.tags.length > 0}
							<div class="flex flex-wrap gap-1 mt-2">
								{#each task.tags as tag}
									<span class="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded">
										#{tag}
									</span>
								{/each}
							</div>
						{/if}
					</div>
					
					<!-- Actions -->
					<div class="flex items-center gap-2 mt-3">
						<button
							on:click={() => handleTestReminder(task.id)}
							class="flex-1 px-3 py-1.5 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition-colors"
						>
							<Icon icon="heroicons:phone" class="w-4 h-4 inline mr-1" />
							Call Now
						</button>
						<button
							on:click={() => handleUpdateStatus(task.id, 'completed')}
							class="p-1.5 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded transition-colors"
							aria-label="Mark complete"
						>
							<Icon icon="heroicons:check" class="w-4 h-4" />
						</button>
					</div>
				</div>
			{/each}
			
			{#if groupedTasks.inProgress.length === 0}
				<div class="text-center py-8 text-gray-500">
					<Icon icon="heroicons:arrow-path" class="w-8 h-8 mx-auto mb-2 text-blue-300" />
					<p class="text-sm">No tasks in progress</p>
				</div>
			{/if}
		</div>
	</div>
	
	<!-- Completed Column -->
	<div class="bg-green-50 rounded-lg p-4">
		<div class="flex items-center justify-between mb-4">
			<h3 class="font-semibold text-gray-900 flex items-center gap-2">
				<Icon icon="heroicons:check-circle" class="w-5 h-5 text-green-600" />
				Completed
			</h3>
			<div class="flex items-center gap-2">
				<span class="text-sm text-gray-500 bg-green-200 px-2 py-1 rounded-full">
					{groupedTasks.completed.length}
				</span>
				<button
					on:click={() => showCompleted = !showCompleted}
					class="text-gray-400 hover:text-gray-600"
					aria-label="{showCompleted ? 'Hide' : 'Show'} completed tasks"
				>
					<Icon icon="heroicons:chevron-{showCompleted ? 'up' : 'down'}" class="w-5 h-5" />
				</button>
			</div>
		</div>
		
		{#if showCompleted}
			<div class="space-y-3">
				{#each groupedTasks.completed as task}
					<div class="bg-white/70 rounded-lg p-3 border border-green-200">
						<h4 class="text-gray-600 line-through">{task.title}</h4>
						{#if task.completed_at}
							<p class="text-xs text-gray-500 mt-1">
								Completed {new Date(task.completed_at).toLocaleDateString()}
							</p>
						{/if}
					</div>
				{/each}
				
				{#if groupedTasks.completed.length === 0}
					<div class="text-center py-8 text-gray-500">
						<p class="text-sm">No completed tasks yet</p>
					</div>
				{/if}
			</div>
		{:else}
			<div class="text-center py-4 text-gray-500">
				<p class="text-sm">Click to view completed tasks</p>
			</div>
		{/if}
	</div>
</div>