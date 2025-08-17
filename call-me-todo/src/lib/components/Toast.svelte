<script lang="ts">
	import { onMount } from 'svelte';
	import { fade, fly } from 'svelte/transition';
	
	export let message = '';
	export let type: 'success' | 'error' | 'info' = 'info';
	export let duration = 5000;
	export let onClose: () => void = () => {};
	
	let visible = true;
	
	onMount(() => {
		if (duration > 0) {
			const timeout = setTimeout(() => {
				visible = false;
				setTimeout(onClose, 300); // Wait for transition to complete
			}, duration);
			
			return () => clearTimeout(timeout);
		}
	});
	
	function handleClose() {
		visible = false;
		setTimeout(onClose, 300);
	}
	
	const icons = {
		success: '✓',
		error: '✕',
		info: 'ℹ'
	};
	
	const colors = {
		success: 'bg-green-50 text-green-800 border-green-200',
		error: 'bg-red-50 text-red-800 border-red-200',
		info: 'bg-blue-50 text-blue-800 border-blue-200'
	};
</script>

{#if visible}
	<div
		in:fly={{ y: -20, duration: 300 }}
		out:fade={{ duration: 300 }}
		class="fixed top-4 right-4 z-[9999] max-w-md"
	>
		<div class="flex items-start gap-3 p-4 rounded-lg border shadow-lg {colors[type]} bg-opacity-95 backdrop-blur">
			<span class="text-xl font-bold">{icons[type]}</span>
			<p class="flex-1 text-sm font-medium">{message}</p>
			<button
				on:click={handleClose}
				class="text-lg hover:opacity-70 transition-opacity"
				aria-label="Close"
			>
				×
			</button>
		</div>
	</div>
{/if}