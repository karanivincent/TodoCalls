<script lang="ts">
	import { onMount } from 'svelte';
	import { toast } from '$lib/stores/toast';
	
	// Mock data for recipients
	let recipients = {
		family: [
			{ id: 1, name: 'Mom', phone: '555-0101', bestTime: '9am-10am', lastCalled: '2 hours ago', compliance: 80 },
			{ id: 2, name: 'Dad', phone: '555-0102', bestTime: '7pm-8pm', lastCalled: 'Yesterday', compliance: 100 },
			{ id: 3, name: 'Sister', phone: '555-0103', bestTime: 'Weekends', lastCalled: '3 days ago', compliance: 60 }
		],
		work: [
			{ id: 4, name: 'John', phone: '555-0201', bestTime: '2pm-4pm', lastCalled: 'Today', compliance: 87 },
			{ id: 5, name: 'Sarah', phone: '555-0202', bestTime: 'Mornings', lastCalled: 'Yesterday', compliance: 92 },
			{ id: 6, name: 'Mike', phone: '555-0203', bestTime: 'Afternoons', lastCalled: '5 days ago', compliance: 75 }
		],
		healthcare: [
			{ id: 7, name: 'Dr. Smith', phone: '555-0301', bestTime: 'Office hours', lastCalled: 'Last month', compliance: 100 }
		]
	};
	
	let showAddModal = false;
	let selectedCategory = 'family';
	let newRecipient = {
		name: '',
		phone: '',
		category: 'family',
		bestTime: ''
	};
	
	function addRecipient() {
		showAddModal = true;
	}
	
	function saveRecipient() {
		if (!newRecipient.name || !newRecipient.phone) {
			toast.show('Please fill in all required fields', 'error');
			return;
		}
		
		// Add to appropriate category
		const newEntry = {
			id: Date.now(),
			name: newRecipient.name,
			phone: newRecipient.phone,
			bestTime: newRecipient.bestTime || 'Not set',
			lastCalled: 'Never',
			compliance: 0
		};
		
		if (newRecipient.category === 'family') {
			recipients.family = [...recipients.family, newEntry];
		} else if (newRecipient.category === 'work') {
			recipients.work = [...recipients.work, newEntry];
		} else {
			recipients.healthcare = [...recipients.healthcare, newEntry];
		}
		
		toast.show(`Added ${newRecipient.name} to recipients`, 'success');
		
		// Reset form
		newRecipient = { name: '', phone: '', category: 'family', bestTime: '' };
		showAddModal = false;
	}
	
	function getComplianceColor(rate: number) {
		if (rate >= 90) return 'text-green-600 bg-green-50';
		if (rate >= 70) return 'text-yellow-600 bg-yellow-50';
		return 'text-red-600 bg-red-50';
	}
</script>

<div class="p-6 max-w-7xl mx-auto">
	<!-- Header -->
	<div class="flex items-center justify-between mb-6">
		<div>
			<h1 class="text-2xl font-bold text-gray-900">Recipients</h1>
			<p class="text-gray-600 mt-1">Manage people you send reminders to</p>
		</div>
		<button
			on:click={addRecipient}
			class="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors flex items-center gap-2"
		>
			<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
			</svg>
			Add Recipient
		</button>
	</div>
	
	<!-- Recipients by Category -->
	<div class="space-y-6">
		<!-- Family -->
		<div class="bg-white rounded-xl shadow-sm border border-gray-200">
			<div class="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-pink-50 to-pink-100">
				<h2 class="text-lg font-semibold text-pink-900 flex items-center gap-2">
					<span class="text-2xl">👨‍👩‍👧</span>
					Family ({recipients.family.length})
				</h2>
			</div>
			<div class="p-6">
				<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
					{#each recipients.family as person}
						<div class="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
							<div class="flex items-start justify-between mb-3">
								<div>
									<h3 class="font-semibold text-gray-900">{person.name}</h3>
									<p class="text-sm text-gray-500">📱 {person.phone}</p>
								</div>
								<button class="text-gray-400 hover:text-gray-600">
									<svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
										<path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z"/>
									</svg>
								</button>
							</div>
							
							<div class="space-y-2 text-sm">
								<div class="flex items-center justify-between">
									<span class="text-gray-500">Best time:</span>
									<span class="font-medium">{person.bestTime}</span>
								</div>
								<div class="flex items-center justify-between">
									<span class="text-gray-500">Last called:</span>
									<span class="font-medium">{person.lastCalled}</span>
								</div>
								<div class="flex items-center justify-between">
									<span class="text-gray-500">Compliance:</span>
									<span class="px-2 py-0.5 rounded-full text-xs font-medium {getComplianceColor(person.compliance)}">
										{person.compliance}%
									</span>
								</div>
							</div>
							
							<div class="mt-4 flex gap-2">
								<button class="flex-1 px-3 py-1.5 bg-orange-100 text-orange-700 rounded-lg hover:bg-orange-200 transition-colors text-sm font-medium">
									Call Now
								</button>
								<button class="flex-1 px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium">
									Schedule
								</button>
							</div>
						</div>
					{/each}
				</div>
			</div>
		</div>
		
		<!-- Work -->
		<div class="bg-white rounded-xl shadow-sm border border-gray-200">
			<div class="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-blue-100">
				<h2 class="text-lg font-semibold text-blue-900 flex items-center gap-2">
					<span class="text-2xl">💼</span>
					Work ({recipients.work.length})
				</h2>
			</div>
			<div class="p-6">
				<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
					{#each recipients.work as person}
						<div class="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
							<div class="flex items-start justify-between mb-3">
								<div>
									<h3 class="font-semibold text-gray-900">{person.name}</h3>
									<p class="text-sm text-gray-500">📱 {person.phone}</p>
								</div>
								<button class="text-gray-400 hover:text-gray-600">
									<svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
										<path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z"/>
									</svg>
								</button>
							</div>
							
							<div class="space-y-2 text-sm">
								<div class="flex items-center justify-between">
									<span class="text-gray-500">Best time:</span>
									<span class="font-medium">{person.bestTime}</span>
								</div>
								<div class="flex items-center justify-between">
									<span class="text-gray-500">Last called:</span>
									<span class="font-medium">{person.lastCalled}</span>
								</div>
								<div class="flex items-center justify-between">
									<span class="text-gray-500">Acknowledgment:</span>
									<span class="px-2 py-0.5 rounded-full text-xs font-medium {getComplianceColor(person.compliance)}">
										{person.compliance}%
									</span>
								</div>
							</div>
							
							<div class="mt-4 flex gap-2">
								<button class="flex-1 px-3 py-1.5 bg-orange-100 text-orange-700 rounded-lg hover:bg-orange-200 transition-colors text-sm font-medium">
									Delegate
								</button>
								<button class="flex-1 px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium">
									View Tasks
								</button>
							</div>
						</div>
					{/each}
				</div>
			</div>
		</div>
		
		<!-- Healthcare -->
		<div class="bg-white rounded-xl shadow-sm border border-gray-200">
			<div class="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-green-50 to-green-100">
				<h2 class="text-lg font-semibold text-green-900 flex items-center gap-2">
					<span class="text-2xl">🏥</span>
					Healthcare ({recipients.healthcare.length})
				</h2>
			</div>
			<div class="p-6">
				<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
					{#each recipients.healthcare as person}
						<div class="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
							<div class="flex items-start justify-between mb-3">
								<div>
									<h3 class="font-semibold text-gray-900">{person.name}</h3>
									<p class="text-sm text-gray-500">📱 {person.phone}</p>
								</div>
								<button class="text-gray-400 hover:text-gray-600">
									<svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
										<path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z"/>
									</svg>
								</button>
							</div>
							
							<div class="space-y-2 text-sm">
								<div class="flex items-center justify-between">
									<span class="text-gray-500">Best time:</span>
									<span class="font-medium">{person.bestTime}</span>
								</div>
								<div class="flex items-center justify-between">
									<span class="text-gray-500">Last called:</span>
									<span class="font-medium">{person.lastCalled}</span>
								</div>
							</div>
							
							<div class="mt-4 flex gap-2">
								<button class="flex-1 px-3 py-1.5 bg-orange-100 text-orange-700 rounded-lg hover:bg-orange-200 transition-colors text-sm font-medium">
									Schedule
								</button>
								<button class="flex-1 px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium">
									View Info
								</button>
							</div>
						</div>
					{/each}
				</div>
			</div>
		</div>
	</div>
</div>

<!-- Add Recipient Modal -->
{#if showAddModal}
	<div class="fixed inset-0 z-50 flex items-center justify-center p-4">
		<div class="fixed inset-0 bg-black bg-opacity-30" on:click={() => showAddModal = false}></div>
		
		<div class="relative bg-white rounded-xl max-w-md w-full p-6">
			<h3 class="text-lg font-semibold text-gray-900 mb-4">Add New Recipient</h3>
			
			<div class="space-y-4">
				<div>
					<label class="block text-sm font-medium text-gray-700 mb-1">Name *</label>
					<input
						type="text"
						bind:value={newRecipient.name}
						class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
						placeholder="e.g., Mom, John Smith"
					/>
				</div>
				
				<div>
					<label class="block text-sm font-medium text-gray-700 mb-1">Phone Number *</label>
					<input
						type="tel"
						bind:value={newRecipient.phone}
						class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
						placeholder="555-0123"
					/>
				</div>
				
				<div>
					<label class="block text-sm font-medium text-gray-700 mb-1">Category</label>
					<select
						bind:value={newRecipient.category}
						class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
					>
						<option value="family">Family</option>
						<option value="work">Work</option>
						<option value="healthcare">Healthcare</option>
					</select>
				</div>
				
				<div>
					<label class="block text-sm font-medium text-gray-700 mb-1">Best Time to Call</label>
					<input
						type="text"
						bind:value={newRecipient.bestTime}
						class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
						placeholder="e.g., Mornings, 2-4 PM, Weekends"
					/>
				</div>
			</div>
			
			<div class="flex gap-3 mt-6">
				<button
					on:click={saveRecipient}
					class="flex-1 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
				>
					Add Recipient
				</button>
				<button
					on:click={() => showAddModal = false}
					class="flex-1 px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors"
				>
					Cancel
				</button>
			</div>
		</div>
	</div>
{/if}