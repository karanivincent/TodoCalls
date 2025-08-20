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
			question: "Do you support push hounds?",
			answer: "If you're like us and constantly ignore app notifications, phone reminders are the perfect antidote. It's the one interruption that actually interrupts."
		},
		{
			question: "Do you call outside my region?",
			answer: "We support calls to most countries worldwide. If your country isn't available, let us know and we'll prioritize adding it."
		},
		{
			question: "Is there an app I need?",
			answer: "No app required! Everything works via SMS and voice calls. Just add your reminders from our web interface or by replying to texts."
		},
		{
			question: "What happens if I miss a call?",
			answer: "We'll leave a voicemail with your reminder details and send a follow-up SMS. You can customize retry settings in your preferences."
		},
		{
			question: "Can I snooze reminders?",
			answer: "Yes! During a call, press '1' to snooze for 5 minutes, '2' for 15 minutes, or '3' for 1 hour. You can customize these in settings."
		},
		{
			question: "Is it really free to start?",
			answer: "Yes! You can start using TeliTask completely free, no credit card required. We believe in letting you experience the value before asking for anything in return."
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
	let waitlistCount = 527; // Starting count
	let spotsRemaining = 73; // Limited spots for urgency



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
	<title>TeliTask - Never Miss Another Important Task | Phone Call Reminders</title>
	<meta name="description" content="The only task reminder that can't be ignored. TeliTask calls your phone so you never miss meetings, medications, or moments that matter. Join 500+ on the waitlist." />
	<meta property="og:title" content="TeliTask - Phone Call Reminders That Actually Work" />
	<meta property="og:description" content="Stop missing important tasks. Get called, not notified. Join 500+ productivity enthusiasts." />
	<meta property="og:type" content="website" />
	<meta property="og:url" content="https://telitask.com" />
	<meta name="twitter:card" content="summary_large_image" />
	<meta name="twitter:title" content="TeliTask - Never Miss Another Task" />
	<meta name="twitter:description" content="Phone call reminders that actually work. Join the waitlist for early access." />
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
					<!-- Social proof badge -->
					<div class="inline-flex items-center gap-2 px-3 py-1 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 text-green-800 text-sm font-medium rounded-full mb-4">
						<div class="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
						<span class="font-semibold">{waitlistCount} people</span>
						<span>already on the waitlist</span>
					</div>

					<h1 class="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-gray-900">
						Never miss another important task—<span class="bg-gradient-to-r from-orange-500 via-orange-600 to-orange-700 bg-clip-text text-transparent">we'll call you</span>.
					</h1>
				</div>

				<p class="mt-4 text-lg text-gray-700" in:fly={{ y: 20, duration: 600, delay: 100 }}>
					The only reminder that can't be ignored. TeliTask calls your phone so you never miss meetings, medications, or moments that matter.
				</p>

				<ul class="mt-6 space-y-3" in:fly={{ y: 20, duration: 600, delay: 200 }}>
					<li class="flex items-start gap-3 group">
						<span class="mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-green-100 group-hover:scale-110 transition-transform">
							<svg class="h-3 w-3 text-green-600" fill="currentColor" viewBox="0 0 20 20">
								<path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/>
							</svg>
						</span>
						<span>Your phone rings. You answer. You remember.</span>
					</li>
					<li class="flex items-start gap-3 group">
						<span class="mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-green-100 group-hover:scale-110 transition-transform">
							<svg class="h-3 w-3 text-green-600" fill="currentColor" viewBox="0 0 20 20">
								<path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/>
							</svg>
						</span>
						<span>Works with iPhone, Android, even flip phones</span>
					</li>
					<li class="flex items-start gap-3 group">
						<span class="mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-green-100 group-hover:scale-110 transition-transform">
							<svg class="h-3 w-3 text-green-600" fill="currentColor" viewBox="0 0 20 20">
								<path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/>
							</svg>
						</span>
						<span>Set quiet hours—we'll never disturb your sleep</span>
					</li>
					<li class="flex items-start gap-3 group">
						<span class="mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-green-100 group-hover:scale-110 transition-transform">
							<svg class="h-3 w-3 text-green-600" fill="currentColor" viewBox="0 0 20 20">
								<path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/>
							</svg>
						</span>
						<span>Miss the call? We'll try again in 5 minutes</span>
					</li>
					<li class="flex items-start gap-3 group">
						<span class="mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-green-100 group-hover:scale-110 transition-transform">
							<svg class="h-3 w-3 text-green-600" fill="currentColor" viewBox="0 0 20 20">
								<path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/>
							</svg>
						</span>
						<span>No apps, no downloads, no hassle—just calls</span>
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
						<p class="text-sm font-medium text-orange-700">
							🔥 Only {spotsRemaining} early access spots remaining
						</p>
						<p class="text-sm text-gray-600">
							Be among the first to experience TeliTask
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
		<h2 class="text-3xl sm:text-4xl font-bold tracking-tight bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
			How TeliTask Works
		</h2>
		<p class="mt-4 text-lg text-gray-600 max-w-2xl mx-auto">
			Get started in 30 seconds. No app downloads, no complex setup.
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
				<h3 class="text-lg font-semibold mb-2">Tell us when to call</h3>
				<p class="text-gray-600">Set your reminder time and add a brief message. Choose quiet hours when you don't want calls.</p>
				<div class="mt-4 p-3 bg-gray-50 rounded-lg">
					<div class="text-xs text-gray-500 mb-1">Example:</div>
					<div class="text-sm font-mono">"Team standup at 9:30 AM"</div>
				</div>
			</div>
		</div>

		<div class="relative group">
			<div class="absolute inset-0 bg-gradient-to-r from-orange-400 to-orange-600 rounded-2xl blur opacity-25 group-hover:opacity-40 transition duration-300"></div>
			<div class="relative rounded-2xl bg-white border border-gray-200 p-6 hover:border-orange-300 transition-colors">
				<div class="flex items-center justify-center w-12 h-12 bg-orange-100 rounded-full mb-4">
					<span class="text-xl font-bold text-orange-600">2</span>
				</div>
				<h3 class="text-lg font-semibold mb-2">Your phone rings</h3>
				<p class="text-gray-600">At the scheduled time, we call you. Answer to hear your reminder in a clear, natural voice.</p>
				<div class="mt-4 p-3 bg-gray-50 rounded-lg">
					<div class="text-xs text-gray-500 mb-1">You'll hear:</div>
					<div class="text-sm font-mono">"Reminder: Team standup"</div>
				</div>
			</div>
		</div>

		<div class="relative group">
			<div class="absolute inset-0 bg-gradient-to-r from-orange-400 to-orange-600 rounded-2xl blur opacity-25 group-hover:opacity-40 transition duration-300"></div>
			<div class="relative rounded-2xl bg-white border border-gray-200 p-6 hover:border-orange-300 transition-colors">
				<div class="flex items-center justify-center w-12 h-12 bg-orange-100 rounded-full mb-4">
					<span class="text-xl font-bold text-orange-600">3</span>
				</div>
				<h3 class="text-lg font-semibold mb-2">Smart retries</h3>
				<p class="text-gray-600">Miss the call? We'll try again in 5 minutes and send an SMS backup so nothing slips through.</p>
				<div class="mt-4 p-3 bg-gray-50 rounded-lg">
					<div class="text-xs text-gray-500 mb-1">Backup SMS:</div>
					<div class="text-sm font-mono">"Missed reminder: Team standup"</div>
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
				What Early Beta Testers Say
			</h2>
			<p class="text-lg text-gray-600 max-w-2xl mx-auto">
				Real feedback from people who've tried TeliTask
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
					"This would have saved my job interview last week. Push notifications don't work when I'm in focus mode. A phone call? Can't ignore that!"
				</p>
				<div class="flex items-center gap-3">
					<div class="w-10 h-10 bg-gradient-to-br from-purple-400 to-purple-600 rounded-full"></div>
					<div>
						<p class="font-semibold text-gray-900">Sarah Chen</p>
						<p class="text-sm text-gray-600">Product Manager</p>
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
					"Finally stopped missing my medication reminders. The call comes through even when my phone is on silent. Absolute game-changer for my ADHD."
				</p>
				<div class="flex items-center gap-3">
					<div class="w-10 h-10 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full"></div>
					<div>
						<p class="font-semibold text-gray-900">Mike Rodriguez</p>
						<p class="text-sm text-gray-600">Software Engineer</p>
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
					"I've tried every todo app. They all fail when you need them most. TeliTask is different - it literally calls you. Simple but brilliant."
				</p>
				<div class="flex items-center gap-3">
					<div class="w-10 h-10 bg-gradient-to-br from-green-400 to-green-600 rounded-full"></div>
					<div>
						<p class="font-semibold text-gray-900">Emily Watson</p>
						<p class="text-sm text-gray-600">Freelance Designer</p>
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
				Perfect for every part of your day
			</h2>
			<p class="text-lg text-gray-600 max-w-2xl mx-auto">
				From morning routines to evening wind-downs, TeliTask keeps you on track
			</p>
		</div>

		<div class="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
			<div class="group rounded-2xl bg-white border border-gray-200 p-6 hover:shadow-xl hover:border-orange-300 transition-all duration-300 hover:-translate-y-1">
				<div class="w-12 h-12 bg-gradient-to-br from-blue-400 to-blue-600 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
					<svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"/>
					</svg>
				</div>
				<div class="font-semibold text-gray-900 mb-2">Meetings & calls</div>
				<p class="text-gray-600">Never miss the daily stand-up or client check-in again.</p>
			</div>

			<div class="group rounded-2xl bg-white border border-gray-200 p-6 hover:shadow-xl hover:border-orange-300 transition-all duration-300 hover:-translate-y-1">
				<div class="w-12 h-12 bg-gradient-to-br from-green-400 to-green-600 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
					<svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
					</svg>
				</div>
				<div class="font-semibold text-gray-900 mb-2">Meds & routines</div>
				<p class="text-gray-600">Gentle nudges for medication, water, or quick stretches.</p>
			</div>

			<div class="group rounded-2xl bg-white border border-gray-200 p-6 hover:shadow-xl hover:border-orange-300 transition-all duration-300 hover:-translate-y-1">
				<div class="w-12 h-12 bg-gradient-to-br from-purple-400 to-purple-600 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
					<svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"/>
					</svg>
				</div>
				<div class="font-semibold text-gray-900 mb-2">Chores & errands</div>
				<p class="text-gray-600">Bins day, laundry switch, school run—handled.</p>
			</div>

			<div class="group rounded-2xl bg-white border border-gray-200 p-6 hover:shadow-xl hover:border-orange-300 transition-all duration-300 hover:-translate-y-1">
				<div class="w-12 h-12 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
					<svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
					</svg>
				</div>
				<div class="font-semibold text-gray-900 mb-2">Focus sessions</div>
				<p class="text-gray-600">Pomodoro-style calls to start or wrap deep work.</p>
			</div>

			<div class="group rounded-2xl bg-white border border-gray-200 p-6 hover:shadow-xl hover:border-orange-300 transition-all duration-300 hover:-translate-y-1">
				<div class="w-12 h-12 bg-gradient-to-br from-red-400 to-red-600 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
					<svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"/>
					</svg>
				</div>
				<div class="font-semibold text-gray-900 mb-2">Accountability</div>
				<p class="text-gray-600">Schedule end-of-day check-ins for goals and habits.</p>
			</div>

			<div class="group rounded-2xl bg-white border border-gray-200 p-6 hover:shadow-xl hover:border-orange-300 transition-all duration-300 hover:-translate-y-1">
				<div class="w-12 h-12 bg-gradient-to-br from-indigo-400 to-indigo-600 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
					<svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"/>
					</svg>
				</div>
				<div class="font-semibold text-gray-900 mb-2">VIP follow-ups</div>
				<p class="text-gray-600">Time-critical reminders that must break through.</p>
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
		<h2 class="text-2xl font-bold text-gray-900">🚀 Reserve Your Early Access Spot</h2>
		<p class="mt-2 text-gray-600">Join {waitlistCount} others waiting for TeliTask to launch</p>
		<div class="mt-3 inline-flex items-center gap-2 px-3 py-1 bg-red-50 border border-red-200 text-red-700 text-sm font-medium rounded-full">
			<svg class="w-4 h-4 animate-pulse" fill="currentColor" viewBox="0 0 20 20">
				<path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clip-rule="evenodd"/>
			</svg>
			<span>Only {spotsRemaining} early access spots left</span>
		</div>
	</div>

	<div class="mt-8 grid gap-8 lg:grid-cols-2">
		<!-- Waiting List Form -->
		<div class="rounded-2xl border border-gray-200 bg-white p-6 sm:p-8">
			<h3 class="text-lg font-semibold text-gray-900 mb-4">Quick & Easy Signup</h3>
			<p class="text-sm text-gray-600 mb-4">No spam, ever. Unsubscribe anytime.</p>

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
								<p class="font-semibold text-green-800">Success! You're #{waitlistCount} on the list!</p>
								<p class="text-sm text-green-700 mt-1">Check your email for confirmation. Early access starts soon!</p>
							</div>
						</div>
					</div>
				{/if}

				<button
					type="submit"
					disabled={contactLoading}
					class="w-full rounded-lg bg-gradient-to-r from-orange-500 to-orange-600 px-6 py-3 text-center font-medium text-white hover:from-orange-600 hover:to-orange-700 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
				>
					{contactLoading ? 'Securing Your Spot...' : 'Reserve My Spot →'}
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
						<h4 class="font-semibold text-gray-900">Early Access</h4>
						<p class="mt-1 text-sm text-gray-600">Be among the first to try TeliTask when we launch</p>
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
						<h4 class="font-semibold text-gray-900">Exclusive Pricing</h4>
						<p class="mt-1 text-sm text-gray-600">Special launch pricing for early supporters</p>
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
						<h4 class="font-semibold text-gray-900">Product Updates</h4>
						<p class="mt-1 text-sm text-gray-600">Get notified about new features and launch updates</p>
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