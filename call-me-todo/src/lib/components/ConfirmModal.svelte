<script lang="ts">
	import { fade, scale } from 'svelte/transition';
	
	export let isOpen = false;
	export let title = 'Confirm Action';
	export let message = 'Are you sure you want to proceed?';
	export let confirmText = 'Confirm';
	export let cancelText = 'Cancel';
	export let onConfirm: () => void = () => {};
	export let onCancel: () => void = () => {};
	export let danger = false;
	
	function handleConfirm() {
		onConfirm();
		isOpen = false;
	}
	
	function handleCancel() {
		onCancel();
		isOpen = false;
	}
	
	function handleBackdropClick(e: MouseEvent) {
		if (e.target === e.currentTarget) {
			handleCancel();
		}
	}
	
	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'Escape') {
			handleCancel();
		}
	}
</script>

<svelte:window on:keydown={handleKeydown} />

{#if isOpen}
	<div
		class="fixed inset-0 z-[10000] flex items-center justify-center"
		on:click={handleBackdropClick}
		transition:fade={{ duration: 200 }}
	>
		<!-- Backdrop -->
		<div class="absolute inset-0 bg-black bg-opacity-30" />
		
		<!-- Modal -->
		<div
			class="relative bg-white rounded-lg shadow-xl max-w-md w-full mx-4 p-6"
			transition:scale={{ duration: 200, start: 0.95 }}
		>
			<h3 class="text-lg font-semibold text-gray-900 mb-2">
				{title}
			</h3>
			
			<p class="text-gray-600 mb-6">
				{message}
			</p>
			
			<div class="flex justify-end space-x-3">
				<button
					on:click={handleCancel}
					class="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-400"
				>
					{cancelText}
				</button>
				<button
					on:click={handleConfirm}
					class="px-4 py-2 text-white rounded-md transition-colors focus:outline-none focus:ring-2 {danger ? 'bg-red-600 hover:bg-red-700 focus:ring-red-500' : 'bg-orange-600 hover:bg-orange-700 focus:ring-orange-500'}"
				>
					{confirmText}
				</button>
			</div>
		</div>
	</div>
{/if}