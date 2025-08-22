import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { createSupabaseClient } from '$lib/supabase';
import { env } from '$env/dynamic/private';

// Email notification using Resend (free tier: 100 emails/day)
async function sendEmailNotification(data: {
  name: string;
  email: string;
  message: string;
}) {
  // Using Resend API - sign up at https://resend.com for free API key
  const RESEND_API_KEY = env.RESEND_API_KEY;
  
  if (!RESEND_API_KEY) {
    console.log('RESEND_API_KEY not configured, skipping email notification');
    console.log('New contact form submission:', data);
    return;
  }
  
  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: 'TeliTask <support@telitask.com>', // Your verified domain
        to: 'support@telitask.com', // Will forward to your Gmail via Cloudflare
        subject: `Contact Form: ${data.name}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #ea580c;">New Contact Form Submission</h2>
            <div style="background: #f9fafb; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <p style="margin: 10px 0;"><strong>Name:</strong> ${data.name}</p>
              <p style="margin: 10px 0;"><strong>Email:</strong> <a href="mailto:${data.email}">${data.email}</a></p>
              <p style="margin: 10px 0;"><strong>Message:</strong></p>
              <div style="background: white; padding: 15px; border-radius: 4px; border-left: 4px solid #ea580c;">
                <p style="white-space: pre-wrap; margin: 0;">${data.message}</p>
              </div>
            </div>
            <p style="color: #6b7280; font-size: 14px;">
              You can reply directly to this email or view it in your 
              <a href="https://telitask.com/dashboard/contacts" style="color: #ea580c;">admin dashboard</a>.
            </p>
          </div>
        `,
        reply_to: data.email // So you can reply directly to the sender
      })
    });
    
    const responseText = await response.text();
    
    if (!response.ok) {
      console.error('Resend API error:', response.status, responseText);
    } else {
      console.log('Email notification sent successfully:', responseText);
    }
  } catch (error) {
    console.error('Failed to send email notification:', error);
    // Don't throw - we still want to save to database even if email fails
  }
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
      console.error('Error code:', dbError.code);
      console.error('Error details:', dbError.details);
      console.error('Error hint:', dbError.hint);
      console.error('Error message:', dbError.message);
      return json(
        { 
          error: 'Failed to send message. Please try again.',
          debug: {
            code: dbError.code,
            message: dbError.message,
            details: dbError.details
          }
        },
        { status: 500 }
      );
    }
    
    // Send email notification and wait for it
    await sendEmailNotification({ name, email, message });
    
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