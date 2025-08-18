<script lang="ts">
	import { goto } from '$app/navigation';
	
	let phone = '';
	let time = '';
	let consent = false;
	let loading = false;
	let error = '';
	let success = false;
	
	// Contact form state
	let contactName = '';
	let contactEmail = '';
	let contactMessage = '';
	let contactLoading = false;
	let contactError = '';
	let contactSuccess = false;
	
	function isValidPhone(value: string): boolean {
		const v = value.trim();
		const e164 = /^\+?[1-9]\d{7,14}$/;
		const localish = /^[0-9 ()+-]{8,}$/;
		return e164.test(v) || localish.test(v);
	}
	
	async function handleSubmit(event: Event) {
		event.preventDefault();
		error = '';
		success = false;
		
		if (!isValidPhone(phone)) {
			error = 'Please enter a valid phone number (you can include +country code).';
			return;
		}
		
		if (!time) {
			error = 'Please choose your preferred reminder time.';
			return;
		}
		
		if (!consent) {
			error = 'Please accept the consent to proceed.';
			return;
		}
		
		loading = true;
		
		try {
			// For now, just redirect to auth page
			// Later we can implement the actual signup API
			goto('/auth');
		} catch (e) {
			error = 'Something went wrong. Please try again later.';
		} finally {
			loading = false;
		}
	}
	
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

<!-- Header -->
<header class="sticky top-0 z-30 backdrop-blur supports-[backdrop-filter]:bg-white/70 border-b border-gray-100">
	<div class="mx-auto max-w-6xl px-4 sm:px-6 py-3 flex items-center justify-between">
		<a href="/" class="flex items-center gap-2">
			<span class="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-orange-100 ring-1 ring-orange-300">
				<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" class="h-5 w-5 fill-orange-800">
					<path d="M6.62 10.79a15.05 15.05 0 0 0 6.59 6.59l2.2-2.2a1 1 0 0 1 1.01-.24c1.1.36 2.28.55 3.5.55a1 1 0 0 1 1 1V20a1 1 0 0 1-1 1C11.3 21 3 12.7 3 2a1 1 0 0 1 1-1h3.5a1 1 0 0 1 1 1c0 1.22.19 2.4.55 3.5a1 1 0 0 1-.25 1.01z"/>
				</svg>
			</span>
			<span class="font-semibold tracking-tight">TeliTask</span>
		</a>
		<nav class="hidden sm:flex items-center gap-6 text-sm">
			<a href="#how" class="hover:text-orange-700">How it works</a>
			<a href="#use-cases" class="hover:text-orange-700">Use cases</a>
			<a href="#faq" class="hover:text-orange-700">FAQ</a>
			<a href="#contact" class="hover:text-orange-700">Contact</a>
			<a href="/auth" class="rounded-lg bg-orange-600 px-3 py-1.5 text-white hover:bg-orange-700">Try Free</a>
		</nav>
	</div>
</header>

<!-- Hero -->
<section id="signup" class="relative">
	<div class="mx-auto max-w-6xl px-4 sm:px-6 py-14 sm:py-20 grid lg:grid-cols-2 gap-10 items-center">
		<div>
			<h1 class="text-4xl sm:text-5xl font-extrabold tracking-tight text-gray-900">
				Task reminders that <span class="bg-gradient-to-r from-orange-500 to-orange-700 bg-clip-text text-transparent">call your phone</span>.
			</h1>
			<p class="mt-4 text-lg text-gray-700">
				Skip the ignored push alerts. TeliTask rings you at the time you choose—so important tasks never slip.
			</p>
			<ul class="mt-6 space-y-2 text-gray-700">
				<li class="flex items-start gap-2">
					<span class="mt-1 h-2 w-2 rounded-full bg-orange-600"></span>
					<span>Works on any phone—no app install required.</span>
				</li>
				<li class="flex items-start gap-2">
					<span class="mt-1 h-2 w-2 rounded-full bg-orange-600"></span>
					<span>Free forever with no credit card required.</span>
				</li>
				<li class="flex items-start gap-2">
					<span class="mt-1 h-2 w-2 rounded-full bg-orange-600"></span>
					<span>Respectful quiet hours & reliable retries on missed calls.</span>
				</li>
			</ul>
		</div>

		<!-- Lead Form Card -->
		<div class="lg:justify-self-end w-full max-w-md">
			{#if success}
				<div class="rounded-2xl border border-orange-200 bg-orange-50 p-6 shadow-sm">
					<h2 class="text-xl font-semibold text-orange-800">You're in! 🎉</h2>
					<p class="mt-2 text-orange-900">Thanks for signing up. We'll send a confirmation SMS shortly. Check your email for next steps.</p>
					<a href="#how" class="mt-4 inline-flex text-sm text-orange-800 underline">See how it works</a>
				</div>
			{:else}
				<form on:submit={handleSubmit} class="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm space-y-4" novalidate>
					<div class="flex items-start gap-3">
						<div class="shrink-0">
							<span class="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-orange-100 ring-1 ring-orange-300">
								<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" class="h-5 w-5 fill-orange-800">
									<path d="M6.62 10.79a15.05 15.05 0 0 0 6.59 6.59l2.2-2.2a1 1 0 0 1 1.01-.24c1.1.36 2.28.55 3.5.55a1 1 0 0 1 1 1V20a1 1 0 0 1-1 1C11.3 21 3 12.7 3 2a1 1 0 0 1 1-1h3.5a1 1 0 0 1 1 1c0 1.22.19 2.4.55 3.5a1 1 0 0 1-.25 1.01z"/>
								</svg>
							</span>
						</div>
						<div>
							<h2 class="text-xl font-semibold">Try it free</h2>
							<p class="text-sm text-gray-600">Enter your number and a preferred call time. We'll set up your first reminder.</p>
						</div>
					</div>
					
					<label class="block">
						<span class="block text-sm font-medium">Phone number</span>
						<input
							bind:value={phone}
							name="phone"
							type="tel"
							inputmode="tel"
							placeholder="e.g., +254712345678"
							required
							class="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 shadow-sm focus:border-orange-600 focus:outline-none focus:ring-2 focus:ring-orange-200"
						/>
					</label>
					
					<label class="block">
						<span class="block text-sm font-medium">Preferred call time</span>
						<input
							bind:value={time}
							name="time"
							type="time"
							required
							class="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 shadow-sm focus:border-orange-600 focus:outline-none focus:ring-2 focus:ring-orange-200"
						/>
					</label>
					
					<label class="flex items-start gap-2 text-sm">
						<input
							bind:checked={consent}
							name="consent"
							type="checkbox"
							class="mt-1 h-4 w-4 rounded border-gray-300 text-orange-600 focus:ring-orange-500"
						/>
						<span>I agree to receive automated calls & SMS for reminders and onboarding. <a href="/privacy" class="underline">Privacy</a></span>
					</label>
					
					{#if error}
						<div class="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">
							{error}
						</div>
					{/if}
					
					<button
						type="submit"
						disabled={loading}
						class="w-full rounded-lg bg-orange-600 px-4 py-2.5 font-semibold text-white shadow-sm hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-300 disabled:opacity-50 disabled:cursor-not-allowed"
					>
						{loading ? 'Submitting...' : 'Try Free'}
					</button>
					
					<p class="text-xs text-gray-500">
						By continuing you agree to our <a href="/terms" class="underline">Terms</a>. Standard carrier rates may apply.
					</p>
				</form>
			{/if}
		</div>
	</div>
</section>

<!-- How it works -->
<section id="how" class="mx-auto max-w-6xl px-4 sm:px-6 py-12 sm:py-16">
	<h2 class="text-2xl sm:text-3xl font-bold tracking-tight">How it works</h2>
	<div class="mt-6 grid gap-6 sm:grid-cols-3">
		<div class="rounded-2xl border border-gray-200 p-6">
			<div class="text-sm font-semibold text-orange-700">1. Tell us when to call</div>
			<p class="mt-2 text-gray-700">Set a time (and optional quiet hours). Add a short note like "Stand-up meeting".</p>
		</div>
		<div class="rounded-2xl border border-gray-200 p-6">
			<div class="text-sm font-semibold text-orange-700">2. We place the call</div>
			<p class="mt-2 text-gray-700">At your chosen time, your phone rings. Pick up to hear your reminder in a clear voice.</p>
		</div>
		<div class="rounded-2xl border border-gray-200 p-6">
			<div class="text-sm font-semibold text-orange-700">3. We retry if you miss it</div>
			<p class="mt-2 text-gray-700">Missed the call? We'll try again and send a follow-up SMS so nothing gets lost.</p>
		</div>
	</div>
</section>

<!-- Use cases -->
<section id="use-cases" class="mx-auto max-w-6xl px-4 sm:px-6 py-12 sm:py-16">
	<h2 class="text-2xl sm:text-3xl font-bold tracking-tight">Perfect for…</h2>
	<div class="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
		<div class="rounded-2xl border border-gray-200 p-6">
			<div class="font-semibold">Meetings & calls</div>
			<p class="mt-1 text-gray-700">Never miss the daily stand-up or client check-in again.</p>
		</div>
		<div class="rounded-2xl border border-gray-200 p-6">
			<div class="font-semibold">Meds & routines</div>
			<p class="mt-1 text-gray-700">Gentle nudges for medication, water, or quick stretches.</p>
		</div>
		<div class="rounded-2xl border border-gray-200 p-6">
			<div class="font-semibold">Chores & errands</div>
			<p class="mt-1 text-gray-700">Bins day, laundry switch, school run—handled.</p>
		</div>
		<div class="rounded-2xl border border-gray-200 p-6">
			<div class="font-semibold">Focus sessions</div>
			<p class="mt-1 text-gray-700">Pomodoro-style calls to start or wrap deep work.</p>
		</div>
		<div class="rounded-2xl border border-gray-200 p-6">
			<div class="font-semibold">Accountability</div>
			<p class="mt-1 text-gray-700">Schedule end-of-day check-ins for goals and habits.</p>
		</div>
		<div class="rounded-2xl border border-gray-200 p-6">
			<div class="font-semibold">VIP follow-ups</div>
			<p class="mt-1 text-gray-700">Time-critical reminders that must break through.</p>
		</div>
	</div>
</section>


<!-- FAQ -->
<section id="faq" class="mx-auto max-w-6xl px-4 sm:px-6 py-12 sm:py-16">
	<h2 class="text-2xl sm:text-3xl font-bold tracking-tight">FAQ</h2>
	<div class="mt-6 grid gap-6 sm:grid-cols-2">
		<div class="rounded-2xl border border-gray-200 p-6">
			<div class="font-semibold">Do you support quiet hours?</div>
			<p class="mt-1 text-gray-700">Yes. Set daily windows when calls are paused. Urgent reminders roll to SMS.</p>
		</div>
		<div class="rounded-2xl border border-gray-200 p-6">
			<div class="font-semibold">What happens if I miss a call?</div>
			<p class="mt-1 text-gray-700">We retry a few times over ~15 minutes and send a summary by SMS.</p>
		</div>
		<div class="rounded-2xl border border-gray-200 p-6">
			<div class="font-semibold">Do you call outside my region?</div>
			<p class="mt-1 text-gray-700">We support calls to most countries worldwide. Check our docs for specific coverage.</p>
		</div>
		<div class="rounded-2xl border border-gray-200 p-6">
			<div class="font-semibold">Is there an app?</div>
			<p class="mt-1 text-gray-700">No app required. Everything works over calls & SMS. A PWA is in the works.</p>
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