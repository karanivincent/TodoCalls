<script lang="ts">
	// Optional prop to specify the current page for active styling
	let { currentPage = '/' }: { currentPage?: string } = $props();
</script>

<header class="sticky top-0 z-30 backdrop-blur supports-[backdrop-filter]:bg-white/70 border-b border-gray-100">
	<div class="mx-auto max-w-6xl px-4 sm:px-6 py-3 flex items-center justify-between">
		<a href="/" class="flex items-center gap-2">
			<span class="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-orange-100 ring-1 ring-orange-300">
				<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" class="h-5 w-5 fill-orange-800">
					<path d="M6.62 10.79a15.05 15.05 0 0 0 6.59 6.59l2.2-2.2a1 1 0 0 1 1.01-.24c1.1.36 2.28.55 3.5.55a1 1 0 0 1 1 1V20a1 1 0 0 1-1 1C11.3 21 3 12.7 3 2a1 1 0 0 1 1-1h3.5a1 1 0 0 1 1 1c0 1.22.19 2.4.55 3.5a1 1 0 0 1-.25 1.01z"/>
				</svg>
			</span>
			<span class="font-semibold tracking-tight">TeliTask</span>
		</a>
		
		<nav class="hidden sm:flex items-center gap-6 text-sm">
			{#if currentPage === '/'}
				<!-- On homepage, use hash links -->
				<a href="#how" class="hover:text-orange-700">How it works</a>
				<a href="/pricing" class="hover:text-orange-700">Pricing</a>
				<a href="#use-cases" class="hover:text-orange-700">Use cases</a>
				<a href="#faq" class="hover:text-orange-700">FAQ</a>
				<a href="#contact" class="hover:text-orange-700">Contact</a>
			{:else}
				<!-- On other pages, link back to homepage sections -->
				<a href="/#how" class="hover:text-orange-700">How it works</a>
				<a href="/pricing" class="{currentPage === '/pricing' ? 'font-semibold text-orange-700' : 'hover:text-orange-700'}">Pricing</a>
				<a href="/#use-cases" class="hover:text-orange-700">Use cases</a>
				<a href="/#faq" class="hover:text-orange-700">FAQ</a>
				<a href="/#contact" class="hover:text-orange-700">Contact</a>
			{/if}
			
			{#if currentPage === '/dashboard'}
				<a href="/dashboard" class="font-semibold text-orange-700">Dashboard</a>
				<button on:click={() => window.location.href = '/api/auth/logout'} class="rounded-lg bg-gray-600 px-3 py-1.5 text-white hover:bg-gray-700">
					Sign Out
				</button>
			{:else}
				<a href={currentPage === '/' ? '#waitlist' : '/#waitlist'} class="rounded-lg bg-orange-600 px-3 py-1.5 text-white hover:bg-orange-700">Join Waiting List</a>
			{/if}
		</nav>
		
		<!-- Mobile menu button -->
		<button class="sm:hidden p-2">
			<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
			</svg>
		</button>
	</div>
</header>