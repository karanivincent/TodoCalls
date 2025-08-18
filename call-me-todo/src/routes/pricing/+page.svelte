<script lang="ts">
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';
	import { fade, fly } from 'svelte/transition';
	import NavBar from '$lib/components/NavBar.svelte';
	
	let selectedPlan = 'pro'; // Default to pro
	let billingCycle: 'monthly' | 'yearly' = 'monthly';
	let mounted = false;
	
	onMount(() => {
		mounted = true;
	});
	
	const plans = [
		{
			id: 'free',
			name: 'Test Drive',
			price: { monthly: 0, yearly: 0 },
			description: 'Try TeliTask risk-free',
			features: [
				'5 calls per month',
				'1 phone number',
				'Basic reminders',
				'Email support',
			],
			limitations: [
				'No SMS fallback',
				'No recurring reminders',
				'No snooze options'
			],
			cta: 'Start Free',
			highlighted: false
		},
		{
			id: 'essential',
			name: 'Essential',
			price: { monthly: 7, yearly: 70 },
			description: 'Perfect for medication reminders',
			features: [
				'50 calls per month',
				'2 phone numbers',
				'SMS fallback',
				'Snooze options',
				'Recurring reminders',
				'Priority email support'
			],
			limitations: [],
			cta: 'Start Essential',
			highlighted: false
		},
		{
			id: 'pro',
			name: 'Pro',
			price: { monthly: 15, yearly: 150 },
			description: 'For busy professionals',
			features: [
				'150 calls per month',
				'3 phone numbers',
				'Custom wake-up calls',
				'Advanced recurring options',
				'API access',
				'Priority support',
				'Usage analytics'
			],
			limitations: [],
			cta: 'Start Pro',
			highlighted: true,
			badge: 'MOST POPULAR'
		},
		{
			id: 'family',
			name: 'Family',
			price: { monthly: 29, yearly: 290 },
			description: 'Share with loved ones',
			features: [
				'400 calls per month',
				'5 phone numbers',
				'Caregiver dashboard',
				'Custom AI voices',
				'WhatsApp integration',
				'Dedicated support',
				'Advanced reporting'
			],
			limitations: [],
			cta: 'Start Family',
			highlighted: false
		}
	];
	
	function selectPlan(planId: string) {
		// In production, this would initiate Stripe checkout
		goto(`/auth?plan=${planId}&billing=${billingCycle}`);
	}
	
	function getYearlySavings(plan: typeof plans[0]) {
		if (plan.price.monthly === 0) return 0;
		const monthlyTotal = plan.price.monthly * 12;
		const yearlyTotal = plan.price.yearly;
		return monthlyTotal - yearlyTotal;
	}
</script>

<svelte:head>
	<title>Pricing - TeliTask</title>
	<meta name="description" content="Simple, transparent pricing for phone call reminders. Start free, upgrade anytime." />
</svelte:head>

<!-- Navigation -->
<NavBar currentPage="/pricing" />

<div class="min-h-screen bg-gradient-to-b from-white to-gray-50">
	<!-- Pricing Content -->
	<div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-12 pb-8">
		<div class="text-center">
			<h1 class="text-4xl sm:text-5xl font-bold text-gray-900 mb-4">
				Simple, Transparent Pricing
			</h1>
			<p class="text-xl text-gray-600 max-w-2xl mx-auto mb-8">
				The average ADHD tax is $1,200/year. TeliTask costs less than one forgotten parking ticket.
			</p>
			
			<!-- Billing Toggle -->
			<div class="inline-flex items-center bg-gray-100 rounded-lg p-1">
				<button
					on:click={() => billingCycle = 'monthly'}
					class="px-4 py-2 rounded-md text-sm font-medium transition-all {billingCycle === 'monthly' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600'}"
				>
					Monthly
				</button>
				<button
					on:click={() => billingCycle = 'yearly'}
					class="px-4 py-2 rounded-md text-sm font-medium transition-all {billingCycle === 'yearly' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600'}"
				>
					Yearly
					<span class="ml-1 text-xs text-green-600 font-semibold">Save 17%</span>
				</button>
			</div>
		</div>
	</div>
	
	<!-- Pricing Cards -->
	{#if mounted}
		<div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pb-16">
			<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
				{#each plans as plan, i}
					<div
						in:fly={{ y: 20, duration: 400, delay: i * 100 }}
						class="relative rounded-2xl bg-white p-6 shadow-lg hover:shadow-xl transition-all duration-300 {plan.highlighted ? 'ring-2 ring-orange-500 scale-105' : ''}"
					>
						{#if plan.badge}
							<div class="absolute -top-3 left-1/2 transform -translate-x-1/2">
								<span class="bg-gradient-to-r from-orange-500 to-orange-600 text-white text-xs font-bold px-3 py-1 rounded-full">
									{plan.badge}
								</span>
							</div>
						{/if}
						
						<div class="text-center mb-6">
							<h3 class="text-xl font-semibold text-gray-900 mb-2">{plan.name}</h3>
							<p class="text-sm text-gray-600 mb-4">{plan.description}</p>
							
							<div class="flex items-baseline justify-center">
								<span class="text-4xl font-bold text-gray-900">
									${plan.price[billingCycle] === 0 ? '0' : billingCycle === 'monthly' ? plan.price.monthly : Math.floor(plan.price.yearly / 12)}
								</span>
								<span class="ml-1 text-gray-600">/month</span>
							</div>
							
							{#if billingCycle === 'yearly' && getYearlySavings(plan) > 0}
								<p class="text-sm text-green-600 mt-1">
									Save ${getYearlySavings(plan)}/year
								</p>
							{/if}
						</div>
						
						<ul class="space-y-3 mb-6">
							{#each plan.features as feature}
								<li class="flex items-start">
									<svg class="w-5 h-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
									</svg>
									<span class="text-sm text-gray-700">{feature}</span>
								</li>
							{/each}
							
							{#each plan.limitations as limitation}
								<li class="flex items-start">
									<svg class="w-5 h-5 text-gray-400 mr-2 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
									</svg>
									<span class="text-sm text-gray-500">{limitation}</span>
								</li>
							{/each}
						</ul>
						
						<button
							on:click={() => selectPlan(plan.id)}
							class="w-full py-3 px-4 rounded-lg font-semibold transition-all duration-200 {plan.highlighted 
								? 'bg-gradient-to-r from-orange-500 to-orange-600 text-white hover:from-orange-600 hover:to-orange-700' 
								: 'bg-gray-100 text-gray-900 hover:bg-gray-200'}"
						>
							{plan.cta}
						</button>
					</div>
				{/each}
			</div>
		</div>
	{/if}
	
	<!-- Add-ons Section -->
	<section class="bg-gray-50 py-12">
		<div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
			<h2 class="text-2xl font-bold text-center text-gray-900 mb-8">Boost Your Plan</h2>
			<div class="grid grid-cols-1 md:grid-cols-3 gap-6">
				<div class="bg-white rounded-lg p-6 border border-gray-200">
					<h3 class="font-semibold text-gray-900 mb-2">Extra Call Pack</h3>
					<p class="text-sm text-gray-600 mb-3">30 additional calls</p>
					<p class="text-2xl font-bold text-gray-900">$3<span class="text-sm font-normal text-gray-600">/month</span></p>
				</div>
				
				<div class="bg-white rounded-lg p-6 border border-gray-200">
					<h3 class="font-semibold text-gray-900 mb-2">International Calling</h3>
					<p class="text-sm text-gray-600 mb-3">Call 50+ countries</p>
					<p class="text-2xl font-bold text-gray-900">$5<span class="text-sm font-normal text-gray-600">/month</span></p>
				</div>
				
				<div class="bg-white rounded-lg p-6 border border-gray-200">
					<h3 class="font-semibold text-gray-900 mb-2">Custom AI Voice</h3>
					<p class="text-sm text-gray-600 mb-3">Choose your preferred voice</p>
					<p class="text-2xl font-bold text-gray-900">$3<span class="text-sm font-normal text-gray-600">/month</span></p>
				</div>
			</div>
		</div>
	</section>
	
	<!-- FAQ Section -->
	<section class="py-12">
		<div class="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
			<h2 class="text-2xl font-bold text-center text-gray-900 mb-8">Pricing FAQs</h2>
			
			<div class="space-y-4">
				<div class="bg-white rounded-lg p-6 shadow-sm">
					<h3 class="font-semibold text-gray-900 mb-2">Can I change plans anytime?</h3>
					<p class="text-gray-600">Yes! Upgrade or downgrade anytime. Changes take effect immediately and we'll prorate the difference.</p>
				</div>
				
				<div class="bg-white rounded-lg p-6 shadow-sm">
					<h3 class="font-semibold text-gray-900 mb-2">What happens if I exceed my call limit?</h3>
					<p class="text-gray-600">We'll notify you when you're close to your limit. You can add extra call packs or upgrade your plan to continue.</p>
				</div>
				
				<div class="bg-white rounded-lg p-6 shadow-sm">
					<h3 class="font-semibold text-gray-900 mb-2">Do unused calls roll over?</h3>
					<p class="text-gray-600">Unused calls don't roll over to the next month, but you can always add call packs if you need a temporary boost.</p>
				</div>
				
				<div class="bg-white rounded-lg p-6 shadow-sm">
					<h3 class="font-semibold text-gray-900 mb-2">Is there a setup fee?</h3>
					<p class="text-gray-600">Never! No setup fees, no cancellation fees. Just simple, transparent monthly pricing.</p>
				</div>
				
				<div class="bg-white rounded-lg p-6 shadow-sm">
					<h3 class="font-semibold text-gray-900 mb-2">What payment methods do you accept?</h3>
					<p class="text-gray-600">We accept all major credit cards, debit cards, and will soon support PayPal and Apple Pay.</p>
				</div>
			</div>
		</div>
	</section>
	
	<!-- CTA Section -->
	<section class="bg-gradient-to-r from-orange-500 to-orange-600 py-12">
		<div class="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center">
			<h2 class="text-3xl font-bold text-white mb-4">
				Stop Paying the ADHD Tax
			</h2>
			<p class="text-xl text-orange-100 mb-8">
				Join thousands who never miss what matters. Start your free trial today.
			</p>
			<button
				on:click={() => selectPlan('free')}
				class="bg-white text-orange-600 px-8 py-3 rounded-lg font-semibold hover:bg-orange-50 transition-colors duration-200"
			>
				Start Free Trial
			</button>
			<p class="mt-4 text-sm text-orange-100">
				No credit card required • Cancel anytime • 5 free calls to start
			</p>
		</div>
	</section>
</div>