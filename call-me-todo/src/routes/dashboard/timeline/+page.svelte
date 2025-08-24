<script lang="ts">
	import { onMount } from 'svelte';
	
	onMount(() => {
		console.log('Timeline view loaded');
	});
</script>

<div class="h-full flex items-center justify-center">
	<div class="text-center">
		<svg class="w-24 h-24 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
			<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/>
		</svg>
		<h2 class="text-2xl font-semibold text-gray-700 mb-2">Timeline View</h2>
		<p class="text-gray-500">Coming soon - visualize your tasks on a timeline</p>
	</div>
</div>