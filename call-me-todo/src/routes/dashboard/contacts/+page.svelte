<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { createSupabaseClient } from '$lib/supabase';
	
	interface ContactMessage {
		id: string;
		name: string;
		email: string;
		message: string;
		created_at: string;
		status: string;
		replied_at?: string;
		notes?: string;
	}
	
	let supabase = createSupabaseClient();
	let messages: ContactMessage[] = [];
	let loading = true;
	let selectedMessage: ContactMessage | null = null;
	
	onMount(async () => {
		// Check authentication
		const { data: { user } } = await supabase.auth.getUser();
		if (!user) {
			goto('/auth');
			return;
		}
		
		// Load contact messages
		await loadMessages();
	});
	
	async function loadMessages() {
		loading = true;
		
		const { data, error } = await supabase
			.from('contact_messages')
			.select('*')
			.order('created_at', { ascending: false });
		
		if (error) {
			console.error('Error loading messages:', error);
		} else {
			messages = data || [];
		}
		
		loading = false;
	}
	
	async function markAsRead(message: ContactMessage) {
		if (message.status === 'read') return;
		
		const { error } = await supabase
			.from('contact_messages')
			.update({ status: 'read' })
			.eq('id', message.id);
		
		if (!error) {
			message.status = 'read';
			messages = messages; // Trigger reactivity
		}
	}
	
	async function markAsReplied(message: ContactMessage) {
		const { error } = await supabase
			.from('contact_messages')
			.update({ 
				status: 'replied',
				replied_at: new Date().toISOString()
			})
			.eq('id', message.id);
		
		if (!error) {
			message.status = 'replied';
			message.replied_at = new Date().toISOString();
			messages = messages; // Trigger reactivity
		}
	}
	
	function formatDate(date: string) {
		return new Date(date).toLocaleString();
	}
</script>

<div class="min-h-screen bg-gray-50">
	<!-- Header -->
	<nav class="bg-white shadow">
		<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
			<div class="flex justify-between h-16">
				<div class="flex items-center">
					<a href="/dashboard" class="text-gray-500 hover:text-gray-700">← Back to Dashboard</a>
				</div>
				<div class="flex items-center">
					<h1 class="text-xl font-semibold">Contact Messages</h1>
				</div>
			</div>
		</div>
	</nav>
	
	<main class="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
		<div class="px-4 py-6 sm:px-0">
			{#if loading}
				<div class="text-center py-12">
					<div class="inline-flex items-center gap-2">
						<svg class="animate-spin h-5 w-5 text-orange-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
							<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
							<path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
						</svg>
						Loading messages...
					</div>
				</div>
			{:else if messages.length === 0}
				<div class="text-center py-12">
					<svg xmlns="http://www.w3.org/2000/svg" class="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
					</svg>
					<h3 class="mt-2 text-sm font-medium text-gray-900">No messages</h3>
					<p class="mt-1 text-sm text-gray-500">Contact messages will appear here.</p>
				</div>
			{:else}
				<div class="bg-white shadow overflow-hidden sm:rounded-lg">
					<ul class="divide-y divide-gray-200">
						{#each messages as message}
							<li class="hover:bg-gray-50 cursor-pointer" on:click={() => {selectedMessage = message; markAsRead(message);}}>
								<div class="px-4 py-4 sm:px-6">
									<div class="flex items-center justify-between">
										<div class="flex items-center">
											<p class="text-sm font-medium text-gray-900 truncate">
												{message.name}
											</p>
											{#if message.status === 'unread'}
												<span class="ml-2 px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
													New
												</span>
											{:else if message.status === 'replied'}
												<span class="ml-2 px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
													Replied
												</span>
											{/if}
										</div>
										<div class="ml-2 flex-shrink-0 flex">
											<p class="text-sm text-gray-500">
												{formatDate(message.created_at)}
											</p>
										</div>
									</div>
									<div class="mt-2 sm:flex sm:justify-between">
										<div class="sm:flex">
											<p class="text-sm text-gray-500">
												{message.email}
											</p>
										</div>
										<div class="mt-2 flex items-center text-sm text-gray-500 sm:mt-0">
											<p class="truncate">{message.message}</p>
										</div>
									</div>
								</div>
							</li>
						{/each}
					</ul>
				</div>
			{/if}
		</div>
	</main>
	
	<!-- Message Detail Modal -->
	{#if selectedMessage}
		<div class="fixed inset-0 z-50 overflow-y-auto">
			<div class="flex items-center justify-center min-h-screen px-4">
				<div class="fixed inset-0 bg-black bg-opacity-30" on:click={() => selectedMessage = null}></div>
				
				<div class="relative bg-white rounded-lg max-w-2xl w-full p-6">
					<div class="mb-4">
						<h3 class="text-lg font-medium text-gray-900">Contact Message</h3>
					</div>
					
					<div class="space-y-4">
						<div>
							<label class="block text-sm font-medium text-gray-700">From</label>
							<p class="mt-1 text-sm text-gray-900">{selectedMessage.name}</p>
						</div>
						
						<div>
							<label class="block text-sm font-medium text-gray-700">Email</label>
							<p class="mt-1 text-sm text-gray-900">
								<a href="mailto:{selectedMessage.email}" class="text-orange-600 hover:text-orange-700">
									{selectedMessage.email}
								</a>
							</p>
						</div>
						
						<div>
							<label class="block text-sm font-medium text-gray-700">Received</label>
							<p class="mt-1 text-sm text-gray-900">{formatDate(selectedMessage.created_at)}</p>
						</div>
						
						<div>
							<label class="block text-sm font-medium text-gray-700">Message</label>
							<p class="mt-1 text-sm text-gray-900 whitespace-pre-wrap">{selectedMessage.message}</p>
						</div>
						
						{#if selectedMessage.replied_at}
							<div>
								<label class="block text-sm font-medium text-gray-700">Replied At</label>
								<p class="mt-1 text-sm text-gray-900">{formatDate(selectedMessage.replied_at)}</p>
							</div>
						{/if}
					</div>
					
					<div class="mt-6 flex gap-3">
						<a 
							href="mailto:{selectedMessage.email}?subject=Re: Your message to TeliTask"
							on:click={() => markAsReplied(selectedMessage)}
							class="inline-flex justify-center px-4 py-2 text-sm font-medium text-white bg-orange-600 border border-transparent rounded-md hover:bg-orange-700"
						>
							Reply via Email
						</a>
						<button
							on:click={() => selectedMessage = null}
							class="inline-flex justify-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
						>
							Close
						</button>
					</div>
				</div>
			</div>
		</div>
	{/if}
</div>