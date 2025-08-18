<script lang="ts">
	import { createSupabaseClient } from '$lib/supabase';
	import { goto } from '$app/navigation';
	import NavBar from '$lib/components/NavBar.svelte';
	
	let name = '';
	let email = '';
	let loading = false;
	let message = '';
	let error = '';
	let step: 'signup' | 'signin' | 'verify' = 'signup';
	let isNewUser = true;
	
	async function handleSignUp() {
		loading = true;
		error = '';
		message = '';
		
		if (isNewUser && !name.trim()) {
			error = 'Please enter your name';
			loading = false;
			return;
		}
		
		const supabase = createSupabaseClient();
		
		if (isNewUser) {
			// Create account with email and auto-generated password
			const tempPassword = Math.random().toString(36).slice(-12) + 'Aa1!';
			
			const { data: authData, error: signUpError } = await supabase.auth.signUp({
				email,
				password: tempPassword,
				options: {
					data: {
						full_name: name
					}
				}
			});
			
			if (signUpError) {
				// If user exists, try to sign them in
				if (signUpError.message.includes('already registered')) {
					const { error: signInError } = await supabase.auth.signInWithOtp({
						email,
						options: {
							emailRedirectTo: `${window.location.origin}/dashboard`
						}
					});
					
					if (signInError) {
						error = signInError.message;
					} else {
						message = 'Welcome back! Check your email to sign in.';
						step = 'verify';
					}
				} else {
					error = signUpError.message;
				}
			} else {
				// Send OTP for verification
				const { error: otpError } = await supabase.auth.signInWithOtp({
					email,
					options: {
						emailRedirectTo: `${window.location.origin}/dashboard`
					}
				});
				
				if (otpError) {
					error = otpError.message;
				} else {
					message = 'Great! Check your email to verify your account and get started.';
					step = 'verify';
					
					// Store user name in localStorage for later
					if (typeof window !== 'undefined') {
						localStorage.setItem('pendingUserName', name);
					}
				}
			}
		} else {
			// Sign in existing user
			const { error: signInError } = await supabase.auth.signInWithOtp({
				email,
				options: {
					emailRedirectTo: `${window.location.origin}/dashboard`
				}
			});
			
			if (signInError) {
				error = signInError.message;
			} else {
				message = 'Welcome back! Check your email to sign in.';
				step = 'verify';
			}
		}
		
		loading = false;
	}
	
	function handleBack() {
		step = isNewUser ? 'signup' : 'signin';
		message = '';
	}
	
	function toggleUserType() {
		isNewUser = !isNewUser;
		step = isNewUser ? 'signup' : 'signin';
		error = '';
		message = '';
	}
</script>

<!-- Navigation -->
<NavBar currentPage="/auth" />

<div class="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 to-white py-12 px-4 sm:px-6 lg:px-8">
	<div class="max-w-md w-full">
		<div class="bg-white rounded-2xl shadow-xl p-8 space-y-6">
			{#if step === 'signup'}
				<div class="text-center">
					<h2 class="text-3xl font-bold text-gray-900">
						Try Call-Me Todo Free
					</h2>
					<p class="mt-2 text-gray-600">
						Get started with AI-powered task management
					</p>
				</div>
				
				<form class="space-y-5" on:submit|preventDefault={handleSignUp}>
					<div>
						<label for="name" class="block text-sm font-medium text-gray-700 mb-1">
							Your Name
						</label>
						<input
							id="name"
							name="name"
							type="text"
							autocomplete="name"
							required
							bind:value={name}
							class="appearance-none relative block w-full px-4 py-3 border border-gray-300 placeholder-gray-400 text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
							placeholder="John Doe"
						/>
					</div>
					
					<div>
						<label for="email" class="block text-sm font-medium text-gray-700 mb-1">
							Email Address
						</label>
						<input
							id="email"
							name="email"
							type="email"
							autocomplete="email"
							required
							bind:value={email}
							class="appearance-none relative block w-full px-4 py-3 border border-gray-300 placeholder-gray-400 text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
							placeholder="john@example.com"
						/>
					</div>

					{#if error}
						<div class="rounded-lg bg-red-50 border border-red-200 p-4">
							<p class="text-sm text-red-800">{error}</p>
						</div>
					{/if}

					<button
						type="submit"
						disabled={loading}
						class="w-full flex justify-center py-3 px-4 border border-transparent text-base font-medium rounded-lg text-white bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all transform hover:scale-[1.02]"
					>
						{loading ? 'Creating Account...' : 'Start Free Trial'}
					</button>
					
					<p class="text-center text-xs text-gray-500">
						No credit card required • Free forever
					</p>
				</form>
				
				<div class="text-center space-y-2">
					<p class="text-sm text-gray-600">
						Already have an account?
						<button on:click={toggleUserType} class="text-orange-600 hover:text-orange-700 font-medium">
							Sign in instead
						</button>
					</p>
					<a href="/" class="inline-block text-sm text-gray-500 hover:text-gray-700">
						← Back to Home
					</a>
				</div>
			{:else if step === 'signin'}
				<div class="text-center">
					<h2 class="text-3xl font-bold text-gray-900">
						Welcome Back
					</h2>
					<p class="mt-2 text-gray-600">
						Sign in to your Call-Me Todo account
					</p>
				</div>
				
				<form class="space-y-5" on:submit|preventDefault={handleSignUp}>
					<div>
						<label for="signin-email" class="block text-sm font-medium text-gray-700 mb-1">
							Email Address
						</label>
						<input
							id="signin-email"
							name="email"
							type="email"
							autocomplete="email"
							required
							bind:value={email}
							class="appearance-none relative block w-full px-4 py-3 border border-gray-300 placeholder-gray-400 text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
							placeholder="john@example.com"
						/>
					</div>

					{#if error}
						<div class="rounded-lg bg-red-50 border border-red-200 p-4">
							<p class="text-sm text-red-800">{error}</p>
						</div>
					{/if}

					<button
						type="submit"
						disabled={loading}
						class="w-full flex justify-center py-3 px-4 border border-transparent text-base font-medium rounded-lg text-white bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all transform hover:scale-[1.02]"
					>
						{loading ? 'Sending Magic Link...' : 'Send Magic Link'}
					</button>
					
					<p class="text-center text-xs text-gray-500">
						We'll email you a secure link to sign in
					</p>
				</form>
				
				<div class="text-center space-y-2">
					<p class="text-sm text-gray-600">
						Don't have an account?
						<button on:click={toggleUserType} class="text-orange-600 hover:text-orange-700 font-medium">
							Sign up for free
						</button>
					</p>
					<a href="/" class="inline-block text-sm text-gray-500 hover:text-gray-700">
						← Back to Home
					</a>
				</div>
			{:else}
				<div class="text-center space-y-4">
					<div class="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100">
						<svg class="h-8 w-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
						</svg>
					</div>
					
					<h3 class="text-2xl font-bold text-gray-900">Check Your Email</h3>
					
					<p class="text-gray-600">
						{message}
					</p>
					
					<p class="text-sm text-gray-500">
						We sent a verification link to<br />
						<span class="font-medium text-gray-900">{email}</span>
					</p>
					
					<button
						on:click={handleBack}
						class="text-sm text-orange-600 hover:text-orange-700 font-medium"
					>
						← Try a different email
					</button>
				</div>
			{/if}
		</div>
		
		<p class="mt-4 text-center text-xs text-gray-400">
			By signing up, you agree to our Terms of Service and Privacy Policy
		</p>
	</div>
</div>