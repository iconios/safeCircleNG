// Read payment service
/*
#Plan:
1. Accept and validate the user
2. Fetch payment
3. Send response to user
*/

import { ZodError } from "zod";
import { isDev } from "../../utils/devEnv.util.ts";
import {
  paymentInputDTO,
  paymentInputSchema,
} from "../../types/payment.types.ts";
import validateUser from "../../utils/validateUser.util.ts";
import { supabaseAdmin } from "../../config/supabase.ts";

const readPaymentService = async (paymentInput: paymentInputDTO) => {
  const now = new Date();
  try {
    // 1. Accept and validate user id
    const { user_id } = paymentInputSchema.parse(paymentInput);
    const userValidation = await validateUser(user_id, now);
    if (!userValidation.success) {
      return userValidation;
    }

    // 2. Fetch payment
    const { data, error } = await supabaseAdmin
      .from("payments")
      .select("id, amount_ngn, currency, status, completed_at")
      .eq("user_id", user_id)
      .maybeSingle();
    if (error) {
      return {
        success: false,
        message: "Error fetching payment",
        data: null,
        error: {
          code: "PAYMENT_FETCH_ERROR",
          details: isDev
            ? (error?.message ?? "Error fetching payment")
            : "Error fetching payment",
        },
        metadata: {
          timestamp: now.toISOString(),
          user_id,
        },
      };
    }

    if (!data) {
      return {
        success: false,
        message: "Payment not found",
        data: null,
        error: {
          code: "PAYMENT_NOT_FOUND",
          details: "Payment not found",
        },
        metadata: {
          timestamp: now.toISOString(),
          user_id,
        },
      };
    }

    // 3. Send response to user
    return {
      success: true,
      message: "Payment fetched successfully",
      data,
      error: null,
      metadata: {
        timestamp: now.toISOString(),
        user_id,
      },
    };
  } catch (error) {
    console.error("readPaymentService error:", error);

    if (error instanceof ZodError) {
      return {
        success: false,
        message: "Payment data validation error",
        data: null,
        error: {
          code: "VALIDATION_ERROR",
          details: isDev
            ? (error?.message ?? "Payment data validation error")
            : "Payment data validation error",
        },
        metadata: {
          timestamp: now.toISOString(),
        },
      };
    }

    return {
      success: false,
      message: "Internal server error",
      data: null,
      error: {
        code: "INTERNAL_ERROR",
        details: "Unexpected error while fetching payment",
      },
      metadata: {
        timestamp: now.toISOString(),
      },
    };
  }
};

export default readPaymentService;
