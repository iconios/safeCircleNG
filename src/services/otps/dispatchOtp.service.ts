import { OTP_EXPIRES_MINUTES } from "../../config/auth";
import { supabaseAdmin } from "../../config/supabase";
import { isDev } from "../../utils/devEnv.util";
import SendSMSUtil from "../../utils/sendSMS.util";

const dispatchOtpService = async (
  channel: string,
  otpId: string,
  phoneNumber: string,
  otp: string,
  type: string,
  at: Date,
) => {
  const message = `Your SafeCircle verification code is ${otp}. Expires in ${OTP_EXPIRES_MINUTES} minutes.`;
  const result = await SendSMSUtil(phoneNumber, message, channel);
  if (!result.success) {
    await supabaseAdmin
      .from("otps")
      .update({
        status: "failed",
        otp_code: null,
        expires_at: null,
      })
      .eq("phone_number", phoneNumber)
      .eq("type", type)
      .eq("id", otpId);

    return {
      success: false,
      message: "Failed to send OTP. Please try again",
      data: null,
      error: {
        code: "SMS_FAILED",
        details: "Error sending SMS",
      },
      metadata: {
        timestamp: new Date().toISOString(),
        phoneNumber: isDev ? phoneNumber : undefined,
      },
    };
  }

  return {
    success: true,
    message: "Otp created and sent via sms",
    data: null,
    error: null,
    metadata: {
      timestamp: at.toISOString(),
      phoneNumber: isDev ? phoneNumber : undefined,
    },
  };
};

export default dispatchOtpService;