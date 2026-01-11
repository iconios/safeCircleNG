// Read subscription service
/*
#Plan:
1. Accept and validate user id
2. Fetch subscription
3. Send response to user
*/

import { ZodError } from "zod";
import validateUser from "../../utils/validateUser.util.ts";
import {
  subscriptionInputDTO,
  subscriptionInputSchema,
} from "../../types/subscription.types.ts";
import { supabaseAdmin } from "../../config/supabase.ts";
import { isDev } from "../../utils/devEnv.util.ts";

const readSubscriptionService = async (
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

    // 2. Fetch subscription
    const { data, error } = await supabaseAdmin
      .from("subscriptions")
      .select("id, tier, status, start_date, end_date, created_at")
      .eq("user_id", user_id)
      .maybeSingle();
    if (error) {
      return {
        success: false,
        message: "Error fetching subscription",
        data: null,
        error: {
          code: "SUBSCRIPTION_FETCH_ERROR",
          details: isDev
            ? (error.message ?? "Error fetching subscription")
            : "Error fetching subscription",
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
      message: data
        ? "Subscription fetched successfully"
        : "No subscription found",
      data,
      error: null,
      metadata: {
        timestamp: now.toISOString(),
        user_id,
      },
    };
  } catch (error) {
    console.error("readSubscriptionService error:", error);

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
        details: "Unexpected error while fetching subscription",
      },
      metadata: {
        timestamp: now.toISOString(),
      },
    };
  }
};

export default readSubscriptionService;
