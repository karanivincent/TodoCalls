<script lang="ts">
	import type { PageData } from './$types';
	import ProjectHeader from '$lib/components/dashboard/ProjectHeader.svelte';
	import KanbanBoard from '$lib/components/dashboard/KanbanBoard.svelte';
	import { toast } from '$lib/stores/toast';
	import { invalidateAll } from '$app/navigation';
	
	export let data: PageData;
	
	$: project = data.project;
	$: tasks = data.tasks || [];
	
	// Group tasks by status
	$: groupedTasks = {
		todo: tasks.filter(t => t.status === 'pending' && !isInProgress(t)),
		inProgress: tasks.filter(t => t.status === 'pending' && isInProgress(t)),
		completed: tasks.filter(t => t.status === 'completed')
	};
	
	// Calculate stats
	$: stats = {
		total: tasks.length,
		completed: groupedTasks.completed.length,
		overdue: tasks.filter(t => {
			const now = new Date();
			const taskDate = new Date(t.scheduled_at);
			return t.status === 'pending' && taskDate < now;
		}).length,
		dueThisWeek: tasks.filter(t => {
			const now = new Date();
			const weekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
			const taskDate = new Date(t.scheduled_at);
			return t.status === 'pending' && taskDate >= now && taskDate <= weekFromNow;
		}).length
	};
	
	// Helper function to determine if a task is in progress
	// (You could use a separate field or logic like "started but not completed")
	function isInProgress(task: any) {
		// For now, we'll consider tasks due today as "in progress"
		const today = new Date();
		const taskDate = new Date(task.scheduled_at);
		return taskDate.toDateString() === today.toDateString();
	}
	
	async function updateTaskStatus(taskId: string, newStatus: string) {
		try {
			const response = await fetch(`/api/tasks/${taskId}`, {
				method: 'PATCH',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ status: newStatus })
			});
			
			if (response.ok) {
				toast.success('Task updated');
				await invalidateAll();
			} else {
				toast.error('Failed to update task');
			}
		} catch (error) {
			toast.error('Failed to update task');
			console.error('Error updating task:', error);
		}
	}
	
	async function testReminder(taskId: string) {
		try {
			const response = await fetch('/api/tasks/test-reminder', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ taskId })
			});
			
			const result = await response.json();
			
			if (result.success) {
				toast.success('Test call initiated! Your phone should ring shortly.');
			} else {
				toast.error(result.error || 'Failed to initiate test call');
			}
		} catch (error) {
			console.error('Error in testReminder:', error);
			toast.error('Failed to initiate test call');
		}
	}
</script>

<div class="min-h-screen bg-gray-50">
	<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
		<!-- Project Header -->
		<ProjectHeader {project} {stats} />
		
		<!-- Kanban Board -->
		<div class="mt-8">
			<KanbanBoard 
				{groupedTasks}
				{project}
				on:updateStatus={(e) => updateTaskStatus(e.detail.taskId, e.detail.status)}
				on:testReminder={(e) => testReminder(e.detail.taskId)}
			/>
		</div>
	</div>
</div>