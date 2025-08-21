<script lang="ts">
	import { goto } from '$app/navigation'
	import NavBar from '$lib/components/NavBar.svelte'
	import PhoneMockup from '$lib/components/PhoneMockup.svelte'
	import { onMount } from 'svelte'
	import { fly, scale } from 'svelte/transition'


	// Animation states
	let mounted = false;
	let showFloatingCta = false;


	onMount(() => {
		mounted = true;

		// Check if this is an email confirmation redirect
		const urlParams = new URLSearchParams(window.location.search);
		const hashParams = new URLSearchParams(window.location.hash.substring(1));

		// Check for Supabase auth confirmation parameters
		if (hashParams.get('access_token') || hashParams.get('type') === 'signup' || hashParams.get('type') === 'recovery') {
			// This is an email confirmation, redirect to callback handler
			goto('/auth/callback' + window.location.hash);
			return;
		}


		// Show floating CTA when scrolled past hero
		const handleScroll = () => {
			const heroSection = document.querySelector('#signup');
			if (heroSection) {
				const rect = heroSection.getBoundingClientRect();
				showFloatingCta = rect.bottom < 100;
			}
		};

		window.addEventListener('scroll', handleScroll);
		handleScroll(); // Check initial position


		return () => {
			window.removeEventListener('scroll', handleScroll);
		};
	});


	// FAQ accordion state
	let openFaqIndex: number | null = null;

	const faqs = [
		{
			question: "Can I send reminders to other people?",
			answer: "Yes! You can set reminders to call anyone - yourself, family members, team members, or anyone else. Perfect for medication reminders for parents, task delegation to your team, or family check-ins. Just add their phone number and set the reminder."
		},
		{
			question: "How does it work for family medication reminders?",
			answer: "Set up daily or scheduled reminder calls for your loved ones. The AI calls them with a caring, natural voice reminder about their medications or appointments. They can confirm they've taken it or ask to be reminded later."
		},
		{
			question: "Is the AI voice really natural?",
			answer: "Yes! Powered by advanced AI voice synthesis, our calls sound like a real assistant. The AI understands context too - say 'I'm driving' and it'll offer to call back later. Perfect for elderly parents who appreciate a friendly voice."
		},
		{
			question: "Can I delegate tasks to my team?",
			answer: "Absolutely! Create task reminders that call your team members or employees. The AI delivers your task details in a professional, clear manner. Track who's been reminded and when tasks are acknowledged."
		},
		{
			question: "Will my elderly parents be comfortable with AI calls?",
			answer: "Most seniors find our AI voice warm and easy to understand. It sounds like a real person, not a robot. The AI speaks clearly, can repeat information, and even understands simple responses like 'yes' or 'I already took it'."
		},
		{
			question: "How does the AI learn calling patterns?",
			answer: "Our AI learns when each person best responds to calls. It tracks completion rates, snooze patterns, and optimal timing for each recipient. Your mom might prefer 9am calls while your assistant responds better at 2pm - the AI figures this out automatically."
		}
	];

	function toggleFaq(index: number) {
		openFaqIndex = openFaqIndex === index ? null : index;
	}

	// Waiting list form state
	let contactName = '';
	let contactEmail = '';
	let acceptTerms = true; // Pre-checked for less friction
	let acceptUpdates = true; // Pre-checked for marketing
	let contactLoading = false;
	let contactError = '';
	let contactSuccess = false;
	
	// Social proof
	let waitlistCount = 827; // Starting count (updated for AI launch)
	let spotsRemaining = 47; // Limited AI beta spots



	async function handleContactSubmit(event: Event) {
		event.preventDefault();
		contactError = '';
		contactSuccess = false;

		if (!contactName.trim()) {
			contactError = 'Please enter your name';
			return;
		}

		if (!contactEmail.trim() || !contactEmail.includes('@')) {
			contactError = 'Please enter a valid email address';
			return;
		}

		if (!acceptTerms) {
			contactError = 'Please accept the terms and privacy policy';
			return;
		}

		contactLoading = true;

		try {
			// Send to API endpoint
			const response = await fetch('/api/contact', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({
					name: contactName,
					email: contactEmail,
					message: 'Joined waiting list from landing page'
				})
			});

			const result = await response.json();

			if (response.ok && result.success) {
				contactSuccess = true;
				contactName = '';
				contactEmail = '';
				contactMessage = 'I want to join the waiting list';
				acceptTerms = true;
				acceptUpdates = true;
				
				// Increment waitlist count
				waitlistCount++;
				if (spotsRemaining > 0) spotsRemaining--;

				// Hide success message after 5 seconds
				setTimeout(() => {
					contactSuccess = false;
				}, 5000);
			} else {
				contactError = result.error || 'Failed to send message. Please try again.';
			}
		} catch (e) {
			contactError = 'Network error. Please check your connection or email us directly.';
		} finally {
			contactLoading = false;
		}
	}
</script>

<svelte:head>
	<title>TeliTask - AI-Powered Phone Reminders That Learn Your Habits</title>
	<meta name="description" content="The only AI assistant that actually calls you. Smart scheduling, natural conversations, and predictive reminders. Join 800+ using AI for 67% better task completion." />
	<meta property="og:title" content="TeliTask - Your AI Assistant That Actually Calls You" />
	<meta property="og:description" content="AI-powered task management with natural voice calls. Smart scheduling that learns your patterns. Join 800+ professionals boosting productivity with AI." />
	<meta property="og:type" content="website" />
	<meta property="og:url" content="https://telitask.com" />
	<meta name="twitter:card" content="summary_large_image" />
	<meta name="twitter:title" content="TeliTask - AI Assistant That Calls You" />
	<meta name="twitter:description" content="AI-powered phone reminders with 67% better task completion. Join the AI productivity revolution." />
</svelte:head>

<!-- Navigation -->
<NavBar />

<!-- Hero -->
<section id="signup" class="relative overflow-hidden">
	<!-- Background gradient -->
	<div class="absolute inset-0 bg-gradient-to-br from-orange-50 via-white to-orange-50 opacity-60"></div>
	<div class="absolute inset-0 opacity-5">
		<svg class="absolute inset-0 w-full h-full" preserveAspectRatio="none">
			<pattern id="hero-pattern" x="0" y="0" width="60" height="60" patternUnits="userSpaceOnUse">
				<g fill="none" fill-rule="evenodd">
					<g fill="#ea580c" fill-opacity="0.5">
						<path d="M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z"/>
					</g>
				</g>
			</pattern>
			<rect width="100%" height="100%" fill="url(#hero-pattern)"/>
		</svg>
	</div>

	<div class="relative mx-auto max-w-6xl px-4 sm:px-6 py-14 sm:py-20 grid lg:grid-cols-2 gap-10 items-center">
		<div>
			{#if mounted}
				<div in:fly={{ y: 20, duration: 600, delay: 0 }}>
					<!-- Social proof badges -->
					<div class="flex flex-wrap gap-2 mb-4">
						<div class="inline-flex items-center gap-2 px-3 py-1 bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-200 text-purple-800 text-sm font-medium rounded-full">
							<svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
								<path d="M9.653 16.915l-.005-.003-.019-.01a20.759 20.759 0 01-1.162-.682 22.045 22.045 0 01-2.582-1.9C4.045 12.733 2 10.352 2 7.5a4.5 4.5 0 018-2.828A4.5 4.5 0 0118 7.5c0 2.852-2.044 5.233-3.885 6.82a22.049 22.049 0 01-3.744 2.582l-.019.01-.005.003h-.002a.739.739 0 01-.69.001l-.002-.001z"/>
							</svg>
							<span class="font-semibold">Powered by AI</span>
						</div>
						<div class="inline-flex items-center gap-2 px-3 py-1 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 text-green-800 text-sm font-medium rounded-full">
							<div class="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
							<span class="font-semibold">{waitlistCount} professionals</span>
							<span>using AI reminders</span>
						</div>
					</div>

					<h1 class="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-gray-900">
						<span class="bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 bg-clip-text text-transparent">AI Reminders</span> That Call You - <span class="bg-gradient-to-r from-orange-500 via-orange-600 to-orange-700 bg-clip-text text-transparent">Or Anyone You Choose</span>
					</h1>
				</div>

				<p class="mt-4 text-lg text-gray-700" in:fly={{ y: 20, duration: 600, delay: 100 }}>
					Never forget a task again. Set reminders that call you, your team, or your family. Natural AI voice calls that ensure things get done - for everyone who matters.
				</p>

				<ul class="mt-6 space-y-3" in:fly={{ y: 20, duration: 600, delay: 200 }}>
					<li class="flex items-start gap-3 group">
						<span class="mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-purple-100 to-indigo-100 group-hover:scale-110 transition-transform">
							<svg class="h-3 w-3 text-purple-600" fill="currentColor" viewBox="0 0 20 20">
								<path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/>
							</svg>
						</span>
						<span><strong>Send reminders</strong> to yourself or anyone else</span>
					</li>
					<li class="flex items-start gap-3 group">
						<span class="mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-purple-100 to-indigo-100 group-hover:scale-110 transition-transform">
							<svg class="h-3 w-3 text-purple-600" fill="currentColor" viewBox="0 0 20 20">
								<path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/>
							</svg>
						</span>
						<span><strong>Perfect for family</strong> medication and care reminders</span>
					</li>
					<li class="flex items-start gap-3 group">
						<span class="mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-purple-100 to-indigo-100 group-hover:scale-110 transition-transform">
							<svg class="h-3 w-3 text-purple-600" fill="currentColor" viewBox="0 0 20 20">
								<path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/>
							</svg>
						</span>
						<span><strong>Delegate tasks</strong> with reminder calls to your team</span>
					</li>
					<li class="flex items-start gap-3 group">
						<span class="mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-purple-100 to-indigo-100 group-hover:scale-110 transition-transform">
							<svg class="h-3 w-3 text-purple-600" fill="currentColor" viewBox="0 0 20 20">
								<path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/>
							</svg>
						</span>
						<span><strong>Natural AI voice</strong> that sounds like a real assistant</span>
					</li>
					<li class="flex items-start gap-3 group">
						<span class="mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-purple-100 to-indigo-100 group-hover:scale-110 transition-transform">
							<svg class="h-3 w-3 text-purple-600" fill="currentColor" viewBox="0 0 20 20">
								<path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/>
							</svg>
						</span>
						<span><strong>AI learns</strong> the best time to call each person</span>
					</li>
				</ul>

				<!-- CTA Button -->
				<div class="mt-8 space-y-4" in:fly={{ y: 20, duration: 600, delay: 300 }}>
					<a
						href="#waitlist"
						class="inline-flex items-center justify-center rounded-lg bg-gradient-to-r from-orange-600 to-orange-700 px-8 py-4 font-semibold text-white text-lg shadow-lg hover:from-orange-700 hover:to-orange-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-300 transition-all transform hover:scale-105"
					>
						Get Early Access
						<svg class="ml-2 w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7l5 5m0 0l-5 5m5-5H6"/>
						</svg>
					</a>
					<div class="space-y-2">
						<p class="text-sm font-medium text-purple-700">
							🤖 Only {spotsRemaining} AI beta spots remaining
						</p>
						<p class="text-sm text-gray-600">
							Be first to experience AI-powered productivity
						</p>
					</div>
				</div>

			{/if}
		</div>

		<!-- Phone Mockup Section -->
		<div class="lg:justify-self-end w-full">
			{#if mounted}
				<div in:scale={{ duration: 600, delay: 500, start: 0.9 }}>
					<PhoneMockup />
				</div>
			{/if}
		</div>
	</div>
</section>


<!-- How it works -->
<section id="how" class="mx-auto max-w-6xl px-4 sm:px-6 py-16 sm:py-20">
	<div class="text-center mb-12">
		<h2 class="text-3xl sm:text-4xl font-bold tracking-tight bg-gradient-to-r from-purple-900 via-indigo-800 to-blue-700 bg-clip-text text-transparent">
			How It Works - For You and Your Loved Ones
		</h2>
		<p class="mt-4 text-lg text-gray-600 max-w-2xl mx-auto">
			Set reminders that call the right person at the right time. Perfect for personal tasks, family care, and team delegation.
		</p>
	</div>

	<div class="grid gap-8 sm:grid-cols-3 relative">
		<!-- Connection line (hidden on mobile) -->
		<div class="hidden sm:block absolute top-20 left-1/4 right-1/4 h-0.5 bg-gradient-to-r from-orange-200 via-orange-400 to-orange-200"></div>

		<div class="relative group">
			<div class="absolute inset-0 bg-gradient-to-r from-orange-400 to-orange-600 rounded-2xl blur opacity-25 group-hover:opacity-40 transition duration-300"></div>
			<div class="relative rounded-2xl bg-white border border-gray-200 p-6 hover:border-orange-300 transition-colors">
				<div class="flex items-center justify-center w-12 h-12 bg-orange-100 rounded-full mb-4">
					<span class="text-xl font-bold text-orange-600">1</span>
				</div>
				<h3 class="text-lg font-semibold mb-2">Create your reminder</h3>
				<p class="text-gray-600">Set a reminder for yourself or someone else. Choose who gets called and when - it's that simple.</p>
				<div class="mt-4 p-3 bg-gradient-to-br from-purple-50 to-indigo-50 rounded-lg">
					<div class="text-xs text-purple-600 mb-1">Examples:</div>
					<div class="text-sm font-mono">"Remind Mom about her medication at 9am"</div>
					<div class="text-xs text-purple-500 mt-1">→ AI calls Mom daily with a caring reminder</div>
				</div>
			</div>
		</div>

		<div class="relative group">
			<div class="absolute inset-0 bg-gradient-to-r from-orange-400 to-orange-600 rounded-2xl blur opacity-25 group-hover:opacity-40 transition duration-300"></div>
			<div class="relative rounded-2xl bg-white border border-gray-200 p-6 hover:border-orange-300 transition-colors">
				<div class="flex items-center justify-center w-12 h-12 bg-orange-100 rounded-full mb-4">
					<span class="text-xl font-bold text-orange-600">2</span>
				</div>
				<h3 class="text-lg font-semibold mb-2">AI makes the call</h3>
				<p class="text-gray-600">Natural voice calls that sound like a real person. Recipients can interact naturally - snooze, confirm, or reschedule.</p>
				<div class="mt-4 p-3 bg-gradient-to-br from-purple-50 to-indigo-50 rounded-lg">
					<div class="text-xs text-purple-600 mb-1">AI to Mom:</div>
					<div class="text-sm font-mono">"Good morning! This is your reminder to take your heart medication"</div>
					<div class="text-xs text-purple-500 mt-1">Mom: "Thank you, I'll take it now"</div>
				</div>
			</div>
		</div>

		<div class="relative group">
			<div class="absolute inset-0 bg-gradient-to-r from-orange-400 to-orange-600 rounded-2xl blur opacity-25 group-hover:opacity-40 transition duration-300"></div>
			<div class="relative rounded-2xl bg-white border border-gray-200 p-6 hover:border-orange-300 transition-colors">
				<div class="flex items-center justify-center w-12 h-12 bg-orange-100 rounded-full mb-4">
					<span class="text-xl font-bold text-orange-600">3</span>
				</div>
				<h3 class="text-lg font-semibold mb-2">Track & optimize</h3>
				<p class="text-gray-600">See who's completing tasks, when calls are most effective, and let AI optimize timing for each person.</p>
				<div class="mt-4 p-3 bg-gradient-to-br from-purple-50 to-indigo-50 rounded-lg">
					<div class="text-xs text-purple-600 mb-1">AI Learning:</div>
					<div class="text-sm font-mono">"Mom responds best to 9am calls"</div>
					<div class="text-xs text-purple-500 mt-1">→ AI automatically adjusts future reminders</div>
				</div>
			</div>
		</div>
	</div>
</section>

<!-- AI Features Section -->
<section id="ai-features" class="bg-gradient-to-b from-purple-50 via-indigo-50 to-white py-16 sm:py-20">
	<div class="mx-auto max-w-6xl px-4 sm:px-6">
		<div class="text-center mb-12">
			<div class="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-100 to-indigo-100 border border-purple-300 text-purple-800 text-sm font-bold rounded-full mb-4">
				<svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
					<path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z"/>
				</svg>
				<span>SMART REMINDER TECHNOLOGY</span>
			</div>
			<h2 class="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-purple-900 via-indigo-800 to-blue-700 bg-clip-text text-transparent mb-4">
				Why Our Reminders Actually Work
			</h2>
			<p class="text-lg text-gray-600 max-w-3xl mx-auto">
				Smart features that solve real problems - from forgotten medications to uncompleted tasks
			</p>
		</div>

		<div class="grid gap-6 lg:grid-cols-2">
			<!-- Intelligent Scheduling -->
			<div class="group relative rounded-2xl bg-white border border-purple-200 p-8 hover:shadow-2xl transition-all duration-300 hover:-translate-y-1">
				<div class="absolute inset-0 bg-gradient-to-br from-purple-400 to-indigo-600 rounded-2xl opacity-5 group-hover:opacity-10 transition-opacity"></div>
				<div class="relative">
					<div class="w-14 h-14 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
						<svg class="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/>
						</svg>
					</div>
					<h3 class="text-xl font-bold text-gray-900 mb-3">No More Forgotten Pills</h3>
					<p class="text-gray-600 mb-4">
						Medication reminders that actually work for your loved ones. Never worry about whether Mom took her medicine.
					</p>
					<ul class="space-y-2 text-sm">
						<li class="flex items-start gap-2">
							<svg class="w-4 h-4 text-purple-600 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
								<path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/>
							</svg>
							<span class="text-gray-700">Calls at the exact time medications are needed</span>
						</li>
						<li class="flex items-start gap-2">
							<svg class="w-4 h-4 text-purple-600 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
								<path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/>
							</svg>
							<span class="text-gray-700">Confirms medication was taken</span>
						</li>
						<li class="flex items-start gap-2">
							<svg class="w-4 h-4 text-purple-600 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
								<path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/>
							</svg>
							<span class="text-gray-700">Alerts you if parents don't respond</span>
						</li>
					</ul>
				</div>
			</div>

			<!-- Voice Intelligence -->
			<div class="group relative rounded-2xl bg-white border border-purple-200 p-8 hover:shadow-2xl transition-all duration-300 hover:-translate-y-1">
				<div class="absolute inset-0 bg-gradient-to-br from-indigo-400 to-blue-600 rounded-2xl opacity-5 group-hover:opacity-10 transition-opacity"></div>
				<div class="relative">
					<div class="w-14 h-14 bg-gradient-to-br from-indigo-500 to-blue-600 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
						<svg class="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"/>
						</svg>
					</div>
					<h3 class="text-xl font-bold text-gray-900 mb-3">Tasks That Get Done</h3>
					<p class="text-gray-600 mb-4">
						Stop chasing people for updates. Delegate tasks and let AI handle the follow-ups.
					</p>
					<ul class="space-y-2 text-sm">
						<li class="flex items-start gap-2">
							<svg class="w-4 h-4 text-indigo-600 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
								<path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/>
							</svg>
							<span class="text-gray-700">Automated task assignment calls</span>
						</li>
						<li class="flex items-start gap-2">
							<svg class="w-4 h-4 text-indigo-600 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
								<path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/>
							</svg>
							<span class="text-gray-700">Smart follow-ups until confirmed</span>
						</li>
						<li class="flex items-start gap-2">
							<svg class="w-4 h-4 text-indigo-600 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
								<path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/>
							</svg>
							<span class="text-gray-700">Real-time completion tracking</span>
						</li>
					</ul>
				</div>
			</div>

			<!-- Predictive Analytics -->
			<div class="group relative rounded-2xl bg-white border border-purple-200 p-8 hover:shadow-2xl transition-all duration-300 hover:-translate-y-1">
				<div class="absolute inset-0 bg-gradient-to-br from-blue-400 to-cyan-600 rounded-2xl opacity-5 group-hover:opacity-10 transition-opacity"></div>
				<div class="relative">
					<div class="w-14 h-14 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
						<svg class="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"/>
						</svg>
					</div>
					<h3 class="text-xl font-bold text-gray-900 mb-3">Family Connection Made Easy</h3>
					<p class="text-gray-600 mb-4">
						Stay close even when you're far. Care for your loved ones with thoughtful reminder calls.
					</p>
					<ul class="space-y-2 text-sm">
						<li class="flex items-start gap-2">
							<svg class="w-4 h-4 text-blue-600 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
								<path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/>
							</svg>
							<span class="text-gray-700">Daily check-in calls to loved ones</span>
						</li>
						<li class="flex items-start gap-2">
							<svg class="w-4 h-4 text-blue-600 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
								<path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/>
							</svg>
							<span class="text-gray-700">Appointment and event reminders</span>
						</li>
						<li class="flex items-start gap-2">
							<svg class="w-4 h-4 text-blue-600 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
								<path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/>
							</svg>
							<span class="text-gray-700">Emergency contact if no response</span>
						</li>
					</ul>
				</div>
			</div>

			<!-- Smart Learning -->
			<div class="group relative rounded-2xl bg-white border border-purple-200 p-8 hover:shadow-2xl transition-all duration-300 hover:-translate-y-1">
				<div class="absolute inset-0 bg-gradient-to-br from-purple-400 to-pink-600 rounded-2xl opacity-5 group-hover:opacity-10 transition-opacity"></div>
				<div class="relative">
					<div class="w-14 h-14 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
						<svg class="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"/>
						</svg>
					</div>
					<h3 class="text-xl font-bold text-gray-900 mb-3">Personalized for Everyone</h3>
					<p class="text-gray-600 mb-4">
						Each person gets reminders their way. AI learns what works best for each recipient.
					</p>
					<ul class="space-y-2 text-sm">
						<li class="flex items-start gap-2">
							<svg class="w-4 h-4 text-purple-600 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
								<path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/>
							</svg>
							<span class="text-gray-700">Learns each person's best response times</span>
						</li>
						<li class="flex items-start gap-2">
							<svg class="w-4 h-4 text-purple-600 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
								<path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/>
							</svg>
							<span class="text-gray-700">Adapts tone and urgency per recipient</span>
						</li>
						<li class="flex items-start gap-2">
							<svg class="w-4 h-4 text-purple-600 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
								<path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/>
							</svg>
							<span class="text-gray-700">Different strategies for different people</span>
						</li>
					</ul>
				</div>
			</div>
		</div>

		<!-- AI Stats Banner -->
		<div class="mt-12 rounded-2xl bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 p-8 text-white">
			<div class="grid gap-8 sm:grid-cols-3 text-center">
				<div>
					<div class="text-4xl font-bold mb-2">67%</div>
					<div class="text-purple-100">Higher task completion with AI</div>
				</div>
				<div>
					<div class="text-4xl font-bold mb-2">2.3x</div>
					<div class="text-purple-100">More productive mornings</div>
				</div>
				<div>
					<div class="text-4xl font-bold mb-2">94%</div>
					<div class="text-purple-100">Call prediction accuracy</div>
				</div>
			</div>
		</div>
	</div>
</section>

<!-- Testimonials Section -->
<section id="testimonials" class="bg-gradient-to-b from-gray-50 to-white py-16 sm:py-20">
	<div class="mx-auto max-w-6xl px-4 sm:px-6">
		<div class="text-center mb-12">
			<h2 class="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
				Loved by Families and Teams
			</h2>
			<p class="text-lg text-gray-600 max-w-2xl mx-auto">
				Real stories from people using AI reminders for themselves and others
			</p>
		</div>

		<div class="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
			<div class="rounded-2xl bg-white border border-gray-200 p-6 shadow-sm hover:shadow-lg transition-shadow">
				<div class="flex gap-1 mb-3">
					{#each Array(5) as _}
						<svg class="w-5 h-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
							<path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
						</svg>
					{/each}
				</div>
				<p class="text-gray-700 mb-4">
					"I set daily medication reminders for my mom. The AI calls her every morning with a friendly reminder. She loves the natural voice and hasn't missed her pills since we started!"
				</p>
				<div class="flex items-center gap-3">
					<div class="w-10 h-10 bg-gradient-to-br from-purple-400 to-purple-600 rounded-full"></div>
					<div>
						<p class="font-semibold text-gray-900">Sarah Chen</p>
						<p class="text-sm text-gray-600">Caring Daughter</p>
					</div>
				</div>
			</div>

			<div class="rounded-2xl bg-white border border-gray-200 p-6 shadow-sm hover:shadow-lg transition-shadow">
				<div class="flex gap-1 mb-3">
					{#each Array(5) as _}
						<svg class="w-5 h-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
							<path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
						</svg>
					{/each}
				</div>
				<p class="text-gray-700 mb-4">
					"I delegate task reminders to my team through TeliTask. The AI calls each person with their assignments. It's like having an assistant who never forgets to follow up."
				</p>
				<div class="flex items-center gap-3">
					<div class="w-10 h-10 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full"></div>
					<div>
						<p class="font-semibold text-gray-900">Mike Rodriguez</p>
						<p class="text-sm text-gray-600">Startup Founder</p>
					</div>
				</div>
			</div>

			<div class="rounded-2xl bg-white border border-gray-200 p-6 shadow-sm hover:shadow-lg transition-shadow">
				<div class="flex gap-1 mb-3">
					{#each Array(5) as _}
						<svg class="w-5 h-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
							<path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
						</svg>
					{/each}
				</div>
				<p class="text-gray-700 mb-4">
					"Perfect for our family! I get work reminders, my dad gets his medication calls, and I can send task reminders to my assistant. One app handles it all beautifully."
				</p>
				<div class="flex items-center gap-3">
					<div class="w-10 h-10 bg-gradient-to-br from-green-400 to-green-600 rounded-full"></div>
					<div>
						<p class="font-semibold text-gray-900">Emily Watson</p>
						<p class="text-sm text-gray-600">Marketing Director</p>
					</div>
				</div>
			</div>
		</div>

		<!-- Trust badges -->
		<div class="mt-12 pt-12 border-t border-gray-200">
			<div class="flex flex-wrap items-center justify-center gap-8">
				<div class="flex items-center gap-2 text-gray-600">
					<svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
						<path fill-rule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/>
					</svg>
					<span class="text-sm font-medium">SSL Encrypted</span>
				</div>
				<div class="flex items-center gap-2 text-gray-600">
					<svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
						<path fill-rule="evenodd" d="M10 2a1 1 0 00-1 1v1a1 1 0 002 0V3a1 1 0 00-1-1zM4 4h3a3 3 0 006 0h3a2 2 0 012 2v9a2 2 0 01-2 2H4a2 2 0 01-2-2V6a2 2 0 012-2zm2.5 7a1.5 1.5 0 100-3 1.5 1.5 0 000 3zm0 1a2.5 2.5 0 100-5 2.5 2.5 0 000 5zm7.5-1.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM13.5 12a2.5 2.5 0 100-5 2.5 2.5 0 000 5z" clip-rule="evenodd"/>
					</svg>
					<span class="text-sm font-medium">GDPR Compliant</span>
				</div>
				<div class="flex items-center gap-2 text-gray-600">
					<svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
						<path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z"/>
					</svg>
					<span class="text-sm font-medium">US-Based Support</span>
				</div>
				<div class="flex items-center gap-2 text-gray-600">
					<svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
						<path fill-rule="evenodd" d="M4 4a2 2 0 00-2 2v4a2 2 0 002 2V6h10a2 2 0 00-2-2H4zm2 6a2 2 0 012-2h8a2 2 0 012 2v4a2 2 0 01-2 2H8a2 2 0 01-2-2v-4zm6 4a2 2 0 100-4 2 2 0 000 4z" clip-rule="evenodd"/>
					</svg>
					<span class="text-sm font-medium">No Hidden Fees</span>
				</div>
			</div>
		</div>
	</div>
</section>

<!-- Use cases -->
<section id="use-cases" class="bg-gradient-to-b from-white to-gray-50 py-16 sm:py-20">
	<div class="mx-auto max-w-6xl px-4 sm:px-6">
		<div class="text-center mb-12">
			<h2 class="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
				AI Optimizes Every Part of Your Day
			</h2>
			<p class="text-lg text-gray-600 max-w-2xl mx-auto">
				Our AI learns your patterns and schedules tasks when you're most likely to complete them
			</p>
		</div>

		<div class="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
			<div class="group rounded-2xl bg-white border border-gray-200 p-6 hover:shadow-xl hover:border-orange-300 transition-all duration-300 hover:-translate-y-1">
				<div class="w-12 h-12 bg-gradient-to-br from-blue-400 to-blue-600 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
					<svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"/>
					</svg>
				</div>
				<div class="font-semibold text-gray-900 mb-2">Personal Task Reminders</div>
				<p class="text-gray-600">Get AI calls about your own tasks at the perfect time.</p>
			</div>

			<div class="group rounded-2xl bg-white border border-gray-200 p-6 hover:shadow-xl hover:border-orange-300 transition-all duration-300 hover:-translate-y-1">
				<div class="w-12 h-12 bg-gradient-to-br from-green-400 to-green-600 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
					<svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
					</svg>
				</div>
				<div class="font-semibold text-gray-900 mb-2">Family Medication Reminders</div>
				<p class="text-gray-600">Send caring reminder calls to parents about their medications.</p>
			</div>

			<div class="group rounded-2xl bg-white border border-gray-200 p-6 hover:shadow-xl hover:border-orange-300 transition-all duration-300 hover:-translate-y-1">
				<div class="w-12 h-12 bg-gradient-to-br from-purple-400 to-purple-600 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
					<svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"/>
					</svg>
				</div>
				<div class="font-semibold text-gray-900 mb-2">Team Task Delegation</div>
				<p class="text-gray-600">Send task reminders to team members or employees.</p>
			</div>

			<div class="group rounded-2xl bg-white border border-gray-200 p-6 hover:shadow-xl hover:border-orange-300 transition-all duration-300 hover:-translate-y-1">
				<div class="w-12 h-12 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
					<svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
					</svg>
				</div>
				<div class="font-semibold text-gray-900 mb-2">Doctor Appointments</div>
				<p class="text-gray-600">Remind family members about upcoming appointments.</p>
			</div>

			<div class="group rounded-2xl bg-white border border-gray-200 p-6 hover:shadow-xl hover:border-orange-300 transition-all duration-300 hover:-translate-y-1">
				<div class="w-12 h-12 bg-gradient-to-br from-red-400 to-red-600 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
					<svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"/>
					</svg>
				</div>
				<div class="font-semibold text-gray-900 mb-2">Daily Check-ins</div>
				<p class="text-gray-600">Regular reminder calls to loved ones who need extra care.</p>
			</div>

			<div class="group rounded-2xl bg-white border border-gray-200 p-6 hover:shadow-xl hover:border-orange-300 transition-all duration-300 hover:-translate-y-1">
				<div class="w-12 h-12 bg-gradient-to-br from-indigo-400 to-indigo-600 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
					<svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"/>
					</svg>
				</div>
				<div class="font-semibold text-gray-900 mb-2">Project Reminders</div>
				<p class="text-gray-600">Delegate project tasks with smart reminder calls to your team.</p>
			</div>
		</div>
	</div>
</section>


<!-- FAQ -->
<section id="faq" class="py-16 sm:py-20">
	<div class="mx-auto max-w-4xl px-4 sm:px-6">
		<div class="text-center mb-12">
			<h2 class="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
				Frequently Asked Questions
			</h2>
			<p class="text-lg text-gray-600">
				Everything you need to know about TeliTask
			</p>
		</div>

		<div class="space-y-4">
			{#each faqs as faq, i}
				<div class="rounded-2xl border border-gray-200 bg-white overflow-hidden transition-all duration-300 hover:shadow-lg">
					<button
						onclick={() => toggleFaq(i)}
						class="w-full px-6 py-4 text-left flex items-center justify-between hover:bg-gray-50 transition-colors"
					>
						<span class="font-semibold text-gray-900">{faq.question}</span>
						<svg
							class="w-5 h-5 text-gray-500 transition-transform duration-300 {openFaqIndex === i ? 'rotate-180' : ''}"
							fill="none"
							stroke="currentColor"
							viewBox="0 0 24 24"
						>
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/>
						</svg>
					</button>

					{#if openFaqIndex === i}
						<div
							in:fly={{ y: -10, duration: 200 }}
							out:fly={{ y: -10, duration: 150 }}
							class="px-6 pb-4"
						>
							<p class="text-gray-600">{faq.answer}</p>
						</div>
					{/if}
				</div>
			{/each}
		</div>
	</div>
</section>

<!-- Waiting List Section -->
<section id="waitlist" class="mx-auto max-w-6xl px-4 sm:px-6 py-12 sm:py-16 border-t border-gray-100">
	<div class="text-center">
		<h2 class="text-2xl font-bold bg-gradient-to-r from-purple-900 via-indigo-800 to-blue-700 bg-clip-text text-transparent">🤖 Be First to Send Reminders to Anyone</h2>
		<p class="mt-2 text-gray-600">Join {waitlistCount} people using AI reminders for themselves and their loved ones</p>
		<div class="mt-3 inline-flex items-center gap-2 px-3 py-1 bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-200 text-purple-700 text-sm font-medium rounded-full">
			<svg class="w-4 h-4 animate-pulse" fill="currentColor" viewBox="0 0 20 20">
				<path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clip-rule="evenodd"/>
			</svg>
			<span>Only {spotsRemaining} AI beta spots remaining</span>
		</div>
	</div>

	<div class="mt-8 grid gap-8 lg:grid-cols-2">
		<!-- Waiting List Form -->
		<div class="rounded-2xl border border-gray-200 bg-white p-6 sm:p-8">
			<h3 class="text-lg font-semibold text-gray-900 mb-4">Reserve Your Early Access</h3>
			<p class="text-sm text-gray-600 mb-4">Be among the first to send AI reminder calls to family, team members, and yourself.</p>

			<form onsubmit={handleContactSubmit} class="space-y-4">
				<div>
					<label for="contact-name" class="block text-sm font-medium text-gray-700 mb-1">
						Your Name
					</label>
					<input
						id="contact-name"
						type="text"
						bind:value={contactName}
						disabled={contactLoading}
						class="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500/20 disabled:opacity-50"
						placeholder="John Doe"
					/>
				</div>

				<div>
					<label for="contact-email" class="block text-sm font-medium text-gray-700 mb-1">
						Email Address
					</label>
					<input
						id="contact-email"
						type="email"
						bind:value={contactEmail}
						disabled={contactLoading}
						class="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500/20 disabled:opacity-50"
						placeholder="john@example.com"
					/>
				</div>

				<!-- Removed message field for better conversion -->

				<!-- Checkboxes -->
				<div class="space-y-3">
					<label class="flex items-start gap-3 cursor-pointer">
						<input
							type="checkbox"
							bind:checked={acceptTerms}
							disabled={contactLoading}
							class="mt-1 h-4 w-4 rounded border-gray-300 text-orange-600 focus:ring-orange-500"
						/>
						<span class="text-sm text-gray-700">
							I agree to the <a href="/terms" target="_blank" class="text-orange-600 hover:text-orange-700 underline">Terms</a> and <a href="/privacy" target="_blank" class="text-orange-600 hover:text-orange-700 underline">Privacy</a>
						</span>
					</label>

					<label class="flex items-start gap-3 cursor-pointer">
						<input
							type="checkbox"
							bind:checked={acceptUpdates}
							disabled={contactLoading}
							class="mt-1 h-4 w-4 rounded border-gray-300 text-orange-600 focus:ring-orange-500"
						/>
						<span class="text-sm text-gray-700">
							Email me when TeliTask launches (you can unsubscribe anytime)
						</span>
					</label>
				</div>

				{#if contactError}
					<div class="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">
						{contactError}
					</div>
				{/if}

				{#if contactSuccess}
					<div class="rounded-lg border border-green-200 bg-green-50 p-4">
						<div class="flex items-start gap-3">
							<svg class="w-5 h-5 text-green-600 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
								<path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/>
							</svg>
							<div>
								<p class="font-semibold text-green-800">Success! You're #{waitlistCount} for AI beta access!</p>
								<p class="text-sm text-green-700 mt-1">Check your email for confirmation. AI features launching soon!</p>
							</div>
						</div>
					</div>
				{/if}

				<button
					type="submit"
					disabled={contactLoading}
					class="w-full rounded-lg bg-gradient-to-r from-orange-500 to-orange-600 px-6 py-3 text-center font-medium text-white hover:from-orange-600 hover:to-orange-700 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
				>
					{contactLoading ? 'Securing AI Access...' : 'Get AI Beta Access →'}
				</button>
			</form>
		</div>

		<!-- Waiting List Benefits -->
		<div class="space-y-6">
			<!-- Early Access Card -->
			<div class="rounded-2xl border border-gray-200 bg-gradient-to-br from-orange-50 to-orange-100/50 p-6">
				<div class="flex items-start gap-4">
					<div class="rounded-lg bg-orange-500 p-2">
						<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="h-6 w-6 text-white">
							<path fill-rule="evenodd" d="M9 4.5a.75.75 0 01.721.544l.813 2.846a3.75 3.75 0 002.576 2.576l2.846.813a.75.75 0 010 1.442l-2.846.813a3.75 3.75 0 00-2.576 2.576l-.813 2.846a.75.75 0 01-1.442 0l-.813-2.846a3.75 3.75 0 00-2.576-2.576l-2.846-.813a.75.75 0 010-1.442l2.846-.813A3.75 3.75 0 007.466 7.89l.813-2.846A.75.75 0 019 4.5zM18 1.5a.75.75 0 01.728.568l.258 1.036c.236.94.97 1.674 1.91 1.91l1.036.258a.75.75 0 010 1.456l-1.036.258c-.94.236-1.674.97-1.91 1.91l-.258 1.036a.75.75 0 01-1.456 0l-.258-1.036a2.625 2.625 0 00-1.91-1.91l-1.036-.258a.75.75 0 010-1.456l1.036-.258a2.625 2.625 0 001.91-1.91l.258-1.036A.75.75 0 0118 1.5zM16.5 15a.75.75 0 01.712.513l.394 1.183c.15.447.5.799.948.948l1.183.395a.75.75 0 010 1.422l-1.183.395c-.447.15-.799.5-.948.948l-.395 1.183a.75.75 0 01-1.422 0l-.395-1.183a1.5 1.5 0 00-.948-.948l-1.183-.395a.75.75 0 010-1.422l1.183-.395c.447-.15.799-.5.948-.948l.395-1.183A.75.75 0 0116.5 15z" clip-rule="evenodd" />
						</svg>
					</div>
					<div>
						<h4 class="font-semibold text-gray-900">Delegation Features</h4>
						<p class="mt-1 text-sm text-gray-600">Send reminder calls to anyone - family, team, or yourself</p>
					</div>
				</div>
			</div>

			<!-- Exclusive Pricing Card -->
			<div class="rounded-2xl border border-gray-200 bg-white p-6">
				<div class="flex items-start gap-4">
					<div class="rounded-lg bg-gray-100 p-2">
						<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="h-6 w-6 text-gray-700">
							<path d="M10.464 8.746c.227-.18.497-.311.786-.394v2.795a2.252 2.252 0 01-.786-.393c-.394-.313-.546-.681-.546-1.004 0-.323.152-.691.546-1.004zM12.75 15.662v-2.824c.347.085.664.228.921.421.427.32.579.686.579.991 0 .305-.152.671-.579.991a2.534 2.534 0 01-.921.42z" />
							<path fill-rule="evenodd" d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25zM12.75 6a.75.75 0 00-1.5 0v.816a3.836 3.836 0 00-1.72.756c-.712.566-1.03 1.35-1.03 2.178 0 .829.318 1.612 1.03 2.178.712.566 1.643.823 2.22.823v2.874c-.662-.021-1.38-.222-2.103-.583a.75.75 0 10-.641 1.353c.877.45 1.773.712 2.744.737V18a.75.75 0 001.5 0v-.868c.855-.065 1.631-.361 2.191-.844.712-.566 1.059-1.35 1.059-2.178 0-.829-.347-1.612-1.059-2.178-.56-.483-1.336-.779-2.191-.843V8.354c.414.039.854.142 1.29.332a.75.75 0 10.556-1.393c-.616-.247-1.218-.396-1.846-.433V6z" clip-rule="evenodd" />
						</svg>
					</div>
					<div>
						<h4 class="font-semibold text-gray-900">Perfect for Families</h4>
						<p class="mt-1 text-sm text-gray-600">Medication reminders, appointment calls, and daily check-ins</p>
					</div>
				</div>
			</div>

			<!-- Product Updates Card -->
			<div class="rounded-2xl border border-gray-200 bg-white p-6">
				<div class="flex items-start gap-4">
					<div class="rounded-lg bg-gray-100 p-2">
						<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="h-6 w-6 text-gray-700">
							<path fill-rule="evenodd" d="M5.25 9a6.75 6.75 0 0113.5 0v.75c0 2.123.8 4.057 2.118 5.52a.75.75 0 01-.297 1.206c-1.544.57-3.16.99-4.831 1.243a3.75 3.75 0 11-7.48 0 24.585 24.585 0 01-4.831-1.244.75.75 0 01-.298-1.205A8.217 8.217 0 005.25 9.75V9zm4.502 8.9a2.25 2.25 0 104.496 0 25.057 25.057 0 01-4.496 0z" clip-rule="evenodd" />
						</svg>
					</div>
					<div>
						<h4 class="font-semibold text-gray-900">Team Management</h4>
						<p class="mt-1 text-sm text-gray-600">Delegate tasks with automatic reminder calls to your team</p>
					</div>
				</div>
			</div>
		</div>
	</div>
</section>

<!-- Footer -->
<footer class="border-t border-gray-100">
	<div class="mx-auto max-w-6xl px-4 sm:px-6 py-8 text-sm text-gray-600 flex flex-col sm:flex-row gap-4 sm:items-center sm:justify-between">
		<div class="flex items-center gap-3">
			<img src="/telitask-logo-alt-2.png" alt="TeliTask" class="h-6" />
			<span>© {new Date().getFullYear()}</span>
		</div>
		<div class="flex flex-wrap gap-x-6 gap-y-2 items-center">
			<a href="/privacy" class="hover:text-orange-700">Privacy</a>
			<a href="/terms" class="hover:text-orange-700">Terms</a>
		</div>
	</div>
</footer>

<!-- Floating CTA Button -->
{#if showFloatingCta}
	<div
		in:scale={{ duration: 300, start: 0.5 }}
		out:scale={{ duration: 200, start: 0.5 }}
		class="fixed bottom-6 right-6 z-50"
	>
		<a
			href="#waitlist"
			class="group flex items-center gap-2 bg-gradient-to-r from-orange-500 to-orange-600 text-white px-6 py-3 rounded-full shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300"
		>
			<span class="font-semibold">Join Waitlist</span>
			<svg
				class="w-5 h-5 group-hover:translate-x-1 transition-transform"
				fill="none"
				stroke="currentColor"
				viewBox="0 0 24 24"
			>
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7l5 5m0 0l-5 5m5-5H6"/>
			</svg>
		</a>

		<!-- Pulse animation -->
		<div class="absolute inset-0 rounded-full bg-orange-500 animate-ping opacity-20 pointer-events-none"></div>
	</div>
{/if}