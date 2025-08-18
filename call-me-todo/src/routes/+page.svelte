<script lang="ts">
	import { goto } from '$app/navigation';
	
	let phone = '';
	let time = '';
	let consent = false;
	let loading = false;
	let error = '';
	let success = false;
	
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
			<a href="/contact" class="hover:text-orange-700">Contact</a>
		</div>
	</div>
</footer>