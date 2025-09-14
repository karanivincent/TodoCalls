<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { createSupabaseClient } from '$lib/supabase';
	import Toast from '$lib/components/Toast.svelte';
	import { toast } from '$lib/stores/toast';
	import { getUserTimezone, commonTimezones } from '$lib/utils/timezone';
	import PhoneInput from '$lib/components/PhoneInput.svelte';
	import VerificationCodeInput from '$lib/components/VerificationCodeInput.svelte';
	
	let supabase = createSupabaseClient();
	let user: any = null;
	let identities: any[] = [];
	let loading = true;
	let linking = false;
	let unlinking = false;
	
	// Phone number management - new approach with verification
	type PhoneNumberRecord = {
		id: string;
		phone_number: string;
		label?: string;
		is_primary: boolean;
		is_verified: boolean;
		is_whatsapp_primary?: boolean;
		created_at: string;
	};
	
	let phoneNumbers: PhoneNumberRecord[] = [];
	let newPhoneNumber = '';
	let newPhoneLabel = '';
	let isPhoneValid = false;
	let savingPhone = false;
	let verifyingPhone = false;
	let pendingVerification: { phoneId: string; phoneNumber: string } | null = null;
	let verificationCode = '';
	let resendCooldown = 0;
	let resendTimer: NodeJS.Timeout | null = null;
	let verificationError = '';
	
	// Phone number visibility state
	let visiblePhoneNumbers: Set<string> = new Set();
	
	function maskPhoneNumber(phone: string): string {
		// Show first 3 and last 2 digits
		if (phone.length > 8) {
			const first = phone.substring(0, 3);
			const last = phone.substring(phone.length - 2);
			const middle = '•'.repeat(phone.length - 5);
			return `${first}${middle}${last}`;
		}
		return phone;
	}
	
	function togglePhoneVisibility(phoneId: string) {
		if (visiblePhoneNumbers.has(phoneId)) {
			visiblePhoneNumbers.delete(phoneId);
		} else {
			visiblePhoneNumbers.add(phoneId);
		}
		visiblePhoneNumbers = visiblePhoneNumbers; // Trigger reactivity
	}
	
	// Timezone management
	let userTimezone = 'Africa/Nairobi';
	let savedTimezone = 'Africa/Nairobi';
	let savingTimezone = false;
	
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
		
		// Load phone numbers and timezone
		await Promise.all([
			loadPhoneNumbers(),
			loadTimezone()
		]);
		
		loading = false;
	});
	
	async function loadPhoneNumbers() {
		const { data, error } = await supabase
			.from('phone_numbers')
			.select('*')
			.eq('user_id', user.id)
			.order('is_primary', { ascending: false })
			.order('created_at', { ascending: true });
		
		if (error) {
			console.error('Error loading phone numbers:', error);
			toast.add('Failed to load phone numbers', 'error');
		} else {
			phoneNumbers = data || [];
		}
	}
	
	async function loadTimezone() {
		const { data: profile } = await supabase
			.from('user_profiles')
			.select('timezone')
			.eq('id', user.id)
			.single();
		
		if (profile?.timezone) {
			userTimezone = profile.timezone;
			savedTimezone = profile.timezone;
		} else {
			// Auto-detect timezone if not set
			const detectedTimezone = getUserTimezone();
			userTimezone = detectedTimezone;
		}
	}
	
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
	
	async function addPhoneNumber() {
		if (!newPhoneNumber || !isPhoneValid) {
			toast.error('Please enter a valid phone number');
			return;
		}
		
		// Check if number already exists
		const existingNumber = phoneNumbers.find(p => p.phone_number === newPhoneNumber);
		if (existingNumber) {
			toast.error('This phone number is already added');
			return;
		}
		
		savingPhone = true;
		
		try {
			// Determine if this should be primary (first number)
			const isPrimary = phoneNumbers.length === 0;
			
			console.log('Adding phone number:', {
				user_id: user.id,
				phone_number: newPhoneNumber,
				is_primary: isPrimary
			});
			
			// Add phone number to database
			const { data, error } = await supabase
				.from('phone_numbers')
				.insert({
					user_id: user.id,
					phone_number: newPhoneNumber,
					label: newPhoneLabel.trim() || (isPrimary ? 'Primary' : 'Mobile'),
					is_primary: isPrimary,
					is_verified: false
				})
				.select()
				.single();
			
			console.log('Phone number insert result:', { data, error });
			
			if (error) {
				console.error('Error saving phone number:', error);
				toast.error('Failed to save phone number');
				return;
			}
			
			if (!data || !data.id) {
				console.error('Phone number inserted but no data returned');
				toast.error('Failed to save phone number - no ID returned');
				return;
			}
			
			// Reload phone numbers
			await loadPhoneNumbers();
			
			// Immediately start verification process
			await sendVerificationCode(data.id, newPhoneNumber);
			
			// Clear form
			newPhoneNumber = '';
			newPhoneLabel = '';
			isPhoneValid = false;
			
		} catch (error) {
			console.error('Error:', error);
			toast.error('Failed to save phone number');
		} finally {
			savingPhone = false;
		}
	}
	
	async function sendVerificationCode(phoneId: string, phoneNumber: string) {
		verifyingPhone = true;
		
		try {
			const { data: { session } } = await supabase.auth.getSession();
			if (!session) {
				toast.error('Please sign in again');
				return;
			}
			
			const response = await fetch('/api/verify/send', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					'Authorization': `Bearer ${session.access_token}`
				},
				body: JSON.stringify({ phoneNumber, phoneId })
			});
			
			const result = await response.json();
			
			if (result.success) {
				pendingVerification = { phoneId, phoneNumber };
				verificationCode = '';
				startResendCooldown();
				toast.success(`Verification code sent to ${phoneNumber}`);
			} else {
				toast.error(result.error || 'Failed to send verification code');
			}
		} catch (error) {
			console.error('Error sending verification:', error);
			toast.error('Failed to send verification code');
		} finally {
			verifyingPhone = false;
		}
	}
	
	async function verifyPhoneNumber(code: string) {
		if (!pendingVerification) return;
		
		verifyingPhone = true;
		verificationError = '';
		
		try {
			const { data: { session } } = await supabase.auth.getSession();
			if (!session) {
				verificationError = 'Please sign in again';
				return;
			}
			
			// Add timeout to prevent hanging
			const controller = new AbortController();
			const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout
			
			const response = await fetch('/api/verify/check', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					'Authorization': `Bearer ${session.access_token}`
				},
				body: JSON.stringify({
					phoneNumber: pendingVerification.phoneNumber,
					phoneId: pendingVerification.phoneId,
					code
				}),
				signal: controller.signal
			});
			
			clearTimeout(timeoutId);
			
			if (!response.ok) {
				throw new Error(`HTTP ${response.status}: ${response.statusText}`);
			}
			
			const result = await response.json();
			
			if (result.success) {
				toast.success('Phone number verified successfully! 🎉');
				const phoneId = pendingVerification.phoneId;
				pendingVerification = null;
				verificationCode = '';
				await loadPhoneNumbers();
				
				// Send test call to verified number
				await testPhoneNumber(phoneId);
			} else {
				verificationError = result.error || result.message || 'Invalid verification code';
				console.error('Verification failed:', result);
			}
		} catch (error: any) {
			console.error('Error verifying code:', error);
			if (error.name === 'AbortError') {
				verificationError = 'Request timed out. Please try again.';
			} else if (error.message?.includes('Failed to fetch')) {
				verificationError = 'Network error. Please check your connection.';
			} else {
				verificationError = 'Failed to verify code. Please try again.';
			}
		} finally {
			verifyingPhone = false;
		}
	}
	
	async function testPhoneNumber(phoneId: string) {
		const phone = phoneNumbers.find(p => p.id === phoneId);
		if (!phone || !phone.is_verified) {
			toast.add('Phone number must be verified first', 'error');
			return;
		}
		
		try {
			const response = await fetch('/api/call', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					phoneNumber: phone.phone_number,
					isTestCall: true
				})
			});
			
			const result = await response.json();
			if (result.success) {
				toast.add('Test call initiated! Your phone should ring shortly.', 'info');
			} else {
				toast.add('Failed to initiate test call', 'error');
			}
		} catch (error) {
			console.error('Test call error:', error);
			toast.add('Failed to initiate test call', 'error');
		}
	}
	
	async function setPrimaryPhone(phoneId: string) {
		try {
			// Update all numbers to not primary, then set the selected one as primary
			const { error } = await supabase
				.from('phone_numbers')
				.update({ is_primary: false })
				.eq('user_id', user.id);
			
			if (error) throw error;
			
			const { error: primaryError } = await supabase
				.from('phone_numbers')
				.update({ is_primary: true })
				.eq('id', phoneId);
			
			if (primaryError) throw primaryError;
			
			await loadPhoneNumbers();
			toast.add('Primary phone number updated', 'success');
		} catch (error) {
			console.error('Error setting primary phone:', error);
			toast.add('Failed to update primary phone', 'error');
		}
	}
	
	async function setWhatsAppPrimary(phoneNumber: string) {
		try {
			const response = await fetch('/api/phone/claim-whatsapp', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ phoneNumber })
			});

			if (!response.ok) {
				const error = await response.json();
				throw new Error(error.message || 'Failed to set WhatsApp primary');
			}

			await loadPhoneNumbers();
			toast.add('WhatsApp primary number updated. Messages from this number will now create tasks for your account.', 'success');
		} catch (error: any) {
			console.error('Error setting WhatsApp primary:', error);
			toast.add(error.message || 'Failed to update WhatsApp primary', 'error');
		}
	}

	async function removePhoneNumber(phoneId: string) {
		const phone = phoneNumbers.find(p => p.id === phoneId);
		if (!phone) return;
		
		if (phone.is_primary && phoneNumbers.length > 1) {
			toast.add('Cannot remove primary phone number. Set another as primary first.', 'error');
			return;
		}
		
		if (!confirm(`Remove ${phone.phone_number}?`)) return;
		
		try {
			const { error } = await supabase
				.from('phone_numbers')
				.delete()
				.eq('id', phoneId);
			
			if (error) throw error;
			
			await loadPhoneNumbers();
			toast.add('Phone number removed', 'success');
			
			// Clear pending verification if it was for this number
			if (pendingVerification?.phoneId === phoneId) {
				pendingVerification = null;
				verificationCode = '';
			}
		} catch (error) {
			console.error('Error removing phone number:', error);
			toast.add('Failed to remove phone number', 'error');
		}
	}
	
	function startResendCooldown() {
		resendCooldown = 30; // 30 seconds
		resendTimer = setInterval(() => {
			resendCooldown--;
			if (resendCooldown <= 0) {
				clearInterval(resendTimer!);
				resendTimer = null;
			}
		}, 1000);
	}
	
	function cancelVerification() {
		pendingVerification = null;
		verificationCode = '';
		if (resendTimer) {
			clearInterval(resendTimer);
			resendTimer = null;
			resendCooldown = 0;
		}
	}
	
	// Phone input handlers
	function handlePhoneChange({ detail }: { detail: { value: string; isValid: boolean } }) {
		newPhoneNumber = detail.value;
		isPhoneValid = detail.isValid;
	}
	
	function handlePhoneSubmit() {
		if (isPhoneValid) {
			addPhoneNumber();
		}
	}
	
	// Verification handlers
	function handleVerificationComplete({ detail }: { detail: { code: string } }) {
		verifyPhoneNumber(detail.code);
	}
	
	async function resendCode() {
		if (!pendingVerification || resendCooldown > 0) return;
		await sendVerificationCode(pendingVerification.phoneId, pendingVerification.phoneNumber);
	}
	
	async function saveTimezone() {
		if (!userTimezone) {
			toast.add('Please select a timezone', 'error');
			return;
		}
		
		savingTimezone = true;
		
		try {
			const { error } = await supabase
				.from('user_profiles')
				.upsert({
					id: user.id,
					timezone: userTimezone,
					updated_at: new Date().toISOString()
				});
			
			if (error) {
				console.error('Error saving timezone:', error);
				toast.add('Failed to save timezone', 'error');
			} else {
				savedTimezone = userTimezone;
				toast.add('Timezone saved successfully!', 'success');
			}
		} catch (error) {
			console.error('Error:', error);
			toast.add('Failed to save timezone', 'error');
		} finally {
			savingTimezone = false;
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
			<!-- Phone Numbers Section -->
			<div class="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">
				<div class="flex items-center gap-3 mb-4">
					<div class="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
						<svg class="w-5 h-5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"/>
						</svg>
					</div>
					<h2 class="text-xl font-semibold text-gray-900">Phone Numbers</h2>
				</div>
				<p class="text-sm text-gray-600 mb-6">
					Manage your phone numbers for task reminders. All numbers must be verified before receiving calls.
				</p>
				
				<!-- Existing Phone Numbers -->
				{#if phoneNumbers.length > 0}
					<div class="space-y-3 mb-6">
						<h3 class="text-sm font-medium text-gray-700">Your Numbers</h3>
						{#each phoneNumbers as phone}
							<div class="flex items-center justify-between p-4 bg-gray-50 rounded-xl border transition-all hover:shadow-sm">
								<div class="flex items-center gap-3">
									<!-- Status indicator -->
									<div class="relative">
										{#if phone.is_verified}
											<div class="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
												<svg class="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
													<path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/>
												</svg>
											</div>
											{#if phone.is_primary}
												<div class="absolute -top-1 -right-1 w-4 h-4 bg-orange-500 rounded-full flex items-center justify-center">
													<svg class="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 20 20">
														<path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
													</svg>
												</div>
											{/if}
										{:else}
											<div class="w-8 h-8 bg-amber-100 border-2 border-amber-300 rounded-full flex items-center justify-center animate-pulse">
												<svg class="w-4 h-4 text-amber-600" fill="currentColor" viewBox="0 0 20 20">
													<path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd"/>
												</svg>
											</div>
										{/if}
									</div>
									
									<div class="flex-1">
										<div class="flex items-center gap-2">
											<span class="font-medium text-gray-900 font-mono">
												{visiblePhoneNumbers.has(phone.id) ? phone.phone_number : maskPhoneNumber(phone.phone_number)}
											</span>
											<button
												on:click={() => togglePhoneVisibility(phone.id)}
												class="p-1 hover:bg-gray-200 rounded transition-all"
												title={visiblePhoneNumbers.has(phone.id) ? 'Hide number' : 'Show number'}
											>
												{#if visiblePhoneNumbers.has(phone.id)}
													<svg class="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
														<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"/>
													</svg>
												{:else}
													<svg class="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
														<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
														<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>
													</svg>
												{/if}
											</button>
											{#if phone.is_primary}
												<span class="px-2 py-1 bg-orange-100 text-orange-700 text-xs font-medium rounded-full">Primary</span>
											{/if}
											{#if phone.is_verified}
												<span class="px-2 py-1 bg-green-100 text-green-700 text-xs font-medium rounded-full">Verified</span>
											{:else}
												<span class="px-2 py-1 bg-amber-100 text-amber-700 text-xs font-medium rounded-full animate-pulse">Pending Verification</span>
											{/if}
										</div>
										{#if phone.label}
											<p class="text-sm text-gray-500">{phone.label}</p>
										{/if}
									</div>
								</div>
								
								<div class="flex items-center gap-2">
									{#if !phone.is_verified}
										<button
											on:click={() => sendVerificationCode(phone.id, phone.phone_number)}
											disabled={verifyingPhone}
											class="px-3 py-1.5 bg-orange-600 text-white text-sm rounded-lg hover:bg-orange-700 disabled:opacity-50 transition-all"
										>
											Verify
										</button>
									{:else}
										<button
											on:click={() => testPhoneNumber(phone.id)}
											class="px-3 py-1.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-all"
										>
											Test Call
										</button>
										{#if !phone.is_primary}
											<button
												on:click={() => setPrimaryPhone(phone.id)}
												class="px-3 py-1.5 bg-gray-100 text-gray-700 text-sm rounded-lg hover:bg-gray-200 transition-all"
											>
												Make Primary
											</button>
										{/if}
										{#if phone.is_verified}
											<button
												on:click={() => setWhatsAppPrimary(phone.phone_number)}
												class="px-3 py-1.5 text-sm rounded-lg transition-all {phone.is_whatsapp_primary 
													? 'bg-green-100 text-green-700' 
													: 'bg-gray-100 text-gray-700 hover:bg-green-50 hover:text-green-600'}"
												title={phone.is_whatsapp_primary ? 'WhatsApp primary' : 'Set as WhatsApp primary'}
											>
												<span class="flex items-center gap-1">
													<svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
														<path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.149-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
													</svg>
													{phone.is_whatsapp_primary ? 'WhatsApp ✓' : 'WhatsApp'}
												</span>
											</button>
										{/if}
									{/if}
									<button
										on:click={() => removePhoneNumber(phone.id)}
										class="p-1.5 text-gray-400 hover:text-red-500 rounded-lg hover:bg-red-50 transition-all"
										title="Remove number"
									>
										<svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
											<path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd"/>
										</svg>
									</button>
								</div>
							</div>
						{/each}
					</div>
				{/if}
				
				<!-- Add New Phone Number -->
				{#if !pendingVerification}
					<div class="border-2 border-dashed border-gray-200 rounded-xl p-6 hover:border-orange-300 transition-all">
						<h3 class="text-sm font-medium text-gray-700 mb-4">Add New Phone Number</h3>
						
						<div class="space-y-4">
							<div>
								<label class="block text-sm font-medium text-gray-700 mb-2">
									Phone Number
								</label>
								<PhoneInput
									value={newPhoneNumber}
									disabled={savingPhone}
									loading={savingPhone}
									placeholder="+1 (555) 123-4567"
									on:change={handlePhoneChange}
									on:submit={handlePhoneSubmit}
								/>
							</div>
							
							<div>
								<label class="block text-sm font-medium text-gray-700 mb-2">
									Label (optional)
								</label>
								<input
									type="text"
									bind:value={newPhoneLabel}
									placeholder="Mobile, Work, Home..."
									class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
									disabled={savingPhone}
								/>
							</div>
							
							<button
								on:click={addPhoneNumber}
								disabled={!isPhoneValid || savingPhone}
								class="w-full px-4 py-3 bg-gradient-to-r from-orange-500 to-orange-600 text-white font-medium rounded-xl hover:from-orange-600 hover:to-orange-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98]"
							>
								{#if savingPhone}
									<div class="flex items-center justify-center gap-2">
										<div class="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full"></div>
										Adding...
									</div>
								{:else}
									Add & Verify Number
								{/if}
							</button>
						</div>
					</div>
				{/if}
				
				<!-- Verification Modal -->
				{#if pendingVerification}
					<div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
						<div class="bg-white rounded-2xl p-8 max-w-md w-full mx-4 transform transition-all duration-300 scale-100">
							<div class="text-center mb-6">
								<div class="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
									<svg class="w-8 h-8 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/>
									</svg>
								</div>
								<h3 class="text-lg font-semibold text-gray-900 mb-2">Verify Your Number</h3>
								<p class="text-sm text-gray-600">
									We sent a 6-digit code to<br>
									<span class="font-medium text-gray-900">{pendingVerification.phoneNumber}</span>
								</p>
							</div>
							
							<div class="mb-6">
								<VerificationCodeInput
									length={6}
									disabled={verifyingPhone}
									loading={verifyingPhone}
									autoFocus={true}
									error={verificationError}
									on:complete={handleVerificationComplete}
								/>
							</div>
							
							<div class="flex flex-col gap-3">
								<button
									on:click={resendCode}
									disabled={resendCooldown > 0 || verifyingPhone}
									class="text-sm text-orange-600 hover:text-orange-700 disabled:opacity-50 disabled:cursor-not-allowed"
								>
									{#if resendCooldown > 0}
										Resend code in {resendCooldown}s
									{:else}
										Resend code
									{/if}
								</button>
								
								<button
									on:click={cancelVerification}
									class="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-all"
								>
									Cancel
								</button>
							</div>
						</div>
					</div>
				{/if}
			</div>
			
			<!-- Timezone Settings -->
			<div class="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">
				<div class="flex items-center gap-3 mb-4">
					<div class="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
						<svg class="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
						</svg>
					</div>
					<h2 class="text-xl font-semibold text-gray-900">Timezone Settings</h2>
				</div>
				<p class="text-sm text-gray-600 mb-4">
					Set your timezone to ensure reminders are scheduled at the correct time for your location.
				</p>
				
				<div class="space-y-4">
					<div>
						<label for="timezone" class="block text-sm font-medium text-gray-700 mb-1">
							Your Timezone
						</label>
						<div class="flex gap-2">
							<select
								id="timezone"
								bind:value={userTimezone}
								class="flex-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-orange-500 focus:border-orange-500 sm:text-sm"
								disabled={savingTimezone}
							>
								{#each commonTimezones as tz}
									<option value={tz.value}>{tz.label}</option>
								{/each}
							</select>
							<button
								on:click={saveTimezone}
								disabled={savingTimezone || userTimezone === savedTimezone}
								class="px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed"
							>
								{savingTimezone ? 'Saving...' : 'Save'}
							</button>
						</div>
						{#if savedTimezone && userTimezone === savedTimezone}
							<p class="mt-2 text-sm text-green-600 flex items-center gap-1">
								<svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
									<path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/>
								</svg>
								Timezone saved - {savedTimezone}
							</p>
						{/if}
						<p class="mt-2 text-xs text-gray-500">
							Current time in your timezone: {new Date().toLocaleString('en-US', { timeZone: userTimezone, dateStyle: 'short', timeStyle: 'short' })}
						</p>
					</div>
				</div>
			</div>
			
			<!-- Account Information -->
			<div class="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">
				<div class="flex items-center gap-3 mb-4">
					<div class="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
						<svg class="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>
						</svg>
					</div>
					<h2 class="text-xl font-semibold text-gray-900">Account Information</h2>
				</div>
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
			<div class="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">
				<div class="flex items-center gap-3 mb-4">
					<div class="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
						<svg class="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/>
						</svg>
					</div>
					<h2 class="text-xl font-semibold text-gray-900">Authentication Methods</h2>
				</div>
				
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
						
						<!-- Password Management -->
						{#if !hasPassword}
							<!-- Add Password for OAuth users -->
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
						{:else}
							<!-- Change Password for users with passwords -->
							<div class="space-y-3">
								<p class="text-sm text-gray-600">
									You already have password authentication enabled.
								</p>
								<button
									on:click={async () => {
										const { error } = await supabase.auth.resetPasswordForEmail(user.email, {
											redirectTo: `${window.location.origin}/auth/reset-password`
										});
										if (error) {
											toast.add('Failed to send reset email: ' + error.message, 'error');
										} else {
											toast.add('Password reset link sent to your email!', 'success');
										}
									}}
									class="w-full px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 transition-colors"
								>
									Change Password
								</button>
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