// providers/termiiVoice.js
import axios from "axios";
import { isDev } from "./devEnv.util";

export async function sendVoiceOtp(phone: string, otp: string) {
  const now = new Date();

  try {
    const res = await axios.post(
      `${process.env.TERMII_BASE_URL}/api/sms/otp/call`,
      {
        phone_number: phone,
        otp,
        api_key: process.env.TERMII_API_KEY,
      },
      { timeout: 8000 },
    );

    console.log("SMS sent successfully:", {
      phoneNumber: phone,
      provider: "termii",
      channel: "voice",
    });

    const isSent = res.data?.status === "success";
    return {
      success: isSent,
      message: isSent
        ? `SMS sent successfully to ${phone} via voice`
        : `SMS failed to ${phone} via voice`,
      data: null,
      error: null,
      metadata: {
        timestamp: now.toISOString(),
      },
    };
  } catch (error) {
    if (isDev) {
      console.error("termiiVoice error:", error);
    }

    return {
      success: false,
      message: `Error sending sms to ${phone} via voice`,
      data: null,
      error: {
        code: "VOICE_OTP_SENDING_FAILED",
        details: "failed",
      },
      metadata: {
        timestamp: now.toISOString(),
      },
    };
  }
}
