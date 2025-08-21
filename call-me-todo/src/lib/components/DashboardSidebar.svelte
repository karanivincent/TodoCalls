<script lang="ts">
	import { page } from '$app/stores';
	import { onMount } from 'svelte';
	
	export let isCollapsed = false;
	
	let activeSection = 'today';
	
	// Mock data for badges
	let todayCount = 3;
	let delegatedCount = 5;
	let missedCount = 1;
	
	const navigationItems = [
		{
			section: 'tasks',
			items: [
				{ id: 'today', label: 'My Tasks', icon: 'phone', count: todayCount, href: '/dashboard' },
				{ id: 'delegated', label: 'Delegated', icon: 'users', count: delegatedCount, href: '/dashboard/delegated' },
				{ id: 'family', label: 'Family Care', icon: 'heart', href: '/dashboard/family' },
				{ id: 'team', label: 'Team Tasks', icon: 'briefcase', href: '/dashboard/team' },
				{ id: 'calendar', label: 'Calendar', icon: 'calendar', href: '/dashboard/calendar' },
				{ id: 'completed', label: 'Completed', icon: 'check', href: '/dashboard/completed' },
				{ id: 'missed', label: 'Missed', icon: 'x', count: missedCount, countColor: 'red', href: '/dashboard/missed' }
			]
		},
		{
			section: 'manage',
			items: [
				{ id: 'recipients', label: 'Recipients', icon: 'user', href: '/dashboard/recipients' },
				{ id: 'phones', label: 'My Phones', icon: 'device-mobile', href: '/dashboard/phones' },
				{ id: 'templates', label: 'Templates', icon: 'template', href: '/dashboard/templates' },
				{ id: 'analytics', label: 'Analytics', icon: 'chart-bar', href: '/dashboard/analytics' },
				{ id: 'settings', label: 'Settings', icon: 'cog', href: '/dashboard/settings' },
				{ id: 'billing', label: 'Billing', icon: 'credit-card', href: '/dashboard/billing' }
			]
		},
		{
			section: 'support',
			items: [
				{ id: 'help', label: 'Help', icon: 'question-mark-circle', href: '/help' },
				{ id: 'profile', label: 'Profile', icon: 'user-circle', href: '/dashboard/profile' }
			]
		}
	];
	
	onMount(() => {
		// Set active section based on current path
		const path = $page.url.pathname;
		navigationItems.forEach(section => {
			section.items.forEach(item => {
				if (path.includes(item.href) || (item.href === '/dashboard' && path === '/dashboard')) {
					activeSection = item.id;
				}
			});
		});
	});
	
	function toggleSidebar() {
		isCollapsed = !isCollapsed;
	}
	
	function getIcon(iconName: string) {
		const icons: Record<string, string> = {
			'phone': 'M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z',
			'users': 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z',
			'heart': 'M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z',
			'briefcase': 'M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z',
			'calendar': 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z',
			'check': 'M5 13l4 4L19 7',
			'x': 'M6 18L18 6M6 6l12 12',
			'user': 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z',
			'device-mobile': 'M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z',
			'template': 'M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z',
			'chart-bar': 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z',
			'cog': 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z',
			'credit-card': 'M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z',
			'question-mark-circle': 'M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
			'user-circle': 'M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0zm6 2a9 9 0 11-18 0 9 9 0 0118 0z'
		};
		return icons[iconName] || '';
	}
</script>

<div class="sidebar {isCollapsed ? 'collapsed' : ''} bg-white border-r border-gray-200 h-full flex flex-col">
	<!-- Logo/Brand -->
	<div class="p-4 border-b border-gray-200">
		<div class="flex items-center justify-between">
			<div class="flex items-center gap-2">
				{#if !isCollapsed}
					<span class="text-xl font-semibold text-gray-900">TeliTask</span>
					<svg class="w-5 h-5 text-orange-600" fill="currentColor" viewBox="0 0 20 20">
						<path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z"/>
					</svg>
				{:else}
					<svg class="w-5 h-5 text-orange-600" fill="currentColor" viewBox="0 0 20 20">
						<path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z"/>
					</svg>
				{/if}
			</div>
			<button 
				on:click={toggleSidebar}
				class="p-1 hover:bg-gray-100 rounded transition-colors"
				aria-label="Toggle sidebar"
			>
				<svg class="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					{#if isCollapsed}
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 5l7 7-7 7M5 5l7 7-7 7" />
					{:else}
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
					{/if}
				</svg>
			</button>
		</div>
	</div>
	
	<!-- Navigation Items -->
	<nav class="flex-1 overflow-y-auto">
		{#each navigationItems as section}
			<div class="p-2 {isCollapsed ? 'px-1' : 'px-3'}">
				{#if !isCollapsed && section.section !== 'tasks'}
					<div class="text-xs font-semibold text-gray-400 uppercase tracking-wider mt-4 mb-2">
						{section.section === 'manage' ? 'Manage' : 'Support'}
					</div>
				{/if}
				
				{#each section.items as item}
					<a
						href={item.href}
						class="flex items-center justify-between px-3 py-2 mb-1 rounded-lg hover:bg-gray-50 transition-colors {activeSection === item.id ? 'bg-orange-50 text-orange-600' : 'text-gray-700'}"
						title={isCollapsed ? item.label : ''}
					>
						<div class="flex items-center gap-3">
							<svg class="w-5 h-5 {activeSection === item.id ? 'text-orange-600' : 'text-gray-400'}" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d={getIcon(item.icon)} />
							</svg>
							{#if !isCollapsed}
								<span class="text-sm font-medium">{item.label}</span>
							{/if}
						</div>
						{#if item.count && !isCollapsed}
							<span class="px-2 py-0.5 text-xs font-medium rounded-full {item.countColor === 'red' ? 'bg-red-100 text-red-600' : 'bg-gray-100 text-gray-600'}">
								{item.count}
							</span>
						{:else if item.count && isCollapsed}
							<span class="absolute -top-1 -right-1 w-2 h-2 rounded-full {item.countColor === 'red' ? 'bg-red-500' : 'bg-orange-500'}"></span>
						{/if}
					</a>
				{/each}
			</div>
		{/each}
	</nav>
	
	<!-- User Section -->
	<div class="border-t border-gray-200 p-4">
		{#if !isCollapsed}
			<div class="flex items-center gap-3">
				<div class="w-8 h-8 rounded-full bg-orange-600 flex items-center justify-center text-white text-sm font-medium">
					U
				</div>
				<div class="flex-1 min-w-0">
					<p class="text-sm font-medium text-gray-900 truncate">User</p>
					<p class="text-xs text-gray-500 truncate">Free Plan</p>
				</div>
			</div>
		{:else}
			<div class="w-8 h-8 rounded-full bg-orange-600 flex items-center justify-center text-white text-sm font-medium mx-auto">
				U
			</div>
		{/if}
	</div>
</div>

<style>
	.sidebar {
		width: 260px;
		transition: width 0.3s ease;
	}
	
	.sidebar.collapsed {
		width: 80px;
	}
	
	@media (max-width: 768px) {
		.sidebar {
			position: fixed;
			left: -260px;
			z-index: 40;
			transition: left 0.3s ease;
		}
		
		.sidebar.mobile-open {
			left: 0;
		}
		
		.sidebar.collapsed {
			width: 260px;
			left: -260px;
		}
	}
</style>