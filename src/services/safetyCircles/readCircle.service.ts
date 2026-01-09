// Read Circle Members Service
/*
#Plan:
1. Accept and validate user id
2. Fetch the circle members
3. Send response to user
*/

import { supabaseAdmin } from "../../config/supabase.ts";
import { SafetyCircleRow } from "../../types/safetyCircle.types.ts";
import validateUser from "../../utils/validateUser.util.ts";

const readCircleService = async (userId: string) => {
  const NODE_ENV = process.env.NODE_ENV ?? "production";
  const now = new Date(Date.now());
  try {
    // 1. Accept and validate the user Id
    const userValidation = await validateUser(userId, now);
    if (!userValidation.success) {
      return userValidation;
    }

    // 2. Fetch the circle members
    const { data, error } = await supabaseAdmin
      .from("safety_circles")
      .select()
      .eq("user_id", userId);

    if (error) {
      return {
        success: false,
        message: "Error fetching circle members",
        data: {},
        error: {
          code: "FETCH_ERROR",
          details:
            NODE_ENV === "development"
              ? error.message
              : "Error fetching circle members",
        },
        metadata: {
          timestamp: now.toISOString(),
          user_id: userId,
        },
      };
    }

    const circleData: SafetyCircleRow[] = data;
    if (!circleData || circleData.length === 0) {
      return {
        success: false,
        message: "No circle members found",
        data: {},
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
    console.error("Error fetching circle members", error);

    return {
      success: false,
      message: "Internal server error",
      data: {},
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

export default readCircleService;
