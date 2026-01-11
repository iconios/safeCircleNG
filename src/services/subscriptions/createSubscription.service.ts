// Create subscription service
/*
#Plan:
1. Accept and validate user id
2. Ensure the user has no existing subscription
3. Validate subscription data and create subscription
4. Send response to user
*/

import { ZodError } from "zod";
import validateUser from "../../utils/validateUser.util.ts";
import {
  subscriptionInputDTO,
  subscriptionInputSchema,
  subscriptionInsert,
  subscriptionInsertSchema,
} from "../../types/subscription.types.ts";
import { supabaseAdmin } from "../../config/supabase.ts";
import { isDev } from "../../utils/devEnv.util.ts";

const createSubscriptionService = async (
  subscriptionInputData: subscriptionInputDTO,
  createSubscriptionData: subscriptionInsert,
) => {
  const now = new Date();
  try {
    // 1. Accept and validate the user Id
    const { user_id } = subscriptionInputSchema.parse(subscriptionInputData);
    const userValidation = await validateUser(user_id, now);
    if (!userValidation.success) {
      return userValidation;
    }

    // 2. Ensure the user has no existing subscription
    const { data: existing } = await supabaseAdmin
      .from("subscriptions")
      .select("id")
      .eq("user_id", user_id)
      .maybeSingle();

    if (existing) {
      return {
        success: false,
        message: "Subscription already exists",
        data: null,
        error: {
          code: "SUBSCRIPTION_ALREADY_EXISTS",
          details: "User already has a subscription",
        },
        metadata: {
          timestamp: now.toISOString(),
          user_id,
        },
      };
    }

    // 3. Validate subscription data and create subscription
    const validatedInput = subscriptionInsertSchema.parse(
      createSubscriptionData,
    );
    const { data, error } = await supabaseAdmin
      .from("subscriptions")
      .insert({
        user_id,
        ...validatedInput,
      })
      .select()
      .single();
    if (error) {
      return {
        success: false,
        message: "Error creating subscription",
        data: null,
        error: {
          code: "SUBSCRIPTION_CREATION_ERROR",
          details: isDev
            ? (error?.message ?? "Error creating subscription")
            : "Error creating subscription",
        },
        metadata: {
          timestamp: now.toISOString(),
          user_id,
        },
      };
    }

    // 4. Send response to user
    return {
      success: true,
      message: "Subscription created successfully",
      data,
      error: null,
      metadata: {
        timestamp: now.toISOString(),
        user_id,
      },
    };
  } catch (error) {
    console.error("createSubscriptionService error:", error);

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
        details: "Unexpected error while creating subscription",
      },
      metadata: {
        timestamp: now.toISOString(),
      },
    };
  }
};

export default createSubscriptionService;
