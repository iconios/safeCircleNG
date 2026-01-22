import axios from "axios";
import { isDev } from "./devEnv.util";

const TERMII_API_KEY = process.env.TERMII_API_KEY;
const senderID = process.env.SMS_SENDER_ID;
const TERMII_BASE_URL = process.env.TERMII_BASE_URL;

const SendSMSUtil = async (phoneNumber: string, message: string) => {
  const now = new Date();
  if (!TERMII_API_KEY || !TERMII_BASE_URL || !senderID) {
    throw new Error("SMS provider configuration missing");
  }

  const url = `${TERMII_BASE_URL}/api/sms/send`;
  const data = {
    to: phoneNumber,
    from: senderID,
    sms: message,
    type: "plain",
    channel: "generic",
    api_key: TERMII_API_KEY,
  };

  try {
    const response = await axios.post(url, data, {
      headers: {
        "Content-Type": "application/json",
      },
    });
    console.log("SMS sent successfully:", {
      phoneNumber,
      provider: "termii",
    });
    return {
      success: true,
      message: `SMS sent successfully to ${phoneNumber}`,
      data: response.status, // Matches an expected delivery_status for message logs
      error: null,
      metadata: {
        timestamp: now.toISOString(),
      },
    };
  } catch (error) {
    if (isDev) {
      console.error("sendSMSUtil error:", error);
    }

    return {
      success: false,
      message: `Error sending sms to ${phoneNumber}`,
      data: null,
      error: {
        code: "OTP_SENDING_FAILED",
        details: "failed", // Matches an expected delivery_status for message logs
      },
      metadata: {
        timestamp: now.toISOString(),
      },
    };
  }
};

export default SendSMSUtil;
