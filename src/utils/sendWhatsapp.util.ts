import axios from "axios";
import logger from "../config/logger";
import { randomUUID } from "node:crypto";
import { maskPhone } from "./maskPhone.util";
import { errorResponseUtil, successResponseUtil } from "./responses.util";

const PHONE_NUMBER_ID = process.env.WHATSAPP_PHONENUMBERID!;
const TOKEN = process.env.WHATSAPP_ACCESS_TOKEN!;

export async function sendWhatsappOtp(phone: string, code: string) {
  const sendWhatsappLogger = logger.child({
    service: "sendWhatsappUtil",
    requestId: randomUUID(),
    provider: "meta",
    channel: "whatsapp",
  });
  try {
    const response = await axios.post(
      `https://graph.facebook.com/v22.0/${PHONE_NUMBER_ID}/messages`,
      {
        messaging_product: "whatsapp",
        to: phone,
        type: "template",
        template: {
          name: "otp_code",
          language: { code: "en_US" },
          components: [
            {
              type: "body",
              parameters: [{ type: "text", text: code }],
            },
          ],
        },
      },
      {
        headers: {
          Authorization: `Bearer ${TOKEN}`,
          "Content-Type": "application/json",
        },
      },
    );

    const isSent = response?.data?.status === "success";
    sendWhatsappLogger.info("Whatsapp otp dispatch attempt:", {
      phoneNumber: maskPhone(phone),
      success: isSent,
      providerResponse: response?.data,
    });

    return successResponseUtil(
      isSent
        ? `Whatsapp OTP sent successfully to ${phone}`
        : `Whatsapp OTP failed to send to ${phone}`,
      null,
      {},
    );
  } catch (error: any) {
    sendWhatsappLogger.error(
      "WhatsApp send failed",
      error?.response?.data || error,
    );
    return errorResponseUtil("Error sending otp via whatsapp", {});
  }
}
