// Verify OTP Auth Service
/*
#Verify OTP Flow Outline (Supabase-native):

1. Validate input
   a. Validate phone number format (E.164)
   b. Validate OTP format (length, string)

2. Fetch user record from `public.users`
   a. If user does not exist → reject (signup required)
   b. If user status is "suspended" → reject
   c. If user status is "inactive" → reject

3. Enforce OTP lockout rules (app-level)
   a. If otp_locked_until > now → reject with remaining wait time

4. Verify OTP with Supabase Auth
   a. Call `supabase.auth.verifyOtp({ phone, token, type: "sms" })`
   b. Supabase:
      - validates OTP
      - checks expiry
      - tracks attempts
      - issues session on success

5. If OTP verification fails
   a. Increment failed_otp_attempts
   b. If attempts exceed threshold:
      - set otp_locked_until
   c. Return generic error ("Invalid or expired code")

6. If OTP verification succeeds
   a. Reset failed_otp_attempts
   b. Clear otp_locked_until
   c. Update user status → "active"
   d. Update phone_verified → true
   e. Return Supabase session to client
*/

import { ZodError } from "zod";
import { supabaseAdmin } from "../../config/supabase.ts";
import {
  VerifyOtpDataDTO,
  VerifyOtpDataSchema,
} from "../../types/auth.types.ts";
import { LOCK_DURATION_MINUTES, MAX_OTP_ATTEMPTS } from "../../config/auth.ts";

export const updateLastOtpRequestAt = async (id: string, at: Date) => {
  try {
  await supabaseAdmin.from("users").update({
    last_otp_requested_at: at.toISOString(),
  }).eq("id", id)
  } catch (error) {
    console.error(`Last otp update failed for ${id}`, error);
  }
}

const VerifyOtpAuthService = async (verifyOtpData: VerifyOtpDataDTO) => {
  const now = new Date(Date.now());
  try {
    // 1. Validate input
    //  a. Validate phone number format (E.164)
    //  b. Validate OTP format (length, string)
    const { phone_number, otp } = VerifyOtpDataSchema.parse(verifyOtpData);

    // 2. Fetch user record from `public.users`
    const { data: userData, error: userError } = await supabaseAdmin
      .from("users")
      .select("id, failed_attempt_count, otp_locked_until, status")
      .eq("phone_number", phone_number)
      .maybeSingle();

    if (userError) {
      return {
        success: false,
        message: "Error fetching user",
        data: {},
        error: {
          code: "FETCH_ERROR",
          details: "Error fetching user in db",
        },
        metadata: {
          timestamp: now.toISOString(),
          phoneNumber: phone_number,
        },
      };
    }

    //  a. If user does not exist → reject (signup required)
    if (!userData) {
      return {
        success: false,
        message: "Please sign up",
        data: {},
        error: {
          code: "NOT_FOUND",
          details: "User not found in the database",
        },
        metadata: {
          timestamp: now.toISOString(),
          phoneNumber: phone_number,
        },
      };
    }

    //  b. If user status is "suspended" → reject
    if (userData.status === "suspended") {
      return {
        success: false,
        message: "Account suspended. Contact support",
        data: {},
        error: {
          code: "USER_SUSPENDED",
          details: "User account suspended by admin",
        },
        metadata: {
          timestamp: now.toISOString(),
          phoneNumber: phone_number,
        },
      };
    }

    //  c. If user status is "inactive" → reject
    if (userData.status === "inactive") {
      return {
        success: false,
        message: "Subscription expired. Please subscribe account",
        data: {},
        error: {
          code: "ACCOUNT_INACTIVE",
          details: "User account subscription expired",
        },
        metadata: {
          timestamp: now.toISOString(),
          phoneNumber: phone_number,
        },
      };
    }

    // 3. Enforce OTP lockout rules (app-level)
    // a. If otp_locked_until > now → reject with remaining wait time
    if (
      userData.otp_locked_until &&
      new Date(userData.otp_locked_until) > now
    ) {
      const remainingMs =
        new Date(userData.otp_locked_until).getTime() - Date.now();
      const remainingMinutes = Math.ceil(remainingMs / 60000);
      return {
        success: false,
        message: `Too many attempts, try again in ${remainingMinutes} minutes`,
        data: {},
        error: {
          code: "LIMIT_EXCEEDED",
          details: "Too many attempts within 15 minutes",
        },
        metadata: {
          timestamp: now.toISOString(),
          phoneNumber: phone_number,
        },
      };
    }

    // 4. Verify OTP with Supabase Auth
    //  a. Call `supabase.auth.verifyOtp({ phone, token, type: "sms" })`
    //  b. Supabase:
    //     - validates OTP
    //     - checks expiry
    //     - tracks attempts
    //     - issues session on success
    const { data: sessionData, error: sessionError } =
      await supabaseAdmin.auth.verifyOtp({
        phone: phone_number,
        token: otp,
        type: "sms",
      });

    // 5. If OTP verification fails
    //  a. Increment failed_otp_attempts
    //  b. If attempts exceed threshold:
    //     - set otp_locked_until
    if (sessionError) {
      const attempts = userData.failed_attempt_count + 1 >= MAX_OTP_ATTEMPTS;
      const isOtpError = sessionError.status === 400;
      if (isOtpError) {
        await supabaseAdmin
          .from("users")
          .update({
            failed_attempt_count: userData.failed_attempt_count + 1,
            otp_locked_until: attempts
              ? new Date(
                  Date.now() + LOCK_DURATION_MINUTES * 60 * 1000,
                ).toISOString()
              : userData.otp_locked_until,
            last_otp_requested_at: now.toISOString(),
          })
          .eq("id", userData.id);
      }

      //  c. Return generic error ("Invalid or expired code")
      return {
        success: false,
        message: isOtpError
          ? "Invalid or expired code"
          : "Service temporarily unavailable",
        data: {},
        error: {
          code: isOtpError ? "INVALID_OTP" : "SERVICE OUTAGE",
          details: isOtpError
            ? "Invalid or expired code"
            : "Service temporarily unavailable",
        },
        metadata: {
          timestamp: new Date().toISOString(),
          phoneNumber: phone_number,
        },
      };
    }

    // 6. If OTP verification succeeds
    //  a. Reset failed_otp_attempts
    //  b. Clear otp_locked_until
    //  c. Update user status → "active"
    //  d. Update phone_verified → true
    await supabaseAdmin
      .from("users")
      .update({
        failed_attempt_count: 0,
        otp_locked_until: null,
        phone_verified: true,
        status: "active",
        last_otp_requested_at: now.toISOString(),
      })
      .eq("id", userData.id);

    //  e. Return Supabase session to client
    return {
      success: true,
      message: "User successfully verified",
      data: {
        accessToken: sessionData.session?.access_token,
        refreshToken: sessionData.session?.refresh_token,
        userId: sessionData.session?.user.id,
        sessionExpires: sessionData.session?.expires_at,
      },
      error: null,
      metadata: {
        timestamp: new Date().toISOString(),
        phoneNumber: phone_number,
      },
    };
  } catch (error) {
    const now = new Date(Date.now());
    if (error instanceof ZodError) {
      console.error("Error verifying OTP", error);
      return {
        success: false,
        message: "Error validating input parameters",
        data: {},
        error: {
          code: "VALIDATION_ERROR",
          details: "Error while validating input parameters",
        },
        metadata: {
          timestamp: now.toISOString(),
        },
      };
    }

    return {
      success: false,
      message: "Error verifying OTP",
      data: {},
      error: {
        code: "VERIFICATION_ERROR",
        details: "Error while verifying verification code",
      },
      metadata: {
        timestamp: now.toISOString(),
      },
    };
  }
};

export default VerifyOtpAuthService;
