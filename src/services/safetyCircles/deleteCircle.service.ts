// Delete Circle Member Service
/*
#Plan:
1. Accept and validate user Id
2. Accept and validate circle member Id
3. Delete circle member
4. Send response to user
*/

import { supabaseAdmin } from "../../config/supabase.ts";
import { isDev } from "../../utils/devEnv.util.ts";
import validateCircle from "../../utils/validateCircle.util.ts";
import validateUser from "../../utils/validateUser.util.ts";

const deleteCircleMemberService = async (userId: string, circleId: string) => {
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

    // 3. Delete circle member
    const { error } = await supabaseAdmin
      .from("safety_circles")
      .delete()
      .eq("id", circleId)
      .eq("user_id", userId);
    if (error) {
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
    console.error("Error deleting circle member", error);
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
