import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { createSupabaseClient } from '$lib/supabase';

// Simple email notification using fetch (works with many email services)
async function sendEmailNotification(data: {
  name: string;
  email: string;
  message: string;
}) {
  // Option 1: If you have SendGrid, Mailgun, or other email service
  // Option 2: Use a webhook to trigger an email (Zapier, Make, etc.)
  // Option 3: Just store in database and check manually
  
  // For now, we'll just log it and store in database
  console.log('New contact form submission:', data);
  
  // If you want to send via an external service, uncomment and configure:
  /*
  try {
    await fetch('https://api.sendgrid.com/v3/mail/send', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.SENDGRID_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        personalizations: [{
          to: [{ email: 'support@telitask.com' }]
        }],
        from: { email: 'noreply@telitask.com' },
        subject: `New Contact Form: ${data.name}`,
        content: [{
          type: 'text/html',
          value: `
            <h2>New Contact Form Submission</h2>
            <p><strong>Name:</strong> ${data.name}</p>
            <p><strong>Email:</strong> ${data.email}</p>
            <p><strong>Message:</strong></p>
            <p>${data.message}</p>
          `
        }]
      })
    });
  } catch (error) {
    console.error('Failed to send email notification:', error);
  }
  */
}

export const POST: RequestHandler = async ({ request }) => {
  try {
    const { name, email, message } = await request.json();
    
    // Validate input
    if (!name?.trim() || !email?.trim() || !message?.trim()) {
      return json(
        { error: 'Please fill in all fields' },
        { status: 400 }
      );
    }
    
    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return json(
        { error: 'Please enter a valid email address' },
        { status: 400 }
      );
    }
    
    // Create Supabase client
    const supabase = createSupabaseClient();
    
    // Store in database
    const { data: contactMessage, error: dbError } = await supabase
      .from('contact_messages')
      .insert({
        name: name.trim(),
        email: email.trim(),
        message: message.trim()
      })
      .select()
      .single();
    
    if (dbError) {
      console.error('Database error:', dbError);
      return json(
        { error: 'Failed to send message. Please try again.' },
        { status: 500 }
      );
    }
    
    // Send email notification (async, don't wait)
    sendEmailNotification({ name, email, message });
    
    return json({
      success: true,
      message: 'Thank you for your message! We\'ll get back to you within 24 hours.',
      id: contactMessage.id
    });
    
  } catch (error) {
    console.error('Contact form error:', error);
    return json(
      { error: 'An unexpected error occurred. Please try again.' },
      { status: 500 }
    );
  }
};