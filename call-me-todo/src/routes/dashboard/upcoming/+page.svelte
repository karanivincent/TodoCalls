<script lang="ts">
	import { onMount } from 'svelte';
	
	onMount(() => {
		console.log('Upcoming view loaded');
	});
</script>

<div class="h-full flex items-center justify-center">
	<div class="text-center">
		<svg class="w-24 h-24 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
			<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2v0a2 2 0 01-2-2v-5a2 2 0 00-2-2H8z"/>
		</svg>
		<h2 class="text-2xl font-semibold text-gray-700 mb-2">Upcoming Tasks</h2>
		<p class="text-gray-500">Coming soon - see all your upcoming tasks</p>
	</div>
</div>