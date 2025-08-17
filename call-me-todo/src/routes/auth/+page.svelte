<script lang="ts">
	import { createSupabaseClient } from '$lib/supabase';
	
	let email = '';
	let loading = false;
	let message = '';
	let error = '';
	
	async function handleSignIn() {
		loading = true;
		error = '';
		message = '';
		
		const supabase = createSupabaseClient();
		
		// Always use the correct production URL for email redirects
		const redirectUrl = window.location.hostname === 'localhost' 
			? `${window.location.origin}/dashboard`
			: 'https://call-me-todo.vercel.app/dashboard';
		
		const { error: signInError } = await supabase.auth.signInWithOtp({
			email,
			options: {
				emailRedirectTo: redirectUrl
			}
		});
		
		if (signInError) {
			error = signInError.message;
		} else {
			message = 'Check your email for the magic link!';
		}
		
		loading = false;
	}
</script>

<div class="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
	<div class="max-w-md w-full space-y-8">
		<div>
			<h2 class="mt-6 text-center text-3xl font-extrabold text-gray-900">
				Sign in to Call-Me Todo
			</h2>
			<p class="mt-2 text-center text-sm text-gray-600">
				We'll send you a magic link to sign in
			</p>
		</div>
		<form class="mt-8 space-y-6" on:submit|preventDefault={handleSignIn}>
			<div>
				<label for="email" class="block text-sm font-medium text-gray-700">
					Email address
				</label>
				<input
					id="email"
					name="email"
					type="email"
					autocomplete="email"
					required
					bind:value={email}
					class="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-orange-500 focus:border-orange-500 focus:z-10 sm:text-sm"
					placeholder="Enter your email"
				/>
			</div>

			{#if error}
				<div class="rounded-md bg-red-50 p-4">
					<p class="text-sm text-red-800">{error}</p>
				</div>
			{/if}
			
			{#if message}
				<div class="rounded-md bg-green-50 p-4">
					<p class="text-sm text-green-800">{message}</p>
				</div>
			{/if}

			<div>
				<button
					type="submit"
					disabled={loading}
					class="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-orange-600 hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
				>
					{loading ? 'Sending...' : 'Send Magic Link'}
				</button>
			</div>
		</form>
	</div>
</div>