// Verify OTP Auth Service (Custom OTP, Supabase Session)
/*
#Verify OTP Flow Outline:
1. Validate input
   a. Validate phone number format (E.164)
   b. Validate OTP format (6-digit string)
2. Fetch user record from `public.users`
   a. If user does not exist → reject (signup required)
   b. If user status = "suspended" → reject
   c. If user status = "inactive" → reject
3. Enforce OTP lockout rules (app-level)
   a. If otp_locked_until > now
      → reject with remaining wait time
4. Fetch OTP record from `otp_codes`
   a. Match by:
      - user_id
      - phone_number
      - unused
   b. If no OTP found → reject ("Invalid or expired code")
   c. If expires_at < now → reject
5. Verify OTP (app-level)
   a. Hash provided OTP
   b. Compare with stored otp_hash
   c. If mismatch:
      - increment attempts
      - if attempts exceed threshold:
          → set otp_locked_until
      - reject with generic error
6. OTP verified successfully
   a. Mark OTP as used / delete record
   b. Reset failed OTP counters
   c. Clear otp_locked_until
   d. Update user:
      - phone_verified = true
      - status = "active"
7. Create Supabase Auth session (CRITICAL STEP)
   a. Use jwt:
      - create token
8. Return token to client
   a. User is now authenticated
*/

import { ZodError } from "zod";
import { supabaseAdmin } from "../../config/supabase";
import { VerifyOtpDataDTO, VerifyOtpDataSchema } from "../../types/auth.types";
import { LOCK_DURATION_MINUTES } from "../../config/auth";
import CompareStrings from "../../utils/compareStrings.util";
import { isDev } from "../../utils/devEnv.util";
import jwt from "jsonwebtoken";
import HashString from "../../utils/hashString.util";

export const updateLastOtpRequestAt = async (id: string, at: Date) => {
  try {
    await supabaseAdmin
      .from("users")
      .update({
        last_otp_requested_at: at.toISOString(),
      })
      .eq("id", id);
  } catch (error) {
    console.error(`Last otp update failed for ${id}`, error);
  }
};

const VerifyOtpAuthService = async (verifyOtpData: VerifyOtpDataDTO) => {
  const JWT_SECRET = process.env.JWT_SECRET;
  const now = new Date(Date.now());
  if (!JWT_SECRET) {
    throw new Error("Jwt secret is required");
  }
  try {
    // 1. Validate input
    //  a. Validate phone number format (E.164)
    //  b. Validate OTP format (length, string)
    const { phone_number, otp, device_id } =
      VerifyOtpDataSchema.parse(verifyOtpData);

    // 2. Fetch user record from `public.users`
    const { data: userData, error: userError } = await supabaseAdmin
      .from("users")
      .select("id, status, email, first_name, otp_locked_until, device_id")
      .eq("phone_number", phone_number)
      .maybeSingle();

    if (userError) {
      return {
        success: false,
        message: "Error fetching user",
        data: null,
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
        message: "Number not found. Please sign up",
        data: null,
        error: {
          code: "NOT_FOUND",
          details: "Number not found in the database",
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
        data: null,
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
    // if (userData.status === "inactive") {
    //   return {
    //     success: false,
    //     message: "Subscription expired. Please subscribe account",
    //     data: null,
    //     error: {
    //       code: "ACCOUNT_INACTIVE",
    //       details: "User account subscription expired",
    //     },
    //     metadata: {
    //       timestamp: now.toISOString(),
    //       phoneNumber: phone_number,
    //     },
    //   };
    // }

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
        data: null,
        error: {
          code: "ACCOUNT_LOCKED",
          details: "Too many attempts within 15 minutes",
        },
        metadata: {
          timestamp: now.toISOString(),
          phoneNumber: phone_number,
        },
      };
    }

    // 4. Fetch OTP record from `otp_codes`
    //  a. Match by:
    //     - phone_number
    //     - unused
    const { data: userOtp, error } = await supabaseAdmin
      .from("otps")
      .select("id, expires_at, otp_code, attempts, max_attempts")
      .eq("phone_number", phone_number)
      .eq("status", "pending")
      .eq("user_id", userData.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (error) {
      return {
        success: false,
        message: "Error fetching otp",
        data: null,
        error: {
          code: "OTP_FETCH_ERROR",
          details: "Error fetching otp",
        },
        metadata: {
          timestamp: now.toISOString(),
        },
      };
    }

    //  b. If no OTP found → reject ("Invalid or expired code")
    if (!userOtp) {
      return {
        success: false,
        message: "Invalid or expired code",
        data: null,
        error: {
          code: "EXPIRED_OR_INVALID_OTP",
          details: "Invalid or expired code",
        },
        metadata: {
          timestamp: now.toISOString(),
        },
      };
    }

    // c. If expires_at < now → reject
    if (new Date(userOtp.expires_at) < now) {
      return {
        success: false,
        message: "Expired code",
        data: null,
        error: {
          code: "OTP_EXPIRED",
          details: "Expired code",
        },
        metadata: {
          timestamp: now.toISOString(),
        },
      };
    }

    // 5. Verify OTP (app-level)
    //  a. Compare with stored hased otp_code with provided otp
    const otpMatch = await CompareStrings(otp, userOtp.otp_code);
    //  c. If mismatch:
    //     - increment attempts
    //     - if attempts exceed threshold:
    //         → set otp_locked_until
    //     - reject with generic error
    if (!otpMatch) {
      const { error: userUpdateError } = await supabaseAdmin
        .from("otps")
        .update({
          attempts: userOtp.attempts + 1,
        })
        .eq("id", userOtp.id);

      if (userUpdateError) {
        return {
          success: false,
          message: "User update failed. Please verify otp",
          data: null,
          error: {
            code: "SERVICE_OUTAGE",
            details: isDev
              ? (userUpdateError.message ?? "Service temporarily unavailable")
              : "Service temporarily unavailable",
          },
          metadata: {
            timestamp: new Date().toISOString(),
            phoneNumber: phone_number,
          },
        };
      }

      const attemptsExceeded = userOtp.attempts + 1 >= userOtp.max_attempts;
      if (attemptsExceeded) {
        await supabaseAdmin
          .from("users")
          .update({
            otp_locked_until: new Date(
              Date.now() + LOCK_DURATION_MINUTES * 60 * 1000,
            ).toISOString(),
          })
          .eq("phone_number", phone_number);
      }

      return {
        success: false,
        message: "Invalid otp",
        data: null,
        error: {
          code: "INVALID_OTP",
          details: "Invalid otp",
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
    //  e. Mark OTP as used / delete record
    // Compare stored hashed device_id with provided device_id
    const deviceMatch = await CompareStrings(device_id, userData.device_id);
    await supabaseAdmin
      .from("users")
      .update({
        otp_locked_until: null,
        phone_verified: true,
        status: "active",
        last_otp_requested_at: now.toISOString(),
        device_id: deviceMatch
          ? userData.device_id
          : await HashString(device_id),
      })
      .eq("id", userData.id);

    await supabaseAdmin.from("otps").delete().eq("id", userOtp.id);

    // 7. Create Supabase Auth session
    //  a. Use jwt:
    //     - create token
    const payload = {
      userId: userData.id,
      phoneNumber: phone_number,
      email: userData.email,
      firstName: userData.first_name,
    };
    const token = await jwt.sign(payload, JWT_SECRET, {
      expiresIn: "30d",
      issuer: "SafeCircleNG",
      audience: "mobile",
    });

    // 8. Return token to client
    //  a. User is now authenticated
    return {
      success: true,
      message: "Token generated successfully",
      data: {
        userId: userData.id,
        phoneNumber: phone_number,
        email: userData.email,
        firstName: userData.first_name,
        token,
      },
      error: null,
      metadata: {
        timestamp: now.toISOString(),
      },
    };
  } catch (error) {
    const now = new Date(Date.now());
    if (error instanceof ZodError) {
      console.error("Error verifying OTP", error);
      return {
        success: false,
        message: "Error validating input parameters",
        data: null,
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
      data: null,
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
