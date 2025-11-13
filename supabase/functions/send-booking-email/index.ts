import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.81.0";
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface BookingEmailRequest {
  bookingId: string;
  type: 'confirmation' | 'status_update' | 'reminder';
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? ""
    );

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("No authorization header");
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      throw new Error("Unauthorized");
    }

    const { bookingId, type }: BookingEmailRequest = await req.json();

    // Fetch booking details with related data
    const { data: booking, error: bookingError } = await supabase
      .from("bookings")
      .select(`
        *,
        service:services(*),
        client:profiles(*)
      `)
      .eq("id", bookingId)
      .single();

    if (bookingError || !booking) {
      throw new Error("Booking not found");
    }

    const clientEmail = booking.client.email;
    const clientName = booking.client.full_name;
    const serviceName = booking.service.name;
    const bookingDate = new Date(booking.scheduled_date).toLocaleDateString();
    const bookingTime = new Date(booking.scheduled_date).toLocaleTimeString();

    let subject = "";
    let htmlContent = "";

    switch (type) {
      case "confirmation":
        subject = `Booking Confirmed - ${serviceName}`;
        htmlContent = `
          <h1>Booking Confirmation</h1>
          <p>Hello ${clientName},</p>
          <p>Your booking has been confirmed!</p>
          <h2>Booking Details:</h2>
          <ul>
            <li><strong>Service:</strong> ${serviceName}</li>
            <li><strong>Date:</strong> ${bookingDate}</li>
            <li><strong>Time:</strong> ${bookingTime}</li>
            <li><strong>Address:</strong> ${booking.address}</li>
            <li><strong>Price:</strong> $${booking.service.price}</li>
          </ul>
          <p>We look forward to serving you!</p>
          <p>Best regards,<br>Handykonnect Team</p>
        `;
        break;

      case "status_update":
        subject = `Booking Status Update - ${serviceName}`;
        htmlContent = `
          <h1>Booking Status Update</h1>
          <p>Hello ${clientName},</p>
          <p>Your booking status has been updated to: <strong>${booking.status}</strong></p>
          <h2>Booking Details:</h2>
          <ul>
            <li><strong>Service:</strong> ${serviceName}</li>
            <li><strong>Date:</strong> ${bookingDate}</li>
            <li><strong>Time:</strong> ${bookingTime}</li>
          </ul>
          <p>Best regards,<br>Handykonnect Team</p>
        `;
        break;

      case "reminder":
        subject = `Upcoming Appointment Reminder - ${serviceName}`;
        htmlContent = `
          <h1>Appointment Reminder</h1>
          <p>Hello ${clientName},</p>
          <p>This is a reminder about your upcoming appointment:</p>
          <h2>Booking Details:</h2>
          <ul>
            <li><strong>Service:</strong> ${serviceName}</li>
            <li><strong>Date:</strong> ${bookingDate}</li>
            <li><strong>Time:</strong> ${bookingTime}</li>
            <li><strong>Address:</strong> ${booking.address}</li>
          </ul>
          <p>We look forward to seeing you!</p>
          <p>Best regards,<br>Handykonnect Team</p>
        `;
        break;
    }

    const emailResponse = await resend.emails.send({
      from: "Handykonnect <onboarding@resend.dev>",
      to: [clientEmail],
      subject,
      html: htmlContent,
    });

    console.log("Email sent successfully:", emailResponse);

    return new Response(JSON.stringify({ success: true, emailResponse }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("Error in send-booking-email:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
