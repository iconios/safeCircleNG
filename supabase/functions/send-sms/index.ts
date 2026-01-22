export const config = { auth: false };

console.log("🚀 send-sms module loaded");

Deno.serve(async (req) => {
  try {
    console.log("📨 request received");

    if (req.method !== "POST") {
      return new Response("Method Not Allowed", { status: 405 });
    }

    const payload = await req.json();
    console.log("📦 payload:", payload);

    const { phone, otp } = payload;

    if (!phone || !otp) {
      console.error("❌ Invalid payload");
      return new Response("Invalid payload", { status: 400 });
    }

    const TERMII_BASE_URL = Deno.env.get("TERMII_BASE_URL");
    const TERMII_API_KEY = Deno.env.get("TERMII_API_KEY");
    const SMS_SENDER_ID = Deno.env.get("SMS_SENDER_ID");

    console.log("🔐 env check:", {
      TERMII_BASE_URL: !!TERMII_BASE_URL,
      TERMII_API_KEY: !!TERMII_API_KEY,
      SMS_SENDER_ID,
    });

    if (!TERMII_BASE_URL || !TERMII_API_KEY) {
      console.error("❌ Missing Termii env variables");
      return new Response("Server misconfiguration", { status: 500 });
    }

    const termiiResponse = await fetch(`${TERMII_BASE_URL}/api/sms/send`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        to: phone,
        from: SMS_SENDER_ID, // IMPORTANT
        sms: `Your safeCircle verification code is ${otp}. Expires in 5 minutes.`,
        type: "plain",
        channel: "generic", // IMPORTANT
        api_key: TERMII_API_KEY,
      }),
    });

    const termiiResult = await termiiResponse.json();
    console.log("📡 Termii response:", termiiResult);

    if (!termiiResponse.ok) {
      return new Response("SMS delivery failed", { status: 500 });
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("🔥 Send SMS Hook error:", err);
    return new Response("Internal error", { status: 500 });
  }
});
