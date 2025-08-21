<script lang="ts">
	import { onMount } from 'svelte';
	import { createEventDispatcher } from 'svelte';
	
	const dispatch = createEventDispatcher();
	
	let input = '';
	let isExpanded = false;
	let showRecipients = false;
	let parsedData = {
		recipient: '',
		task: '',
		time: ''
	};
	
	// Recent recipients for quick selection
	let recentRecipients = [
		{ id: 'me', name: 'Me', type: 'personal' },
		{ id: 'mom', name: 'Mom', type: 'family' },
		{ id: 'john', name: 'John', type: 'work' },
		{ id: 'dad', name: 'Dad', type: 'family' }
	];
	
	// Parse natural language input
	function parseInput(text: string) {
		// Simple parsing logic (would be replaced with actual NLP)
		const lowerText = text.toLowerCase();
		
		// Detect recipient
		let recipient = 'Me';
		recentRecipients.forEach(r => {
			if (lowerText.includes(r.name.toLowerCase())) {
				recipient = r.name;
			}
		});
		
		// Detect time patterns
		const timeMatch = text.match(/at\s+(\d{1,2}(?::\d{2})?\s*(?:am|pm)?)/i);
		const time = timeMatch ? timeMatch[1] : '';
		
		// Extract task (remove recipient and time)
		let task = text;
		if (recipient !== 'Me') {
			task = task.replace(new RegExp(recipient, 'gi'), '');
		}
		if (time) {
			task = task.replace(new RegExp(`at\\s+${time}`, 'gi'), '');
		}
		task = task.replace(/^\s*(remind|tell|call)\s+/i, '').trim();
		
		parsedData = { recipient, task, time };
	}
	
	function handleInputChange() {
		if (input.length > 0) {
			parseInput(input);
		} else {
			parsedData = { recipient: '', task: '', time: '' };
		}
	}
	
	function handleSubmit() {
		if (input.trim()) {
			dispatch('addTask', {
				text: input,
				parsed: parsedData
			});
			input = '';
			parsedData = { recipient: '', task: '', time: '' };
			isExpanded = false;
		}
	}
	
	function selectRecipient(recipient: any) {
		if (input) {
			input = `Remind ${recipient.name} to ${input}`;
		} else {
			input = `Remind ${recipient.name} to `;
		}
		showRecipients = false;
		handleInputChange();
	}
	
	function handleKeyDown(event: KeyboardEvent) {
		if (event.key === 'Enter' && !event.shiftKey) {
			event.preventDefault();
			handleSubmit();
		}
	}
	
	// Voice input placeholder
	function startVoiceInput() {
		alert('Voice input would start here (requires implementation)');
	}
</script>

<div class="bg-white border-b border-gray-200 sticky top-0 z-30">
	<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
		<div class="py-3">
			<div class="relative">
				<!-- Main Input Container -->
				<div class="flex items-center gap-2 bg-white rounded-lg border border-gray-300 focus-within:border-orange-500 focus-within:ring-2 focus-within:ring-orange-500/20 transition-all">
					<!-- Voice Input Button -->
					<button
						on:click={startVoiceInput}
						class="p-2 ml-2 text-gray-400 hover:text-gray-600 transition-colors"
						aria-label="Voice input"
					>
						<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"/>
						</svg>
					</button>
					
					<!-- Input Field -->
					<input
						type="text"
						bind:value={input}
						on:input={handleInputChange}
						on:keydown={handleKeyDown}
						on:focus={() => isExpanded = true}
						on:blur={() => setTimeout(() => isExpanded = false, 200)}
						placeholder='Try: "Remind Mom to take medication at 9am" or "Tell John to submit report by 5pm"'
						class="flex-1 py-2 px-3 text-gray-900 placeholder-gray-400 focus:outline-none"
						autocomplete="off"
					/>
					
					<!-- Add Button -->
					<button
						on:click={handleSubmit}
						disabled={!input.trim()}
						class="px-4 py-2 mr-1 bg-orange-600 text-white rounded-md hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
					>
						<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
						</svg>
						<span class="hidden sm:inline">Add</span>
					</button>
				</div>
				
				<!-- AI Parsing Visualization -->
				{#if parsedData.recipient || parsedData.task || parsedData.time}
					<div class="absolute left-0 right-0 top-full mt-2 p-2 bg-purple-50 border border-purple-200 rounded-lg">
						<div class="flex items-center gap-3 text-xs">
							{#if parsedData.recipient}
								<span class="inline-flex items-center gap-1 px-2 py-1 bg-white rounded-full text-purple-700 border border-purple-200">
									<svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>
									</svg>
									{parsedData.recipient}
								</span>
							{/if}
							{#if parsedData.task}
								<span class="inline-flex items-center gap-1 px-2 py-1 bg-white rounded-full text-purple-700 border border-purple-200">
									<svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/>
									</svg>
									{parsedData.task}
								</span>
							{/if}
							{#if parsedData.time}
								<span class="inline-flex items-center gap-1 px-2 py-1 bg-white rounded-full text-purple-700 border border-purple-200">
									<svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
									</svg>
									{parsedData.time}
								</span>
							{/if}
						</div>
					</div>
				{/if}
				
				<!-- Recent Recipients Dropdown -->
				{#if isExpanded && !input}
					<div class="absolute left-0 right-0 top-full mt-2 p-4 bg-white border border-gray-200 rounded-lg shadow-lg">
						<div class="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Recent Recipients</div>
						<div class="flex flex-wrap gap-2">
							{#each recentRecipients as recipient}
								<button
									on:click={() => selectRecipient(recipient)}
									class="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium border transition-colors
										{recipient.type === 'family' ? 'bg-pink-50 text-pink-700 border-pink-200 hover:bg-pink-100' : ''}
										{recipient.type === 'work' ? 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100' : ''}
										{recipient.type === 'personal' ? 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100' : ''}"
								>
									{#if recipient.type === 'family'}
										<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
											<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"/>
										</svg>
									{:else if recipient.type === 'work'}
										<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
											<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>
										</svg>
									{:else}
										<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
											<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>
										</svg>
									{/if}
									{recipient.name}
								</button>
							{/each}
							<button class="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium bg-purple-50 text-purple-700 border border-purple-200 hover:bg-purple-100 transition-colors">
								<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
								</svg>
								Add recipient
							</button>
						</div>
						
						<div class="mt-3 pt-3 border-t border-gray-100">
							<div class="flex items-start gap-2 text-xs text-gray-500">
								<svg class="w-4 h-4 text-purple-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"/>
								</svg>
								<span>Just start typing naturally. Our AI will understand who to call and when.</span>
							</div>
						</div>
					</div>
				{/if}
			</div>
		</div>
	</div>
</div>