// Cancel subscription service
/*
#Plan:
1. Accept and validate the user
2. Confirm subscription exists and cancel if not cancelled already
3. Send response to user
*/

import { ZodError } from "zod";
import { isDev } from "../../utils/devEnv.util.ts";
import {
  subscriptionInputDTO,
  subscriptionInputSchema,
} from "../../types/subscription.types.ts";
import validateUser from "../../utils/validateUser.util.ts";
import { supabaseAdmin } from "../../config/supabase.ts";

const cancelSubscriptionService = async (
  subscriptionInputData: subscriptionInputDTO,
) => {
  const now = new Date();
  try {
    // 1. Accept and validate the user Id
    const { user_id } = subscriptionInputSchema.parse(subscriptionInputData);
    const userValidation = await validateUser(user_id, now);
    if (!userValidation.success) {
      return userValidation;
    }

    // 2. Confirm subscription exists and cancel if not cancelled already
    const { data, error } = await supabaseAdmin
      .from("subscriptions")
      .update({ status: "cancelled" })
      .select("id, tier, status, start_date, end_date")
      .eq("user_id", user_id)
      .neq("status", "cancelled")
      .maybeSingle();

    if (error) {
      return {
        success: false,
        message: "Error updating subscription",
        data: null,
        error: {
          code: "SUBSCRIPTION_UPDATE_ERROR",
          details: isDev
            ? (error.message ?? "Error updating subscription")
            : "Error updating subscription",
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
        message: "Subscription not found or already cancelled",
        data: null,
        error: {
          code: "SUBSCRIPTION_NOT_FOUND_OR_CANCELLED",
          details: "Subscription not found or already cancelled",
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
      message: "Subscription cancelled successfully",
      data,
      error: null,
      metadata: {
        timestamp: now.toISOString(),
        user_id,
      },
    };
  } catch (error) {
    console.error("cancelSubscriptionService error:", error);

    if (error instanceof ZodError) {
      return {
        success: false,
        message: "Subscription data validation error",
        data: null,
        error: {
          code: "VALIDATION_ERROR",
          details: isDev
            ? (error?.message ?? "Subscription data validation error")
            : "Subscription data validation error",
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
        details: "Unexpected error while cancelling subscription",
      },
      metadata: {
        timestamp: now.toISOString(),
      },
    };
  }
};

export default cancelSubscriptionService;
