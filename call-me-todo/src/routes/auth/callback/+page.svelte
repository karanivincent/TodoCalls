<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import { createSupabaseClient } from '$lib/supabase';
	
	let error = '';
	
	onMount(async () => {
		const supabase = createSupabaseClient();
		
		// Get the hash from the URL
		const hashParams = new URLSearchParams($page.url.hash.substring(1));
		const errorParam = hashParams.get('error');
		const errorDescription = hashParams.get('error_description');
		const type = hashParams.get('type');
		
		if (errorParam) {
			error = errorDescription || errorParam;
			return;
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
			
			if (isEmailConfirmation) {
				// For email confirmations, redirect to auth page with success message
				goto('/auth?verified=true');
			} else {
				// For OAuth or magic link sign-ins, redirect to dashboard
				goto('/dashboard');
			}
		} else {
			// No session, redirect to auth page
			goto('/auth');
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