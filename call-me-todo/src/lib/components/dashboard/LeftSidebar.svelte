<script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import Icon from '@iconify/svelte';
	import type { ProjectWithStats } from '$lib/database.types.enhanced';

	export let collapsed: boolean = false;
	export let onToggleCollapse: () => void = () => {};
	export let taskCounts: {
		today: number;
		upcoming: number;
		completed: number;
		overdue: number;
	} = { today: 0, upcoming: 0, completed: 0, overdue: 0 };
	
	let projects: ProjectWithStats[] = [];
	let loading = true;
	let error = '';
	let showCreateModal = false;
	let newProject = {
		name: '',
		description: '',
		color: '#6366f1'
	};
	let creating = false;
	async function fetchProjects() {
		try {
			loading = true;
			error = '';
			
			const response = await fetch('/api/projects');
			
			if (!response.ok) {
				// Only show error for actual server errors, not for empty results
				if (response.status >= 500) {
					error = 'Failed to load projects';
				}
				return;
			}
			
			const result = await response.json();
			
			if (result.success) {
				projects = result.projects || [];
			} else if (result.error && result.error !== 'Unauthorized') {
				// Only show error if it's not just an auth issue (which redirects anyway)
				error = result.error;
			}
		} catch (err) {
			console.error('Error fetching projects:', err);
			// Only show error for network/connection issues
			error = 'Unable to connect to server';
		} finally {
			loading = false;
		}
	}
	
	onMount(() => {
		fetchProjects();
	});

	async function createProject() {
		if (!newProject.name.trim()) return;
		
		try {
			creating = true;
			const response = await fetch('/api/projects', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify(newProject)
			});

			const result = await response.json();

			if (result.success) {
				await fetchProjects(); // Refresh the projects list
				showCreateModal = false;
				newProject = { name: '', description: '', color: '#6366f1' };
			} else {
				error = result.error || 'Failed to create project';
			}
		} catch (err) {
			console.error('Error creating project:', err);
			error = 'Failed to create project';
		} finally {
			creating = false;
		}
	}
</script>

<div class="h-full flex flex-col bg-white border-r border-gray-200 transition-all duration-300" class:w-64={!collapsed} class:w-16={collapsed}>
	<!-- Collapse Toggle Button -->
	<div class="flex items-center justify-between p-4 border-b border-gray-200 flex-shrink-0">
		{#if !collapsed}
			<h2 class="text-lg font-semibold text-gray-800">Menu</h2>
		{/if}
		<button 
			on:click={onToggleCollapse}
			class="p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
			aria-label="{collapsed ? 'Expand' : 'Collapse'} sidebar"
		>
			<Icon 
				icon={collapsed ? 'heroicons:chevron-double-right' : 'heroicons:chevron-double-left'} 
				class="w-5 h-5 text-gray-600" 
			/>
		</button>
	</div>
	
	<!-- Scrollable Middle Section -->
	<div class="flex-1 overflow-y-auto">
		<!-- Primary Views -->
		<div class="p-4">
		<nav class="space-y-1">
			<a
				href="/dashboard"
				class="relative group w-full flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors"
				class:bg-orange-50={$page.url.pathname === '/dashboard'}
				class:text-orange-700={$page.url.pathname === '/dashboard'}
				class:border-orange-200={$page.url.pathname === '/dashboard'}
				class:border={$page.url.pathname === '/dashboard'}
				class:text-gray-700={$page.url.pathname !== '/dashboard'}
				class:hover:bg-gray-50={$page.url.pathname !== '/dashboard'}
				class:justify-center={collapsed}
			>
				<Icon icon="heroicons:star" class="w-5 h-5 {collapsed ? '' : 'mr-3'} flex-shrink-0" />
				{#if !collapsed}
					Today
					{#if taskCounts.today > 0}
						<span class="ml-auto bg-orange-100 text-orange-600 text-xs px-2 py-1 rounded-full">
							{taskCounts.today}
						</span>
					{/if}
				{:else if taskCounts.today > 0}
					<span class="absolute -top-1 -right-1 bg-orange-600 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center">
						{taskCounts.today}
					</span>
				{/if}
				{#if collapsed}
					<div class="absolute left-full ml-2 px-2 py-1 bg-gray-900 text-white text-xs rounded-md opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-10">
						Today
					</div>
				{/if}
			</a>
			
			<a
				href="/dashboard/timeline"
				class="relative group w-full flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors"
				class:justify-center={collapsed}
				class:bg-orange-50={$page.url.pathname === '/dashboard/timeline'}
				class:text-orange-700={$page.url.pathname === '/dashboard/timeline'}
				class:border-orange-200={$page.url.pathname === '/dashboard/timeline'}
				class:border={$page.url.pathname === '/dashboard/timeline'}
				class:text-gray-700={$page.url.pathname !== '/dashboard/timeline'}
				class:hover:bg-gray-50={$page.url.pathname !== '/dashboard/timeline'}
			>
				<Icon icon="heroicons:calendar" class="w-5 h-5 {collapsed ? '' : 'mr-3'} flex-shrink-0" />
				{#if !collapsed}
					Timeline
				{/if}
				{#if collapsed}
					<div class="absolute left-full ml-2 px-2 py-1 bg-gray-900 text-white text-xs rounded-md opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-10">
						Timeline
					</div>
				{/if}
			</a>
			
			<a
				href="/dashboard/list"
				class="relative group w-full flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors"
				class:justify-center={collapsed}
				class:bg-orange-50={$page.url.pathname === '/dashboard/list'}
				class:text-orange-700={$page.url.pathname === '/dashboard/list'}
				class:border-orange-200={$page.url.pathname === '/dashboard/list'}
				class:border={$page.url.pathname === '/dashboard/list'}
				class:text-gray-700={$page.url.pathname !== '/dashboard/list'}
				class:hover:bg-gray-50={$page.url.pathname !== '/dashboard/list'}
			>
				<Icon icon="heroicons:list-bullet" class="w-5 h-5 {collapsed ? '' : 'mr-3'} flex-shrink-0" />
				{#if !collapsed}
					List
				{/if}
				{#if collapsed}
					<div class="absolute left-full ml-2 px-2 py-1 bg-gray-900 text-white text-xs rounded-md opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-10">
						List
					</div>
				{/if}
			</a>
			
			<a 
				href="/dashboard/upcoming"
				class="relative group w-full flex items-center px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
				class:justify-center={collapsed}
			>
				<Icon icon="heroicons:document-duplicate" class="w-5 h-5 {collapsed ? '' : 'mr-3'} flex-shrink-0" />
				{#if !collapsed}
					Upcoming
					{#if taskCounts.upcoming > 0}
						<span class="ml-auto bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded-full">
							{taskCounts.upcoming}
						</span>
					{/if}
				{:else if taskCounts.upcoming > 0}
					<span class="absolute -top-1 -right-1 bg-gray-600 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center">
						{taskCounts.upcoming}
					</span>
				{/if}
				{#if collapsed}
					<div class="absolute left-full ml-2 px-2 py-1 bg-gray-900 text-white text-xs rounded-md opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-10">
						Upcoming
					</div>
				{/if}
			</a>
		</nav>
	</div>
	
	<!-- Projects Section -->
	<div class="px-4 py-2 border-t border-gray-200">
		<div class="flex items-center justify-between mb-3">
			{#if !collapsed}
				<h3 class="text-xs font-semibold text-gray-500 uppercase tracking-wider">Projects</h3>
				<button 
					class="text-gray-400 hover:text-gray-600" 
					aria-label="Add new project"
					on:click={() => showCreateModal = true}
				>
					<Icon icon="heroicons:plus" class="w-4 h-4" />
				</button>
			{:else}
				<button 
					class="w-full flex justify-center text-gray-400 hover:text-gray-600" 
					aria-label="Projects"
					on:click={() => onToggleCollapse()}
				>
					<Icon icon="heroicons:folder" class="w-5 h-5" />
				</button>
			{/if}
		</div>
		
		<div class="space-y-1">
			{#if loading}
				<div class="flex items-center px-3 py-2 text-sm text-gray-500">
					<div class="w-3 h-3 bg-gray-200 rounded-full mr-3 animate-pulse"></div>
					Loading projects...
				</div>
			{:else if error}
				<div class="px-3 py-2 text-sm text-red-600 bg-red-50 rounded-lg">
					{error}
				</div>
			{:else if projects.length === 0}
				{#if !collapsed}
					<div class="px-3 py-2 text-sm text-gray-500">
						No projects yet
					</div>
				{/if}
			{:else}
				{#if !collapsed}
					{#each projects as project}
						<a 
							href="/dashboard/projects/{project.id}"
							class="relative group w-full flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors"
							class:bg-orange-50={$page.params.id === project.id}
							class:text-orange-700={$page.params.id === project.id}
							class:border-orange-200={$page.params.id === project.id}
							class:border={$page.params.id === project.id}
							class:text-gray-700={$page.params.id !== project.id}
							class:hover:bg-gray-50={$page.params.id !== project.id}
						>
							<div 
								class="w-3 h-3 rounded-full mr-3 flex-shrink-0"
								style="background-color: {project.color}"
							></div>
							{project.name}
							{#if project.total_tasks > 0}
								<span class="ml-auto bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded-full">
									{project.total_tasks}
								</span>
							{/if}
						</a>
					{/each}
				{/if}
			{/if}
		</div>
	</div>
	</div> <!-- End of scrollable middle section -->
	
	<!-- Bottom Section (fixed at bottom) -->
	<div class="flex-shrink-0">
		<!-- Settings & Help -->
		<div class="p-4 border-t border-gray-200">
			<nav class="space-y-1">
				<a 
					href="/dashboard/settings" 
					class="relative group flex items-center px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
					class:justify-center={collapsed}
				>
					<Icon icon="heroicons:cog-6-tooth" class="w-5 h-5 {collapsed ? '' : 'mr-3'} flex-shrink-0" />
					{#if !collapsed}
						Settings
					{/if}
					{#if collapsed}
						<div class="absolute left-full ml-2 px-2 py-1 bg-gray-900 text-white text-xs rounded-md opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-10">
							Settings
						</div>
					{/if}
				</a>
				<a 
					href="/help" 
					class="relative group flex items-center px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
					class:justify-center={collapsed}
				>
					<Icon icon="heroicons:question-mark-circle" class="w-5 h-5 {collapsed ? '' : 'mr-3'} flex-shrink-0" />
					{#if !collapsed}
						Help
					{/if}
					{#if collapsed}
						<div class="absolute left-full ml-2 px-2 py-1 bg-gray-900 text-white text-xs rounded-md opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-10">
							Help
						</div>
					{/if}
				</a>
			</nav>
		</div>
	</div>
</div>

<!-- Create Project Modal -->
{#if showCreateModal}
	<div class="fixed inset-0 z-50 flex items-center justify-center p-4">
		<div class="fixed inset-0 bg-black bg-opacity-30" role="button" tabindex="0" on:click={() => showCreateModal = false} on:keydown={(e) => e.key === 'Escape' && (showCreateModal = false)} aria-label="Close modal"></div>
		
		<div class="relative bg-white rounded-xl max-w-md w-full p-6">
			<h2 class="text-xl font-semibold text-gray-900 mb-4">Create New Project</h2>
			
			<form on:submit|preventDefault={createProject} class="space-y-4">
				<div>
					<label for="project-name" class="block text-sm font-medium text-gray-700 mb-1">Project Name *</label>
					<input
						id="project-name"
						type="text"
						bind:value={newProject.name}
						class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
						placeholder="Enter project name"
						required
						maxlength="50"
					/>
				</div>
				
				<div>
					<label for="project-description" class="block text-sm font-medium text-gray-700 mb-1">Description</label>
					<textarea
						id="project-description"
						bind:value={newProject.description}
						class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
						placeholder="Optional project description"
						rows="3"
					></textarea>
				</div>
				
				<div>
					<label for="project-color" class="block text-sm font-medium text-gray-700 mb-1">Color</label>
					<div class="flex items-center gap-3">
						<input
							id="project-color"
							type="color"
							bind:value={newProject.color}
							class="w-12 h-8 border border-gray-300 rounded-md cursor-pointer"
						/>
						<span class="text-sm text-gray-500">{newProject.color}</span>
					</div>
				</div>
				
				{#if error}
					<div class="px-3 py-2 text-sm text-red-600 bg-red-50 rounded-lg">
						{error}
					</div>
				{/if}
				
				<div class="flex justify-end gap-3 pt-4">
					<button
						type="button"
						on:click={() => showCreateModal = false}
						class="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
					>
						Cancel
					</button>
					<button
						type="submit"
						disabled={creating || !newProject.name.trim()}
						class="px-4 py-2 text-sm font-medium text-white bg-orange-600 rounded-md hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
					>
						{creating ? 'Creating...' : 'Create Project'}
					</button>
				</div>
			</form>
		</div>
	</div>
{/if}