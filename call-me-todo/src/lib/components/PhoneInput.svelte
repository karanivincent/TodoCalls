<script lang="ts">
	import { countryCodes, getDefaultCountry, formatPhoneNumber, type CountryCode } from '$lib/countryCodes';
	import { onMount } from 'svelte';
	
	export let value = '';
	export let required = false;
	export let placeholder = 'Phone number';
	export let id = 'phone';
	export let className = '';
	
	let selectedCountry: CountryCode = getDefaultCountry();
	let phoneNumber = '';
	let showDropdown = false;
	let searchQuery = '';
	
	$: filteredCountries = searchQuery
		? countryCodes.filter(country => 
			country.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
			country.dialCode.includes(searchQuery) ||
			country.code.toLowerCase().includes(searchQuery.toLowerCase())
		)
		: countryCodes;
	
	$: {
		// Update the exported value whenever country or phone number changes
		if (phoneNumber) {
			value = formatPhoneNumber(selectedCountry.dialCode, phoneNumber);
		} else {
			value = '';
		}
	}
	
	onMount(() => {
		// If value is provided, parse it
		if (value) {
			const country = countryCodes.find(c => value.startsWith(c.dialCode));
			if (country) {
				selectedCountry = country;
				phoneNumber = value.replace(country.dialCode, '');
			}
		}
		
		// Close dropdown when clicking outside
		const handleClickOutside = (e: MouseEvent) => {
			const target = e.target as HTMLElement;
			if (!target.closest('.country-selector')) {
				showDropdown = false;
			}
		};
		
		document.addEventListener('click', handleClickOutside);
		return () => document.removeEventListener('click', handleClickOutside);
	});
	
	function selectCountry(country: CountryCode) {
		selectedCountry = country;
		showDropdown = false;
		searchQuery = '';
	}
</script>

<div class="flex {className}">
	<!-- Country Code Selector -->
	<div class="relative country-selector">
		<button
			type="button"
			on:click={() => showDropdown = !showDropdown}
			class="flex items-center px-3 py-2 border border-r-0 border-gray-300 rounded-l-md bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
		>
			<span class="text-lg mr-2">{selectedCountry.flag}</span>
			<span class="text-sm font-medium">{selectedCountry.dialCode}</span>
			<svg class="ml-2 h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
			</svg>
		</button>
		
		{#if showDropdown}
			<div class="absolute z-10 mt-1 w-80 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-hidden">
				<!-- Search Input -->
				<div class="p-2 border-b">
					<input
						type="text"
						bind:value={searchQuery}
						placeholder="Search country..."
						class="w-full px-3 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-orange-500"
					/>
				</div>
				
				<!-- Country List -->
				<div class="overflow-y-auto max-h-48">
					{#each filteredCountries as country}
						<button
							type="button"
							on:click={() => selectCountry(country)}
							class="w-full px-3 py-2 flex items-center hover:bg-gray-100 text-left"
						>
							<span class="text-lg mr-3">{country.flag}</span>
							<span class="flex-1 text-sm">{country.name}</span>
							<span class="text-sm text-gray-500">{country.dialCode}</span>
						</button>
					{/each}
					
					{#if filteredCountries.length === 0}
						<div class="px-3 py-2 text-sm text-gray-500">No countries found</div>
					{/if}
				</div>
			</div>
		{/if}
	</div>
	
	<!-- Phone Number Input -->
	<input
		{id}
		type="tel"
		bind:value={phoneNumber}
		{required}
		{placeholder}
		class="flex-1 px-3 py-2 border border-gray-300 rounded-r-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
	/>
</div>