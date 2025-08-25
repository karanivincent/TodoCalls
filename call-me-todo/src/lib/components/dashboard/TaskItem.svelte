<script lang="ts">
	import type { Database } from '$lib/database.types';
	import Icon from '@iconify/svelte';
	
	type Task = Database['public']['Tables']['tasks']['Row'];
	
	export let task: Task;
	export let index: number = 0;
	export let isOverdue: boolean = false;
	export let testReminder: (taskId: string) => Promise<void>;
	export let formatTime: (date: string) => string;
	export let formatRelativeTime: ((date: string) => string) | undefined = undefined;
	
	// Priority colors - subtle and clean
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
</script>

<div class="flex items-center gap-4 py-4 group hover:{isOverdue ? 'bg-red-50/50' : 'bg-gray-50'} px-3 {index !== 0 ? 'border-t border-gray-200' : ''}">
	<!-- Priority indicator -->
	{#if task.priority}
		<div class="w-1.5 h-1.5 rounded-full {getPriorityColor(task.priority)} flex-shrink-0"></div>
	{/if}
	
	<!-- Content -->
	<div class="flex-1 min-w-0">
		<div class="flex items-center gap-1.5">
			<Icon icon="heroicons:phone" class="w-4 h-4 text-gray-500" />
			<span class="font-semibold text-gray-900">{task.title}</span>
		</div>
		<div class="flex items-center gap-2 mt-1 ml-5">
			{#if task.project_id}
				<span class="text-xs text-gray-500">
					<Icon icon="heroicons:folder" class="w-3 h-3 inline mr-0.5" />
					Project
				</span>
			{/if}
			{#if task.tags && task.tags.length > 0}
				<div class="flex gap-1">
					{#each task.tags as tag}
						<span class="px-1.5 py-0.5 bg-gray-100 text-gray-600 text-xs rounded">#{tag}</span>
					{/each}
				</div>
			{/if}
			{#if task.due_date}
				<span class="text-xs {isOverdue ? 'text-red-600 font-medium' : 'text-gray-500'}">
					Due: {new Date(task.due_date).toLocaleDateString()}
				</span>
			{/if}
		</div>
	</div>
	
	<!-- Time -->
	<div class="text-sm {isOverdue ? 'text-red-600 font-medium' : 'text-gray-500'}">
		{isOverdue && formatRelativeTime ? formatRelativeTime(task.scheduled_at) : formatTime(task.scheduled_at)}
	</div>
	
	<!-- Action -->
	{#if isOverdue}
		<button 
			on:click={() => testReminder(task.id)}
			class="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700 transition-colors"
		>
			Call Now
		</button>
	{:else}
		<button 
			on:click={() => testReminder(task.id)}
			class="opacity-0 group-hover:opacity-100 px-2 py-1 text-gray-600 hover:bg-gray-100 text-xs rounded transition-all"
		>
			Call
		</button>
	{/if}
</div>