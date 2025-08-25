<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import { createSupabaseClient } from '$lib/supabase';
	
	let error = '';
	
	onMount(async () => {
		const supabase = createSupabaseClient();
		
		// Get the hash and query params from the URL
		const hashParams = new URLSearchParams($page.url.hash.substring(1));
		const queryParams = $page.url.searchParams;
		const errorParam = hashParams.get('error') || queryParams.get('error');
		const errorDescription = hashParams.get('error_description') || queryParams.get('error_description');
		const type = hashParams.get('type');
		const provider = hashParams.get('provider_token') || hashParams.get('provider');
		
		if (errorParam) {
			error = errorDescription || errorParam;
			return;
		}
		
		// For OAuth callbacks, we need to exchange the code for a session
		if (queryParams.get('code')) {
			try {
				const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(queryParams.get('code'));
				if (exchangeError) {
					error = exchangeError.message;
					return;
				}
			} catch (e) {
				// If exchange fails, continue to check session
			}
		}
		
		// Try to get the session
		const { data: { session }, error: sessionError } = await supabase.auth.getSession();
		
		if (sessionError) {
			error = sessionError.message;
			return;
		}
		
		if (session) {
			// Check if this is an email confirmation (signup or recovery)
			const isEmailConfirmation = type === 'signup' || type === 'recovery';
			
			// Always redirect OAuth sign-ins (including Google) to dashboard
			// OAuth callbacks will have either a 'code' param or come from a provider
			const isOAuth = queryParams.get('code') || provider || hashParams.get('provider');
			
			if (isOAuth) {
				// This is definitely OAuth (Google, etc.), go to dashboard
				await goto('/dashboard');
			} else if (isEmailConfirmation) {
				// For email confirmations, redirect to auth page with success message
				await goto('/auth?verified=true');
			} else {
				// Default to dashboard for other sign-ins
				await goto('/dashboard');
			}
		} else {
			// No session, might need to retry or show error
			if (queryParams.get('code')) {
				// Had a code but couldn't create session
				error = 'Failed to complete sign in. Please try again.';
			} else {
				// No session and no code, redirect to auth page
				await goto('/auth');
			}
		}
	});
</script>

<div class="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
	<div class="max-w-md w-full space-y-8">
		<div class="text-center">
			{#if error}
				<h2 class="mt-6 text-3xl font-extrabold text-gray-900">
					Authentication Error
				</h2>
				<div class="mt-4 rounded-md bg-red-50 p-4">
					<p class="text-sm text-red-800">{error}</p>
				</div>
				<div class="mt-4">
					<a
						href="/auth"
						class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-orange-600 hover:bg-orange-700 transition-colors"
					>
						Try Again
					</a>
				</div>
			{:else}
				<h2 class="mt-6 text-3xl font-extrabold text-gray-900">
					Verifying...
				</h2>
				<p class="mt-2 text-sm text-gray-600">
					Please wait while we complete your sign in.
				</p>
				<div class="mt-4">
					<div class="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto"></div>
				</div>
			{/if}
		</div>
	</div>
</div>