// Update Circle Member Service
/*
#Plan:
1. Accept and validate user Id
2. Accept and validate circle member Id
3. Accept and validate update data
4. Update the circle member
5. Send response to user
*/

import { ZodError } from "zod";
import { supabaseAdmin } from "../../config/supabase";
import {
  SafetyCircleUpdate,
  SafetyCircleUpdateSchema,
} from "../../types/safetyCircle.types";
import validateCircle from "../../utils/validateCircle.util";
import validateUser from "../../utils/validateUser.util";
import { isDev } from "../../utils/devEnv.util";
import logger from "../../config/logger";

const safetyCircle = logger.child({
  service: "updateCircleMemberService",
});

const updateCircleMemberService = async (
  userId: string,
  circleId: string,
  updateCircleData: SafetyCircleUpdate,
) => {
  const now = new Date();
  try {
    // 1. Accept and validate the user Id
    const userValidation = await validateUser(userId, now);
    if (!userValidation.success) {
      safetyCircle.info("User Id validation failed", {
        userId,
      });
      return userValidation;
    }

    // 2. Accept and validate circle member Id
    const circleValidation = await validateCircle(circleId, userId, now);
    if (!circleValidation.success) {
      safetyCircle.info("Circle Id validation failed", {
        userId,
        circleId,
      });
      return circleValidation;
    }

    // 3. Accept and validate update data
    if (!updateCircleData || Object.keys(updateCircleData).length === 0) {
      safetyCircle.info("No update data provided", {
        userId,
        circleId,
        reason: "EMPTY_UPDATE",
      });
      return {
        success: false,
        message: "No update data provided",
        data: null,
        error: {
          code: "EMPTY_UPDATE",
          details: "At least one field must be provided for update",
        },
        metadata: {
          timestamp: now.toISOString(),
          circle_id: circleId,
          user_id: userId,
        },
      };
    }
    const validatedInput = SafetyCircleUpdateSchema.parse(updateCircleData);

    // 4. Update the circle member
    const { data: circleData, error: circleError } = await supabaseAdmin
      .from("safety_circles")
      .update({
        ...validatedInput,
      })
      .eq("id", circleId)
      .eq("user_id", userId)
      .select()
      .maybeSingle();

    if (circleError) {
      safetyCircle.info("Error while updating circle member", {
        userId,
        circleId,
        reason: "CIRCLE_UPDATE_ERROR",
      });
      return {
        success: false,
        message: "Error while updating circle member",
        data: null,
        error: {
          code: "CIRCLE_UPDATE_ERROR",
          details: isDev
            ? (circleError?.message ?? "Error while updating circle member")
            : "Error while updating circle member",
        },
        metadata: {
          timestamp: now.toISOString(),
          circle_id: circleId,
          user_id: userId,
        },
      };
    }

    if (!circleData) {
      safetyCircle.info("Circle member not found or not updated", {
        userId,
        circleId,
        reason: "CIRCLE_NOT_FOUND",
      });
      return {
        success: false,
        message: "Circle member not found or not updated",
        data: null,
        error: {
          code: "CIRCLE_NOT_FOUND",
          details: "Circle member not found or not updated",
        },
        metadata: {
          timestamp: now.toISOString(),
          circle_id: circleId,
          user_id: userId,
        },
      };
    }

    // 5. Send response to user
    return {
      success: true,
      message: "Circle member updated successfully",
      data: circleData,
      error: null,
      metadata: {
        timestamp: now.toISOString(),
        circle_id: circleId,
        user_id: userId,
      },
    };
  } catch (error) {
    if (error instanceof ZodError) {
      safetyCircle.error("Update data validation error", {
        userId,
        circleId,
        reason: "VALIDATION_ERROR",
        error,
      });
      return {
        success: false,
        message: "Update data validation error",
        data: null,
        error: {
          code: "VALIDATION_ERROR",
          details: error.message,
        },
        metadata: {
          timestamp: now.toISOString(),
          circle_id: circleId,
          user_id: userId,
        },
      };
    }

    safetyCircle.error("Internal server error", {
      userId,
      circleId,
      reason: "INTERNAL_ERROR",
      error,
    });
    return {
      success: false,
      message: "Internal server error",
      data: null,
      error: {
        code: "INTERNAL_ERROR",
        details: "Unexpected error while updating circle member",
      },
      metadata: {
        timestamp: now.toISOString(),
        circle_id: circleId,
        user_id: userId,
      },
    };
  }
};

export default updateCircleMemberService;
