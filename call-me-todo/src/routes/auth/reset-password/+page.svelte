<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { createSupabaseClient } from '$lib/supabase';
	
	let supabase = createSupabaseClient();
	let newPassword = '';
	let confirmPassword = '';
	let loading = false;
	let error = '';
	let success = false;
	
	onMount(async () => {
		// Check if user is in password reset flow
		const { data: { session } } = await supabase.auth.getSession();
		if (!session) {
			// No session means no reset token
			goto('/auth');
		}
	});
	
	async function handlePasswordReset() {
		error = '';
		
		if (newPassword !== confirmPassword) {
			error = 'Passwords do not match';
			return;
		}
		
		if (newPassword.length < 8) {
			error = 'Password must be at least 8 characters';
			return;
		}
		
		loading = true;
		
		try {
			const { error: updateError } = await supabase.auth.updateUser({
				password: newPassword
			});
			
			if (updateError) {
				error = updateError.message;
			} else {
				success = true;
				setTimeout(() => {
					goto('/dashboard');
				}, 2000);
			}
		} catch (err: any) {
			error = err.message;
		} finally {
			loading = false;
		}
	}
</script>

<div class="min-h-screen bg-gradient-to-br from-orange-50 to-orange-100 flex items-center justify-center p-4">
	<div class="bg-white rounded-2xl shadow-xl w-full max-w-md p-8">
		<div class="text-center mb-8">
			<h1 class="text-3xl font-bold text-gray-900 mb-2">Reset Your Password</h1>
			<p class="text-gray-600">Enter your new password below</p>
		</div>
		
		{#if success}
			<div class="bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-lg mb-6">
				✅ Password updated successfully! Redirecting to dashboard...
			</div>
		{/if}
		
		{#if error}
			<div class="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg mb-6">
				{error}
			</div>
		{/if}
		
		<form on:submit|preventDefault={handlePasswordReset} class="space-y-6">
			<div>
				<label for="password" class="block text-sm font-medium text-gray-700 mb-2">
					New Password
				</label>
				<input
					type="password"
					id="password"
					bind:value={newPassword}
					required
					minlength="8"
					class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
					placeholder="Enter new password"
				/>
			</div>
			
			<div>
				<label for="confirmPassword" class="block text-sm font-medium text-gray-700 mb-2">
					Confirm Password
				</label>
				<input
					type="password"
					id="confirmPassword"
					bind:value={confirmPassword}
					required
					minlength="8"
					class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
					placeholder="Confirm new password"
				/>
			</div>
			
			<button
				type="submit"
				disabled={loading || success}
				class="w-full py-3 px-4 bg-orange-600 text-white font-semibold rounded-lg hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
			>
				{loading ? 'Updating...' : 'Update Password'}
			</button>
		</form>
		
		<div class="mt-6 text-center">
			<a href="/auth" class="text-sm text-orange-600 hover:text-orange-700">
				Back to Login
			</a>
		</div>
	</div>
</div>