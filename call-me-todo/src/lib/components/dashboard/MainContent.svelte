<script lang="ts">
	import TodayView from './TodayView.svelte';
	import TimelineView from './TimelineView.svelte';
	
	export let currentView: 'today' | 'timeline' | 'list' = 'today';
	export let tasks: any[] = [];
	export let loading: boolean = false;
	export let userTimezone: string = 'UTC';
	export let testReminder: (taskId: string) => Promise<void>;
	export let triggerCron: () => Promise<void>;
</script>

<div class="h-full">
	{#if currentView === 'today'}
		<TodayView 
			{tasks} 
			{loading} 
			{userTimezone} 
			{testReminder} 
		/>
	{:else if currentView === 'timeline'}
		<TimelineView 
			{tasks} 
			{loading} 
			{userTimezone} 
			{testReminder} 
		/>
	{:else if currentView === 'list'}
		<!-- ListView will be implemented later -->
		<div class="p-6 text-center text-gray-500">
			<p>List view coming soon...</p>
		</div>
	{/if}
</div>