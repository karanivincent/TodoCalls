<script lang="ts">
	import Icon from '@iconify/svelte';
	
	export let project: any;
	export let stats: {
		total: number;
		completed: number;
		overdue: number;
		dueThisWeek: number;
	};
	
	$: completionPercentage = stats.total > 0 
		? Math.round((stats.completed / stats.total) * 100)
		: 0;
</script>

<div class="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
	<div class="flex items-start justify-between">
		<div class="flex-1">
			<!-- Project Name and Color -->
			<div class="flex items-center gap-3 mb-2">
				<div 
					class="w-4 h-4 rounded-full flex-shrink-0"
					style="background-color: {project.color}"
				></div>
				<h1 class="text-2xl font-bold text-gray-900">{project.name}</h1>
			</div>
			
			<!-- Project Description -->
			{#if project.description}
				<p class="text-gray-600 mb-4">{project.description}</p>
			{/if}
			
			<!-- Progress Bar -->
			<div class="mb-4">
				<div class="flex items-center justify-between text-sm mb-2">
					<span class="text-gray-600">
						{stats.completed} of {stats.total} tasks completed
					</span>
					<span class="font-medium text-gray-900">{completionPercentage}%</span>
				</div>
				<div class="w-full bg-gray-200 rounded-full h-2">
					<div 
						class="h-2 rounded-full transition-all duration-300"
						style="width: {completionPercentage}%; background-color: {project.color}"
					></div>
				</div>
			</div>
			
			<!-- Stats -->
			<div class="flex flex-wrap gap-4 text-sm">
				{#if stats.overdue > 0}
					<div class="flex items-center gap-2">
						<Icon icon="heroicons:exclamation-circle" class="w-4 h-4 text-red-500" />
						<span class="text-red-700 font-medium">{stats.overdue} overdue</span>
					</div>
				{/if}
				
				{#if stats.dueThisWeek > 0}
					<div class="flex items-center gap-2">
						<Icon icon="heroicons:calendar" class="w-4 h-4 text-blue-500" />
						<span class="text-blue-700">{stats.dueThisWeek} due this week</span>
					</div>
				{/if}
				
				<div class="flex items-center gap-2">
					<Icon icon="heroicons:check-circle" class="w-4 h-4 text-green-500" />
					<span class="text-green-700">{stats.completed} completed</span>
				</div>
			</div>
		</div>
		
		<!-- Project Actions -->
		<div class="flex items-center gap-2 ml-4">
			<button
				class="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
				aria-label="Edit project"
			>
				<Icon icon="heroicons:pencil" class="w-5 h-5" />
			</button>
			<button
				class="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
				aria-label="More options"
			>
				<Icon icon="heroicons:ellipsis-horizontal" class="w-5 h-5" />
			</button>
		</div>
	</div>
</div>