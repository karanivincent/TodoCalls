<script lang="ts">
	import { onMount } from 'svelte';
	import type { ProjectWithStats } from '$lib/database.types.enhanced';

	export let currentView: 'today' | 'timeline' | 'list' = 'today';
	export let onViewChange: (view: 'today' | 'timeline' | 'list') => void = () => {};
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
			const result = await response.json();
			
			if (result.success) {
				projects = result.projects;
			} else {
				error = result.error || 'Failed to load projects';
			}
		} catch (err) {
			console.error('Error fetching projects:', err);
			error = 'Failed to load projects';
		} finally {
			loading = false;
		}
	}
	
	onMount(() => {
		fetchProjects();
	});
	
	function handleViewChange(view: 'today' | 'timeline' | 'list') {
		currentView = view;
		onViewChange(view);
	}

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

<div class="h-full flex flex-col">
	<!-- Primary Views -->
	<div class="p-4">
		<nav class="space-y-1">
			<button
				class="w-full flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors"
				class:bg-orange-50={currentView === 'today'}
				class:text-orange-700={currentView === 'today'}
				class:border-orange-200={currentView === 'today'}
				class:border={currentView === 'today'}
				class:text-gray-700={currentView !== 'today'}
				class:hover:bg-gray-50={currentView !== 'today'}
				on:click={() => handleViewChange('today')}
			>
				<svg class="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"/>
				</svg>
				Today
				{#if taskCounts.today > 0}
					<span class="ml-auto bg-orange-100 text-orange-600 text-xs px-2 py-1 rounded-full">
						{taskCounts.today}
					</span>
				{/if}
			</button>
			
			<button
				class="w-full flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors"
				class:bg-orange-50={currentView === 'timeline'}
				class:text-orange-700={currentView === 'timeline'}
				class:border-orange-200={currentView === 'timeline'}
				class:border={currentView === 'timeline'}
				class:text-gray-700={currentView !== 'timeline'}
				class:hover:bg-gray-50={currentView !== 'timeline'}
				on:click={() => handleViewChange('timeline')}
			>
				<svg class="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/>
				</svg>
				Timeline
			</button>
			
			<button
				class="w-full flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors"
				class:bg-orange-50={currentView === 'list'}
				class:text-orange-700={currentView === 'list'}
				class:border-orange-200={currentView === 'list'}
				class:border={currentView === 'list'}
				class:text-gray-700={currentView !== 'list'}
				class:hover:bg-gray-50={currentView !== 'list'}
				on:click={() => handleViewChange('list')}
			>
				<svg class="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 10h16M4 14h16M4 18h16"/>
				</svg>
				List
			</button>
			
			<button class="w-full flex items-center px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-lg transition-colors">
				<svg class="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2v0a2 2 0 01-2-2v-5a2 2 0 00-2-2H8z"/>
				</svg>
				Upcoming
				{#if taskCounts.upcoming > 0}
					<span class="ml-auto bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded-full">
						{taskCounts.upcoming}
					</span>
				{/if}
			</button>
		</nav>
	</div>
	
	<!-- Projects Section -->
	<div class="px-4 py-2 border-t border-gray-200">
		<div class="flex items-center justify-between mb-3">
			<h3 class="text-xs font-semibold text-gray-500 uppercase tracking-wider">Projects</h3>
			<button 
				class="text-gray-400 hover:text-gray-600" 
				aria-label="Add new project"
				on:click={() => showCreateModal = true}
			>
				<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
				</svg>
			</button>
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
			{:else}
				{#each projects as project}
					<a 
						href="/dashboard/projects/{project.id}"
						class="w-full flex items-center px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
					>
						<div 
							class="w-3 h-3 rounded-full mr-3"
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
		</div>
	</div>
	
	<!-- Bottom Section -->
	<div class="mt-auto">
		<!-- Settings & Help -->
		<div class="p-4 border-t border-gray-200">
			<nav class="space-y-1">
				<a 
					href="/dashboard/settings" 
					class="flex items-center px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
				>
					<svg class="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/>
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
					</svg>
					Settings
				</a>
				<a 
					href="/help" 
					class="flex items-center px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
				>
					<svg class="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
					</svg>
					Help
				</a>
			</nav>
		</div>
		
		<!-- Voice Status Section -->
		<div class="p-4 border-t border-gray-200">
			<div class="bg-orange-50 rounded-lg p-3">
				<div class="flex items-center text-sm text-orange-700 mb-2">
					<svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"/>
					</svg>
					Voice Status
				</div>
				<p class="text-xs text-orange-600 mb-2">Next call in 25 min</p>
				<button class="w-full px-3 py-1 bg-orange-600 text-white text-xs rounded-md hover:bg-orange-700 transition-colors">
					Test Call Now
				</button>
			</div>
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