<script lang="ts">
	import { onMount } from 'svelte';
	
	export let currentView: 'today' | 'timeline' | 'list' = 'today';
	
	// Props for child components
	export let user: any = null;
	export let tasks: any[] = [];
	export let loading: boolean = false;
	export let userTimezone: string = 'UTC';
	
	// Functions passed down from parent
	export let loadTasks: () => Promise<void>;
	export let testReminder: (taskId: string) => Promise<void>;
	export let triggerCron: () => Promise<void>;
</script>

<div class="h-full flex flex-col bg-gray-50">
	<!-- Main 2-column layout (sidebar is now in the parent layout) -->
	<div class="flex-1 flex overflow-hidden">		
		<!-- Center Panel -->
		<main class="flex-1 flex flex-col min-w-0 h-full">
			<!-- Focus Bar -->
			<div class="bg-white border-b border-gray-200 px-6 py-4 flex-shrink-0">
				<slot name="focus-bar" />
			</div>
			
			<!-- Main Content Area - Scrollable -->
			<div class="flex-1 overflow-y-auto">
				<slot name="main-content" {currentView} {tasks} {loading} {userTimezone} {testReminder} {triggerCron} />
			</div>
		</main>
		
		<!-- Right Panel - Scrollable -->
		<aside class="w-80 bg-white border-l border-gray-200 flex-shrink-0 hidden lg:block h-full overflow-y-auto">
			<slot name="right-panel" />
		</aside>
	</div>
</div>

<style>
	/* Responsive adjustments */
	@media (max-width: 1024px) {
		/* On smaller screens, hide right panel */
	}
	
	@media (max-width: 768px) {
		/* On mobile, make left sidebar overlay */
	}
</style>