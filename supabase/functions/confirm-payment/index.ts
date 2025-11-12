import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.81.0";
import Stripe from "https://esm.sh/stripe@14.21.0?target=deno";

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

    const { paymentIntentId } = await req.json();

    if (!paymentIntentId) {
      throw new Error('Missing paymentIntentId');
    }

    // Initialize Stripe
    const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
      apiVersion: '2023-10-16',
    });

    // Retrieve payment intent from Stripe
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

    // Update payment record in database
    const { data: payment, error: paymentError } = await supabase
      .from('payments')
      .update({
        status: paymentIntent.status === 'succeeded' ? 'completed' : 'failed',
      })
      .eq('stripe_payment_id', paymentIntentId)
      .select()
      .single();

    if (paymentError) {
      console.error('Error updating payment:', paymentError);
      throw paymentError;
    }

    // Update booking status to confirmed if payment succeeded
    if (paymentIntent.status === 'succeeded') {
      const { error: bookingError } = await supabase
        .from('bookings')
        .update({ status: 'confirmed' })
        .eq('id', payment.booking_id);

      if (bookingError) {
        console.error('Error updating booking:', bookingError);
      }
    }

    console.log('Payment confirmed:', paymentIntentId, 'Status:', paymentIntent.status);

    return new Response(
      JSON.stringify({
        status: paymentIntent.status,
        payment: payment,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('Error in confirm-payment:', error);
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
