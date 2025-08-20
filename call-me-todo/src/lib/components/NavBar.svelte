<script lang="ts">
	// Optional prop to specify the current page for active styling
	let { currentPage = '/' }: { currentPage?: string } = $props();

	let mobileMenuOpen = $state(false);

	function toggleMobileMenu() {
		mobileMenuOpen = !mobileMenuOpen;
	}

	function closeMobileMenu() {
		mobileMenuOpen = false;
	}
</script>

<header class="sticky top-0 z-30 backdrop-blur supports-[backdrop-filter]:bg-white/70 border-b border-gray-100">
	<div class="mx-auto max-w-6xl px-4 sm:px-6 py-3 flex items-center justify-between">
		<a href="/" class="flex items-center">
			<img src="/telitask-logo-alt-2.png" alt="TeliTask" class="h-8" />
		</a>

		<nav class="hidden sm:flex items-center gap-6 text-sm">
			{#if currentPage === '/'}
				<!-- On homepage, use hash links -->
				<a href="#how" class="hover:text-orange-700">How it works</a>
				<a href="#use-cases" class="hover:text-orange-700">Use cases</a>
				<a href="#faq" class="hover:text-orange-700">FAQ</a>
			{:else}
				<!-- On other pages, link back to homepage sections -->
				<a href="/#how" class="hover:text-orange-700">How it works</a>
				<a href="/#use-cases" class="hover:text-orange-700">Use cases</a>
				<a href="/#faq" class="hover:text-orange-700">FAQ</a>
			{/if}

			{#if currentPage === '/dashboard'}
				<a href="/dashboard" class="font-semibold text-orange-700">Dashboard</a>
				<button onclick={() => window.location.href = '/api/auth/logout'} class="rounded-lg bg-gray-600 px-3 py-1.5 text-white hover:bg-gray-700">
					Sign Out
				</button>
			{:else}
				<a href={currentPage === '/' ? '#waitlist' : '/#waitlist'} class="rounded-lg bg-orange-600 px-3 py-1.5 text-white hover:bg-orange-700">Join Waiting List</a>
			{/if}
		</nav>

		<!-- Mobile menu button -->
		<button class="sm:hidden p-2" onclick={toggleMobileMenu}>
			{#if mobileMenuOpen}
				<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
				</svg>
			{:else}
				<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
				</svg>
			{/if}
		</button>
	</div>

	<!-- Mobile menu -->
	{#if mobileMenuOpen}
		<div class="sm:hidden border-t border-gray-200 bg-white/95 backdrop-blur">
			<nav class="flex flex-col px-4 py-3 space-y-2">
				{#if currentPage === '/'}
					<!-- On homepage, use hash links -->
					<a href="#how" onclick={closeMobileMenu} class="block py-2 hover:text-orange-700">How it works</a>
					<a href="#use-cases" onclick={closeMobileMenu} class="block py-2 hover:text-orange-700">Use cases</a>
					<a href="#faq" onclick={closeMobileMenu} class="block py-2 hover:text-orange-700">FAQ</a>
				{:else}
					<!-- On other pages, link back to homepage sections -->
					<a href="/#how" onclick={closeMobileMenu} class="block py-2 hover:text-orange-700">How it works</a>
					<a href="/#use-cases" onclick={closeMobileMenu} class="block py-2 hover:text-orange-700">Use cases</a>
					<a href="/#faq" onclick={closeMobileMenu} class="block py-2 hover:text-orange-700">FAQ</a>
				{/if}

				{#if currentPage === '/dashboard'}
					<a href="/dashboard" onclick={closeMobileMenu} class="block py-2 font-semibold text-orange-700">Dashboard</a>
					<button onclick={() => window.location.href = '/api/auth/logout'} class="w-full text-left py-2 rounded-lg bg-gray-600 px-3 text-white hover:bg-gray-700">
						Sign Out
					</button>
				{:else}
					<a href={currentPage === '/' ? '#waitlist' : '/#waitlist'} onclick={closeMobileMenu} class="block py-2 rounded-lg bg-orange-600 px-3 text-center text-white hover:bg-orange-700">Join Waiting List</a>
				{/if}
			</nav>
		</div>
	{/if}
</header>