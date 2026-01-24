// Delete Circle Member Service
/*
#Plan:
1. Accept and validate user Id
2. Accept and validate circle member Id
3. Delete circle member
4. Send response to user
*/

import logger from "../../config/logger";
import { supabaseAdmin } from "../../config/supabase";
import { isDev } from "../../utils/devEnv.util";
import validateCircle from "../../utils/validateCircle.util";
import validateUser from "../../utils/validateUser.util";

const safetyCircle = logger.child({
  service: "deleteCircleMemberService",
});

const deleteCircleMemberService = async (userId: string, circleId: string) => {
  const now = new Date();
  try {
    // 1. Accept and validate the user Id
    const userValidation = await validateUser(userId, now);
    if (!userValidation.success) {
      safetyCircle.info("User validation failed", {
        userId,
      });
      return userValidation;
    }

    // 2. Accept and validate circle member Id
    const circleValidation = await validateCircle(circleId, userId, now);
    if (!circleValidation.success) {
      safetyCircle.info("Circle validation failed", {
        userId,
        circleId,
      });
      return circleValidation;
    }

    // 3. Delete circle member
    const { error } = await supabaseAdmin
      .from("safety_circles")
      .delete()
      .eq("id", circleId)
      .eq("user_id", userId);
    if (error) {
      safetyCircle.error("Error deleting circle member", {
        userId,
        circleId,
        reason: "CIRCLE_DELETE_ERROR",
        error,
      });
      return {
        success: false,
        message: "Error deleting circle member",
        data: null,
        error: {
          code: "CIRCLE_DELETE_ERROR",
          details: isDev ? error.message : "Error deleting circle member",
        },
        metadata: {
          timestamp: now.toISOString(),
          user_id: userId,
          circle_id: circleId,
        },
      };
    }

    return {
      success: true,
      message: "Circle member deleted successfully",
      data: null,
      error: null,
      metadata: {
        timestamp: now.toISOString(),
        user_id: userId,
        circle_id: circleId,
      },
    };
  } catch (error) {
    safetyCircle.error("Internal server error", {
      userId,
      circleId,
      reason: "INTERNAL_ERROR",
      error,
    });
    return {
      success: false,
      message: "Internal server error",
      data: {},
      error: {
        code: "INTERNAL_ERROR",
        details: "Unexpected error while deleting circle member",
      },
      metadata: {
        timestamp: now.toISOString(),
        user_id: userId,
        circle_id: circleId,
      },
    };
  }
};

export default deleteCircleMemberService;
