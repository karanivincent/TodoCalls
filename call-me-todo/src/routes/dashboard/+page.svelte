<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { createSupabaseClient } from '$lib/supabase';
	import type { Database } from '$lib/database.types';
	import PhoneInput from '$lib/components/PhoneInput.svelte';
	import Toast from '$lib/components/Toast.svelte';
	import { toast } from '$lib/stores/toast';
	
	type Task = Database['public']['Tables']['tasks']['Row'];
	
	let supabase = createSupabaseClient();
	let user: any = null;
	let userPhone = '';
	let tasks: Task[] = [];
	let loading = true;
	let testingCall = false;
	
	// New task form
	let showNewTaskForm = false;
	let newTask = {
		title: '',
		scheduled_at: ''
	};
	let saving = false;
	let savingPhone = false;
	
	onMount(async () => {
		// Check if user is authenticated
		const { data: { user: currentUser } } = await supabase.auth.getUser();
		
		if (!currentUser) {
			goto('/auth');
			return;
		}
		
		user = currentUser;
		
		// Load user profile to get phone number
		const { data: profile } = await supabase
			.from('user_profiles')
			.select('phone_number')
			.eq('id', user.id)
			.single();
		
		if (profile?.phone_number) {
			userPhone = profile.phone_number;
		}
		
		await loadTasks();
	});
	
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
	
	async function createTask() {
		if (!userPhone) {
			toast.error('Please save your phone number first');
			return;
		}
		
		saving = true;
		
		const { error } = await supabase
			.from('tasks')
			.insert({
				user_id: user.id,
				title: newTask.title,
				phone_number: userPhone,
				scheduled_at: newTask.scheduled_at,
				status: 'pending'
			});
		
		if (!error) {
			newTask = { title: '', scheduled_at: '' };
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
		if (confirm('Are you sure you want to delete this task?')) {
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
	
	async function savePhoneNumber() {
		if (!userPhone) {
			toast.error('Please enter a phone number');
			return;
		}
		
		savingPhone = true;
		
		const { error } = await supabase
			.from('user_profiles')
			.upsert({
				id: user.id,
				phone_number: userPhone,
				updated_at: new Date().toISOString()
			});
		
		if (!error) {
			toast.success('Phone number saved successfully!');
		} else {
			toast.error(`Could not save phone number: ${error.message}`);
		}
		
		savingPhone = false;
	}
	
	async function testCall() {
		if (!userPhone) {
			toast.error('Please set your phone number first');
			return;
		}
		
		testingCall = true;
		toast.info('Initiating test call...');
		
		try {
			const response = await fetch('/api/call', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({
					phoneNumber: userPhone,
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
			<!-- Phone Number Setup -->
			<div class="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
				<h3 class="text-lg font-medium mb-2">Your Phone Number</h3>
				<div class="flex flex-col sm:flex-row gap-3">
					<PhoneInput
						bind:value={userPhone}
						placeholder="Enter your phone number"
						className="flex-1"
					/>
					<div class="flex gap-2">
						<button
							on:click={savePhoneNumber}
							disabled={savingPhone || !userPhone}
							class="px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 disabled:opacity-50 transition-colors"
						>
							{savingPhone ? 'Saving...' : 'Save'}
						</button>
						<button
							on:click={testCall}
							disabled={testingCall || !userPhone}
							class="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 transition-colors"
						>
							{testingCall ? 'Calling...' : 'Test AI Call'}
						</button>
					</div>
				</div>
				<p class="mt-2 text-sm text-gray-600">
					Test call will demonstrate the AI assistant powered by OpenAI. Select your country and enter your phone number.
				</p>
			</div>

			<div class="flex justify-between items-center mb-6">
				<h2 class="text-2xl font-bold text-gray-900">Your Tasks</h2>
				<button
					on:click={() => showNewTaskForm = true}
					class="px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 transition-colors"
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