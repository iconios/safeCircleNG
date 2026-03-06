// providers/sendchampWhatsapp.js
import { randomUUID } from "node:crypto";
import logger from "../config/logger";
import { maskPhone } from "./maskPhone.util";
import messageConstructor from "./messageConstructor";
import { errorResponseUtil } from "./responses.util";
import axios from "axios";

export async function sendWhatsappSendChamp(phone: string, otp: string) {
  const now = new Date();
  const SENDCHAMP_BASE_URL = process.env.SENDCHAMP_BASE_URL;
  const SENDCHAMP_PUBLIC_KEY = process.env.SENDCHAMP_PUBLIC_KEY;
  if (!SENDCHAMP_BASE_URL || !SENDCHAMP_PUBLIC_KEY)
    throw new Error("Sendchamp details missing");

  const sendWhatsappLogger = logger.child({
    service: "sendWhatsappSendChamp",
    requestId: randomUUID(),
    provider: "sendChamp",
    channel: "whatsapp",
  });

  try {
    const res = await axios.post(
      `${SENDCHAMP_BASE_URL}/whatsapp/send`,
      {
        to: phone.startsWith("+") ? phone : `+${phone}`,
        message: messageConstructor({ messageType: "verification", otp }),
      },
      {
        headers: {
          Authorization: `Bearer ${SENDCHAMP_PUBLIC_KEY}`,
          "Content-Type": "application/json",
        },
        timeout: 10_000,
      },
    );

    const isSent = res?.data?.status === "success";

    sendWhatsappLogger.info("Whatsapp otp dispatch attempt:", {
      phoneNumber: maskPhone(phone),
      success: isSent,
      providerResponse: res?.data,
    });

    return {
      success: isSent,
      message: isSent
        ? `Whatsapp OTP sent successfully to ${phone}`
        : `Whatsapp OTP failed to send to ${phone}`,
      data: null,
      error: null,
      metadata: {
        timestamp: now.toISOString(),
      },
    };
  } catch (error) {
    sendWhatsappLogger.error("sendWhatsappSendChamp error", {
      error,
      phoneNumber: maskPhone(phone),
    });
    return errorResponseUtil(
      `Error sending whatsapp to ${phone} via whatsapp`,
      {
        code: "WHATSAPP_OTP_SENDING_FAILED",
        provider: "sendchamp",
      },
      {},
    );
  }
}
