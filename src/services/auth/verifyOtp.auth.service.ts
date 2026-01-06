// Verify OTP Auth Service
/*
#Verify OTP Flow Outline (Supabase-native):

1. Validate input
   a. Validate phone number format (E.164)
   b. Validate OTP format (length, numeric)

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
import { supabaseAdmin } from "../../config/supabase";
import { VerifyOtpDataDTO, VerifyOtpDataSchema } from "../../types/auth.types";
import CompareOtp from "../../utils/compareOtp.util";

const VerifyOtpAuthService = async (verifyOtpData: VerifyOtpDataDTO) => {
  const now = new Date(Date.now());
  try {
    // 1. Gets and validates the otp and phone number format
    const { phone_number, otp } = VerifyOtpDataSchema.parse(verifyOtpData);

    // 2. Check if failed attempts >= 3 in last 15min:
    // a. If yes, reject with "Too many attempts, try again in XX minutes"
    const { data: userData, error: userError } = await supabaseAdmin
      .from("users")
      .select(
        "id, failed_attempt_count, verification_code, verification_expires_at, status",
      )
      .eq("phone_number", phone_number)
      .maybeSingle();
    if (userError) {
      return {
        success: false,
        message: "User not found",
        data: {},
        error: {
          code: "NOT_FOUND",
          details: "User not found in the database",
        },
        metadata: {
          timestamp: new Date().toISOString(),
          phoneNumber: phone_number,
        },
      };
    }

    if (
      userData?.failed_attempt_count >= 3 &&
      new Date(userData?.verification_expires_at) > now
    ) {
      const remainingMs =
        new Date(userData?.verification_expires_at).getTime() - Date.now();
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
          timestamp: new Date().toISOString(),
          phoneNumber: phone_number,
        },
      };
    }

    // 3. Check user status:
    // a. If suspended: notify account suspended, contact support
    if (userData?.status === "suspended") {
      return {
        success: false,
        message: "Account suspended. Contact support",
        data: {},
        error: {
          code: "USER_SUSPENDED",
          details: "User account suspended by admin",
        },
        metadata: {
          timestamp: new Date().toISOString(),
          phoneNumber: phone_number,
        },
      };
    }

    // b. If inactive: notify to reactivate via subscription/support
    if (userData?.status === "inactive") {
      return {
        success: false,
        message: "Account inactive. subscribe to reactivate account",
        data: {},
        error: {
          code: "ACCOUNT_INACTIVE",
          details: "User account subscription expired",
        },
        metadata: {
          timestamp: new Date().toISOString(),
          phoneNumber: phone_number,
        },
      };
    }

    // 4. Check if OTP has expired (compare current time with expiration)
    // a. If expired: reject with "OTP expired, request new one"
    if (new Date(userData?.verification_expires_at) < now) {
      return {
        success: false,
        message: "OTP expired. Request new one",
        data: {},
        error: {
          code: "OTP_EXPIRED",
          details: "Verification code expired",
        },
        metadata: {
          timestamp: new Date().toISOString(),
          phoneNumber: phone_number,
        },
      };
    }

    // 5. Verify OTP hash matches using constant-time comparison
    const isMatch = await CompareOtp(otp, userData?.verification_code);

    // 6. If match:
    if (isMatch) {
      //  a. Mark user as verified
      await supabaseAdmin
        .from("users")
        .update({
          phone_verified: true,
        })
        .eq("id", userData?.id)
        .single();

      // b. Generate new session (invalidate any existing ones)
      const { data: sessionData, error: sessionError } =
        await supabaseAdmin.auth.getSession();

      if (sessionError) {
        await supabaseAdmin
          .from("users")
          .update({
            phone_verified: false,
          })
          .eq("id", userData?.id)
          .single();
        return {
          success: false,
          message: "Error getting session",
          data: {},
          error: {
            code: "SESSION_ERROR",
            details: "Error while getting session",
          },
          metadata: {
            timestamp: new Date().toISOString(),
            phoneNumber: phone_number,
          },
        };
      }

      // c. Clear OTP hash and expiration
      // d. Reset failed attempt counter
      await supabaseAdmin
        .from("users")
        .update({
          verification_code: null,
          verification_expires_at: null,
          failed_attempt_count: 0,
        })
        .eq("id", userData?.id)
        .single();

      // e. Send session and user details
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
    }

    // 7. If no match:
    if (!isMatch) {
      // a. Increment failed attempt counter
      await supabaseAdmin
        .from("users")
        .update({
          failed_attempt_count: userData?.failed_attempt_count + 1,
        })
        .eq("id", userData?.id)
        .single();

      // b. Log failed attempt
      console.log("Failed OTP verification for", phone_number);

      // c. Inform user with remaining attempts (3 - current attempts)
      // d. If attempts >= 3, inform to try again after 15min
      const { data } = await supabaseAdmin
        .from("users")
        .select("failed_attempt_count")
        .eq("id", userData?.id)
        .single();
      const attempt = 3 - data?.failed_attempt_count;
      const left = attempt > 0;
      return {
        success: false,
        message: left
          ? `Incorrect OTP. ${attempt} attempt(s) remaining`
          : "Try again after 15 minutes",
        data: {},
        error: {
          code: "INCORRECT_OTP",
          details: "Incorrect OTP entered",
        },
        metadata: {
          timestamp: new Date().toISOString(),
          phoneNumber: phone_number,
        },
      };
    }
  } catch (error) {
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
          timestamp: new Date().toISOString(),
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
        timestamp: new Date().toISOString(),
      },
    };
  }
};

export default VerifyOtpAuthService;
