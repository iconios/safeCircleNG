// Create payment service
/*
#Plan:
1. Accept and validate user id
2. Validate payment data and create payment
3. Send response to user
*/

import { ZodError } from "zod";
import { isDev } from "../../utils/devEnv.util.ts";
import {
  paymentInputDTO,
  paymentInputSchema,
  paymentInsert,
  paymentInsertSchema,
} from "../../types/payment.types.ts";
import validateUser from "../../utils/validateUser.util.ts";
import { supabaseAdmin } from "../../config/supabase.ts";

const createPaymentService = async (
  paymentInput: paymentInputDTO,
  createPaymentData: paymentInsert,
) => {
  const now = new Date();
  try {
    // 1. Accept and validate user id
    const { user_id } = paymentInputSchema.parse(paymentInput);
    const userValidation = await validateUser(user_id, now);
    if (!userValidation.success) {
      return userValidation;
    }

    // 2. Validate payment data and create payment
    const validatedInput = paymentInsertSchema.parse(createPaymentData);
    const { data, error } = await supabaseAdmin
      .from("payments")
      .insert({
        user_id,
        ...validatedInput,
      })
      .select()
      .maybeSingle();
    if (error || !data) {
      return {
        success: false,
        message: "Error creating payment",
        data: null,
        error: {
          code: "PAYMENT_CREATION_ERROR",
          details: isDev
            ? (error?.message ?? "Error creating payment")
            : "Error creating payment",
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
      message: "Payment created successfully",
      data,
      error: null,
      metadata: {
        timestamp: now.toISOString(),
        user_id,
      },
    };
  } catch (error) {
    console.error("createPaymentService error:", error);

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
        details: "Unexpected error while creating payment",
      },
      metadata: {
        timestamp: now.toISOString(),
      },
    };
  }
};

export default createPaymentService;
