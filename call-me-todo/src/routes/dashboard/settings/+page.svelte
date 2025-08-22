<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { createSupabaseClient } from '$lib/supabase';
	import Toast from '$lib/components/Toast.svelte';
	import { toast } from '$lib/stores/toast';
	
	let supabase = createSupabaseClient();
	let user: any = null;
	let identities: any[] = [];
	let loading = true;
	let linking = false;
	let unlinking = false;
	
	// Phone number management
	let phoneNumber = '';
	let savedPhoneNumber = '';
	let savingPhone = false;
	
	// Password management
	let showPasswordForm = false;
	let passwordForm = {
		password: '',
		confirmPassword: ''
	};
	let settingPassword = false;
	
	// Check if user has password
	let hasPassword = false;
	let hasGoogle = false;
	
	onMount(async () => {
		const { data: { user: currentUser } } = await supabase.auth.getUser();
		
		if (!currentUser) {
			goto('/auth');
			return;
		}
		
		user = currentUser;
		identities = user.identities || [];
		
		// Check authentication methods
		hasPassword = identities.some((id: any) => id.provider === 'email');
		hasGoogle = identities.some((id: any) => id.provider === 'google');
		
		// Load existing phone number
		const { data: profile } = await supabase
			.from('user_profiles')
			.select('phone_number')
			.eq('id', user.id)
			.single();
		
		if (profile?.phone_number) {
			phoneNumber = profile.phone_number;
			savedPhoneNumber = profile.phone_number;
		}
		
		loading = false;
	});
	
	async function linkGoogleAccount() {
		linking = true;
		
		try {
			const { data, error } = await supabase.auth.linkIdentity({
				provider: 'google',
				options: {
					redirectTo: `${window.location.origin}/dashboard/settings`
				}
			});
			
			if (error) {
				if (error.message.includes('already linked')) {
					toast.add('This Google account is already linked', 'info');
				} else {
					toast.add(error.message, 'error');
				}
				linking = false;
			}
			// Will redirect to Google OAuth
		} catch (err: any) {
			toast.add(err.message, 'error');
			linking = false;
		}
	}
	
	async function setPassword() {
		if (passwordForm.password !== passwordForm.confirmPassword) {
			toast.add('Passwords do not match', 'error');
			return;
		}
		
		if (passwordForm.password.length < 6) {
			toast.add('Password must be at least 6 characters', 'error');
			return;
		}
		
		settingPassword = true;
		
		try {
			const { error } = await supabase.auth.updateUser({
				password: passwordForm.password
			});
			
			if (error) {
				toast.add(error.message, 'error');
			} else {
				toast.add('Password set successfully', 'success');
				showPasswordForm = false;
				passwordForm = { password: '', confirmPassword: '' };
				hasPassword = true;
				
				// Refresh user data
				const { data: { user: updatedUser } } = await supabase.auth.getUser();
				if (updatedUser) {
					user = updatedUser;
					identities = user.identities || [];
				}
			}
		} catch (err: any) {
			toast.add(err.message, 'error');
		} finally {
			settingPassword = false;
		}
	}
	
	async function unlinkIdentity(identityId: string, provider: string) {
		// Prevent unlinking if it's the only auth method
		if (identities.length <= 1) {
			toast.add('Cannot remove your only authentication method', 'error');
			return;
		}
		
		// Prevent unlinking password if no other methods exist
		if (provider === 'email' && !hasGoogle) {
			toast.add('Add another authentication method before removing password', 'error');
			return;
		}
		
		if (!confirm(`Are you sure you want to unlink your ${provider} account?`)) {
			return;
		}
		
		unlinking = true;
		
		try {
			const { error } = await supabase.auth.unlinkIdentity({
				identity_id: identityId
			});
			
			if (error) {
				toast.add(error.message, 'error');
			} else {
				toast.add(`${provider} account unlinked successfully`, 'success');
				
				// Refresh user data
				const { data: { user: updatedUser } } = await supabase.auth.getUser();
				if (updatedUser) {
					user = updatedUser;
					identities = user.identities || [];
					hasPassword = identities.some((id: any) => id.provider === 'email');
					hasGoogle = identities.some((id: any) => id.provider === 'google');
				}
			}
		} catch (err: any) {
			toast.add(err.message, 'error');
		} finally {
			unlinking = false;
		}
	}
	
	async function savePhoneNumber() {
		if (!phoneNumber) {
			toast.add('Please enter a phone number', 'error');
			return;
		}
		
		// Allow any format, but ensure it starts with + for international format
		let formattedPhone = phoneNumber.trim();
		
		// If it doesn't start with +, add it
		if (!formattedPhone.startsWith('+')) {
			// If it's just digits and looks like a US number, add +1
			const cleanPhone = formattedPhone.replace(/\D/g, '');
			if (cleanPhone.length === 10) {
				// Likely US number without country code
				formattedPhone = `+1${cleanPhone}`;
			} else {
				// Keep as is but add +
				formattedPhone = `+${cleanPhone}`;
			}
		}
		
		// Basic validation - must have at least 10 digits
		const digitCount = formattedPhone.replace(/\D/g, '').length;
		if (digitCount < 10) {
			toast.add('Please enter a valid phone number with country code (e.g., +1234567890)', 'error');
			return;
		}
		
		savingPhone = true;
		
		try {
			// Save or update phone number
			const { error } = await supabase
				.from('user_profiles')
				.upsert({
					id: user.id,
					phone_number: formattedPhone,
					updated_at: new Date().toISOString()
				});
			
			if (error) {
				console.error('Error saving phone number:', error);
				toast.add('Failed to save phone number', 'error');
			} else {
				phoneNumber = formattedPhone;
				savedPhoneNumber = formattedPhone;
				toast.add('Phone number saved successfully!', 'success');
				
				// Test the phone with a welcome call
				await testWelcomeCall();
			}
		} catch (error) {
			console.error('Error:', error);
			toast.add('Failed to save phone number', 'error');
		} finally {
			savingPhone = false;
		}
	}
	
	async function testWelcomeCall() {
		try {
			const response = await fetch('/api/call', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					phoneNumber: savedPhoneNumber,
					isTestCall: true
				})
			});
			
			const result = await response.json();
			if (result.success) {
				toast.add('Test call initiated! Your phone should ring shortly.', 'info');
			}
		} catch (error) {
			console.error('Welcome call error:', error);
		}
	}
	
	function signOut() {
		supabase.auth.signOut();
		goto('/');
	}
</script>

<Toast />

<nav class="bg-white shadow">
	<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
		<div class="flex justify-between h-16">
			<div class="flex items-center">
				<h1 class="text-xl font-semibold">Account Settings</h1>
			</div>
			<div class="flex items-center space-x-4">
				<a href="/dashboard" class="text-sm text-orange-600 hover:text-orange-700">
					← Back to Dashboard
				</a>
				<button
					on:click={signOut}
					class="text-sm text-gray-500 hover:text-gray-700"
				>
					Sign Out
				</button>
			</div>
		</div>
	</div>
</nav>

<main class="max-w-4xl mx-auto py-6 sm:px-6 lg:px-8">
	<div class="px-4 py-6 sm:px-0">
		{#if loading}
			<div class="flex justify-center items-center h-64">
				<div class="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600"></div>
			</div>
		{:else if user}
			<!-- Phone Number Section -->
			<div class="bg-white rounded-lg shadow p-6 mb-6">
				<h2 class="text-lg font-medium mb-4">Phone Number for Reminders</h2>
				<p class="text-sm text-gray-600 mb-4">
					We'll call this number for your task reminders. Standard calling rates may apply.
					<br />
					<span class="text-xs">Include country code (e.g., +1 for US, +44 for UK, +254 for Kenya)</span>
				</p>
				
				<div class="space-y-4">
					<div>
						<label for="phone" class="block text-sm font-medium text-gray-700 mb-1">
							Phone Number
						</label>
						<div class="flex gap-2">
							<input
								id="phone"
								type="tel"
								bind:value={phoneNumber}
								placeholder="+1234567890 or +44123456789"
								class="flex-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-orange-500 focus:border-orange-500 sm:text-sm"
								disabled={savingPhone}
							/>
							<button
								on:click={savePhoneNumber}
								disabled={savingPhone || phoneNumber === savedPhoneNumber}
								class="px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed"
							>
								{savingPhone ? 'Saving...' : 'Save'}
							</button>
						</div>
						{#if savedPhoneNumber && phoneNumber === savedPhoneNumber}
							<p class="mt-2 text-sm text-green-600 flex items-center gap-1">
								<svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
									<path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/>
								</svg>
								Phone number saved
							</p>
						{/if}
					</div>
					
					{#if savedPhoneNumber}
						<div class="border-t pt-4">
							<button
								on:click={testWelcomeCall}
								class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
							>
								📞 Send Test Call
							</button>
							<p class="mt-2 text-sm text-gray-500">
								Test that your phone number is working correctly
							</p>
						</div>
					{/if}
				</div>
			</div>
			
			<!-- Account Information -->
			<div class="bg-white rounded-lg shadow p-6 mb-6">
				<h2 class="text-lg font-medium mb-4">Account Information</h2>
				<div class="space-y-3">
					<div>
						<label class="block text-sm font-medium text-gray-700">Email</label>
						<p class="mt-1 text-sm text-gray-900">{user.email}</p>
					</div>
					<div>
						<label class="block text-sm font-medium text-gray-700">User ID</label>
						<p class="mt-1 text-sm text-gray-500 font-mono text-xs">{user.id}</p>
					</div>
					<div>
						<label class="block text-sm font-medium text-gray-700">Account Created</label>
						<p class="mt-1 text-sm text-gray-900">
							{new Date(user.created_at).toLocaleDateString()}
						</p>
					</div>
				</div>
			</div>
			
			<!-- Authentication Methods -->
			<div class="bg-white rounded-lg shadow p-6 mb-6">
				<h2 class="text-lg font-medium mb-4">Authentication Methods</h2>
				
				<div class="space-y-4">
					<!-- Current Methods -->
					<div class="border rounded-lg p-4">
						<h3 class="text-sm font-medium text-gray-700 mb-3">Active Methods</h3>
						<div class="space-y-2">
							{#each identities as identity}
								<div class="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
									<div class="flex items-center space-x-3">
										{#if identity.provider === 'google'}
											<svg class="w-5 h-5 text-blue-600" viewBox="0 0 24 24">
												<path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
												<path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
												<path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
												<path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
											</svg>
											<span class="text-sm font-medium">Google</span>
										{:else if identity.provider === 'email'}
											<svg class="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
												<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>
											</svg>
											<span class="text-sm font-medium">Email & Password</span>
										{:else}
											<span class="text-sm font-medium capitalize">{identity.provider}</span>
										{/if}
									</div>
									
									{#if identities.length > 1}
										<button
											on:click={() => unlinkIdentity(identity.id, identity.provider)}
											disabled={unlinking}
											class="text-sm text-red-600 hover:text-red-700 disabled:opacity-50"
										>
											Remove
										</button>
									{/if}
								</div>
							{/each}
						</div>
					</div>
					
					<!-- Add Authentication Methods -->
					<div class="border rounded-lg p-4">
						<h3 class="text-sm font-medium text-gray-700 mb-3">Add Authentication Method</h3>
						
						<!-- Add Google -->
						{#if !hasGoogle}
							<div class="mb-3">
								<button
									on:click={linkGoogleAccount}
									disabled={linking}
									class="w-full flex items-center justify-center space-x-2 px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
								>
									<svg class="w-5 h-5" viewBox="0 0 24 24">
										<path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
										<path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
										<path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
										<path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
									</svg>
									<span>{linking ? 'Linking...' : 'Link Google Account'}</span>
								</button>
							</div>
						{/if}
						
						<!-- Add Password -->
						{#if !hasPassword}
							<div>
								{#if !showPasswordForm}
									<button
										on:click={() => showPasswordForm = true}
										class="w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
									>
										Add Password Authentication
									</button>
								{:else}
									<form on:submit|preventDefault={setPassword} class="space-y-3">
										<div>
											<label for="password" class="block text-sm font-medium text-gray-700">
												New Password
											</label>
											<input
												id="password"
												type="password"
												bind:value={passwordForm.password}
												required
												minlength="6"
												class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-orange-500 focus:border-orange-500 sm:text-sm"
												placeholder="Enter password"
											/>
										</div>
										
										<div>
											<label for="confirmPassword" class="block text-sm font-medium text-gray-700">
												Confirm Password
											</label>
											<input
												id="confirmPassword"
												type="password"
												bind:value={passwordForm.confirmPassword}
												required
												minlength="6"
												class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-orange-500 focus:border-orange-500 sm:text-sm"
												placeholder="Confirm password"
											/>
										</div>
										
										<div class="flex space-x-2">
											<button
												type="submit"
												disabled={settingPassword}
												class="flex-1 px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 disabled:opacity-50"
											>
												{settingPassword ? 'Setting...' : 'Set Password'}
											</button>
											<button
												type="button"
												on:click={() => {
													showPasswordForm = false;
													passwordForm = { password: '', confirmPassword: '' };
												}}
												class="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
											>
												Cancel
											</button>
										</div>
									</form>
								{/if}
							</div>
						{/if}
						
						{#if hasGoogle && hasPassword}
							<p class="text-sm text-gray-500">All available authentication methods are active.</p>
						{/if}
					</div>
				</div>
				
				<div class="mt-4 p-4 bg-blue-50 rounded-lg">
					<p class="text-sm text-blue-800">
						<strong>Note:</strong> Having multiple authentication methods allows you to sign in using any of them. 
						Your account data remains the same regardless of which method you use.
					</p>
				</div>
			</div>
		{/if}
	</div>
</main>

<style>
	/* Add any component-specific styles here */
</style>