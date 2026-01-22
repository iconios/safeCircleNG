// Read message log service
/*
#Plan:
1. Accept and validate user id
2. Get message logs for user
3. Send response to the user
*/

import { supabaseAdmin } from "../../config/supabase.ts";
import { isDev } from "../../utils/devEnv.util.ts";
import validateUser from "../../utils/validateUser.util.ts";

const readMessageLogService = async (userId: string) => {
  const now = new Date();
  try {
    // 1. Accept and validate the user Id
    const userValidation = await validateUser(userId, now);
    if (!userValidation.success) {
      return userValidation;
    }

    // 2. Get message logs for user
    const { data, error } = await supabaseAdmin
      .from("message_logs")
      .select()
      .eq("user_id", userId);
    if (error) {
      return {
        success: false,
        message: "Error fetching message log",
        data: [],
        error: {
          code: "MESSAGE_LOG_FETCH_ERROR",
          details: isDev
            ? (error?.message ?? "Error fetching message log")
            : "Error fetching message log",
        },
        metadata: {
          timestamp: now.toISOString(),
          user_id: userId,
        },
      };
    }

    if (!data) {
      return {
        success: false,
        message: "No message logs found",
        data: [],
        error: {
          code: "MESSAGE_LOG_NOT_FOUND",
          details: "No message logs found",
        },
        metadata: {
          timestamp: now.toISOString(),
          user_id: userId,
        },
      };
    }

    return {
      success: true,
      message: "Message logs fetched successfully",
      data,
      error: null,
      metadata: {
        timestamp: now.toISOString(),
        user_id: userId,
      },
    };
  } catch (error) {
    console.error("readMessageLogService error:", error);

    return {
      success: false,
      message: "Internal server error",
      data: null,
      error: {
        code: "INTERNAL_ERROR",
        details: "Unexpected error while fetching message log",
      },
      metadata: {
        timestamp: now.toISOString(),
        user_id: userId,
      },
    };
  }
};

export default readMessageLogService;
