// Dispatch Otp Service
/*
1. Validate the inputs
2. Get the message
3. Check time of day in Nigeria
    -> if between 8am-8pm
        -> try SMS (Termii)
            -> if delivered -> done
            -> if not delivered in 15secs -> fallback
    -> try whatsApp (SendChamp)
        -> if delivered -> done
        -> if failed -> fallback
    -> try voice otp (Termii) -> done    
*/

import { randomUUID } from "node:crypto";
import logger from "../../config/logger";
import { isDev } from "../../utils/devEnv.util";
import SendSMSUtil from "../../utils/sendSMS.util";
import messageConstructor from "../../utils/messageConstructor";
import dayjs from "../../config/dayjsConfig";
import { sendVoiceOtp } from "../../utils/termiiVoice.util";
import { maskPhone } from "../../utils/maskPhone.util";
import {
  errorResponseUtil,
  successResponseUtil,
} from "../../utils/responses.util";
import { sendWhatsappOtp } from "../../utils/sendWhatsapp.util";

const WHATSAPP_PHONENUMBERID = process.env.WHATSAPP_PHONENUMBERID;

const NIGHT_START = 20; // 8pm
const NIGHT_END = 8; // 8am

const isNightTime = () => {
  const hour = dayjs().tz("Africa/Lagos").hour();
  return hour >= NIGHT_START || hour < NIGHT_END;
};

const dispatchOtpService = async (phoneNumber: string, otp: string) => {
  const dispatchLogger = logger.child({
    service: "dispatchOtpService",
    requestId: randomUUID(),
  });

  const message = messageConstructor({
    messageType: "verification",
    otp,
  });
  if (!phoneNumber || !WHATSAPP_PHONENUMBERID)
    throw new Error("Dispatch otp service inputs missing");

  // sms
  if (!isNightTime()) {
    try {
      const smsRes = await SendSMSUtil(phoneNumber, message, "generic");
      if (smsRes.success) {
        return successResponseUtil(
          "Otp created and sent via sms",
          {},
          {
            channel: "sms",
            phoneNumber: isDev ? phoneNumber : maskPhone(phoneNumber),
          },
        );
      }
    } catch {}
  }

  // WhatsApp
  dispatchLogger.info("SMS not available! Sending via whatsapp now", {
    phone: maskPhone(phoneNumber),
  });
  try {
    const whatsappRes = await sendWhatsappOtp(phoneNumber, otp);
    if (whatsappRes) {
      return successResponseUtil(
        "Otp created and sent via whatsapp",
        {},
        {
          channel: "whatsapp",
          phoneNumber: isDev ? phoneNumber : maskPhone(phoneNumber),
        },
      );
    }
  } catch {}

  dispatchLogger.info("Whatsapp failed! Sending via voice now", {
    phone: maskPhone(phoneNumber),
  });
  // Voice OTP (last resort)
  const voiceOk = await sendVoiceOtp(phoneNumber, otp);
  if (voiceOk) {
    return successResponseUtil(
      "Otp created and sent via voice",
      {},
      {
        channel: "voice",
        phoneNumber: isDev ? phoneNumber : maskPhone(phoneNumber),
      },
    );
  }

  return errorResponseUtil(
    "Failed to send otp via all channels",
    {
      code: "SMS_FAILED_ALL_CHANNELS",
      details: "Failed to send otp via all channels",
    },
    {
      phoneNumber: isDev ? phoneNumber : maskPhone(phoneNumber),
    },
  );
};

export default dispatchOtpService;
