import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { createSupabaseClient } from '$lib/supabase';

// Endpoint to claim a phone number as WhatsApp primary
export const POST: RequestHandler = async ({ request, locals }) => {
  const session = await locals.getSession();
  
  if (!session?.user) {
    return error(401, 'Authentication required');
  }

  try {
    const { phoneNumber } = await request.json();
    
    if (!phoneNumber) {
      return error(400, 'Phone number is required');
    }

    const supabase = createSupabaseClient();

    // First check if this number is already WhatsApp primary for another user
    const { data: existingPrimary } = await supabase
      .from('phone_numbers')
      .select('user_id')
      .eq('phone_number', phoneNumber)
      .eq('is_whatsapp_primary', true)
      .single();

    if (existingPrimary && existingPrimary.user_id !== session.user.id) {
      return error(409, 'This phone number is already claimed by another user for WhatsApp');
    }

    // Check if user already has this phone number
    const { data: existingPhone } = await supabase
      .from('phone_numbers')
      .select('*')
      .eq('user_id', session.user.id)
      .eq('phone_number', phoneNumber)
      .single();

    if (existingPhone) {
      // Update existing phone to be WhatsApp primary
      // First remove WhatsApp primary from user's other numbers
      await supabase
        .from('phone_numbers')
        .update({ is_whatsapp_primary: false })
        .eq('user_id', session.user.id)
        .eq('is_whatsapp_primary', true);

      // Then set this one as primary
      const { error: updateError } = await supabase
        .from('phone_numbers')
        .update({ 
          is_whatsapp_primary: true,
          is_primary: true,
          updated_at: new Date().toISOString()
        })
        .eq('id', existingPhone.id);

      if (updateError) {
        console.error('Error updating phone:', updateError);
        return error(500, 'Failed to update phone number');
      }
    } else {
      // Add new phone number as WhatsApp primary
      // First remove WhatsApp primary from any other numbers for this user
      await supabase
        .from('phone_numbers')
        .update({ is_whatsapp_primary: false })
        .eq('user_id', session.user.id)
        .eq('is_whatsapp_primary', true);

      // Insert new phone number
      const { error: insertError } = await supabase
        .from('phone_numbers')
        .insert({
          user_id: session.user.id,
          phone_number: phoneNumber,
          is_primary: true,
          is_whatsapp_primary: true,
          is_verified: false,
          label: 'WhatsApp'
        });

      if (insertError) {
        console.error('Error inserting phone:', insertError);
        return error(500, 'Failed to add phone number');
      }
    }

    // Clear any existing WhatsApp sessions for this phone to force re-authentication
    await supabase
      .from('whatsapp_sessions')
      .delete()
      .eq('phone_number', phoneNumber);

    return json({ 
      success: true, 
      message: 'Phone number claimed for WhatsApp successfully',
      phoneNumber 
    });

  } catch (err) {
    console.error('Error claiming WhatsApp phone:', err);
    return error(500, 'Internal server error');
  }
};