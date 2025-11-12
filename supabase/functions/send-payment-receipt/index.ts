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

    const { paymentId } = await req.json();

    // Fetch payment details with booking and service info
    const { data: payment, error: paymentError } = await supabase
      .from('payments')
      .select(`
        *,
        booking:bookings(
          *,
          service:services(*),
          client:profiles(*)
        )
      `)
      .eq('id', paymentId)
      .single();

    if (paymentError || !payment) {
      throw new Error('Payment not found');
    }

    // Initialize Resend
    const resend = new Resend(Deno.env.get('RESEND_API_KEY'));

    const html = `
      <h1>Payment Receipt</h1>
      <p>Dear ${payment.booking.client.full_name},</p>
      <p>Thank you for your payment. Here are the details:</p>
      <h2>Payment Information:</h2>
      <ul>
        <li><strong>Payment ID:</strong> ${payment.id}</li>
        <li><strong>Amount:</strong> $${payment.amount}</li>
        <li><strong>Status:</strong> ${payment.status}</li>
        <li><strong>Date:</strong> ${new Date(payment.created_at).toLocaleString()}</li>
      </ul>
      <h2>Service Details:</h2>
      <ul>
        <li><strong>Service:</strong> ${payment.booking.service.name}</li>
        <li><strong>Scheduled Date:</strong> ${new Date(payment.booking.scheduled_date).toLocaleString()}</li>
        <li><strong>Address:</strong> ${payment.booking.address}</li>
      </ul>
      <p>This serves as your receipt for this transaction.</p>
      <p>Thank you for choosing Handykonnect!</p>
    `;

    const { error: emailError } = await resend.emails.send({
      from: 'Handykonnect <onboarding@resend.dev>',
      to: [payment.booking.client.email],
      subject: `Payment Receipt - ${payment.booking.service.name}`,
      html,
    });

    if (emailError) {
      console.error('Email error:', emailError);
      throw emailError;
    }

    console.log('Payment receipt sent successfully:', paymentId);

    return new Response(
      JSON.stringify({ success: true }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('Error in send-payment-receipt:', error);
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
