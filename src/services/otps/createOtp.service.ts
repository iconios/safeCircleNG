// Create otp service
/*
#Plan:
0. Check user is not locked
1. Accept and validate phone number
2. Accept and validate otp data
3. Invalidate previous otp of the same type
4. Ensure user owns the phone 
5. Create otp
6. Send otp to caller
*/

import { ZodError } from "zod";
import { otpType, otpTypeEnum } from "../../types/otp.types";
import { phoneNumber, PhoneNumberSchema } from "../../types/user.types";
import { isDev } from "../../utils/devEnv.util";
import { otpGen } from "otp-gen-agent";
import { supabaseAdmin } from "../../config/supabase";
import SendSMSUtil from "../../utils/sendSMS.util";
import { OTP_EXPIRES_MINUTES } from "../../config/auth";
import HashString from "../../utils/hashString.util";
import {
  isHourWindowExpired,
  isDayWindowExpired,
} from "../../utils/windowExpired.util";

const dispatchOtp = async (
  otpId: string,
  phoneNumber: string,
  otp: string,
  type: string,
  at: Date,
) => {
  const message = `Your SafeCircle verification code is ${otp}. Expires in ${OTP_EXPIRES_MINUTES} minutes.`;
  const result = await SendSMSUtil(phoneNumber, message);
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

const createOtpService = async (
  phoneNumber: phoneNumber,
  type: otpType,
  userId: string,
) => {
  const now = new Date();
  try {
    // 0. Check user is not locked
    const { data: user } = await supabaseAdmin
      .from("users")
      .select(
        "id, phone_number, otp_locked_until, otp_requests_last_hour, otp_requests_today, otp_hour_window_started_at, otp_day_window_started_at",
      )
      .eq("id", userId)
      .single();

    if (!user) {
      return {
        success: false,
        message: "Unable to send sms",
        data: null,
        error: {
          code: "USER_NOT_FOUND",
          details: "Unable to send sms",
        },
        metadata: {
          timestamp: now.toISOString(),
        },
      };
    }

    if (user?.otp_locked_until && new Date(user.otp_locked_until) > now) {
      return {
        success: false,
        message: "Too many attempts. Try again later",
        data: null,
        error: {
          code: "ACCOUNT_LOCKED",
          details: "Too many attempts. Try again later",
        },
        metadata: {
          timestamp: now.toISOString(),
        },
      };
    }

    // 1. Accept and validate phone number
    const validatedPhoneNumber = PhoneNumberSchema.parse(phoneNumber);

    // 2. Accept and validate otp data
    const validatedType = otpTypeEnum.parse(type);
    const expires = new Date();
    expires.setMinutes(expires.getMinutes() + OTP_EXPIRES_MINUTES);

    // 3. Invalidate previous otp of the same type
    const { data: existingOtp, error: confirmError } = await supabaseAdmin
      .from("otps")
      .select("id, expires_at")
      .eq("phone_number", validatedPhoneNumber)
      .eq("type", validatedType)
      .eq("status", "pending")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (confirmError) {
      return {
        success: false,
        message: "Error confirming otp. Please try again",
        data: null,
        error: {
          code: "OTP_CONFIRMATION_ERROR",
          details: "Error confirming otp. Please try again",
        },
        metadata: {
          timestamp: now.toISOString(),
          phoneNumber: isDev ? validatedPhoneNumber : undefined,
        },
      };
    }

    if (existingOtp?.expires_at && new Date(existingOtp.expires_at) > now) {
      return {
        success: false,
        message: "Please wait before requesting another code",
        data: null,
        error: {
          code: "OTP_COOLDOWN",
          details: "Please wait before requesting another code",
        },
        metadata: {
          timestamp: now.toISOString(),
          phoneNumber: isDev ? validatedPhoneNumber : undefined,
        },
      };
    }

    // 4. Ensure user owns the phone
    if (user.phone_number !== validatedPhoneNumber) {
      return {
        success: false,
        message: "Invalid user context",
        error: {
          code: "USER_PHONE_MISMATCH",
          details: "Invalid user context",
        },
        metadata: {
          timestamp: now.toISOString(),
        },
      };
    }

    // 5. Create otp
    const otp = await otpGen({ length: 6, type: "numeric" });
    const hashedOtp = await HashString(otp);
    if (existingOtp) {
      const { error } = await supabaseAdmin
        .from("otps")
        .update({
          otp_code: hashedOtp,
          expires_at: expires,
          attempts: 0,
          status: "pending",
        })
        .eq("phone_number", validatedPhoneNumber)
        .eq("type", validatedType)
        .eq("id", existingOtp.id)
        .select()
        .single();

      if (error) {
        return {
          success: false,
          message: "Error updating otp",
          data: null,
          error: {
            code: "OTP_UPDATE_ERROR",
            details: isDev
              ? (error.message ?? "Error creating otp")
              : "Error updating otp",
          },
          metadata: {
            timestamp: now.toISOString(),
            phoneNumber: isDev ? validatedPhoneNumber : undefined,
          },
        };
      }

      const smsResult = await dispatchOtp(
        existingOtp.id,
        validatedPhoneNumber,
        otp,
        validatedType,
        now,
      );
      if (smsResult.success) {
        await supabaseAdmin
          .from("users")
          .update({
            last_otp_requested_at: now.toISOString(),
          })
          .eq("id", userId);

        return smsResult;
      }
      return smsResult;
    }

    const { data, error } = await supabaseAdmin
      .from("otps")
      .insert({
        user_id: userId,
        otp_code: hashedOtp,
        phone_number: validatedPhoneNumber,
        expires_at: expires,
        type: validatedType,
        attempts: 0,
        status: "pending",
      })
      .select("id, phone_number, expires_at, type")
      .single();

    if (error) {
      return {
        success: false,
        message: "Error creating otp",
        data: null,
        error: {
          code: "OTP_CREATION_ERROR",
          details: isDev
            ? (error.message ?? "Error creating otp")
            : "Error creating otp",
        },
        metadata: {
          timestamp: now.toISOString(),
          phoneNumber: isDev ? validatedPhoneNumber : undefined,
        },
      };
    }

    // 6. Send otp to caller
    const smsResult = await dispatchOtp(
      data.id,
      validatedPhoneNumber,
      otp,
      validatedType,
      now,
    );
    if (smsResult.success) {
      const hourExpired = isHourWindowExpired(
        user?.otp_hour_window_started_at,
        now,
      );
      const dayExpired = isDayWindowExpired(
        user?.otp_day_window_started_at,
        now,
      );

      const hourlyCount = hourExpired ? 0 : (user?.otp_requests_last_hour ?? 0);
      const dailyCount = dayExpired ? 0 : (user?.otp_requests_today ?? 0);

      await supabaseAdmin
        .from("users")
        .update({
          last_otp_requested_at: now.toISOString(),
          otp_requests_last_hour: hourlyCount + 1,
          otp_hour_window_started_at: hourExpired
            ? now.toISOString()
            : user?.otp_hour_window_started_at,
          otp_requests_today: dailyCount + 1,
          otp_day_window_started_at: dayExpired
            ? now.toISOString()
            : user?.otp_day_window_started_at,
        })
        .eq("id", userId);

      return smsResult;
    }
    return smsResult;
  } catch (error) {
    if (isDev) {
      console.error("createOtpService error:", error);
    }

    if (error instanceof ZodError) {
      return {
        success: false,
        message: error.message || "Otp data validation failed",
        data: null,
        error: {
          code: "VALIDATION_ERROR",
          details: "Otp data validation failed",
        },
        metadata: {
          timestamp: now.toISOString(),
          phoneNumber: isDev ? phoneNumber : undefined,
        },
      };
    }

    return {
      success: false,
      message: "Internal server error",
      data: null,
      error: {
        code: "INTERNAL_ERROR",
        details: "Unexpected error while creating otp",
      },
      metadata: {
        timestamp: now.toISOString(),
        phoneNumber: isDev ? phoneNumber : undefined,
      },
    };
  }
};

export default createOtpService;
