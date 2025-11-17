import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";
import { Resend } from "https://esm.sh/resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface TransactionAlert {
  type: 'payment' | 'booking';
  status: string;
  amount?: number;
  customerName: string;
  customerEmail: string;
  serviceName?: string;
  bookingDate?: string;
  transactionId: string;
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const alertData: TransactionAlert = await req.json();

    const emailContent = alertData.type === 'payment'
      ? `
        <h2>New Payment Transaction</h2>
        <p><strong>Status:</strong> ${alertData.status}</p>
        <p><strong>Amount:</strong> $${alertData.amount?.toFixed(2)}</p>
        <p><strong>Customer:</strong> ${alertData.customerName} (${alertData.customerEmail})</p>
        <p><strong>Transaction ID:</strong> ${alertData.transactionId}</p>
      `
      : `
        <h2>New Booking Transaction</h2>
        <p><strong>Status:</strong> ${alertData.status}</p>
        <p><strong>Service:</strong> ${alertData.serviceName}</p>
        <p><strong>Booking Date:</strong> ${alertData.bookingDate}</p>
        <p><strong>Customer:</strong> ${alertData.customerName} (${alertData.customerEmail})</p>
        <p><strong>Booking ID:</strong> ${alertData.transactionId}</p>
      `;

    const emailResponse = await resend.emails.send({
      from: "HandyConnect Transactions <onboarding@resend.dev>",
      to: ["jesicar1100@gmail.com"],
      subject: `New ${alertData.type === 'payment' ? 'Payment' : 'Booking'} - ${alertData.status}`,
      html: emailContent,
    });

    console.log("Transaction alert email sent:", emailResponse);

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("Error sending transaction alert:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
