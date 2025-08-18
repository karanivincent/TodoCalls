<script lang="ts">
	import { createSupabaseClient } from '$lib/supabase';
	import { goto } from '$app/navigation';
	import NavBar from '$lib/components/NavBar.svelte';
	
	let name = '';
	let email = '';
	let password = '';
	let loading = false;
	let message = '';
	let error = '';
	let step: 'signup' | 'signin' | 'verify' = 'signup';
	let isNewUser = true;
	let useMagicLink = false;
	let termsAccepted = false;
	let marketingConsent = false;
	
	async function handleAuth() {
		loading = true;
		error = '';
		message = '';
		
		if (isNewUser && !name.trim()) {
			error = 'Please enter your name';
			loading = false;
			return;
		}

		if (isNewUser && !termsAccepted) {
			error = 'Please accept the Terms of Service and Privacy Policy to continue';
			loading = false;
			return;
		}

		if (!useMagicLink && !password.trim()) {
			error = 'Please enter your password';
			loading = false;
			return;
		}
		
		const supabase = createSupabaseClient();
		
		if (useMagicLink) {
			// Magic link authentication
			if (isNewUser) {
				// Create account with temp password first, then send magic link
				const tempPassword = Math.random().toString(36).slice(-12) + 'Aa1!';
				
				const { error: signUpError } = await supabase.auth.signUp({
					email,
					password: tempPassword,
					options: {
						data: {
							full_name: name,
							marketing_consent: marketingConsent
						}
					}
				});
				
				if (signUpError && !signUpError.message.includes('already registered')) {
					error = signUpError.message;
					loading = false;
					return;
				}
			}

			// Send magic link
			const { error: otpError } = await supabase.auth.signInWithOtp({
				email,
				options: {
					emailRedirectTo: `${window.location.origin}/auth/callback`
				}
			});
			
			if (otpError) {
				error = otpError.message;
			} else {
				message = isNewUser 
					? 'Great! Check your email to verify your account and get started.'
					: 'Welcome back! Check your email to sign in.';
				step = 'verify';
				
				if (isNewUser && typeof window !== 'undefined') {
					localStorage.setItem('pendingUserName', name);
				}
			}
		} else {
			// Password-based authentication
			if (isNewUser) {
				// Sign up with password
				const { error: signUpError } = await supabase.auth.signUp({
					email,
					password,
					options: {
						data: {
							full_name: name,
							marketing_consent: marketingConsent
						}
					}
				});
				
				if (signUpError) {
					if (signUpError.message.includes('already registered')) {
						error = 'An account with this email already exists. Please sign in instead.';
						isNewUser = false;
						step = 'signin';
					} else {
						error = signUpError.message;
					}
				} else {
					message = 'Account created! Check your email to verify your account.';
					step = 'verify';
					
					if (typeof window !== 'undefined') {
						localStorage.setItem('pendingUserName', name);
					}
				}
			} else {
				// Sign in with password
				const { error: signInError } = await supabase.auth.signInWithPassword({
					email,
					password
				});
				
				if (signInError) {
					error = signInError.message;
				} else {
					// Redirect to dashboard on successful signin
					goto('/dashboard');
				}
			}
		}
		
		loading = false;
	}

	async function handleGoogleAuth() {
		loading = true;
		error = '';
		
		const supabase = createSupabaseClient();
		
		const { error: oauthError } = await supabase.auth.signInWithOAuth({
			provider: 'google',
			options: {
				redirectTo: `${window.location.origin}/auth/callback`
			}
		});
		
		if (oauthError) {
			error = oauthError.message;
			loading = false;
		}
		// Loading will be handled by the redirect
	}

	async function handleForgotPassword() {
		if (!email.trim()) {
			error = 'Please enter your email address first';
			return;
		}

		loading = true;
		error = '';
		
		const supabase = createSupabaseClient();
		
		const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
			redirectTo: `${window.location.origin}/auth/reset-password`
		});
		
		if (resetError) {
			error = resetError.message;
		} else {
			message = 'Check your email for a password reset link.';
			step = 'verify';
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
		password = '';
		useMagicLink = false;
		// Reset checkbox states when switching between signup/signin
		termsAccepted = false;
		marketingConsent = false;
	}

	function toggleMagicLink() {
		useMagicLink = !useMagicLink;
		password = '';
		error = '';
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

				<!-- Google OAuth Button -->
				<button
					on:click={handleGoogleAuth}
					disabled={loading}
					class="w-full flex items-center justify-center gap-3 py-3 px-4 border border-gray-300 text-base font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
				>
					<svg class="w-5 h-5" viewBox="0 0 24 24">
						<path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
						<path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
						<path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
						<path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
					</svg>
					{loading ? 'Connecting...' : 'Continue with Google'}
				</button>

				<!-- Divider -->
				<div class="relative">
					<div class="absolute inset-0 flex items-center">
						<div class="w-full border-t border-gray-300"></div>
					</div>
					<div class="relative flex justify-center text-sm">
						<span class="px-2 bg-white text-gray-500">Or continue with email</span>
					</div>
				</div>
				
				<form class="space-y-5" on:submit|preventDefault={handleAuth}>
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

					{#if !useMagicLink}
						<div>
							<label for="password" class="block text-sm font-medium text-gray-700 mb-1">
								Password
							</label>
							<input
								id="password"
								name="password"
								type="password"
								autocomplete="new-password"
								required
								bind:value={password}
								class="appearance-none relative block w-full px-4 py-3 border border-gray-300 placeholder-gray-400 text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
								placeholder="Choose a secure password"
							/>
						</div>
					{/if}

					<!-- Terms and Marketing Consent Checkboxes -->
					<div class="space-y-3">
						<div class="flex items-start">
							<input
								id="terms-checkbox"
								type="checkbox"
								bind:checked={termsAccepted}
								class="mt-1 h-4 w-4 text-orange-600 border-gray-300 rounded focus:ring-orange-500 focus:ring-2"
								required
							/>
							<label for="terms-checkbox" class="ml-3 text-sm text-gray-700">
								I agree to the 
								<a href="/terms" target="_blank" class="text-orange-600 hover:text-orange-700 underline">
									Terms of Service
								</a>
								 and 
								<a href="/privacy" target="_blank" class="text-orange-600 hover:text-orange-700 underline">
									Privacy Policy
								</a>
								<span class="text-red-500" aria-label="Required">*</span>
							</label>
						</div>
						
						<div class="flex items-start">
							<input
								id="marketing-checkbox"
								type="checkbox"
								bind:checked={marketingConsent}
								class="mt-1 h-4 w-4 text-orange-600 border-gray-300 rounded focus:ring-orange-500 focus:ring-2"
							/>
							<label for="marketing-checkbox" class="ml-3 text-sm text-gray-700">
								Send me product updates and marketing emails
							</label>
						</div>
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
						{#if loading}
							{useMagicLink ? 'Sending Magic Link...' : 'Creating Account...'}
						{:else}
							{useMagicLink ? 'Send Magic Link' : 'Start Free Trial'}
						{/if}
					</button>
					
					<div class="text-center">
						<button
							type="button"
							on:click={toggleMagicLink}
							class="text-sm text-orange-600 hover:text-orange-700 font-medium"
						>
							{useMagicLink ? 'Use password instead' : 'Use magic link instead'}
						</button>
					</div>
					
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

				<!-- Google OAuth Button -->
				<button
					on:click={handleGoogleAuth}
					disabled={loading}
					class="w-full flex items-center justify-center gap-3 py-3 px-4 border border-gray-300 text-base font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
				>
					<svg class="w-5 h-5" viewBox="0 0 24 24">
						<path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
						<path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
						<path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
						<path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
					</svg>
					{loading ? 'Connecting...' : 'Continue with Google'}
				</button>

				<!-- Divider -->
				<div class="relative">
					<div class="absolute inset-0 flex items-center">
						<div class="w-full border-t border-gray-300"></div>
					</div>
					<div class="relative flex justify-center text-sm">
						<span class="px-2 bg-white text-gray-500">Or continue with email</span>
					</div>
				</div>
				
				<form class="space-y-5" on:submit|preventDefault={handleAuth}>
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

					{#if !useMagicLink}
						<div>
							<div class="flex items-center justify-between">
								<label for="signin-password" class="block text-sm font-medium text-gray-700">
									Password
								</label>
								<button
									type="button"
									on:click={handleForgotPassword}
									class="text-sm text-orange-600 hover:text-orange-700 font-medium"
								>
									Forgot password?
								</button>
							</div>
							<input
								id="signin-password"
								name="password"
								type="password"
								autocomplete="current-password"
								required
								bind:value={password}
								class="mt-1 appearance-none relative block w-full px-4 py-3 border border-gray-300 placeholder-gray-400 text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
								placeholder="Enter your password"
							/>
						</div>
					{/if}

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
						{#if loading}
							{useMagicLink ? 'Sending Magic Link...' : 'Signing In...'}
						{:else}
							{useMagicLink ? 'Send Magic Link' : 'Sign In'}
						{/if}
					</button>
					
					<div class="text-center">
						<button
							type="button"
							on:click={toggleMagicLink}
							class="text-sm text-orange-600 hover:text-orange-700 font-medium"
						>
							{useMagicLink ? 'Use password instead' : 'Use magic link instead'}
						</button>
					</div>
					
					{#if useMagicLink}
						<p class="text-center text-xs text-gray-500">
							We'll email you a secure link to sign in
						</p>
					{/if}
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