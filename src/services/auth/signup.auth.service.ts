// Sign Up Auth Service
/*
#Plan:
1. Get and validates the phone number format and device_id format
2. Checks whether the phone number already exists in the db
3. If the number already exists, the user is informed to log in instead
    - check signup rate limits / lockout rules
    - check if an OTP was recently requested, reject with: 
        "Please wait x minutes before requesting another code"
4. If the phone number never existed:
	a. the user is created in the supabase Auth wih phone number
	b. the user is created in the users table
    - link via auth user id
    - set status = "pending_verification"
5. Request OTP via Supabase Auth:
  a. Call "signInWithOtp({ phone })"
  b. Supabase generates and stores OTP
  c. Supabase triggers Send SMS Hook
  d. Update last_otp_requested_at after sending OTP
6. Send OTP via SMS 
*/

import { ZodError } from "zod";
import { SignUpDataDTO, SignUpDataDTOSchema } from "../../types/auth.types.ts";
import { supabase, supabaseAdmin } from "../../config/supabase.ts";
import { subscriptionExpiresAt } from "../../utils/calculateExpiry.util.ts";
import HashString from "../../utils/hashString.util.ts";
import { OTP_COOLDOWN_MS } from "../../config/auth.ts";

export const sendOtp = async (phone_number: string) => {
  try {
    const {error} = await supabase.auth.signInWithOtp({
      phone: phone_number,
      options: {
        shouldCreateUser: false,
        channel: "sms",
      },
    });

    if (error) {
      throw new Error("SMS_FAILED")
    }
  } catch (error) {
    console.error("SMS Failed", error);
  }
};

export const updateOtpTimestamp = async (id: string, at: Date) => {
  await supabaseAdmin
      .from("users")
      .update({
        last_otp_requested_at: at.toISOString(),
      })
      .eq("id", id);
}

const SignUpAuthService = async (signUpData: SignUpDataDTO) => {
  const now: Date = new Date(Date.now());
  try {
    // 1. Get and validates the phone number format and device_id format
    const { phone_number, device_id } = SignUpDataDTOSchema.parse(signUpData);

    // 2. Checks whether the phone number already exists in the db
    const { data: existingUser } = await supabaseAdmin
      .from("users")
      .select(
        "id, phone_number, phone_verified, last_otp_requested_at, otp_locked_until",
      )
      .eq("phone_number", phone_number)
      .maybeSingle();

    // 3. If the number already exists, the user is informed to log in instead
    if (existingUser) {      
      // - check signup rate limits / lockout rules
      // - check if an OTP was recently requested, reject with:
      //    "Please wait x minutes before requesting another code"
      if (
        existingUser.otp_locked_until &&
        now < new Date(existingUser.otp_locked_until)
      ) {
        const remainingMs =
          new Date(existingUser.otp_locked_until).getTime() - Date.now();
        const remainingMinutes = Math.ceil(remainingMs / 60000);
        return {
          success: false,
          message: `Try again in ${remainingMinutes} minutes`,
          data: {},
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

      if (existingUser.phone_verified) {    
        return {
          success: false,
          message: "User already exists. Please log in",
          data: {},
          error: {
            code: "USER_EXISTS",
            details: "User already exists",
          },
          metadata: {
            timestamp: now.toISOString(),
            phoneNumber: phone_number,
          },
        };
      }

      if (!existingUser.phone_verified) {
        const diffMs = Date.now() - new Date(existingUser.last_otp_requested_at).getTime(); 
        const isInCooldown = diffMs < OTP_COOLDOWN_MS;
        const remainingSeconds = Math.ceil((OTP_COOLDOWN_MS - diffMs) / 1000);
        if (isInCooldown) {
          return {
          success: false,
          message: `Wait ${remainingSeconds} seconds to request new OTP`,
          data: {},
          error: {
            code: "OTP_COOLDOWN",
            details: "Wait for OTP cool-down time to elapse"
          },
          metadata: {
            timestamp: now.toISOString(),
            phoneNumber: phone_number,
          },
        };
        }
        
        await sendOtp(phone_number);
        await updateOtpTimestamp(existingUser.id, now)
        return {
          success: true,
          message: "Verification OTP sent via SMS",
          data: {},
          error: null,
          metadata: {
            timestamp: now.toISOString(),
            phoneNumber: phone_number,
          },
        };
      }
    }
    
    // 4. If the phone number never existed
    // a. the user is created in the authentication space
    const { data: authData, error: authError } =
      await supabaseAdmin.auth.admin.createUser({
        phone: phone_number,
        phone_confirm: false,
      });
    if (authError) {
      return {
        success: false,
        message: "Error creating auth user. Try again",
        data: {},
        error: {
          code: "ERROR_CREATE_USER",
          details: "Error creating auth user",
        },
        metadata: {
          timestamp: now.toISOString(),
          phoneNumber: phone_number,
        },
      };
    }

    // b. the user is created in the users table
    // - link via auth user id
    // - set status = "pending_verification"
    const { error: userError } = await supabaseAdmin
      .from("users")
      .insert({
        id: authData.user.id,
        phone_number,
        phone_verified: false,
        user_type: "individual",
        subscription_tier: "free",
        subscription_expires_at: subscriptionExpiresAt(),
        device_id: await HashString(device_id),
        status: "pending_verification",
        last_otp_requested_at: now.toISOString(),
      })
      .select()
      .single();

    if (userError) {
      await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
      return {
        success: false,
        message: "Error creating user. Try again",
        data: {},
        error: {
          code: "CREATE_USER_ERROR",
          details: "Error creating user",
        },
        metadata: {
          timestamp: now.toISOString(),
          phoneNumber: phone_number,
        },
      };
    }

    // 5. Request OTP via Supabase Auth:
    // a. Call "signInWithOtp({ phone })"
    // b. Supabase generates and stores OTP
    // c. Supabase triggers Send SMS Hook
    await sendOtp(phone_number);

    // d. Update last_otp_requested_at after sending OTP
    await updateOtpTimestamp(authData.user.id, now);

    // e. the user is informed to check the appropriate channel for the otp
    return {
      success: true,
      message: "Verification OTP sent via SMS",
      data: {},
      error: null,
      metadata: {
        timestamp: now.toISOString(),
        phoneNumber: phone_number,
      },
    };
  } catch (error) {
    console.error("SignUp authentication error", error);

    if (error instanceof ZodError) {
      return {
        success: false,
        message: error.message || "Signup data validation failed",
        data: {},
        error: {
          code: "VALIDATION_ERROR",
          details: "Signup data validation failed",
        },
        metadata: {
          timestamp: now.toISOString(),
        },
      };
    }

    return {
      success: false,
      message: "Sign up error",
      data: {},
      error: {
        code: "SIGNUP_ERROR",
        details: "Error signing up user",
      },
      metadata: {
        timestamp: now.toISOString(),
      },
    };
  }
};

export default SignUpAuthService;
