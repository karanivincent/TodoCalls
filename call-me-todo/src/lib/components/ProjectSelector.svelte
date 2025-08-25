<script lang="ts">
	import Icon from '@iconify/svelte';
	import type { Project } from '$lib/database.types.enhanced';
	
	export let selectedProjectId: string | null = null;
	export let projects: Project[] = [];
	export let loading: boolean = false;
	export let onProjectChange: (projectId: string | null) => void = () => {};
	
	let showDropdown = false;
	
	$: selectedProject = projects.find(p => p.id === selectedProjectId);
	
	function selectProject(projectId: string | null) {
		selectedProjectId = projectId;
		onProjectChange(projectId);
		showDropdown = false;
	}
	
	function handleClickOutside(event: MouseEvent) {
		const target = event.target as HTMLElement;
		if (!target.closest('.project-selector')) {
			showDropdown = false;
		}
	}
</script>

<svelte:window on:click={handleClickOutside} />

<div class="project-selector relative">
	<button
		on:click={() => showDropdown = !showDropdown}
		class="flex items-center justify-between gap-2 px-4 py-3 text-sm rounded-lg border border-gray-200 hover:border-gray-300 hover:bg-gray-50 transition-all bg-white group h-[46px] w-[180px]"
		disabled={loading}
	>
		{#if loading}
			<div class="animate-spin w-4 h-4 border-2 border-gray-300 border-t-orange-600 rounded-full mx-auto"></div>
		{:else}
			<div class="flex items-center gap-2 flex-1 min-w-0">
				{#if selectedProject}
					<span class="w-3 h-3 rounded-full flex-shrink-0" style="background-color: {selectedProject.color}"></span>
					<span class="font-medium text-gray-900 truncate">{selectedProject.name}</span>
				{:else}
					<Icon icon="heroicons:folder" class="w-4 h-4 text-gray-400 group-hover:text-gray-600 flex-shrink-0" />
					<span class="text-gray-600 truncate">No project</span>
				{/if}
			</div>
			<Icon icon="heroicons:chevron-down" class="w-4 h-4 text-gray-400 group-hover:text-gray-600 transition-transform flex-shrink-0 {showDropdown ? 'rotate-180' : ''}" />
		{/if}
	</button>
	
	{#if showDropdown && !loading}
		<div class="absolute top-full left-0 mt-1 w-64 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
			<div class="p-1">
				<!-- No project option -->
				<button
					on:click={() => selectProject(null)}
					class="w-full flex items-center gap-2 px-3 py-2 text-sm rounded hover:bg-gray-50 transition-colors text-left {!selectedProjectId ? 'bg-gray-50' : ''}"
				>
					<Icon icon="heroicons:folder" class="w-4 h-4 text-gray-400" />
					<span class="text-gray-600">No project</span>
				</button>
				
				{#if projects.length > 0}
					<div class="border-t border-gray-100 my-1"></div>
					
					{#each projects as project}
						<button
							on:click={() => selectProject(project.id)}
							class="w-full flex items-center gap-2 px-3 py-2 text-sm rounded hover:bg-gray-50 transition-colors text-left {selectedProjectId === project.id ? 'bg-gray-50' : ''}"
						>
							<span class="w-2 h-2 rounded-full flex-shrink-0" style="background-color: {project.color}"></span>
							<span class="flex-1 truncate">{project.name}</span>
							{#if project.total_tasks > 0}
								<span class="text-xs text-gray-500">{project.total_tasks}</span>
							{/if}
						</button>
					{/each}
				{/if}
			</div>
		</div>
	{/if}
</div>