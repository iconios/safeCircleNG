// Auth Service
/*
#Plan:
AuthRequest(phone, device_id, channel)

1. Validate input

2. Fetch user by phone
   If exists AND status = suspended → reject

3. If user exists:
   a. If otp_locked_until > now → reject
   b. If last_otp_requested_at + cooldown > now → reject
   c. Normalize hourly window
   d. Normalize daily window
   e. If otp_requests_last_hour >= 3 → reject
   f. If otp_requests_today >= 10 → reject

4. If user does NOT exist:
   a. Create user (unverified)
   b. Initialize otp counters & windows

5. If active OTP exists AND not expired:
   → return success (do NOT resend)

6. createOtpService:
   a. Generate OTP (type = auth)
   b. Hash + store
   c. Send via selected channel

7. Update OTP metadata:
   - last_otp_requested_at
   - otp_requests_last_hour++
   - otp_requests_today++
   - window timestamps

8. Return generic success response
*/

import { ZodError } from "zod";
import { SignUpDataDTO, SignUpDataDTOSchema } from "../../types/auth.types";
import { supabaseAdmin } from "../../config/supabase";
import { subscriptionExpiresAt } from "../../utils/calculateExpiry.util";
import HashString from "../../utils/hashString.util";
import { OTP_COOLDOWN_MS } from "../../config/auth";
import { isDev } from "../../utils/devEnv.util";
import createOtpService from "../otps/createOtp.service";
import {
  isDayWindowExpired,
  isHourWindowExpired,
} from "../../utils/windowExpired.util";
import logger from "../../config/logger";
import { maskPhone } from "../../utils/maskPhone.util";
import { randomUUID } from "node:crypto";
import {
  errorResponseUtil,
  successResponseUtil,
} from "../../utils/responses.util";

const authService = async (signUpData: SignUpDataDTO) => {
  console.log("backend received signupdata", signUpData);
  const auth = logger.child({
    service: "authService",
    requestId: randomUUID(),
  });
  const now: Date = new Date(Date.now());
  let userId: string = "";
  try {
    // 1. Validate input (phone, device_id, channel)
    const { phone_number, device_id, channel } =
      SignUpDataDTOSchema.parse(signUpData);
    const maskedPhone = maskPhone(phone_number);

    // 2. Fetch user by phone
    const { data: existingUser, error: fetchError } = await supabaseAdmin
      .from("users")
      .select(
        `id, phone_number, phone_verified, last_otp_requested_at, otp_locked_until, status, otp_hour_window_started_at, otp_requests_last_hour, otp_day_window_started_at, otp_requests_today`,
      )
      .eq("phone_number", phone_number)
      .maybeSingle();

    if (fetchError) {
      auth.info("Unable to process request", {
        phone: maskedPhone,
        reason: "USER_FETCH_ERROR",
      });
      return errorResponseUtil(
        "Unable to process request",
        {
          code: "USER_FETCH_ERROR",
          details: "Unable to process request",
        },
        {
          phoneNumber: maskedPhone,
        },
      );
    }

    if (existingUser) {
      userId = existingUser.id;
    }

    // a. If exists AND status = suspended
    //      → reject
    if (existingUser?.status === "suspended") {
      auth.warn("Account suspended", {
        phone: maskedPhone,
        reason: "USER_SUSPENDED",
      });
      return errorResponseUtil(
        "Account suspended. Contact support",
        {
          code: "USER_SUSPENDED",
          details: "Account suspended. Contact support",
        },
        {
          phoneNumber: maskedPhone,
        },
      );
    }

    //  3. If user exists:
    //  a. If otp_locked_until > now → reject
    if (
      existingUser?.otp_locked_until &&
      now < new Date(existingUser.otp_locked_until)
    ) {
      const remainingMs =
        new Date(existingUser.otp_locked_until).getTime() - Date.now();
      const remainingMinutes = Math.ceil(remainingMs / 60000);
      auth.warn(`Try again in ${remainingMinutes} minutes`, {
        phone: maskedPhone,
        reason: "ACCOUNT_LOCKED",
      });
      return errorResponseUtil(
        `Try again in ${remainingMinutes} minutes`,
        {
          code: "ACCOUNT_LOCKED",
          details: `Try again in ${remainingMinutes} minutes`,
        },
        {
          phoneNumber: maskedPhone,
        },
      );
    }

    //  b. If last_otp_requested_at + cooldown > now → reject
    if (existingUser?.last_otp_requested_at) {
      const diffMs =
        Date.now() - new Date(existingUser.last_otp_requested_at).getTime();
      const isInCooldown = diffMs < OTP_COOLDOWN_MS;
      if (isInCooldown) {
        const remainingSeconds = Math.ceil((OTP_COOLDOWN_MS - diffMs) / 1000);
        auth.warn(`Wait ${remainingSeconds} seconds to request new OTP`, {
          phone: maskedPhone,
          reason: "OTP_COOLDOWN",
        });
        return errorResponseUtil(
          `Wait ${remainingSeconds} seconds to request new OTP`,
          {
            code: "OTP_COOLDOWN",
            details: "Wait for OTP cool-down time to elapse",
          },
          {
            phoneNumber: maskedPhone,
          },
        );
      }
    }

    //  c. Normalize hourly window
    const hourWindowExpired = isHourWindowExpired(
      existingUser?.otp_hour_window_started_at,
      now,
    );
    const effectiveHourlyCount = hourWindowExpired
      ? 0
      : (existingUser?.otp_requests_last_hour ?? 0);

    // d. Normalize daily window
    const dayWindowExpired = isDayWindowExpired(
      existingUser?.otp_day_window_started_at,
      now,
    );
    const effectiveDailyCount = dayWindowExpired
      ? 0
      : (existingUser?.otp_requests_today ?? 0);

    //   e. If otp_requests_last_hour >= 3 → reject
    if (effectiveHourlyCount >= 3) {
      auth.warn("Too many requests. Try again later", {
        phone: maskedPhone,
        reason: "LIMIT_EXCEEDED",
        window: "Hour",
      });
      return errorResponseUtil(
        "Too many requests. Try again later",
        {
          code: "LIMIT_EXCEEDED",
          details: "Too many requests. Try again later",
        },
        {
          phoneNumber: maskedPhone,
        },
      );
    }

    // f. If otp_requests_today >= 10 → reject
    if (effectiveDailyCount >= 10) {
      auth.warn("Daily limit exceeded. Try again later", {
        phone: maskedPhone,
        reason: "LIMIT_EXCEEDED",
        window: "Daily",
      });
      return errorResponseUtil(
        "Daily limit exceeded. Try again later",
        {
          code: "LIMIT_EXCEEDED",
          details: "Daily limit exceeded. Try again later",
        },
        {
          phoneNumber: maskedPhone,
        },
      );
    }

    // 4. If user does NOT exist:
    //  a. Create user (unverified) and initialize otp counters & windows
    if (!existingUser) {
      const { data: userData, error: userError } = await supabaseAdmin
        .from("users")
        .insert({
          phone_number,
          // - phone_verified = false
          phone_verified: false,
          user_type: "individual",
          subscription_tier: "free",
          subscription_expires_at: subscriptionExpiresAt(),
          device_id: await HashString(device_id),
          // - status = pending_verification
          status: "pending_verification",
          // - otp_requests_last_hour = 0
          otp_requests_last_hour: 0,
          // - otp_requests_today = 0
          otp_requests_today: 0,
          // - otp_hour_window_started_at = now
          otp_hour_window_started_at: now,
          // - otp_day_window_started_at = now
          otp_day_window_started_at: now,
        })
        .select("id")
        .single();

      if (userError) {
        auth.info("Error creating user. Try again", {
          phone: maskedPhone,
          reason: "CREATE_USER_ERROR",
        });
        return errorResponseUtil(
          "Error creating user. Try again",
          {
            code: "CREATE_USER_ERROR",
            details: isDev
              ? (userError ?? "Error creating user")
              : "Error creating user",
          },
          {
            phoneNumber: maskedPhone,
          },
        );
      }

      if (userData) {
        userId = userData.id;
      }
    }

    // 5. If active OTP exists AND not expired:
    //  → return success (do NOT resend)
    if (existingUser) {
      const { data: otpData, error: otpError } = await supabaseAdmin
        .from("otps")
        .select("id, expires_at")
        .eq("user_id", existingUser.id)
        .eq("phone_number", existingUser.phone_number)
        .maybeSingle();
      if (otpError) {
        auth.error("Error confirming otp data", {
          phoneNumber: maskedPhone,
          reason: "OTP_CONFIRMATION_ERROR",
        });
        return errorResponseUtil(
          "Error confirming otp data",
          {
            code: "OTP_CONFIRMATION_ERROR",
            details: "Error confirming otp data",
          },
          {
            phoneNumber: maskedPhone,
          },
        );
      }

      if (otpData && new Date(otpData.expires_at) > now) {
        auth.info("Otp has already been sent", {
          phoneNumber: maskedPhone,
          reason: "OTP_ALREADY_SENT",
        });
        return successResponseUtil("Otp has already been sent", null, {
          phoneNumber: maskedPhone,
          code: "OTP_ALREADY_SENT",
          details: "Otp has already been sent",
        });
      }
    }

    // 6. createOtpService handles:
    // a. Create OTP (type = auth)
    //   - hash
    //   - store
    //   - send SMS
    // b. Set otp metadata
    //  - last_otp_requested_at
    //  - otp_requests_last_hour
    //  - otp_requests_today
    //  - window timestamps
    return await createOtpService(phone_number, userId);
  } catch (error) {
    auth.error("signUpAuthService error:", error);

    if (error instanceof ZodError) {
      auth.error("Signup data validation failed", {
        reason: "VALIDATION_ERROR",
        error,
      });
      return errorResponseUtil(
        error.message || "Signup data validation failed",
        {
          code: "VALIDATION_ERROR",
          details: "Signup data validation failed",
        },
        {},
      );
    }

    auth.error("Unexpected error while signing up user", {
      reason: "INTERNAL_ERROR",
      error,
    });
    return errorResponseUtil(
      "Unexpected error while signing up user",
      {
        code: "INTERNAL_ERROR",
        details: "Unexpected error while signing up user",
      },
      {},
    );
  }
};

export default authService;
