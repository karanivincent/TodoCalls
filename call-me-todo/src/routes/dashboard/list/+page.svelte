<script lang="ts">
	import { onMount } from 'svelte';
	
	onMount(() => {
		console.log('List view loaded');
	});
</script>

<div class="h-full flex items-center justify-center">
	<div class="text-center">
		<svg class="w-24 h-24 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
			<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 10h16M4 14h16M4 18h16"/>
		</svg>
		<h2 class="text-2xl font-semibold text-gray-700 mb-2">List View</h2>
		<p class="text-gray-500">Coming soon - see all your tasks in a list</p>
	</div>
</div>