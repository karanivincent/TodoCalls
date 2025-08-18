<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { createSupabaseClient } from '$lib/supabase';
	import type { Database } from '$lib/database.types';
	import PhoneInput from '$lib/components/PhoneInput.svelte';
	import Toast from '$lib/components/Toast.svelte';
	import ConfirmModal from '$lib/components/ConfirmModal.svelte';
	import { toast } from '$lib/stores/toast';
	
	type Task = Database['public']['Tables']['tasks']['Row'];
	
	interface PhoneNumber {
		id: string;
		phone_number: string;
		label?: string;
		is_primary: boolean;
		is_verified: boolean;
		created_at: string;
	}
	
	let supabase = createSupabaseClient();
	let user: any = null;
	let userName = '';
	let phoneNumbers: PhoneNumber[] = [];
	let primaryPhone = '';
	let tasks: Task[] = [];
	let loading = true;
	let testingCall = false;
	
	// Phone management
	let showAddPhoneForm = false;
	let newPhone = {
		number: '',
		label: ''
	};
	let savingPhone = false;
	let deletingPhoneId: string | null = null;
	
	// Confirmation modal
	let confirmModal = {
		isOpen: false,
		title: '',
		message: '',
		onConfirm: () => {},
		danger: false
	};
	
	// New task form
	let showNewTaskForm = false;
	let newTask = {
		title: '',
		scheduled_at: '',
		notify_by_phone: true,
		notify_by_text: false,
		notify_by_email: false
	};
	let saving = false;
	
	onMount(async () => {
		// Check if user is authenticated
		const { data: { user: currentUser } } = await supabase.auth.getUser();
		
		if (!currentUser) {
			goto('/auth');
			return;
		}
		
		user = currentUser;
		
		// Get user's full name from metadata or local storage
		if (user.user_metadata?.full_name) {
			userName = user.user_metadata.full_name;
		} else if (typeof window !== 'undefined') {
			// Check localStorage for pending name
			const pendingName = localStorage.getItem('pendingUserName');
			if (pendingName) {
				userName = pendingName;
				// Update user metadata with the name
				await supabase.auth.updateUser({
					data: { full_name: pendingName }
				});
				localStorage.removeItem('pendingUserName');
			}
		}
		
		// Fallback to email username if no name
		if (!userName) {
			userName = user.email?.split('@')[0] || 'User';
		}
		
		await loadPhoneNumbers();
		await loadTasks();
	});
	
	async function loadPhoneNumbers() {
		const { data, error } = await supabase
			.from('phone_numbers')
			.select('*')
			.eq('user_id', user.id)
			.order('is_primary', { ascending: false })
			.order('created_at', { ascending: true });
		
		if (data) {
			phoneNumbers = data;
			const primary = phoneNumbers.find(p => p.is_primary);
			if (primary) {
				primaryPhone = primary.phone_number;
			}
		}
		
		// If no phone numbers exist, check legacy user_profiles
		if (!phoneNumbers.length) {
			const { data: profile } = await supabase
				.from('user_profiles')
				.select('phone_number')
				.eq('id', user.id)
				.single();
			
			if (profile?.phone_number) {
				// Migrate to new system
				await addPhoneNumber(profile.phone_number, 'Primary', true);
			}
		}
	}
	
	async function loadTasks() {
		loading = true;
		const { data, error } = await supabase
			.from('tasks')
			.select('*')
			.eq('user_id', user.id)
			.order('scheduled_at', { ascending: true });
		
		if (data) {
			tasks = data;
		}
		loading = false;
	}
	
	async function addPhoneNumber(number?: string, label?: string, setPrimary?: boolean) {
		const phoneToAdd = number || newPhone.number;
		const phoneLabel = label || newPhone.label;
		
		if (!phoneToAdd) {
			toast.error('Please enter a phone number');
			return;
		}
		
		savingPhone = true;
		
		const { error } = await supabase
			.from('phone_numbers')
			.insert({
				user_id: user.id,
				phone_number: phoneToAdd,
				label: phoneLabel || null,
				is_primary: setPrimary || phoneNumbers.length === 0,
				is_verified: false
			});
		
		if (!error) {
			toast.success('Phone number added successfully!');
			newPhone = { number: '', label: '' };
			showAddPhoneForm = false;
			await loadPhoneNumbers();
		} else {
			if (error.message.includes('duplicate')) {
				toast.error('This phone number is already added');
			} else {
				toast.error(`Error adding phone number: ${error.message}`);
			}
		}
		
		savingPhone = false;
	}
	
	async function setPrimaryPhone(phoneId: string) {
		const { error } = await supabase
			.from('phone_numbers')
			.update({ is_primary: true })
			.eq('id', phoneId);
		
		if (!error) {
			toast.success('Primary phone number updated');
			await loadPhoneNumbers();
		} else {
			toast.error('Failed to update primary phone');
		}
	}
	
	async function deletePhoneNumber(phoneId: string) {
		const phone = phoneNumbers.find(p => p.id === phoneId);
		confirmModal = {
			isOpen: true,
			title: 'Delete Phone Number',
			message: `Are you sure you want to delete ${phone?.phone_number}? This action cannot be undone.`,
			danger: true,
			onConfirm: async () => {
				deletingPhoneId = phoneId;
				
				const { error } = await supabase
					.from('phone_numbers')
					.delete()
					.eq('id', phoneId);
				
				if (!error) {
					toast.success('Phone number removed');
					await loadPhoneNumbers();
				} else {
					toast.error('Failed to delete phone number');
				}
				
				deletingPhoneId = null;
			}
		};
	}
	
	async function createTask() {
		// Check if at least one notification method is selected
		if (!newTask.notify_by_phone && !newTask.notify_by_text && !newTask.notify_by_email) {
			toast.error('Please select at least one notification method');
			return;
		}
		
		// Check if phone number is required
		if ((newTask.notify_by_phone || newTask.notify_by_text) && !primaryPhone) {
			toast.error('Please add and set a primary phone number first');
			return;
		}
		
		saving = true;
		
		const { error } = await supabase
			.from('tasks')
			.insert({
				user_id: user.id,
				title: newTask.title,
				phone_number: primaryPhone,
				scheduled_at: newTask.scheduled_at,
				status: 'pending',
				notify_by_phone: newTask.notify_by_phone,
				notify_by_text: newTask.notify_by_text,
				notify_by_email: newTask.notify_by_email
			});
		
		if (!error) {
			newTask = { 
				title: '', 
				scheduled_at: '',
				notify_by_phone: true,
				notify_by_text: false,
				notify_by_email: false
			};
			showNewTaskForm = false;
			await loadTasks();
			toast.success('Task created successfully!');
		} else {
			toast.error('Error creating task: ' + error.message);
		}
		
		saving = false;
	}
	
	async function completeTask(taskId: string) {
		await supabase
			.from('tasks')
			.update({ 
				status: 'completed',
				completed_at: new Date().toISOString()
			})
			.eq('id', taskId);
		
		await loadTasks();
	}
	
	async function deleteTask(taskId: string) {
		const task = tasks.find(t => t.id === taskId);
		confirmModal = {
			isOpen: true,
			title: 'Delete Task',
			message: `Are you sure you want to delete "${task?.title}"? This action cannot be undone.`,
			danger: true,
			onConfirm: async () => {
				const { error } = await supabase
					.from('tasks')
					.delete()
					.eq('id', taskId);
				
				if (!error) {
					toast.success('Task deleted');
					await loadTasks();
				} else {
					toast.error('Failed to delete task');
				}
			}
		};
	}
	
	async function signOut() {
		await supabase.auth.signOut();
		goto('/');
	}
	
	function formatDate(dateString: string) {
		return new Date(dateString).toLocaleString();
	}
	
	function getMinDateTime() {
		const now = new Date();
		now.setMinutes(now.getMinutes() + 1);
		return now.toISOString().slice(0, 16);
	}
	
	async function testCall(phoneNumber: string) {
		testingCall = true;
		toast.info('Initiating test call...');
		
		try {
			const response = await fetch('/api/call', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({
					phoneNumber: phoneNumber,
					isTestCall: true
				})
			});
			
			const result = await response.json();
			
			if (result.success) {
				toast.success('Call initiated! You should receive a call shortly.');
			} else {
				toast.error('Failed to initiate call: ' + result.error);
			}
		} catch (error: any) {
			toast.error('Error making call: ' + error.message);
		} finally {
			testingCall = false;
		}
	}
</script>

{#each $toast as notification (notification.id)}
	<Toast
		message={notification.message}
		type={notification.type}
		duration={notification.duration}
		onClose={() => toast.remove(notification.id)}
	/>
{/each}

<div class="min-h-screen bg-gray-50">
	<nav class="bg-white shadow">
		<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
			<div class="flex justify-between h-16">
				<div class="flex items-center">
					<h1 class="text-xl font-semibold">Call-Me Todo</h1>
				</div>
				<div class="flex items-center space-x-4">
					{#if user}
						<span class="text-sm font-medium text-gray-700">Hi, {userName}!</span>
						<span class="text-sm text-gray-500">{user.email}</span>
						<button
							on:click={signOut}
							class="text-sm text-gray-500 hover:text-gray-700"
						>
							Sign Out
						</button>
					{/if}
				</div>
			</div>
		</div>
	</nav>

	<main class="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
		<div class="px-4 py-6 sm:px-0">
			<!-- Phone Numbers Section -->
			<div class="bg-white rounded-lg shadow p-6 mb-6">
				<div class="flex justify-between items-center mb-4">
					<h3 class="text-lg font-medium">Your Phone Numbers</h3>
					<button
						on:click={() => showAddPhoneForm = true}
						class="px-3 py-1 bg-orange-600 text-white text-sm rounded-md hover:bg-orange-700 transition-colors"
					>
						Add Number
					</button>
				</div>
				
				{#if phoneNumbers.length > 0}
					<div class="space-y-3">
						{#each phoneNumbers as phone}
							<div class="flex items-center justify-between p-3 border rounded-lg {phone.is_primary ? 'border-orange-500 bg-orange-50' : 'border-gray-200'}">
								<div class="flex-1">
									<div class="flex items-center gap-3">
										<span class="font-medium">{phone.phone_number}</span>
										{#if phone.label}
											<span class="text-sm text-gray-500">({phone.label})</span>
										{/if}
										{#if phone.is_primary}
											<span class="px-2 py-1 text-xs bg-orange-600 text-white rounded-full">Primary</span>
										{/if}
										{#if phone.is_verified}
											<span class="text-green-600">✓ Verified</span>
										{/if}
									</div>
									<div class="text-xs text-gray-500 mt-1">
										Added {new Date(phone.created_at).toLocaleDateString()}
									</div>
								</div>
								<div class="flex items-center gap-2">
									{#if !phone.is_primary}
										<button
											on:click={() => setPrimaryPhone(phone.id)}
											class="px-2 py-1 text-xs bg-gray-600 text-white rounded hover:bg-gray-700"
										>
											Set Primary
										</button>
									{/if}
									<button
										on:click={() => testCall(phone.phone_number)}
										disabled={testingCall}
										class="px-2 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
									>
										Test Call
									</button>
									<button
										on:click={() => deletePhoneNumber(phone.id)}
										disabled={deletingPhoneId === phone.id || (phone.is_primary && phoneNumbers.length === 1)}
										class="px-2 py-1 text-xs bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50"
									>
										Delete
									</button>
								</div>
							</div>
						{/each}
					</div>
				{:else}
					<p class="text-gray-500 text-center py-4">No phone numbers added yet.</p>
				{/if}
				
				{#if showAddPhoneForm}
					<div class="mt-4 p-4 border-2 border-dashed border-gray-300 rounded-lg">
						<h4 class="font-medium mb-3">Add New Phone Number</h4>
						<div class="space-y-3">
							<div>
								<label class="block text-sm font-medium text-gray-700 mb-1">
									Phone Number
								</label>
								<PhoneInput
									bind:value={newPhone.number}
									placeholder="Enter phone number"
								/>
							</div>
							<div>
								<label class="block text-sm font-medium text-gray-700 mb-1">
									Label (optional)
								</label>
								<input
									type="text"
									bind:value={newPhone.label}
									placeholder="e.g., Mobile, Work, Home"
									class="w-full rounded-md border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500 sm:text-sm"
								/>
							</div>
							<div class="flex gap-2">
								<button
									on:click={() => addPhoneNumber()}
									disabled={savingPhone}
									class="px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 disabled:opacity-50"
								>
									{savingPhone ? 'Adding...' : 'Add Number'}
								</button>
								<button
									on:click={() => {showAddPhoneForm = false; newPhone = {number: '', label: ''}}}
									class="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300"
								>
									Cancel
								</button>
							</div>
						</div>
					</div>
				{/if}
			</div>

			<!-- Tasks Section -->
			<div class="flex justify-between items-center mb-6">
				<h2 class="text-2xl font-bold text-gray-900">Your Tasks</h2>
				<button
					on:click={() => showNewTaskForm = true}
					disabled={!primaryPhone}
					class="px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 disabled:opacity-50 transition-colors"
					title={!primaryPhone ? 'Add a phone number first' : ''}
				>
					New Task
				</button>
			</div>

			{#if showNewTaskForm}
				<div class="bg-white shadow rounded-lg p-6 mb-6">
					<h3 class="text-lg font-medium mb-4">Create New Task</h3>
					<form on:submit|preventDefault={createTask} class="space-y-4">
						<div>
							<label for="title" class="block text-sm font-medium text-gray-700">
								Task Title
							</label>
							<input
								id="title"
								type="text"
								bind:value={newTask.title}
								required
								class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500 sm:text-sm"
								placeholder="e.g., Doctor appointment"
							/>
						</div>
						
						<div>
							<label for="scheduled" class="block text-sm font-medium text-gray-700">
								Scheduled Time
							</label>
							<input
								id="scheduled"
								type="datetime-local"
								bind:value={newTask.scheduled_at}
								required
								min={getMinDateTime()}
								class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500 sm:text-sm"
							/>
						</div>
						
						<div>
							<label class="block text-sm font-medium text-gray-700 mb-2">
								Notification Methods
							</label>
							<div class="space-y-2">
								<label class="flex items-center">
									<input
										type="checkbox"
										bind:checked={newTask.notify_by_phone}
										class="h-4 w-4 text-orange-600 focus:ring-orange-500 border-gray-300 rounded"
									/>
									<span class="ml-2 text-sm text-gray-700">📞 Phone Call</span>
								</label>
								<label class="flex items-center">
									<input
										type="checkbox"
										bind:checked={newTask.notify_by_text}
										class="h-4 w-4 text-orange-600 focus:ring-orange-500 border-gray-300 rounded"
									/>
									<span class="ml-2 text-sm text-gray-700">💬 Text Message (SMS)</span>
								</label>
								<label class="flex items-center">
									<input
										type="checkbox"
										bind:checked={newTask.notify_by_email}
										class="h-4 w-4 text-orange-600 focus:ring-orange-500 border-gray-300 rounded"
									/>
									<span class="ml-2 text-sm text-gray-700">📧 Email</span>
								</label>
							</div>
						</div>
						
						{#if (newTask.notify_by_phone || newTask.notify_by_text) && primaryPhone}
							<div class="text-sm text-gray-600">
								Phone/SMS will be sent to: <span class="font-medium">{primaryPhone}</span>
							</div>
						{/if}
						
						{#if newTask.notify_by_email && user}
							<div class="text-sm text-gray-600">
								Email will be sent to: <span class="font-medium">{user.email}</span>
							</div>
						{/if}
						
						<div class="flex space-x-3">
							<button
								type="submit"
								disabled={saving}
								class="flex-1 px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 disabled:opacity-50 transition-colors"
							>
								{saving ? 'Creating...' : 'Create Task'}
							</button>
							<button
								type="button"
								on:click={() => showNewTaskForm = false}
								class="flex-1 px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300"
							>
								Cancel
							</button>
						</div>
					</form>
				</div>
			{/if}

			{#if loading}
				<div class="text-center py-12">
					<p class="text-gray-500">Loading tasks...</p>
				</div>
			{:else if tasks.length === 0}
				<div class="text-center py-12 bg-white rounded-lg shadow">
					<p class="text-gray-500">No tasks yet. Create your first task!</p>
				</div>
			{:else}
				<div class="bg-white shadow overflow-hidden sm:rounded-md">
					<ul class="divide-y divide-gray-200">
						{#each tasks as task}
							<li class="px-6 py-4">
								<div class="flex items-center justify-between">
									<div class="flex-1">
										<h3 class="text-lg font-medium text-gray-900">{task.title}</h3>
										<div class="mt-1 flex items-center space-x-4 text-sm text-gray-500">
											<span>📅 {formatDate(task.scheduled_at)}</span>
											<span class="px-2 py-1 text-xs rounded-full
												{task.status === 'completed' ? 'bg-green-100 text-green-800' : ''}
												{task.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : ''}
												{task.status === 'failed' ? 'bg-red-100 text-red-800' : ''}
											">
												{task.status}
											</span>
										</div>
										<div class="mt-2 flex items-center space-x-3 text-xs text-gray-400">
											{#if task.notify_by_phone}
												<span class="flex items-center">
													<span class="mr-1">📞</span> Phone
												</span>
											{/if}
											{#if task.notify_by_text}
												<span class="flex items-center">
													<span class="mr-1">💬</span> SMS
												</span>
											{/if}
											{#if task.notify_by_email}
												<span class="flex items-center">
													<span class="mr-1">📧</span> Email
												</span>
											{/if}
										</div>
									</div>
									<div class="flex items-center space-x-2">
										{#if task.status === 'pending'}
											<button
												on:click={() => completeTask(task.id)}
												class="px-3 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700"
											>
												Complete
											</button>
										{/if}
										<button
											on:click={() => deleteTask(task.id)}
											class="px-3 py-1 text-sm bg-red-600 text-white rounded hover:bg-red-700"
										>
											Delete
										</button>
									</div>
								</div>
							</li>
						{/each}
					</ul>
				</div>
			{/if}
		</div>
	</main>
</div>

<ConfirmModal
	bind:isOpen={confirmModal.isOpen}
	title={confirmModal.title}
	message={confirmModal.message}
	danger={confirmModal.danger}
	onConfirm={confirmModal.onConfirm}
	confirmText="Delete"
	cancelText="Cancel"
/>