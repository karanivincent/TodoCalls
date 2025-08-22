<script lang="ts">
	import { toast } from '$lib/stores/toast';
	import { fade, fly } from 'svelte/transition';
	import { flip } from 'svelte/animate';
	
	let toasts: any[] = [];
	
	toast.subscribe(value => {
		toasts = value;
		// Auto-remove toasts after their duration
		toasts.forEach(t => {
			if (t.duration && t.duration > 0) {
				setTimeout(() => {
					toast.remove(t.id);
				}, t.duration);
			}
		});
	});
	
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

<div class="fixed top-4 right-4 z-[9999] space-y-2 pointer-events-none">
	{#each toasts as item (item.id)}
		<div
			animate:flip={{ duration: 200 }}
			in:fly={{ x: 100, duration: 300 }}
			out:fade={{ duration: 200 }}
			class="pointer-events-auto"
		>
			<div class="flex items-start gap-3 p-4 rounded-lg border shadow-lg {colors[item.type]} bg-opacity-95 backdrop-blur max-w-md">
				<span class="text-xl font-bold">{icons[item.type]}</span>
				<p class="flex-1 text-sm font-medium">{item.message}</p>
				<button
					on:click={() => toast.remove(item.id)}
					class="text-lg hover:opacity-70 transition-opacity"
					aria-label="Close"
				>
					×
				</button>
			</div>
		</div>
	{/each}
</div>