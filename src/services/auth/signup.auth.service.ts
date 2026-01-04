// Sign Up Auth Service
/*
#Plan:
1. Get and validates the phone number format
2. Checks whether the phone number already exists in the db
3. If the number already exists, the user is informed to log in instead
4. If the phone number never existed:
	a. the user is created in the authentication space
	b. the user is created in the users table with hashed verification otp code
	c. the otp code expiration is set to 15mins from generation
	d. the user is sent the otp code via sms
	e. the user is informed to check the appropriate channel for the otp
5. Once the backend sends the otp, any attempt to regenerate any otp verification 
code before expiration time should inform the user to wait for xxx minutes left before trying again
*/

import { ZodError } from "zod";
import { SignUpDataDTO, SignUpDataDTOSchema } from "../../types/auth.types";
import { supabaseAdmin } from "../../config/supabase";
import SendSMSUtil from "../../utils/sendSMS.util";
import { subscriptionExpiresAt, verificationCodeExpiresAt } from "../../utils/calculateExpiry.util";
import GenerateOtp from "../../utils/generateOtp.util";
import HashOtp from "../../utils/hashOtp.util";

const SignUpAuthService = async (signUpData: SignUpDataDTO) => {    
    const now = new Date(Date.now());
  try {
    // 1. Get and validates the phone number format
    const { phone_number, device_id } = SignUpDataDTOSchema.parse(signUpData);

    // 2. Checks whether the phone number already exists in the db
    const { data: existingUser } = await supabaseAdmin
      .from("users")
      .select("id, phone_number, email, verification_expires_at")
      .eq("phone_number", phone_number)
      .maybeSingle();

    // 3. If the number already exists, the user is informed to log in instead
    if (existingUser && existingUser.verification_expires_at > now) {
        const remainingMs = new Date(existingUser.verification_expires_at).getTime() - Date.now();
        const remainingMinutes = Math.ceil(remainingMs / 60000);
        return {
            success: false,
            message: `Wait ${remainingMinutes} mins before requesting a new OTP`,
            data: {},
            error: {
                code: "OTP_NOT_EXPIRED",
                details: "Former otp has not expired"
            },
            metadata: {
                timestamp: new Date().toISOString(),
                phoneNumber: phone_number,
            }
        }
    }

    if (existingUser) {
      return {
        success: false,
        message: "User already exists. Please log in",
        data: {},
        error: {
          code: "USER_EXISTS",
          details: "User already exists",
        },
        metadata: {
          timestamp: new Date().toISOString(),
          phoneNumber: phone_number,
        },
      };
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
        message: "Error creating auth user",
        data: {},
        error: {
          code: "ERROR_CREATE_USER",
          details: "Error creating auth user",
        },
        metadata: {
          timestamp: new Date().toISOString(),
          phoneNumber: phone_number,
        },
      };
    }

    // b. the user is created in the users table with hashed verification otp code
    // c. the otp code expiration is set to 15mins from generation
    const randomSixDigitNumber = GenerateOtp();
    const hashedOtp = await HashOtp(randomSixDigitNumber);
    const { error: userError } = await supabaseAdmin
      .from("users")
      .insert({
        id: authData.user.id,
        phone_number,
        phone_verified: false,
        user_type: "individual",
        subscription_tier: "free",
        subscription_expires_at: subscriptionExpiresAt, 
        device_id,
        status: "active",
        verification_code: hashedOtp,
        verification_expires_at: verificationCodeExpiresAt,
      })
      .select()
      .single();

    if (userError) {
        await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
      return {
        success: false,
        message: "Error creating user",
        data: {},
        error: {
          code: "CREATE_USER_ERROR",
          details: "Error creating user",
        },
        metadata: {
          timestamp: new Date().toISOString(),
          phoneNumber: phone_number,
        },
      };
    }

    // d. the user is sent the otp code via sms
    await SendSMSUtil(phone_number, randomSixDigitNumber);

    // e. the user is informed to check the appropriate channel for the otp
    return {
        success: true,
        message: "Verification OTP sent via SMS",
        data: {},
        error: null,
        metadata: {
          timestamp: new Date().toISOString(),
          phoneNumber: phone_number,
        },
    }
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
          timestamp: new Date().toISOString(),
        },
      };
    }

    return {
      success: false,
      message: "Sign up error",
      data: {},
      error: {
        code: "SIGNUP_ERROR",
        details: "Error signning up user",
      },
      metadata: {
        timestamp: new Date().toISOString(),
      },
    };
  }
};

export default SignUpAuthService;
