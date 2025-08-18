<script lang="ts">
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';
	import { fade, fly, scale } from 'svelte/transition';
	import { quintOut } from 'svelte/easing';
	import NavBar from '$lib/components/NavBar.svelte';
	
	
	// Animation states
	let mounted = false;
	let currentTestimonial = 0;
	let statsVisible = false;
	let showFloatingCta = false;
	
	// Stats counters
	let callsMade = 0;
	let usersActive = 0;
	let satisfaction = 0;
	
	onMount(() => {
		mounted = true;
		
		// Animate stats when visible
		const observer = new IntersectionObserver(
			(entries) => {
				if (entries[0].isIntersecting && !statsVisible) {
					statsVisible = true;
					animateStats();
				}
			},
			{ threshold: 0.5 }
		);
		
		const statsSection = document.querySelector('#stats');
		if (statsSection) observer.observe(statsSection);
		
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
		
		// Rotate testimonials
		const interval = setInterval(() => {
			currentTestimonial = (currentTestimonial + 1) % testimonials.length;
		}, 4000);
		
		return () => {
			clearInterval(interval);
			if (statsSection) observer.unobserve(statsSection);
			window.removeEventListener('scroll', handleScroll);
		};
	});
	
	function animateStats() {
		const duration = 2000;
		const steps = 60;
		const interval = duration / steps;
		
		for (let i = 0; i <= steps; i++) {
			setTimeout(() => {
				callsMade = Math.floor((15234 / steps) * i);
				usersActive = Math.floor((1847 / steps) * i);
				satisfaction = Math.floor((98 / steps) * i);
			}, interval * i);
		}
	}
	
	const testimonials = [
		{
			quote: "I haven't missed a medication dose in 3 months. The phone calls work where notifications failed.",
			name: "Sarah Chen",
			role: "Chronic illness patient",
			rating: 5
		},
		{
			quote: "My ADHD brain ignores every app notification. But a ringing phone? That gets my attention every time.",
			name: "Marcus Johnson",
			role: "Software Developer",
			rating: 5
		},
		{
			quote: "Perfect for my elderly parents. No apps to learn, just answer the phone for their reminders.",
			name: "Emily Rodriguez",
			role: "Caregiver",
			rating: 5
		}
	];
	
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
			question: "Is it really free?",
			answer: "Yes! Start with 5 free calls per month, no credit card required. Need more? Our Essential plan starts at just $7/month for 50 calls. See our pricing page for all options."
		}
	];
	
	function toggleFaq(index: number) {
		openFaqIndex = openFaqIndex === index ? null : index;
	}
	
	// Contact form state
	let contactName = '';
	let contactEmail = '';
	let contactMessage = '';
	let contactLoading = false;
	let contactError = '';
	let contactSuccess = false;
	
	
	
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
		
		if (!contactMessage.trim()) {
			contactError = 'Please enter a message';
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
					message: contactMessage
				})
			});
			
			const result = await response.json();
			
			if (response.ok && result.success) {
				contactSuccess = true;
				contactName = '';
				contactEmail = '';
				contactMessage = '';
				
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
	<title>TeliTask — Task reminders that actually reach you</title>
	<meta name="description" content="TeliTask calls your phone to remind you about tasks. Stop missing notifications. Try the free tier in minutes." />
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
					<!-- Trust badge -->
					<div class="inline-flex items-center gap-2 px-3 py-1 bg-orange-100 text-orange-800 text-sm font-medium rounded-full mb-4">
						<svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
							<path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
						</svg>
						<span>Trusted by 1,847+ users</span>
					</div>
					
					<h1 class="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-gray-900">
						Task reminders that <span class="bg-gradient-to-r from-orange-500 via-orange-600 to-orange-700 bg-clip-text text-transparent animate-pulse">call your phone</span>.
					</h1>
				</div>
				
				<p class="mt-4 text-lg text-gray-700" in:fly={{ y: 20, duration: 600, delay: 100 }}>
					Skip the ignored push alerts. TeliTask rings you at the time you choose—so important tasks never slip.
				</p>
				
				<ul class="mt-6 space-y-3" in:fly={{ y: 20, duration: 600, delay: 200 }}>
					<li class="flex items-start gap-3 group">
						<span class="mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-green-100 group-hover:scale-110 transition-transform">
							<svg class="h-3 w-3 text-green-600" fill="currentColor" viewBox="0 0 20 20">
								<path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/>
							</svg>
						</span>
						<span>Works on any phone—no app install required</span>
					</li>
					<li class="flex items-start gap-3 group">
						<span class="mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-green-100 group-hover:scale-110 transition-transform">
							<svg class="h-3 w-3 text-green-600" fill="currentColor" viewBox="0 0 20 20">
								<path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/>
							</svg>
						</span>
						<span>Free forever with no credit card required</span>
					</li>
					<li class="flex items-start gap-3 group">
						<span class="mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-green-100 group-hover:scale-110 transition-transform">
							<svg class="h-3 w-3 text-green-600" fill="currentColor" viewBox="0 0 20 20">
								<path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/>
							</svg>
						</span>
						<span>Respectful quiet hours & reliable retries</span>
					</li>
				</ul>
				
				<!-- Social proof -->
				<div class="mt-8 flex items-center gap-4" in:fly={{ y: 20, duration: 600, delay: 300 }}>
					<div class="flex -space-x-2">
						{#each [1, 2, 3, 4, 5] as i}
							<img 
								class="h-8 w-8 rounded-full border-2 border-white" 
								src="https://api.dicebear.com/7.x/avataaars/svg?seed=user{i}" 
								alt="User {i}"
							/>
						{/each}
					</div>
					<div class="text-sm">
						<div class="flex items-center gap-1">
							{#each [1, 2, 3, 4, 5] as star}
								<svg class="h-4 w-4 text-yellow-400 fill-current" viewBox="0 0 20 20">
									<path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
								</svg>
							{/each}
						</div>
						<p class="text-gray-600">4.9/5 from 200+ reviews</p>
					</div>
				</div>
			{/if}
		</div>

		<!-- CTA Section -->
		<div class="lg:justify-self-end w-full max-w-md">
			{#if mounted}
				<div in:scale={{ duration: 500, delay: 400, start: 0.95 }} class="text-center">
					<div class="space-y-4">
						<a
							href="/auth"
							class="inline-flex items-center justify-center w-full rounded-lg bg-orange-600 px-8 py-4 font-semibold text-white text-lg shadow-lg hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-300 transition-all transform hover:scale-105"
						>
							Get Started Free
							<svg class="ml-2 w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7l5 5m0 0l-5 5m5-5H6"/>
							</svg>
						</a>
						<p class="text-sm text-gray-600">
							No credit card required • 5 free calls/month
						</p>
					</div>
				</div>
			{/if}
		</div>
	</div>
</section>

<!-- Stats Section -->
<section id="stats" class="bg-gradient-to-r from-orange-500 to-orange-600 py-12">
	<div class="mx-auto max-w-6xl px-4 sm:px-6">
		<div class="grid grid-cols-1 sm:grid-cols-3 gap-8 text-center">
			<div class="space-y-2">
				<div class="text-4xl font-bold text-white">
					{callsMade.toLocaleString()}+
				</div>
				<div class="text-orange-100">Reminder calls made</div>
			</div>
			<div class="space-y-2">
				<div class="text-4xl font-bold text-white">
					{usersActive.toLocaleString()}+
				</div>
				<div class="text-orange-100">Active users</div>
			</div>
			<div class="space-y-2">
				<div class="text-4xl font-bold text-white">
					{satisfaction}%
				</div>
				<div class="text-orange-100">User satisfaction</div>
			</div>
		</div>
	</div>
</section>

<!-- Testimonials Section -->
<section id="testimonials" class="bg-gray-50 py-16 sm:py-20">
	<div class="mx-auto max-w-6xl px-4 sm:px-6">
		<div class="text-center mb-12">
			<h2 class="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
				Loved by thousands who never miss what matters
			</h2>
			<p class="text-lg text-gray-600 max-w-2xl mx-auto">
				From busy professionals to caregivers, TeliTask helps people stay on track
			</p>
		</div>
		
		<div class="relative max-w-4xl mx-auto h-64">
			{#each testimonials as testimonial, i}
				<div
					class="bg-white rounded-2xl shadow-lg p-8 transition-all duration-500 {currentTestimonial === i ? 'opacity-100 scale-100' : 'opacity-0 scale-95 absolute inset-0'}"
				>
					<div class="flex mb-4">
						{#each Array(testimonial.rating) as _}
							<svg class="w-5 h-5 text-yellow-400 fill-current" viewBox="0 0 20 20">
								<path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z"/>
							</svg>
						{/each}
					</div>
					
					<blockquote class="text-lg sm:text-xl text-gray-700 mb-6 italic">
						"{testimonial.quote}"
					</blockquote>
					
					<div class="flex items-center">
						<div class="w-12 h-12 bg-gradient-to-br from-orange-400 to-orange-600 rounded-full flex items-center justify-center text-white font-semibold">
							{testimonial.name.split(' ').map(n => n[0]).join('')}
						</div>
						<div class="ml-4">
							<div class="font-semibold text-gray-900">{testimonial.name}</div>
							<div class="text-gray-600 text-sm">{testimonial.role}</div>
						</div>
					</div>
				</div>
			{/each}
		</div>
		
		<!-- Navigation dots -->
		<div class="flex justify-center mt-8 space-x-2">
			{#each testimonials as _, i}
				<button
					on:click={() => currentTestimonial = i}
					class="w-2 h-2 rounded-full transition-all duration-300 {currentTestimonial === i ? 'w-8 bg-orange-500' : 'bg-gray-300 hover:bg-gray-400'}"
					aria-label="Go to testimonial {i + 1}"
				/>
			{/each}
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
						on:click={() => toggleFaq(i)}
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

<!-- Contact Section -->
<section id="contact" class="mx-auto max-w-6xl px-4 sm:px-6 py-12 sm:py-16 border-t border-gray-100">
	<h2 class="text-2xl font-bold text-gray-900 text-center">Get in Touch</h2>
	<p class="mt-2 text-center text-gray-600">Have questions? We'd love to hear from you.</p>
	
	<div class="mt-8 grid gap-8 lg:grid-cols-2">
		<!-- Contact Form -->
		<div class="rounded-2xl border border-gray-200 bg-white p-6 sm:p-8">
			<h3 class="text-lg font-semibold text-gray-900 mb-4">Send us a message</h3>
			
			<form on:submit={handleContactSubmit} class="space-y-4">
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
				
				<div>
					<label for="contact-message" class="block text-sm font-medium text-gray-700 mb-1">
						Message
					</label>
					<textarea
						id="contact-message"
						bind:value={contactMessage}
						disabled={contactLoading}
						rows="4"
						class="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500/20 disabled:opacity-50 resize-none"
						placeholder="Tell us how we can help you..."
					></textarea>
				</div>
				
				{#if contactError}
					<div class="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">
						{contactError}
					</div>
				{/if}
				
				{#if contactSuccess}
					<div class="rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-800">
						✓ Thank you for your message! We'll get back to you within 24 hours.
					</div>
				{/if}
				
				<button
					type="submit"
					disabled={contactLoading}
					class="w-full rounded-lg bg-gradient-to-r from-orange-500 to-orange-600 px-6 py-3 text-center font-medium text-white hover:from-orange-600 hover:to-orange-700 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
				>
					{contactLoading ? 'Sending...' : 'Send Message'}
				</button>
			</form>
		</div>
		
		<!-- Contact Info Cards -->
		<div class="space-y-6">
			<!-- Email Card -->
			<div class="rounded-2xl border border-gray-200 bg-gradient-to-br from-orange-50 to-orange-100/50 p-6">
				<div class="flex items-start gap-4">
					<div class="rounded-lg bg-orange-500 p-2">
						<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="h-6 w-6 text-white">
							<path d="M1.5 8.67v8.58a3 3 0 003 3h15a3 3 0 003-3V8.67l-8.928 5.493a3 3 0 01-3.144 0L1.5 8.67z" />
							<path d="M22.5 6.908V6.75a3 3 0 00-3-3h-15a3 3 0 00-3 3v.158l9.714 5.978a1.5 1.5 0 001.572 0L22.5 6.908z" />
						</svg>
					</div>
					<div>
						<h4 class="font-semibold text-gray-900">Email Support</h4>
						<p class="mt-1 text-sm text-gray-600">Get help with your account or tasks</p>
						<a href="mailto:support@telitask.com" class="mt-2 inline-flex items-center text-sm font-medium text-orange-600 hover:text-orange-700">
							support@telitask.com
							<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="ml-1 h-4 w-4">
								<path fill-rule="evenodd" d="M5 10a.75.75 0 01.75-.75h6.638L10.23 7.29a.75.75 0 111.04-1.08l3.5 3.25a.75.75 0 010 1.08l-3.5 3.25a.75.75 0 11-1.04-1.08l2.158-1.96H5.75A.75.75 0 015 10z" clip-rule="evenodd" />
							</svg>
						</a>
					</div>
				</div>
			</div>
			
			<!-- Response Time Card -->
			<div class="rounded-2xl border border-gray-200 bg-white p-6">
				<div class="flex items-start gap-4">
					<div class="rounded-lg bg-gray-100 p-2">
						<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="h-6 w-6 text-gray-700">
							<path fill-rule="evenodd" d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25zM12.75 6a.75.75 0 00-1.5 0v6c0 .414.336.75.75.75h4.5a.75.75 0 000-1.5h-3.75V6z" clip-rule="evenodd" />
						</svg>
					</div>
					<div>
						<h4 class="font-semibold text-gray-900">Quick Response</h4>
						<p class="mt-1 text-sm text-gray-600">We typically respond within 24 hours</p>
					</div>
				</div>
			</div>
			
			<!-- Business Inquiries Card -->
			<div class="rounded-2xl border border-gray-200 bg-white p-6">
				<div class="flex items-start gap-4">
					<div class="rounded-lg bg-gray-100 p-2">
						<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="h-6 w-6 text-gray-700">
							<path fill-rule="evenodd" d="M4.5 2.25a.75.75 0 000 1.5v16.5h-.75a.75.75 0 000 1.5h16.5a.75.75 0 000-1.5h-.75V3.75a.75.75 0 000-1.5h-15zM9 6a.75.75 0 000 1.5h1.5a.75.75 0 000-1.5H9zm-.75 3.75A.75.75 0 019 9h1.5a.75.75 0 010 1.5H9a.75.75 0 01-.75-.75zM9 12a.75.75 0 000 1.5h1.5a.75.75 0 000-1.5H9zm3.75-5.25A.75.75 0 0113.5 6H15a.75.75 0 010 1.5h-1.5a.75.75 0 01-.75-.75zM13.5 9a.75.75 0 000 1.5H15A.75.75 0 0015 9h-1.5zm-.75 3.75a.75.75 0 01.75-.75H15a.75.75 0 010 1.5h-1.5a.75.75 0 01-.75-.75zM9 19.5v-2.25a.75.75 0 01.75-.75h4.5a.75.75 0 01.75.75v2.25a.75.75 0 01-.75.75h-4.5A.75.75 0 019 19.5z" clip-rule="evenodd" />
						</svg>
					</div>
					<div>
						<h4 class="font-semibold text-gray-900">Business Inquiries</h4>
						<p class="mt-1 text-sm text-gray-600">For partnerships and enterprise solutions</p>
						<a href="mailto:hello@telitask.com" class="mt-2 inline-flex items-center text-sm font-medium text-orange-600 hover:text-orange-700">
							hello@telitask.com
							<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="ml-1 h-4 w-4">
								<path fill-rule="evenodd" d="M5 10a.75.75 0 01.75-.75h6.638L10.23 7.29a.75.75 0 111.04-1.08l3.5 3.25a.75.75 0 010 1.08l-3.5 3.25a.75.75 0 11-1.04-1.08l2.158-1.96H5.75A.75.75 0 015 10z" clip-rule="evenodd" />
							</svg>
						</a>
					</div>
				</div>
			</div>
		</div>
	</div>
</section>

<!-- Footer -->
<footer class="border-t border-gray-100">
	<div class="mx-auto max-w-6xl px-4 sm:px-6 py-8 text-sm text-gray-600 flex flex-col sm:flex-row gap-4 sm:items-center sm:justify-between">
		<div class="flex items-center gap-2">
			<span class="font-semibold text-gray-800">TeliTask</span>
			<span>© {new Date().getFullYear()}</span>
		</div>
		<div class="flex flex-wrap gap-x-6 gap-y-2">
			<a href="/privacy" class="hover:text-orange-700">Privacy</a>
			<a href="/terms" class="hover:text-orange-700">Terms</a>
			<a href="#contact" class="hover:text-orange-700">Contact</a>
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
			href="/auth"
			class="group flex items-center gap-2 bg-gradient-to-r from-orange-500 to-orange-600 text-white px-6 py-3 rounded-full shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300"
		>
			<span class="font-semibold">Get Started</span>
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
		<div class="absolute inset-0 rounded-full bg-orange-500 animate-ping opacity-20"></div>
	</div>
{/if}