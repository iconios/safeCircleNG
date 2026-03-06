// Create otp service
/*
#Plan:
0. Check user is not locked
1. Accept and validate phone number
2. Accept and validate otp data
3. Ensure user owns the phone 
4. Check existing otp irrespective of type
    -> if exisiting and not expired 
        -> reuse otp (or regenerate otp if Redis missing, UPDATE)
    -> if existing and expired 
        -> regenerate otp + UPDATE 
    -> if no existing otp
        -> create new otp (INSERT)
5. Dispatch otp to caller
*/

import { ZodError } from "zod";
import { phoneNumber, PhoneNumberSchema } from "../../types/user.types";
import { isDev } from "../../utils/devEnv.util";
import { supabaseAdmin } from "../../config/supabase";
import { OTP_EXPIRES_MINUTES } from "../../config/auth";
import HashString from "../../utils/hashString.util";
import logger from "../../config/logger";
import { randomUUID } from "node:crypto";
import { maskPhone } from "../../utils/maskPhone.util";
import dispatchOtpService from "./dispatchOtp.service";
import generateOtpUtil from "../../utils/generateOtp.util";
import { initializeRedisClient } from "../../config/redisClient";
import { plainOtpKeyByPhone } from "../../utils/redisKeys";
import { errorResponseUtil } from "../../utils/responses.util";

const createOtpService = async (phoneNumber: phoneNumber, userId: string) => {
  const now = new Date();
  let rawOtp: string = "";
  let hashedOtp: string = "";
  const client = await initializeRedisClient();

  const createOtp = logger.child({
    service: "createOtpService",
    requestId: randomUUID(),
  });

  try {
    // 1. Accept and validate phone number
    const validatedPhoneNumber = PhoneNumberSchema.parse(phoneNumber);

    // 0. Check user is not locked
    const { data: user } = await supabaseAdmin
      .from("users")
      .select(
        "id, phone_number, otp_locked_until, otp_requests_last_hour, otp_requests_today, otp_hour_window_started_at, otp_day_window_started_at",
      )
      .eq("id", userId)
      .eq("phone_number", validatedPhoneNumber)
      .single();

    if (!user) {
      return errorResponseUtil(
        "Unable to send sms",
        {
          code: "USER_NOT_FOUND",
          details: "Unable to send sms",
        },
        {},
      );
    }

    if (user?.otp_locked_until && new Date(user.otp_locked_until) > now) {
      return errorResponseUtil(
        "Too many attempts. Try again later",
        {
          code: "ACCOUNT_LOCKED",
          details: "Too many attempts. Try again later",
        },
        {},
      );
    }

    // 2. Accept and validate otp data
    const expires = new Date();
    expires.setMinutes(expires.getMinutes() + OTP_EXPIRES_MINUTES);

    // 3. Ensure user owns the phone
    if (user.phone_number !== validatedPhoneNumber) {
      return errorResponseUtil(
        "Invalid user context",
        {
          code: "USER_PHONE_MISMATCH",
          details: "Invalid user context",
        },
        {},
      );
    }

    // 4. Check existing otp irrespective of type
    const { data: existingOtp, error: confirmError } = await supabaseAdmin
      .from("otps")
      .select("id, expires_at, otp_code, phone_number")
      .eq("phone_number", validatedPhoneNumber)
      .maybeSingle();
    if (confirmError) {
      createOtp.info("Error confirming otp. Please try again", {
        phoneNumber: maskPhone(validatedPhoneNumber),
      });
      return errorResponseUtil(
        "Error confirming otp. Please try again",
        {
          code: "OTP_CONFIRMATION_ERROR",
          details: "Error confirming otp. Please try again",
        },
        {
          phoneNumber: isDev
            ? validatedPhoneNumber
            : maskPhone(validatedPhoneNumber),
        },
      );
    }

    if (existingOtp) {
      //    -> if exisiting and not expired
      //        -> reuse otp (or regenerate otp if Redis missing, UPDATE)
      if (new Date(existingOtp.expires_at) > now) {
        hashedOtp = existingOtp.otp_code;
        const plainOtpKey = plainOtpKeyByPhone(existingOtp.phone_number);
        const plainOtp = await client.get(plainOtpKey);
        if (plainOtp) {
          rawOtp = plainOtp;
        } else {
          rawOtp = await generateOtpUtil();
          hashedOtp = await HashString(rawOtp);
          const plainOtpKey = plainOtpKeyByPhone(existingOtp.phone_number);
          await client.set(plainOtpKey, rawOtp, {
            EX: OTP_EXPIRES_MINUTES * 60,
          });
          const { error } = await supabaseAdmin
            .from("otps")
            .update({
              otp_code: hashedOtp,
              expires_at: expires,
              attempts: 0,
              status: "pending",
            })
            .eq("phone_number", validatedPhoneNumber)
            .eq("id", existingOtp.id)
            .select("id")
            .single();

          if (error) {
            return errorResponseUtil(
              "Error updating otp",
              {
                code: "OTP_UPDATE_ERROR",
                details: isDev
                  ? (error.message ?? "Error updating otp")
                  : "Error updating otp",
              },
              {
                phoneNumber: isDev
                  ? validatedPhoneNumber
                  : maskPhone(validatedPhoneNumber),
              },
            );
          }
        }
      } else {
        // -> if existing and expired
        // -> regenerate otp + UPDATE
        rawOtp = await generateOtpUtil();
        hashedOtp = await HashString(rawOtp);
        const plainOtpKey = plainOtpKeyByPhone(existingOtp.phone_number);
        await client.set(plainOtpKey, rawOtp, { EX: OTP_EXPIRES_MINUTES * 60 });
        const { error } = await supabaseAdmin
          .from("otps")
          .update({
            otp_code: hashedOtp,
            expires_at: expires,
            attempts: 0,
            status: "pending",
          })
          .eq("phone_number", validatedPhoneNumber)
          .eq("id", existingOtp.id)
          .select("id")
          .single();

        if (error) {
          return errorResponseUtil(
            "Error updating otp",
            {
              code: "OTP_UPDATE_ERROR",
              details: isDev
                ? (error.message ?? "Error updating otp")
                : "Error updating otp",
            },
            {
              phoneNumber: isDev
                ? validatedPhoneNumber
                : maskPhone(validatedPhoneNumber),
            },
          );
        }
      }
    } else {
      // -> if no existing otp
      // -> create new otp (INSERT)
      rawOtp = await generateOtpUtil();
      hashedOtp = await HashString(rawOtp);
      const plainOtpKey = plainOtpKeyByPhone(user.phone_number);
      await client.set(plainOtpKey, rawOtp, { EX: OTP_EXPIRES_MINUTES * 60 });
      const { error } = await supabaseAdmin
        .from("otps")
        .insert({
          otp_code: hashedOtp,
          expires_at: expires,
          attempts: 0,
          status: "pending",
          phone_number: validatedPhoneNumber,
          user_id: user.id,
        })
        .select("id")
        .single();

      if (error) {
        createOtp.error("Error creating otp", {
          error,
          phoneNumber: isDev
            ? validatedPhoneNumber
            : maskPhone(validatedPhoneNumber),
        });
        return errorResponseUtil(
          "Error creating otp",
          {
            code: "OTP_UPDATE_ERROR",
            details: isDev
              ? (error.message ?? "Error creating otp")
              : "Error creating otp",
          },
          {
            phoneNumber: isDev
              ? validatedPhoneNumber
              : maskPhone(validatedPhoneNumber),
          },
        );
      }
    }

    if (!rawOtp) {
      createOtp.error("rawOtp missing before dispatch", {
        phone: maskPhone(validatedPhoneNumber),
      });
      return errorResponseUtil(
        "Unable to generate OTP",
        { code: "OTP_GENERATION_FAILED", details: "rawOtp missing" },
        { phoneNumber: maskPhone(validatedPhoneNumber) },
      );
    }
    // 5. Dispatch otp to caller
    const smsResult = await dispatchOtpService(validatedPhoneNumber, rawOtp);
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
  } catch (error) {
    if (error instanceof ZodError) {
      createOtp.error("Otp data validation failed", {
        reason: error.message,
        phoneNumber: maskPhone(phoneNumber),
      });
      return errorResponseUtil(
        error.message || "Otp data validation failed",
        {
          code: "VALIDATION_ERROR",
          details: "Otp data validation failed",
        },
        { phoneNumber: isDev ? phoneNumber : maskPhone(phoneNumber) },
      );
    }

    createOtp.error("Internal server error", {
      phoneNumber: maskPhone(phoneNumber),
    });
    return errorResponseUtil(
      "Internal server error",
      {
        code: "INTERNAL_ERROR",
        details: "Unexpected error while creating otp",
      },
      { phoneNumber: isDev ? phoneNumber : maskPhone(phoneNumber) },
    );
  }
};

export default createOtpService;
