import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.81.0";
import { Resend } from "npm:resend@4.0.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_PUBLISHABLE_KEY') ?? '',
      {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
        },
      }
    );

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (authError || !user) {
      throw new Error('Unauthorized');
    }

    const { bookingId, type } = await req.json();

    // Fetch booking details
    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .select(`
        *,
        service:services(*),
        client:profiles(*)
      `)
      .eq('id', bookingId)
      .single();

    if (bookingError || !booking) {
      throw new Error('Booking not found');
    }

    // Initialize Resend
    const resend = new Resend(Deno.env.get('RESEND_API_KEY'));

    let subject = '';
    let html = '';

    if (type === 'confirmation') {
      subject = `Booking Confirmation - ${booking.service.name}`;
      html = `
        <h1>Booking Confirmed!</h1>
        <p>Dear ${booking.client.full_name},</p>
        <p>Your booking for <strong>${booking.service.name}</strong> has been confirmed.</p>
        <h2>Booking Details:</h2>
        <ul>
          <li><strong>Service:</strong> ${booking.service.name}</li>
          <li><strong>Date:</strong> ${new Date(booking.scheduled_date).toLocaleString()}</li>
          <li><strong>Address:</strong> ${booking.address}</li>
          <li><strong>Price:</strong> $${booking.service.price}</li>
          <li><strong>Duration:</strong> ${booking.service.duration_minutes} minutes</li>
        </ul>
        ${booking.notes ? `<p><strong>Notes:</strong> ${booking.notes}</p>` : ''}
        <p>Thank you for choosing Handykonnect!</p>
      `;
    } else if (type === 'update') {
      subject = `Booking Update - ${booking.service.name}`;
      html = `
        <h1>Booking Status Updated</h1>
        <p>Dear ${booking.client.full_name},</p>
        <p>Your booking status has been updated to: <strong>${booking.status}</strong></p>
        <h2>Booking Details:</h2>
        <ul>
          <li><strong>Service:</strong> ${booking.service.name}</li>
          <li><strong>Date:</strong> ${new Date(booking.scheduled_date).toLocaleString()}</li>
          <li><strong>Address:</strong> ${booking.address}</li>
        </ul>
        <p>Thank you for choosing Handykonnect!</p>
      `;
    } else if (type === 'reminder') {
      subject = `Booking Reminder - ${booking.service.name}`;
      html = `
        <h1>Booking Reminder</h1>
        <p>Dear ${booking.client.full_name},</p>
        <p>This is a reminder for your upcoming appointment:</p>
        <h2>Booking Details:</h2>
        <ul>
          <li><strong>Service:</strong> ${booking.service.name}</li>
          <li><strong>Date:</strong> ${new Date(booking.scheduled_date).toLocaleString()}</li>
          <li><strong>Address:</strong> ${booking.address}</li>
        </ul>
        <p>We look forward to serving you!</p>
      `;
    }

    const { error: emailError } = await resend.emails.send({
      from: 'Handykonnect <onboarding@resend.dev>',
      to: [booking.client.email],
      subject,
      html,
    });

    if (emailError) {
      console.error('Email error:', emailError);
      throw emailError;
    }

    console.log('Email sent successfully:', bookingId, type);

    return new Response(
      JSON.stringify({ success: true }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('Error in send-booking-email:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    );
  }
});
