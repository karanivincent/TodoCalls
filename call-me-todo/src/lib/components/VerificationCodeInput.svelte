<script lang="ts">
	import { createEventDispatcher, tick } from 'svelte';
	
	const dispatch = createEventDispatcher<{
		complete: { code: string };
		change: { code: string; isComplete: boolean };
	}>();
	
	export let length = 6;
	export let disabled = false;
	export let error = '';
	export let loading = false;
	export let autoFocus = true;
	
	let inputs: HTMLInputElement[] = [];
	let values: string[] = Array(length).fill('');
	let currentIndex = 0;
	
	$: code = values.join('');
	$: isComplete = code.length === length && /^\d+$/.test(code);
	
	// Dispatch changes
	$: dispatch('change', { code, isComplete });
	
	// Auto-submit when complete
	$: if (isComplete && !loading) {
		dispatch('complete', { code });
	}
	
	async function focusNext(index: number) {
		if (index < length - 1) {
			currentIndex = index + 1;
			await tick();
			inputs[currentIndex]?.focus();
		}
	}
	
	async function focusPrev(index: number) {
		if (index > 0) {
			currentIndex = index - 1;
			await tick();
			inputs[currentIndex]?.focus();
		}
	}
	
	function handleInput(event: Event, index: number) {
		const target = event.target as HTMLInputElement;
		const value = target.value.replace(/\D/g, ''); // Only digits
		
		if (value.length > 1) {
			// Handle paste or multiple characters
			const chars = value.split('').slice(0, length - index);
			for (let i = 0; i < chars.length && index + i < length; i++) {
				values[index + i] = chars[i];
			}
			values = [...values];
			
			// Focus the next empty input or last input
			const nextIndex = Math.min(index + chars.length, length - 1);
			currentIndex = nextIndex;
			tick().then(() => inputs[nextIndex]?.focus());
		} else {
			values[index] = value;
			values = [...values];
			
			if (value) {
				focusNext(index);
			}
		}
		
		// Auto-advance cursor
		if (target.value.length > 1) {
			target.value = target.value.slice(-1);
		}
	}
	
	function handleKeyDown(event: KeyboardEvent, index: number) {
		const target = event.target as HTMLInputElement;
		
		if (event.key === 'Backspace') {
			if (!values[index] && index > 0) {
				// If current input is empty, go back and clear previous
				values[index - 1] = '';
				values = [...values];
				focusPrev(index);
			} else {
				// Clear current input
				values[index] = '';
				values = [...values];
			}
		} else if (event.key === 'ArrowLeft') {
			event.preventDefault();
			focusPrev(index);
		} else if (event.key === 'ArrowRight') {
			event.preventDefault();
			focusNext(index);
		} else if (event.key === 'Enter' && isComplete) {
			event.preventDefault();
			dispatch('complete', { code });
		} else if (/^\d$/.test(event.key)) {
			// Allow only digits
			event.preventDefault();
			values[index] = event.key;
			values = [...values];
			focusNext(index);
		} else if (!/^[Backspace|ArrowLeft|ArrowRight|Tab|Enter]$/.test(event.key)) {
			// Prevent non-digit characters
			event.preventDefault();
		}
	}
	
	function handlePaste(event: ClipboardEvent, index: number) {
		event.preventDefault();
		const pastedText = event.clipboardData?.getData('text') || '';
		const digits = pastedText.replace(/\D/g, '').slice(0, length);
		
		// Fill inputs starting from current index
		for (let i = 0; i < digits.length && index + i < length; i++) {
			values[index + i] = digits[i];
		}
		values = [...values];
		
		// Focus the next empty input or last input
		const nextIndex = Math.min(index + digits.length, length - 1);
		currentIndex = nextIndex;
		tick().then(() => inputs[nextIndex]?.focus());
	}
	
	function handleFocus(index: number) {
		currentIndex = index;
	}
	
	// Auto-focus first input
	$: if (autoFocus && inputs[0] && !disabled) {
		tick().then(() => inputs[0]?.focus());
	}
	
	// Clear all inputs when error changes
	$: if (error) {
		values = Array(length).fill('');
		currentIndex = 0;
		tick().then(() => inputs[0]?.focus());
	}
</script>

<div class="verification-code-input">
	<div class="flex gap-2 justify-center">
		{#each Array(length) as _, index}
			<input
				bind:this={inputs[index]}
				bind:value={values[index]}
				on:input={(e) => handleInput(e, index)}
				on:keydown={(e) => handleKeyDown(e, index)}
				on:paste={(e) => handlePaste(e, index)}
				on:focus={() => handleFocus(index)}
				type="text"
				inputmode="numeric"
				pattern="[0-9]*"
				maxlength="1"
				{disabled}
				class="w-12 h-12 text-center text-xl font-bold border-2 rounded-lg transition-all duration-200
					{error ? 'border-red-500 bg-red-50 text-red-700' :
					 values[index] ? 'border-green-500 bg-green-50 text-green-700' :
					 currentIndex === index ? 'border-orange-500 bg-orange-50 ring-2 ring-orange-200' :
					 'border-gray-300 hover:border-gray-400'}
					disabled:opacity-50 disabled:cursor-not-allowed
					focus:outline-none"
				autocomplete="one-time-code"
			/>
		{/each}
	</div>
	
	{#if error}
		<p class="mt-3 text-sm text-red-600 text-center flex items-center justify-center gap-1">
			<svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
				<path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clip-rule="evenodd"/>
			</svg>
			{error}
		</p>
	{:else if isComplete}
		<p class="mt-3 text-sm text-green-600 text-center flex items-center justify-center gap-1">
			<svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
				<path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/>
			</svg>
			Code complete
		</p>
	{/if}
	
	{#if loading}
		<div class="mt-3 flex justify-center">
			<div class="animate-spin w-5 h-5 border-2 border-orange-500 border-t-transparent rounded-full"></div>
		</div>
	{/if}
</div>

<style>
	.verification-code-input input {
		transition: all 0.15s ease-in-out;
	}
	
	.verification-code-input input:focus {
		transform: scale(1.05);
	}
	
	/* Add subtle pulse animation for current input */
	.verification-code-input input:focus {
		animation: pulse-border 1.5s infinite;
	}
	
	@keyframes pulse-border {
		0%, 100% { border-color: #f97316; }
		50% { border-color: #fb923c; }
	}
</style>