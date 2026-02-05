// providers/sendchampWhatsapp.js
import axios from "axios";
import { randomUUID } from "node:crypto";
import logger from "../config/logger";
import { maskPhone } from "./maskPhone.util";

export async function sendWhatsappSendChamp(phone: string, otp: string) {
  const now = new Date();
  const sendWhatsappLogger = logger.child({
    service: "createOtpService",
    requestId: randomUUID(),
  });

  try {
    const res = await axios.post(
      `${process.env.SENDCHAMP_BASE_URL}/whatsapp/send`,
      {
        to: phone,
        template_code: "otp_template",
        parameters: { code: otp },
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.SENDCHAMP_API_KEY}`,
          "Content-Type": "application/json"
        },
        timeout: 8000,
      },
    );

    sendWhatsappLogger.info("SMS sent successfully:", {
      phoneNumber: maskPhone(phone),
      provider: "sendChamp",
      channel: "whatsapp",
    });

    const isSent = res.data?.status === "success";
    return {
      success: isSent,
      message: isSent
        ? `SMS sent successfully to ${phone} via whatsapp`
        : `SMS failed to ${phone} via whatsapp`,
      data: null,
      error: null,
      metadata: {
        timestamp: now.toISOString(),
      },
    };
  } catch (error) {
    sendWhatsappLogger.error("sendSMSUtil error", {
      error,
      phoneNumber: maskPhone(phone),
      provider: "sendChamp",
      channel: "whatsapp",
    });
    return {
      success: false,
      message: `Error sending sms to ${phone} via whatsapp`,
      data: null,
      error: {
        code: "WHATSAPP_OTP_SENDING_FAILED",
        details: "failed",
      },
      metadata: {
        timestamp: now.toISOString(),
      },
    };
  }
}
