<script lang="ts">
	import NavBar from '$lib/components/NavBar.svelte';
</script>

<svelte:head>
	<title>Privacy Policy - TeliTask</title>
	<meta name="description" content="TeliTask's privacy policy - how we collect, use, and protect your data." />
</svelte:head>

<NavBar currentPage="/privacy" />

<div class="min-h-screen bg-white">
	<div class="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-12">
		<div class="prose prose-lg max-w-none">
			<h1 class="text-4xl font-bold text-gray-900 mb-8">Privacy Policy</h1>
			<p class="text-gray-600 mb-8">Last updated: August 18, 2025</p>

			<section class="mb-8">
				<h2 class="text-2xl font-semibold text-gray-900 mb-4">Introduction</h2>
				<p class="text-gray-700 mb-4">
					TeliTask ("we," "our," or "us") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our phone reminder service.
				</p>
				<p class="text-gray-700">
					By using TeliTask, you agree to the collection and use of information in accordance with this policy.
				</p>
			</section>

			<section class="mb-8">
				<h2 class="text-2xl font-semibold text-gray-900 mb-4">Information We Collect</h2>
				
				<h3 class="text-xl font-semibold text-gray-800 mb-3">Personal Information</h3>
				<p class="text-gray-700 mb-4">We collect the following personal information:</p>
				<ul class="list-disc list-inside text-gray-700 mb-4 ml-4">
					<li><strong>Name:</strong> To personalize your reminders and communications</li>
					<li><strong>Phone Number:</strong> To deliver voice and SMS reminders</li>
					<li><strong>Email Address:</strong> For account management and support communications</li>
					<li><strong>Payment Information:</strong> Processed securely through third-party payment processors</li>
				</ul>

				<h3 class="text-xl font-semibold text-gray-800 mb-3">Usage Information</h3>
				<ul class="list-disc list-inside text-gray-700 mb-4 ml-4">
					<li>Reminder content and scheduling preferences</li>
					<li>Call delivery status and response data</li>
					<li>Usage patterns and service interactions</li>
					<li>Device and browser information</li>
					<li>IP address and location data (for service delivery)</li>
				</ul>
			</section>

			<section class="mb-8">
				<h2 class="text-2xl font-semibold text-gray-900 mb-4">How We Use Your Information</h2>
				<p class="text-gray-700 mb-4">We use your information to:</p>
				<ul class="list-disc list-inside text-gray-700 mb-4 ml-4">
					<li>Deliver voice and SMS reminders as scheduled</li>
					<li>Personalize your reminder experience</li>
					<li>Process payments and manage your subscription</li>
					<li>Provide customer support and respond to inquiries</li>
					<li>Improve our services and develop new features</li>
					<li>Send important service updates and security notifications</li>
					<li>Comply with legal obligations and prevent fraud</li>
				</ul>
			</section>

			<section class="mb-8">
				<h2 class="text-2xl font-semibold text-gray-900 mb-4">Third-Party Services</h2>
				<p class="text-gray-700 mb-4">We work with trusted third-party services to provide our functionality:</p>
				
				<div class="bg-gray-50 p-4 rounded-lg mb-4">
					<h3 class="text-lg font-semibold text-gray-800 mb-2">Supabase (Database & Authentication)</h3>
					<p class="text-gray-700">Securely stores your account information and reminder data</p>
				</div>
				
				<div class="bg-gray-50 p-4 rounded-lg mb-4">
					<h3 class="text-lg font-semibold text-gray-800 mb-2">Twilio (Voice & SMS Delivery)</h3>
					<p class="text-gray-700">Enables phone calls and text message delivery</p>
				</div>
				
				<div class="bg-gray-50 p-4 rounded-lg mb-4">
					<h3 class="text-lg font-semibold text-gray-800 mb-2">OpenAI (Voice Generation)</h3>
					<p class="text-gray-700">Generates natural-sounding voice for your reminders</p>
				</div>
				
				<div class="bg-gray-50 p-4 rounded-lg">
					<h3 class="text-lg font-semibold text-gray-800 mb-2">Stripe (Payment Processing)</h3>
					<p class="text-gray-700">Securely processes payments and subscription management</p>
				</div>
			</section>

			<section class="mb-8">
				<h2 class="text-2xl font-semibold text-gray-900 mb-4">Data Security</h2>
				<p class="text-gray-700 mb-4">
					We implement industry-standard security measures to protect your personal information:
				</p>
				<ul class="list-disc list-inside text-gray-700 mb-4 ml-4">
					<li>Data encryption in transit and at rest</li>
					<li>Secure authentication and access controls</li>
					<li>Regular security audits and monitoring</li>
					<li>Limited access to personal data on a need-to-know basis</li>
					<li>Secure data centers with physical access controls</li>
				</ul>
				<p class="text-gray-700">
					While we strive to protect your information, no method of transmission over the internet is 100% secure. We cannot guarantee absolute security but commit to promptly addressing any security incidents.
				</p>
			</section>

			<section class="mb-8">
				<h2 class="text-2xl font-semibold text-gray-900 mb-4">Data Retention</h2>
				<p class="text-gray-700 mb-4">We retain your information for the following periods:</p>
				<ul class="list-disc list-inside text-gray-700 mb-4 ml-4">
					<li><strong>Account Data:</strong> Until you delete your account or request deletion</li>
					<li><strong>Reminder Data:</strong> For the duration of your subscription plus 30 days</li>
					<li><strong>Payment Data:</strong> As required by law and payment processors (typically 7 years)</li>
					<li><strong>Usage Logs:</strong> Up to 2 years for service improvement and security purposes</li>
				</ul>
				<p class="text-gray-700">
					You may request deletion of your data at any time by contacting us at privacy@telitask.com.
				</p>
			</section>

			<section class="mb-8">
				<h2 class="text-2xl font-semibold text-gray-900 mb-4">Your Rights</h2>
				<p class="text-gray-700 mb-4">Under applicable privacy laws (GDPR, CCPA), you have the right to:</p>
				<ul class="list-disc list-inside text-gray-700 mb-4 ml-4">
					<li><strong>Access:</strong> Request a copy of your personal data</li>
					<li><strong>Rectification:</strong> Correct inaccurate or incomplete data</li>
					<li><strong>Erasure:</strong> Request deletion of your personal data</li>
					<li><strong>Portability:</strong> Receive your data in a portable format</li>
					<li><strong>Restriction:</strong> Limit how we process your data</li>
					<li><strong>Objection:</strong> Object to processing based on legitimate interests</li>
					<li><strong>Withdraw Consent:</strong> Revoke consent for data processing</li>
				</ul>
				<p class="text-gray-700">
					To exercise these rights, contact us at privacy@telitask.com. We will respond within 30 days.
				</p>
			</section>

			<section class="mb-8">
				<h2 class="text-2xl font-semibold text-gray-900 mb-4">Cookies and Tracking</h2>
				<p class="text-gray-700 mb-4">
					We use essential cookies and similar technologies to:
				</p>
				<ul class="list-disc list-inside text-gray-700 mb-4 ml-4">
					<li>Maintain your login session</li>
					<li>Remember your preferences</li>
					<li>Improve website performance</li>
					<li>Analyze usage patterns (anonymized)</li>
				</ul>
				<p class="text-gray-700">
					You can control cookies through your browser settings. Disabling essential cookies may affect service functionality.
				</p>
			</section>

			<section class="mb-8">
				<h2 class="text-2xl font-semibold text-gray-900 mb-4">International Data Transfers</h2>
				<p class="text-gray-700 mb-4">
					Your data may be processed in countries other than your residence. We ensure appropriate safeguards are in place, including:
				</p>
				<ul class="list-disc list-inside text-gray-700 mb-4 ml-4">
					<li>EU Standard Contractual Clauses</li>
					<li>Adequacy decisions by relevant authorities</li>
					<li>Certification schemes and codes of conduct</li>
				</ul>
			</section>

			<section class="mb-8">
				<h2 class="text-2xl font-semibold text-gray-900 mb-4">Children's Privacy</h2>
				<p class="text-gray-700">
					TeliTask is not intended for children under 13 years old. We do not knowingly collect personal information from children under 13. If you believe we have collected such information, please contact us immediately at privacy@telitask.com.
				</p>
			</section>

			<section class="mb-8">
				<h2 class="text-2xl font-semibold text-gray-900 mb-4">Changes to This Policy</h2>
				<p class="text-gray-700">
					We may update this Privacy Policy periodically. We will notify you of any material changes by email or through our service. Continued use of TeliTask after changes constitutes acceptance of the updated policy.
				</p>
			</section>

			<section class="mb-8">
				<h2 class="text-2xl font-semibold text-gray-900 mb-4">Contact Us</h2>
				<p class="text-gray-700 mb-4">
					If you have questions about this Privacy Policy or our data practices, please contact us:
				</p>
				<div class="bg-orange-50 p-6 rounded-lg border border-orange-200">
					<p class="text-gray-700 mb-2"><strong>Email:</strong> privacy@telitask.com</p>
					<p class="text-gray-700 mb-2"><strong>Support:</strong> support@telitask.com</p>
					<p class="text-gray-700"><strong>Website:</strong> <a href="https://telitask.com" class="text-orange-600 hover:text-orange-700">https://telitask.com</a></p>
				</div>
			</section>
		</div>
	</div>
</div>