import axios from "axios";
import { supabaseAdmin } from "../config/supabase.ts";
import process from "node:process";

const TERMII_API_KEY = process.env.TERMII_API_KEY;
const senderID = process.env.SMS_SENDER_ID;
const TERMII_BASE_URL = process.env.TERMII_BASE_URL;

const SendSMSUtil = async (
  phoneNumber: string,
  OTP: string,
  userId: string,
  name?: string,
) => {
  if (!TERMII_API_KEY || !TERMII_BASE_URL || !senderID) {
    throw new Error("SMS provider configuration missing");
  }

  const url = `${TERMII_BASE_URL}/api/sms/send`;
  const data = {
    to: phoneNumber,
    from: senderID,
    sms: `Hi ${name ?? "new user"}, here's your OTP: ${OTP}`,
    type: "plain",
    channel: "dnd",
    api_key: TERMII_API_KEY,
  };

  try {
    await axios.post(url, data, {
      headers: {
        "Content-Type": "application/json",
      },
    });
    console.log("SMS sent successfully:", {
      phoneNumber,
      provider: "termii",
    });
  } catch (error) {
    console.error("Error sending SMS", error);
    await supabaseAdmin
      .from("users")
      .update({
        verification_code: null,
        verification_expires_at: null,
      })
      .eq("id", userId);

    return {
      success: false,
      message: "Failed to send OTP. Please try again",
      data: {},
      error: {
        code: "SMS_FAILED",
        details: "Error sending SMS",
      },
      metadata: {
        timestamp: new Date().toISOString(),
        phoneNumber,
      },
    };
  }
};

export default SendSMSUtil;
