// Create message log service
/*
#Plan:
1. Accept and validate user id
2. Accept and validate message log data
3. Create message log
4. Send response to the user
*/

import { ZodError } from "zod";
import {
  messageLogsInsert,
  messageLogsInsertSchema,
} from "../../types/messageLogs.types";
import validateUser from "../../utils/validateUser.util";
import { supabaseAdmin } from "../../config/supabase";
import { isDev } from "../../utils/devEnv.util";

const createMessageLogService = async (
  userId: string,
  logData: messageLogsInsert,
) => {
  const now = new Date();
  try {
    // 1. Accept and validate the user Id
    const userValidation = await validateUser(userId, now);
    if (!userValidation.success) {
      return userValidation;
    }

    // 2. Accept and validate message log data
    const validatedInput = messageLogsInsertSchema.parse(logData);

    // 3. Create message log
    const { data, error } = await supabaseAdmin
      .from("message_logs")
      .insert({
        user_id: userId,
        ...validatedInput,
      })
      .select()
      .single();

    if (error) {
      return {
        success: false,
        message: "Error creating message log",
        data: null,
        error: {
          code: "MESSAGE_LOG_CREATION_ERROR",
          details: isDev
            ? (error?.message ?? "Error creating message log")
            : "Error creating message log",
        },
        metadata: {
          timestamp: now.toISOString(),
          user_id: userId,
        },
      };
    }

    // 4. Send response to the user
    return {
      success: true,
      message: "Message log created successfully",
      data,
      error: null,
      metadata: {
        timestamp: now.toISOString(),
        user_id: userId,
      },
    };
  } catch (error) {
    console.error("createMessageLogService error:", error);

    if (error instanceof ZodError) {
      return {
        success: false,
        message: "Message log data validation error",
        data: null,
        error: {
          code: "VALIDATION_ERROR",
          details: isDev
            ? (error?.message ?? "Message log data validation error")
            : "Message log data validation error",
        },
        metadata: {
          timestamp: now.toISOString(),
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
        details: "Unexpected error while creating message log",
      },
      metadata: {
        timestamp: now.toISOString(),
        user_id: userId,
      },
    };
  }
};

export default createMessageLogService;
