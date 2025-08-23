<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	
	const dispatch = createEventDispatcher<{
		change: { value: string; isValid: boolean };
		submit: void;
	}>();
	
	export let value = '';
	export let placeholder = '+1 (555) 123-4567';
	export let disabled = false;
	export let error = '';
	export let loading = false;
	export let autoFocus = false;
	
	let inputRef: HTMLInputElement;
	let isValid = false;
	let displayValue = '';
	
	function formatPhoneNumber(input: string): string {
		// Remove all non-digit characters
		const digits = input.replace(/\D/g, '');
		
		// If empty, return empty
		if (!digits) return '';
		
		// Format based on length and patterns
		if (digits.length >= 10) {
			if (digits.startsWith('1') && digits.length === 11) {
				// US number: +1 (234) 567-8900
				const match = digits.match(/^1(\d{3})(\d{3})(\d{4})$/);
				if (match) {
					return `+1 (${match[1]}) ${match[2]}-${match[3]}`;
				}
			} else if (digits.length === 10) {
				// US number without country code: +1 (234) 567-8900
				const match = digits.match(/^(\d{3})(\d{3})(\d{4})$/);
				if (match) {
					return `+1 (${match[1]}) ${match[2]}-${match[3]}`;
				}
			} else if (digits.startsWith('44') && digits.length >= 12) {
				// UK number: +44 20 1234 5678
				const match = digits.match(/^44(\d{2,4})(\d{4})(\d{4})$/);
				if (match) {
					return `+44 ${match[1]} ${match[2]} ${match[3]}`;
				}
			} else if (digits.startsWith('254') && digits.length >= 11) {
				// Kenya number: +254 712 345 678
				const match = digits.match(/^254(\d{3})(\d{3})(\d{3,4})$/);
				if (match) {
					return `+254 ${match[1]} ${match[2]} ${match[3]}`;
				}
			}
		}
		
		// For other patterns, format generically
		if (digits.length >= 10) {
			// Try to detect country code and format appropriately
			if (digits.length === 10) {
				// Assume US
				const match = digits.match(/^(\d{3})(\d{3})(\d{4})$/);
				if (match) {
					return `+1 (${match[1]}) ${match[2]}-${match[3]}`;
				}
			} else {
				// International - add spaces every 3-4 digits
				const countryCode = digits.slice(0, -10);
				const remaining = digits.slice(-10);
				const formatted = remaining.replace(/(\d{3})(\d{3})(\d{4})/, '$1 $2 $3');
				return `+${countryCode} ${formatted}`;
			}
		}
		
		// Partial number - just add +
		return `+${digits}`;
	}
	
	function getRawPhoneNumber(formatted: string): string {
		// Extract just the digits with +
		const digits = formatted.replace(/\D/g, '');
		if (!digits) return '';
		return `+${digits}`;
	}
	
	function validatePhoneNumber(phone: string): boolean {
		const digits = phone.replace(/\D/g, '');
		return digits.length >= 10 && digits.length <= 15;
	}
	
	function handleInput(event: Event) {
		const target = event.target as HTMLInputElement;
		const cursorPos = target.selectionStart || 0;
		const oldLength = displayValue.length;
		
		// Format the input
		displayValue = formatPhoneNumber(target.value);
		
		// Update raw value and validation
		const rawValue = getRawPhoneNumber(displayValue);
		isValid = validatePhoneNumber(rawValue);
		value = rawValue;
		
		// Dispatch change event
		dispatch('change', { value: rawValue, isValid });
		
		// Preserve cursor position after formatting
		const newLength = displayValue.length;
		const lengthDiff = newLength - oldLength;
		const newCursorPos = Math.max(0, Math.min(cursorPos + lengthDiff, displayValue.length));
		
		setTimeout(() => {
			if (inputRef && document.activeElement === inputRef) {
				inputRef.setSelectionRange(newCursorPos, newCursorPos);
			}
		}, 0);
	}
	
	function handleKeyDown(event: KeyboardEvent) {
		if (event.key === 'Enter' && isValid && !disabled) {
			event.preventDefault();
			dispatch('submit');
		}
	}
	
	function handlePaste(event: ClipboardEvent) {
		event.preventDefault();
		const pastedText = event.clipboardData?.getData('text') || '';
		displayValue = formatPhoneNumber(pastedText);
		handleInput({ target: { value: displayValue } } as any);
	}
	
	// Initialize display value when value prop changes externally
	$: if (value && value !== getRawPhoneNumber(displayValue)) {
		displayValue = formatPhoneNumber(value);
		isValid = validatePhoneNumber(value);
	}
	
	// Auto-focus if requested
	$: if (autoFocus && inputRef && !disabled) {
		setTimeout(() => inputRef?.focus(), 100);
	}
</script>

<div class="phone-input-container">
	<div class="relative">
		<input
			bind:this={inputRef}
			bind:value={displayValue}
			on:input={handleInput}
			on:keydown={handleKeyDown}
			on:paste={handlePaste}
			type="tel"
			{placeholder}
			{disabled}
			class="w-full px-4 py-3 pr-12 border-2 rounded-xl shadow-sm text-lg transition-all duration-300 ease-out
				{isValid && displayValue ? 'border-green-400 bg-green-50 shadow-green-100' : 
				 error ? 'border-red-400 bg-red-50 shadow-red-100' : 
				 'border-gray-300 hover:border-gray-400 focus:border-orange-400 focus:ring-4 focus:ring-orange-100'}
				disabled:opacity-50 disabled:cursor-not-allowed
				focus:outline-none focus:scale-[1.02] focus:shadow-lg"
			autocomplete="tel"
			inputmode="tel"
		/>
		
		<!-- Validation indicator with animation -->
		<div class="absolute right-3 top-1/2 transform -translate-y-1/2 transition-all duration-300">
			{#if loading}
				<div class="animate-spin w-6 h-6 border-2 border-orange-400 border-t-transparent rounded-full"></div>
			{:else if isValid && displayValue}
				<div class="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center animate-bounce">
					<svg class="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
						<path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/>
					</svg>
				</div>
			{:else if displayValue && !isValid}
				<div class="w-6 h-6 bg-red-500 rounded-full flex items-center justify-center animate-pulse">
					<svg class="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
						<path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd"/>
					</svg>
				</div>
			{/if}
		</div>
	</div>
	
	<!-- Helper text with smooth transitions -->
	<div class="mt-2 min-h-[1.5rem] transition-all duration-300">
		{#if error}
			<p class="text-sm text-red-600 flex items-center gap-2 animate-fadeIn">
				<svg class="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
					<path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clip-rule="evenodd"/>
				</svg>
				{error}
			</p>
		{:else if displayValue && !isValid}
			<p class="text-sm text-amber-600 flex items-center gap-2 animate-fadeIn">
				<svg class="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
					<path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd"/>
				</svg>
				Include country code (e.g., +1 for US, +254 for Kenya)
			</p>
		{:else if isValid && displayValue}
			<p class="text-sm text-green-600 flex items-center gap-2 animate-fadeIn">
				<svg class="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
					<path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/>
				</svg>
				Looks great! Ready to verify
			</p>
		{:else if placeholder}
			<p class="text-sm text-gray-500">
				Enter your phone number with country code
			</p>
		{/if}
	</div>
</div>

<style>
	.phone-input-container {
		@apply w-full;
	}
	
	/* Smooth focus animations */
	input {
		transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
	}
	
	input:focus {
		transform: translateY(-1px);
	}
	
	/* Fade in animation */
	@keyframes fadeIn {
		from { 
			opacity: 0; 
			transform: translateY(-4px); 
		}
		to { 
			opacity: 1; 
			transform: translateY(0); 
		}
	}
	
	.animate-fadeIn {
		animation: fadeIn 0.3s ease-out;
	}
	
	/* Subtle glow effect for valid input */
	input.border-green-400 {
		box-shadow: 0 0 0 3px rgba(34, 197, 94, 0.1), 0 4px 6px -1px rgba(0, 0, 0, 0.1);
	}
</style>