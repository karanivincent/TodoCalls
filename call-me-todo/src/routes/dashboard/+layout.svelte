<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { createSupabaseClient } from '$lib/supabase';
	import LeftSidebar from '$lib/components/dashboard/LeftSidebar.svelte';
	import QuickAddBar from '$lib/components/QuickAddBar.svelte';
	import ToastContainer from '$lib/components/ToastContainer.svelte';
	
	let supabase = createSupabaseClient();
	let user: any = null;
	let loading = true;
	let sidebarCollapsed = false;
	
	// Task counts for sidebar - will be updated from child pages
	let taskCounts = {
		today: 0,
		upcoming: 0,
		completed: 0,
		overdue: 0
	};
	
	onMount(async () => {
		// Check if user is authenticated
		const { data: { user: currentUser } } = await supabase.auth.getUser();
		
		if (!currentUser) {
			goto('/auth');
			return;
		}
		
		user = currentUser;
		loading = false;
		
		// Load sidebar collapsed state from localStorage
		const savedCollapsed = localStorage.getItem('sidebarCollapsed');
		if (savedCollapsed !== null) {
			sidebarCollapsed = savedCollapsed === 'true';
		}
	});
	
	function toggleSidebar() {
		sidebarCollapsed = !sidebarCollapsed;
		// Save to localStorage
		localStorage.setItem('sidebarCollapsed', sidebarCollapsed.toString());
	}
	
	async function handleTaskCreated(event: CustomEvent) {
		const { task, parsed, message } = event.detail;
		console.log('Task created:', task);
		
		// The QuickAddBar already shows toast and dispatches taskListUpdate event
		// No need to duplicate here
	}
</script>

{#if loading}
	<div class="min-h-screen flex items-center justify-center bg-gray-50">
		<div class="text-center">
			<div class="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto"></div>
			<p class="mt-4 text-gray-600">Loading dashboard...</p>
		</div>
	</div>
{:else}
	<div class="min-h-screen bg-gray-50 flex">
		<!-- Sidebar -->
		<div class="flex-shrink-0">
			<LeftSidebar 
				{taskCounts}
				collapsed={sidebarCollapsed}
				onToggleCollapse={toggleSidebar}
			/>
		</div>
		
		<!-- Main Content Area -->
		<div class="flex-1 flex flex-col min-w-0">
			<!-- Quick Add Bar -->
			<QuickAddBar on:taskCreated={handleTaskCreated} />
			
			<!-- Page Content -->
			<main class="flex-1 overflow-y-auto">
				<slot />
			</main>
		</div>
		
		<!-- Mobile Bottom Navigation (optional) -->
		<div class="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-40">
			<div class="grid grid-cols-5 gap-1 p-2">
				<a href="/dashboard" class="flex flex-col items-center p-2 text-gray-600 hover:text-orange-600">
					<span class="text-xl">📞</span>
					<span class="text-xs">Today</span>
				</a>
				<a href="/dashboard/calendar" class="flex flex-col items-center p-2 text-gray-600 hover:text-orange-600">
					<span class="text-xl">📅</span>
					<span class="text-xs">Calendar</span>
				</a>
				<button class="flex flex-col items-center p-2 text-orange-600">
					<span class="text-xl">➕</span>
					<span class="text-xs">Add</span>
				</button>
				<a href="/dashboard/completed" class="flex flex-col items-center p-2 text-gray-600 hover:text-orange-600">
					<span class="text-xl">✓</span>
					<span class="text-xs">History</span>
				</a>
				<a href="/dashboard/settings" class="flex flex-col items-center p-2 text-gray-600 hover:text-orange-600">
					<span class="text-xl">⚙️</span>
					<span class="text-xs">Settings</span>
				</a>
			</div>
		</div>
	</div>
	
	<ToastContainer />
{/if}

<style>
	@media (max-width: 768px) {
		main {
			padding-bottom: 80px; /* Space for bottom nav */
		}
	}
</style>