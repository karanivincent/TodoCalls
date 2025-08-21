<script lang="ts">
	import { onMount } from 'svelte';
	import { toast } from '$lib/stores/toast';
	
	// Mock data for family care
	let todaySchedule = [
		{ id: 1, time: '9:00 AM', person: 'Mom', task: 'Morning medication', status: 'completed', acknowledged: true },
		{ id: 2, time: '2:00 PM', person: 'Dad', task: 'Doctor appointment reminder', status: 'pending', acknowledged: false },
		{ id: 3, time: '7:00 PM', person: 'Mom', task: 'Evening medication', status: 'pending', acknowledged: false },
		{ id: 4, time: '8:00 PM', person: 'Grandma', task: 'Daily check-in call', status: 'pending', acknowledged: false }
	];
	
	let weeklyCompliance = {
		mom: { completed: 8, total: 10, percentage: 80 },
		dad: { completed: 5, total: 5, percentage: 100 },
		grandma: { completed: 6, total: 7, percentage: 86 }
	};
	
	let medicationSchedule = [
		{ person: 'Mom', medication: 'Heart medication', times: ['9:00 AM', '7:00 PM'], frequency: 'Daily' },
		{ person: 'Dad', medication: 'Blood pressure', times: ['8:00 AM'], frequency: 'Daily' },
		{ person: 'Grandma', medication: 'Vitamins', times: ['10:00 AM'], frequency: 'Daily' }
	];
	
	let upcomingAppointments = [
		{ person: 'Dad', type: 'Cardiology', date: 'Dec 22', time: '10:00 AM', doctor: 'Dr. Smith' },
		{ person: 'Mom', type: 'General Checkup', date: 'Dec 28', time: '2:00 PM', doctor: 'Dr. Johnson' },
		{ person: 'Grandma', type: 'Eye Exam', date: 'Jan 5', time: '11:00 AM', doctor: 'Dr. Williams' }
	];
	
	function quickAction(action: string) {
		switch(action) {
			case 'check-mom':
				toast.show('Calling Mom now...', 'success');
				break;
			case 'med-reminder':
				toast.show('Setting up medication reminder...', 'success');
				break;
			case 'schedule-appointment':
				toast.show('Opening appointment scheduler...', 'success');
				break;
			case 'view-report':
				toast.show('Generating compliance report...', 'success');
				break;
		}
	}
	
	function getStatusIcon(status: string) {
		switch(status) {
			case 'completed': return '✓';
			case 'pending': return '⏰';
			case 'missed': return '❌';
			default: return '⏰';
		}
	}
	
	function getStatusColor(status: string) {
		switch(status) {
			case 'completed': return 'text-green-600';
			case 'pending': return 'text-blue-600';
			case 'missed': return 'text-red-600';
			default: return 'text-gray-600';
		}
	}
</script>

<div class="p-6 max-w-7xl mx-auto">
	<!-- Header -->
	<div class="flex items-center justify-between mb-6">
		<div>
			<h1 class="text-2xl font-bold text-gray-900">Family Care Center</h1>
			<p class="text-gray-600 mt-1">Manage medication reminders and health appointments for your loved ones</p>
		</div>
		<button class="px-4 py-2 bg-pink-600 text-white rounded-lg hover:bg-pink-700 transition-colors flex items-center gap-2">
			<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
			</svg>
			Add Family Member
		</button>
	</div>
	
	<!-- Quick Actions -->
	<div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
		<button
			on:click={() => quickAction('check-mom')}
			class="bg-gradient-to-r from-pink-500 to-pink-600 text-white rounded-lg p-4 hover:from-pink-600 hover:to-pink-700 transition-all"
		>
			<div class="text-2xl mb-2">📞</div>
			<div class="text-sm font-medium">Check on Mom</div>
		</button>
		<button
			on:click={() => quickAction('med-reminder')}
			class="bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-lg p-4 hover:from-purple-600 hover:to-purple-700 transition-all"
		>
			<div class="text-2xl mb-2">💊</div>
			<div class="text-sm font-medium">Set Med Reminder</div>
		</button>
		<button
			on:click={() => quickAction('schedule-appointment')}
			class="bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg p-4 hover:from-blue-600 hover:to-blue-700 transition-all"
		>
			<div class="text-2xl mb-2">📅</div>
			<div class="text-sm font-medium">Schedule Appointment</div>
		</button>
		<button
			on:click={() => quickAction('view-report')}
			class="bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg p-4 hover:from-green-600 hover:to-green-700 transition-all"
		>
			<div class="text-2xl mb-2">📊</div>
			<div class="text-sm font-medium">View Report</div>
		</button>
	</div>
	
	<!-- Main Grid -->
	<div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
		<!-- Today's Schedule -->
		<div class="bg-white rounded-xl shadow-sm border border-gray-200">
			<div class="px-6 py-4 border-b border-gray-200">
				<h2 class="text-lg font-semibold text-gray-900">Today's Schedule</h2>
			</div>
			<div class="p-6">
				<div class="space-y-3">
					{#each todaySchedule as item}
						<div class="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition-colors">
							<div class="flex items-center gap-3">
								<span class="{getStatusColor(item.status)} text-lg">{getStatusIcon(item.status)}</span>
								<div>
									<div class="font-medium text-gray-900">{item.person} - {item.task}</div>
									<div class="text-sm text-gray-500">{item.time}</div>
								</div>
							</div>
							{#if item.acknowledged}
								<span class="px-2 py-1 text-xs bg-green-100 text-green-700 rounded-full">Acknowledged</span>
							{:else if item.status === 'pending'}
								<button class="px-3 py-1 text-xs bg-orange-100 text-orange-700 rounded-lg hover:bg-orange-200 transition-colors">
									Call Now
								</button>
							{/if}
						</div>
					{/each}
				</div>
			</div>
		</div>
		
		<!-- Compliance This Week -->
		<div class="bg-white rounded-xl shadow-sm border border-gray-200">
			<div class="px-6 py-4 border-b border-gray-200">
				<h2 class="text-lg font-semibold text-gray-900">Compliance This Week</h2>
			</div>
			<div class="p-6">
				<div class="space-y-4">
					{#each Object.entries(weeklyCompliance) as [person, data]}
						<div>
							<div class="flex items-center justify-between mb-2">
								<span class="font-medium text-gray-900 capitalize">{person}</span>
								<span class="text-sm text-gray-600">{data.completed}/{data.total} acknowledged</span>
							</div>
							<div class="w-full bg-gray-200 rounded-full h-2">
								<div 
									class="h-2 rounded-full transition-all {data.percentage >= 90 ? 'bg-green-500' : data.percentage >= 70 ? 'bg-yellow-500' : 'bg-red-500'}"
									style="width: {data.percentage}%"
								></div>
							</div>
							<div class="text-xs text-gray-500 mt-1">{data.percentage}% compliance rate</div>
						</div>
					{/each}
				</div>
				
				<div class="mt-4 pt-4 border-t border-gray-200">
					<div class="bg-purple-50 rounded-lg p-3">
						<div class="flex items-start gap-2">
							<span class="text-purple-600">🧠</span>
							<div class="text-sm">
								<p class="font-medium text-purple-900">AI Insight</p>
								<p class="text-purple-700">Mom responds better to 9:15 AM calls instead of 9:00 AM</p>
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
		
		<!-- Medication Schedule -->
		<div class="bg-white rounded-xl shadow-sm border border-gray-200">
			<div class="px-6 py-4 border-b border-gray-200">
				<h2 class="text-lg font-semibold text-gray-900">Medication Schedule</h2>
			</div>
			<div class="p-6">
				<div class="space-y-4">
					{#each medicationSchedule as schedule}
						<div class="border border-gray-200 rounded-lg p-3">
							<div class="flex items-start justify-between">
								<div>
									<div class="font-medium text-gray-900">{schedule.person}</div>
									<div class="text-sm text-gray-600 mt-1">{schedule.medication}</div>
									<div class="flex gap-2 mt-2">
										{#each schedule.times as time}
											<span class="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded">
												{time}
											</span>
										{/each}
									</div>
								</div>
								<span class="text-xs text-gray-500">{schedule.frequency}</span>
							</div>
						</div>
					{/each}
				</div>
				
				<button class="mt-4 w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium">
					+ Add Medication
				</button>
			</div>
		</div>
		
		<!-- Upcoming Appointments -->
		<div class="bg-white rounded-xl shadow-sm border border-gray-200">
			<div class="px-6 py-4 border-b border-gray-200">
				<h2 class="text-lg font-semibold text-gray-900">Upcoming Appointments</h2>
			</div>
			<div class="p-6">
				<div class="space-y-3">
					{#each upcomingAppointments as appointment}
						<div class="border-l-4 border-pink-500 pl-4 py-2">
							<div class="font-medium text-gray-900">{appointment.person} - {appointment.type}</div>
							<div class="text-sm text-gray-600 mt-1">
								📅 {appointment.date} at {appointment.time}
							</div>
							<div class="text-sm text-gray-500">
								👨‍⚕️ {appointment.doctor}
							</div>
						</div>
					{/each}
				</div>
				
				<button class="mt-4 w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium">
					+ Schedule Appointment
				</button>
			</div>
		</div>
	</div>
	
	<!-- Care Insights -->
	<div class="mt-6 bg-gradient-to-r from-purple-50 to-indigo-50 rounded-xl border border-purple-200 p-6">
		<h3 class="text-lg font-semibold text-purple-900 mb-4">🧠 AI Care Insights</h3>
		<div class="grid grid-cols-1 md:grid-cols-3 gap-4">
			<div class="bg-white/80 rounded-lg p-4">
				<div class="text-2xl mb-2">📈</div>
				<div class="text-sm font-medium text-purple-900">23% improvement</div>
				<div class="text-xs text-purple-700">in medication compliance this month</div>
			</div>
			<div class="bg-white/80 rounded-lg p-4">
				<div class="text-2xl mb-2">⏰</div>
				<div class="text-sm font-medium text-purple-900">Optimal timing</div>
				<div class="text-xs text-purple-700">Dad responds best after 7 PM</div>
			</div>
			<div class="bg-white/80 rounded-lg p-4">
				<div class="text-2xl mb-2">🔄</div>
				<div class="text-sm font-medium text-purple-900">Pattern detected</div>
				<div class="text-xs text-purple-700">Mom needs 2nd reminder for evening meds</div>
			</div>
		</div>
	</div>
</div>