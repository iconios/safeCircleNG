// Read Circle Members Service
/*
#Plan:
1. Accept and validate user id
2. Fetch the circle members
3. Send response to user
*/

import logger from "../../config/logger";
import { supabaseAdmin } from "../../config/supabase";
import { SafetyCircleRow } from "../../types/safetyCircle.types";
import { isDev } from "../../utils/devEnv.util";
import validateUser from "../../utils/validateUser.util";

const safetyCircle = logger.child({
  service: "readCircleMemberService",
});

const readCircleMemberService = async (userId: string) => {
  const now = new Date(Date.now());
  try {
    // 1. Accept and validate the user Id
    const userValidation = await validateUser(userId, now);
    if (!userValidation.success) {
      safetyCircle.info("User validation failed", {
        userId,
      });
      return userValidation;
    }

    // 2. Fetch the circle members
    const { data, error } = await supabaseAdmin
      .from("safety_circles")
      .select()
      .eq("user_id", userId);

    if (error) {
      safetyCircle.error("Error fetching circle members", {
        userId,
        reason: "FETCH_ERROR",
        error,
      });
      return {
        success: false,
        message: "Error fetching circle members",
        data: null,
        error: {
          code: "FETCH_ERROR",
          details: isDev ? error.message : "Error fetching circle members",
        },
        metadata: {
          timestamp: now.toISOString(),
          user_id: userId,
        },
      };
    }

    const circleData: SafetyCircleRow[] = data;
    if (!circleData || circleData.length === 0) {
      safetyCircle.info("No circle members found", {
        userId,
        reason: "NOT_FOUND",
      });
      return {
        success: false,
        message: "No circle members found",
        data: null,
        error: {
          code: "NOT_FOUND",
          details: "No circle members found",
        },
        metadata: {
          timestamp: now.toISOString(),
          user_id: userId,
        },
      };
    }

    // 3. Send response to user
    return {
      success: true,
      message: "Circle members fetched successfully",
      data: circleData,
      error: null,
      metadata: {
        timestamp: now.toISOString(),
        user_id: userId,
      },
    };
  } catch (error) {
    safetyCircle.error("Internal server error", {
      userId,
      reason: "INTERNAL_ERROR",
      error,
    });

    return {
      success: false,
      message: "Internal server error",
      data: null,
      error: {
        code: "INTERNAL_ERROR",
        details: "Unexpected error while fetching circle members",
      },
      metadata: {
        timestamp: now.toISOString(),
        user_id: userId,
      },
    };
  }
};

export default readCircleMemberService;
