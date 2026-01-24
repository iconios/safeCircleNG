// Login OTP Request Flow (Aligned with Signup)
/*
1. Validate input (phone, device_id)
2. Fetch user by phone
   a. If NOT found → reject ("Account not found. Please sign up")
   b. If status = suspended → reject
   c. If phone_verified = false → reject ("Verify phone first")
3. Enforce otp_locked_until
4. Enforce cooldown (last_otp_requested_at)
5. Normalize hourly/daily windows
   a. If hour window expired → reset otp_requests_last_hour
   b. If day window expired → reset otp_requests_today
6. Enforce limits:
   a. otp_requests_last_hour >= 5 → reject
   b. otp_requests_today >= 15 → reject
7. Create OTP (type = login)
   - hash
   - store
   - send SMS
8. After SMS success:
   a. last_otp_requested_at = now
   b. otp_requests_last_hour += 1
   c. otp_requests_today += 1
9. Respond success
*/

import { ZodError } from "zod";
import { OTP_COOLDOWN_MS } from "../../config/auth";
import { supabaseAdmin } from "../../config/supabase";
import { loginInputDataSchema, loginInputDTO } from "../../types/auth.types";
import { isDev } from "../../utils/devEnv.util";
import {
  isDayWindowExpired,
  isHourWindowExpired,
} from "../../utils/windowExpired.util";
import createOtpService from "../otps/createOtp.service";
import logger from "../../config/logger";
import { maskPhone } from "../../utils/maskPhone.util";
import { randomUUID } from "node:crypto";

const auth = logger.child({
  service: "loginAuthService",
  requestId: randomUUID(),
});

const loginAuthService = async (loginInput: loginInputDTO) => {
  const now = new Date();
  try {
    // 1. Validate input (phone, device_id)
    const { phone_number } = loginInputDataSchema.parse(loginInput);
    const maskedPhone = maskPhone(phone_number);

    // 2. Fetch user by phone
    const { data: userData, error: userError } = await supabaseAdmin
      .from("users")
      .select(
        "id, status, phone_verified, otp_locked_until, last_otp_requested_at, otp_hour_window_started_at, otp_day_window_started_at, otp_requests_last_hour, otp_requests_today, device_id",
      )
      .eq("phone_number", phone_number)
      .maybeSingle();
    if (userError) {
      auth.info("Error fetching user", {
        phone: maskedPhone,
        reason: "USER_FETCH_ERROR",
      });
      return {
        success: false,
        message: "Error fetching user",
        data: null,
        error: {
          code: "USER_FETCH_ERROR",
          details: isDev
            ? (userError ?? "Error fetching user")
            : "Error fetching user",
        },
        metadata: {
          timestamp: now.toISOString(),
          phoneNumber: phone_number,
        },
      };
    }

    //     a. If NOT found → reject ("Account not found. Please sign up")
    if (!userData) {
      auth.info("If an account exists for this number, a code will be sent", {
        phone: maskedPhone,
        reason: "USER_NOT_FOUND",
      });
      return {
        success: false,
        message: "If an account exists for this number, a code will be sent",
        data: null,
        error: {
          code: "USER_NOT_FOUND",
          details: "If an account exists for this number, a code will be sent",
        },
        metadata: {
          timestamp: now.toISOString(),
          phoneNumber: phone_number,
        },
      };
    }

    //    b. If status = suspended → reject
    if (userData.status === "suspended") {
      auth.warn("User suspended", {
        phone: maskedPhone,
        reason: "USER_SUSPENDED",
      });
      return {
        success: false,
        message: "User suspended. Contact support",
        data: null,
        error: {
          code: "USER_SUSPENDED",
          details: "User suspended. Contact support",
        },
        metadata: {
          timestamp: now.toISOString(),
          phoneNumber: phone_number,
        },
      };
    }

    //    c. If phone_verified = false → reject ("Verify phone first")
    if (!userData.phone_verified) {
      auth.info("Please verify phone number first", {
        phone: maskedPhone,
        reason: "PHONE_UNVERIFIED",
      });
      return {
        success: false,
        message: "Please verify phone number first",
        data: null,
        error: {
          code: "PHONE_UNVERIFIED",
          details: "Please verify phone number first",
        },
        metadata: {
          timestamp: now.toISOString(),
          phoneNumber: phone_number,
        },
      };
    }

    // 3. Enforce otp_locked_until
    if (
      userData.otp_locked_until &&
      now < new Date(userData.otp_locked_until)
    ) {
      const remainingMs =
        new Date(userData.otp_locked_until).getTime() - Date.now();
      const remainingMinutes = Math.ceil(remainingMs / 60000);
      auth.info(`Try again in ${remainingMinutes} minutes`, {
        phone: maskedPhone,
        reason: "ACCOUNT_LOCKED",
      });
      return {
        success: false,
        message: `Try again in ${remainingMinutes} minutes`,
        data: null,
        error: {
          code: "ACCOUNT_LOCKED",
          details: `Try again in ${remainingMinutes} minutes`,
        },
        metadata: {
          timestamp: now.toISOString(),
          phoneNumber: phone_number,
        },
      };
    }

    // 4. Enforce cooldown (last_otp_requested_at)
    if (userData.last_otp_requested_at) {
      const diffMs =
        Date.now() - new Date(userData.last_otp_requested_at).getTime();
      const isInCooldown = diffMs < OTP_COOLDOWN_MS;
      if (isInCooldown) {
        const remainingSeconds = Math.ceil((OTP_COOLDOWN_MS - diffMs) / 1000);
        auth.info(`Wait ${remainingSeconds} seconds to request new OTP`, {
          phone: maskedPhone,
          reason: "OTP_COOLDOWN",
        });
        return {
          success: false,
          message: `Wait ${remainingSeconds} seconds to request new OTP`,
          data: null,
          error: {
            code: "OTP_COOLDOWN",
            details: "Wait for OTP cool-down time to elapse",
          },
          metadata: {
            timestamp: now.toISOString(),
            phoneNumber: phone_number,
          },
        };
      }
    }

    // 5. Normalize hourly/daily windows
    //    a. If hour window expired → reset otp_requests_last_hour
    const hourWindowExpired = isHourWindowExpired(
      userData.otp_hour_window_started_at,
      now,
    );
    const effectiveHourlyCount = hourWindowExpired
      ? 0
      : userData.otp_requests_last_hour;

    //    b. If day window expired → reset otp_requests_today
    const dayWindowExpired = isDayWindowExpired(
      userData.otp_day_window_started_at,
      now,
    );
    const effectiveDailyCount = dayWindowExpired
      ? 0
      : userData.otp_requests_today;

    // 6. Enforce limits:
    //    a. otp_requests_last_hour >= 5 → reject
    if (effectiveHourlyCount >= 5) {
      auth.warn(`Too many requests. Try again later`, {
        phone: maskedPhone,
        reason: "LIMIT_EXCEEDED",
      });
      return {
        success: false,
        message: "Too many requests. Try again later",
        data: null,
        error: {
          code: "LIMIT_EXCEEDED",
          details: "Too many requests. Try again later",
        },
        metadata: {
          timestamp: now.toISOString(),
          phoneNumber: phone_number,
        },
      };
    }
    //    b. otp_requests_today >= 15 → reject
    if (effectiveDailyCount >= 15) {
      auth.warn(`Daily limit exceeded`, {
        phone: maskedPhone,
        reason: "LIMIT_EXCEEDED",
      });
      return {
        success: false,
        message: "Daily limit exceeded. Try again later",
        data: null,
        error: {
          code: "LIMIT_EXCEEDED",
          details: "Daily limit exceeded. Try again later",
        },
        metadata: {
          timestamp: now.toISOString(),
          phoneNumber: phone_number,
        },
      };
    }

    // 7. Create OTP (type = login)
    //    - hash
    //    - store
    //    - send SMS
    // 8. After SMS success:
    //    a. last_otp_requested_at = now
    //    b. otp_requests_last_hour += 1
    //    c. otp_requests_today += 1
    // 9. Respond success
    return await createOtpService(phone_number, "login", userData.id);
  } catch (error) {
    if (isDev) {
      auth.error("loginAuthService error:", error);
    }

    if (error instanceof ZodError) {
      auth.error(`Login data validation failed`, {
        reason: "VALIDATION_ERROR",
        error,
      });
      return {
        success: false,
        message: error.message || "Login data validation failed",
        data: null,
        error: {
          code: "VALIDATION_ERROR",
          details: "Login data validation failed",
        },
        metadata: {
          timestamp: now.toISOString(),
        },
      };
    }

    auth.info("Unexpected error while logining in user", {
      reason: "INTERNAL_ERROR",
      error,
    });
    return {
      success: false,
      message: "Unexpected error while logining in user",
      data: null,
      error: {
        code: "INTERNAL_ERROR",
        details: "Unexpected error while logining in user",
      },
      metadata: {
        timestamp: now.toISOString(),
      },
    };
  }
};

export default loginAuthService;
