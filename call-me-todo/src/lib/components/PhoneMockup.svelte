<script lang="ts">
	import { onMount } from 'svelte';
	import { fade, scale } from 'svelte/transition';
	import { spring } from 'svelte/motion';
	
	let isRinging = true;
	let isDemoPlaying = false;
	let showCallScreen = true;
	let audioElement: HTMLAudioElement | null = null;
	let isLoadingAudio = false;
	
	// Spring animation for the phone shake effect
	const shake = spring(0, {
		stiffness: 0.05,
		damping: 0.25
	});
	
	onMount(() => {
		// Start ringing animation
		const ringInterval = setInterval(() => {
			if (isRinging) {
				shake.update(v => v === 0 ? 1 : 0);
			}
		}, 600);
		
		return () => {
			clearInterval(ringInterval);
		};
	});
	
	async function playDemo() {
		isLoadingAudio = true;
		isRinging = false;
		shake.set(0);
		
		try {
			// Fetch the demo audio from our API
			const response = await fetch('/api/demo-audio');
			
			if (!response.ok) {
				throw new Error('Failed to load demo audio');
			}
			
			// Create audio element if it doesn't exist
			if (!audioElement) {
				audioElement = new Audio();
				
				// Set up event listeners
				audioElement.addEventListener('ended', () => {
					isDemoPlaying = false;
					isRinging = true;
				});
				
				audioElement.addEventListener('error', (e) => {
					console.error('Audio playback error:', e);
					isDemoPlaying = false;
					isRinging = true;
					isLoadingAudio = false;
				});
			}
			
			// Create blob URL from the response
			const audioBlob = await response.blob();
			const audioUrl = URL.createObjectURL(audioBlob);
			
			// Set the source and play
			audioElement.src = audioUrl;
			audioElement.volume = 0.8;
			
			await audioElement.play();
			isDemoPlaying = true;
			isLoadingAudio = false;
			
		} catch (error) {
			console.error('Error playing demo:', error);
			isLoadingAudio = false;
			isRinging = true;
			
			// Fallback to visual-only demo
			isDemoPlaying = true;
			setTimeout(() => {
				isDemoPlaying = false;
				isRinging = true;
			}, 5000);
		}
	}
	
	function stopDemo() {
		if (audioElement) {
			audioElement.pause();
			audioElement.currentTime = 0;
		}
		isDemoPlaying = false;
		isLoadingAudio = false;
		isRinging = true;
	}
	
	$: phoneTransform = `rotate(${$shake * 2}deg) translateX(${$shake * 3}px)`;
</script>

<div class="relative w-full max-w-sm mx-auto">
	<!-- Phone container with shake animation -->
	<div 
		class="relative mx-auto w-[280px] h-[580px] transform transition-transform duration-100"
		style="transform: {phoneTransform}"
	>
		<!-- Phone frame -->
		<div class="absolute inset-0 bg-gray-900 rounded-[3rem] shadow-2xl overflow-hidden">
			<!-- Screen bezel -->
			<div class="absolute inset-[3px] bg-black rounded-[2.8rem] overflow-hidden">
				<!-- Notch -->
				<div class="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-6 bg-gray-900 rounded-b-2xl"></div>
				
				<!-- Screen content -->
				<div class="absolute inset-[2px] bg-white rounded-[2.7rem] overflow-hidden">
					{#if showCallScreen}
						<!-- Incoming call screen -->
						<div class="h-full relative bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
							<!-- Blurred background -->
							<div class="absolute inset-0 opacity-30">
								<div class="absolute inset-0 bg-gradient-to-br from-orange-500 to-orange-700"></div>
							</div>
							
							<!-- Call content -->
							<div class="relative h-full flex flex-col items-center justify-between text-white p-8 pt-12">
								<!-- Incoming call label -->
								<div class="text-center space-y-2">
									<p class="text-sm text-gray-300 uppercase tracking-wider">Incoming call</p>
									<h2 class="text-2xl font-light">TeliTask</h2>
									<p class="text-lg text-gray-300">Reminder Service</p>
								</div>
								
								<!-- Avatar/Icon -->
								<div class="relative">
									<div class="w-32 h-32 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center shadow-2xl">
										{#if isDemoPlaying}
											<!-- Sound wave animation when playing -->
											<div class="absolute inset-0 rounded-full animate-ping bg-orange-500 opacity-30"></div>
											<div class="absolute inset-0 rounded-full animate-ping animation-delay-200 bg-orange-500 opacity-20"></div>
										{/if}
										<svg class="w-16 h-16 text-white" fill="currentColor" viewBox="0 0 24 24">
											<path d="M3 5a2 2 0 012-2h14a2 2 0 012 2v14a2 2 0 01-2 2H5a2 2 0 01-2-2V5zm9 5a1 1 0 011 1v2a1 1 0 11-2 0v-2a1 1 0 011-1zm-4 0a1 1 0 011 1v2a1 1 0 11-2 0v-2a1 1 0 011-1zm8 0a1 1 0 011 1v2a1 1 0 11-2 0v-2a1 1 0 011-1z"/>
										</svg>
									</div>
								</div>
								
								<!-- Task preview -->
								<div class="w-full bg-black/30 backdrop-blur rounded-2xl p-4">
									<p class="text-xs text-gray-400 mb-1">Reminder:</p>
									<p class="text-sm font-medium">Team meeting in 30 minutes</p>
									{#if isDemoPlaying}
										<div class="mt-2 flex items-center gap-2">
											<div class="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
											<p class="text-xs text-green-400">Speaking...</p>
										</div>
									{/if}
								</div>
								
								<!-- Call actions -->
								<div class="flex gap-4">
									<!-- Decline button -->
									<button class="w-16 h-16 rounded-full bg-red-500 flex items-center justify-center shadow-lg">
										<svg class="w-8 h-8 text-white transform rotate-135" fill="currentColor" viewBox="0 0 24 24">
											<path d="M20.01 15.38c-1.23 0-2.42-.2-3.53-.56a.977.977 0 00-1.01.24l-1.57 1.97c-2.83-1.35-5.48-3.9-6.89-6.83l1.95-1.66c.27-.28.35-.67.24-1.02-.37-1.11-.56-2.3-.56-3.53 0-.54-.45-.99-.99-.99H4.19C3.65 3 3 3.24 3 3.99 3 13.28 10.73 21 20.01 21c.71 0 .99-.63.99-1.18v-3.45c0-.54-.45-.99-.99-.99z"/>
										</svg>
									</button>
									
									<!-- Accept button -->
									<button class="w-16 h-16 rounded-full bg-green-500 flex items-center justify-center shadow-lg {isRinging ? 'animate-pulse' : ''}">
										<svg class="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
											<path d="M20.01 15.38c-1.23 0-2.42-.2-3.53-.56a.977.977 0 00-1.01.24l-1.57 1.97c-2.83-1.35-5.48-3.9-6.89-6.83l1.95-1.66c.27-.28.35-.67.24-1.02-.37-1.11-.56-2.3-.56-3.53 0-.54-.45-.99-.99-.99H4.19C3.65 3 3 3.24 3 3.99 3 13.28 10.73 21 20.01 21c.71 0 .99-.63.99-1.18v-3.45c0-.54-.45-.99-.99-.99z"/>
										</svg>
									</button>
								</div>
							</div>
						</div>
					{/if}
				</div>
			</div>
		</div>
		
		<!-- Side buttons -->
		<div class="absolute -left-1 top-24 w-1 h-12 bg-gray-800 rounded-l"></div>
		<div class="absolute -left-1 top-40 w-1 h-20 bg-gray-800 rounded-l"></div>
		<div class="absolute -right-1 top-32 w-1 h-16 bg-gray-800 rounded-r"></div>
	</div>
	
	<!-- Play Demo Button -->
	<div class="mt-8 text-center">
		{#if isLoadingAudio}
			<button
				disabled
				class="inline-flex items-center gap-2 px-6 py-3 bg-gray-400 text-white rounded-lg font-medium shadow-lg cursor-not-allowed"
			>
				<svg class="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
					<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
					<path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
				</svg>
				Loading Audio...
			</button>
		{:else if !isDemoPlaying}
			<button
				on:click={playDemo}
				class="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-lg font-medium shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300"
			>
				<svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
					<path d="M8 5v14l11-7z"/>
				</svg>
				Play Demo Call
			</button>
		{:else}
			<button
				on:click={stopDemo}
				class="inline-flex items-center gap-2 px-6 py-3 bg-gray-600 text-white rounded-lg font-medium shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300"
			>
				<svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
					<rect x="6" y="6" width="12" height="12"/>
				</svg>
				Stop Demo
			</button>
		{/if}
		<p class="mt-2 text-sm text-gray-500">
			{#if isDemoPlaying}
				Listen to a sample reminder call
			{:else}
				Hear how your reminders will sound
			{/if}
		</p>
	</div>
</div>

<style>
	@keyframes animation-delay-200 {
		0% {
			opacity: 0;
			transform: scale(1);
		}
		50% {
			opacity: 0.2;
			transform: scale(1.5);
		}
		100% {
			opacity: 0;
			transform: scale(2);
		}
	}
	
	.animation-delay-200 {
		animation: animation-delay-200 2s cubic-bezier(0, 0, 0.2, 1) infinite;
		animation-delay: 0.2s;
	}
</style>