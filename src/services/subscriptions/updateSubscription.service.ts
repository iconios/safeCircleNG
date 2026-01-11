// Update subscription service
/*
#Plan:
1. Accept and validate the user
2. Validate update data and update the subscription 
    - ensure subscription exists
3. Send response to user
*/

import { ZodError } from "zod";
import {
  subscriptionInputDTO,
  subscriptionInputSchema,
  subscriptionUpdate,
  subscriptionUpdateSchema,
} from "../../types/subscription.types.ts";
import validateUser from "../../utils/validateUser.util.ts";
import { isDev } from "../../utils/devEnv.util.ts";
import { supabaseAdmin } from "../../config/supabase.ts";

const updateSubscriptionService = async (
  subscriptionInputData: subscriptionInputDTO,
  updateSubscriptionData: subscriptionUpdate,
) => {
  const now = new Date();
  try {
    // 1. Accept and validate the user Id
    const { user_id } = subscriptionInputSchema.parse(subscriptionInputData);
    const userValidation = await validateUser(user_id, now);
    if (!userValidation.success) {
      return userValidation;
    }

    // 2. Validate update data and update the subscription
    //      - ensure subscription exists
    const validatedInput = subscriptionUpdateSchema.parse(
      updateSubscriptionData,
    );
    if (Object.keys(validatedInput).length === 0) {
        return {
            success: false,
            message: "No subscription update data found",
            data: null,
            error: {
            code: "EMPTY_UPDATE_DATA",
            details: "No subscription update data found",
            },
            metadata: {
            timestamp: now.toISOString(),
            user_id,
            },
        }
    }
    
    const { data, error } = await supabaseAdmin
      .from("subscriptions")
      .update({ ...validatedInput })
      .eq("user_id", user_id)
      .select("id, tier, status, start_date, end_date, updated_at")
      .maybeSingle();
    if (error) {
      return {
        success: false,
        message: "Error updating subscription",
        data: null,
        error: {
          code: "SUBSCRIPTION_UPDATE_ERROR",
          details: isDev
            ? (error?.message ?? "Error updating subscription")
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
        message: "Subscription not found",
        data: null,
        error: {
          code: "SUBSCRIPTION_NOT_FOUND",
          details: "Subscription not found",
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
      message: "Subscription updated successfully",
      data,
      error: null,
      metadata: {
        timestamp: now.toISOString(),
        user_id,
      },
    };
  } catch (error) {
    console.error("updateSubscriptionService error:", error);

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
        details: "Unexpected error while updating subscription",
      },
      metadata: {
        timestamp: now.toISOString(),
      },
    };
  }
};

export default updateSubscriptionService;
