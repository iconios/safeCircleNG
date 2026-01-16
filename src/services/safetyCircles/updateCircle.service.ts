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
import { supabaseAdmin } from "../../config/supabase.ts";
import {
  SafetyCircleUpdate,
  SafetyCircleUpdateSchema,
} from "../../types/safetyCircle.types.ts";
import validateCircle from "../../utils/validateCircle.util.ts";
import validateUser from "../../utils/validateUser.util.ts";
import { isDev } from "../../utils/devEnv.util.ts";

const updateCircleService = async (
  userId: string,
  circleId: string,
  updateCircleData: SafetyCircleUpdate,
) => {
  const NODE_ENV = process.env.NODE_ENV ?? "production";
  const now = new Date();
  try {
    // 1. Accept and validate the user Id
    const userValidation = await validateUser(userId, now);
    if (!userValidation.success) {
      return userValidation;
    }

    // 2. Accept and validate circle member Id
    const circleValidation = await validateCircle(circleId, userId, now);
    if (!circleValidation.success) {
      return circleValidation;
    }

    // 3. Accept and validate update data
    if (!updateCircleData || Object.keys(updateCircleData).length === 0) {
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
      .single();

    if (circleError || !circleData) {
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
    console.error("Error updating circle member", error);

    if (error instanceof ZodError) {
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

export default updateCircleService;
