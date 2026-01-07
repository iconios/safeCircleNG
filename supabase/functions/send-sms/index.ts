Deno.serve(async (req) => {
  try {
    // 1. Parse the payload Supabase sends
    const payload = await req.json();
    const TERMII_BASE_URL = Deno.env.get("TERMII_BASE_URL");
    const TERMII_API_KEY = Deno.env.get("TERMII_API_KEY");
    const SMS_SENDER_ID = Deno.env.get("SMS_SENDER_ID");

    if (!TERMII_BASE_URL || !TERMII_API_KEY) {
      console.error("Missing termii env variables");
      return new Response("Server misconfiguration", { status: 500 });
    }
    const { phone, otp } = payload;

    if (!phone || !otp) {
      return new Response("Invalid payload", { status: 400 });
    }

    // 2. Send SMS via Termii
    const termiiResponse = await fetch(`${TERMII_BASE_URL}/api/sms/send`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        to: phone,
        from: SMS_SENDER_ID,
        sms: `Your ${SMS_SENDER_ID} verification code is ${otp}. Expires in 5 minutes.`,
        type: "plain",
        channel: "dnd",
        api_key: TERMII_API_KEY,
      }),
    });

    if (!termiiResponse.ok) {
      const errorText = await termiiResponse.text();
      console.error("Termii SMS failed:", errorText);
      return new Response("SMS delivery failed", { status: 500 });
    }

    // 3. Tell Supabase everything is OK
    return new Response("OK", { status: 200 });
  } catch (err) {
    console.error("Send SMS Hook error:", err);
    return new Response("Internal error", { status: 500 });
  }
});
