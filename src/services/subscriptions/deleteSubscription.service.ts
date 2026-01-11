// Cancel subscription service
/*
#Plan:
1. Accept and validate the user
2. Cancel subscription if not already cancelled
3. Send response to user
*/

import { ZodError } from "zod";
import { isDev } from "../../utils/devEnv.util.ts";
import { subscriptionInputDTO, subscriptionInputSchema } from "../../types/subscription.types.ts";
import validateUser from "../../utils/validateUser.util.ts";

const cancelSubscriptionService = async (subscriptionInputData: subscriptionInputDTO) => {
  const now = new Date();
    try {
        // 1. Accept and validate the user Id
        const { user_id } = subscriptionInputSchema.parse(subscriptionInputData);
        const userValidation = await validateUser(user_id, now);
        if (!userValidation.success) {
        return userValidation;
        }

        // 2. Cancel subscription if not already cancelled
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
}

export default cancelSubscriptionService;