// Create message log service
// This is an internal service — user validation is expected to be handled by the caller
/*
#Plan:
1. Accept and validate message log data
2. Create message log
3. Send response to the user
*/

import {
  messageLogsArrayInsert,
  messageLogsInsertArraySchema,
} from "../../types/messageLogs.types";
import { supabaseAdmin } from "../../config/supabase";
import { isDev } from "../../utils/devEnv.util";

const createMessageLogService = async (
  userId: string,
  logData: messageLogsArrayInsert,
): Promise<{ success: true; count: number } | void> => {
  try {
    if (!userId) {
      if (isDev) console.error("createMessageLogService: missing userId");
      return;
    }

    // 1. Accept and validate message log data
    const validatedInput = messageLogsInsertArraySchema.parse(logData);

    // 2. Create message log
    const payload = validatedInput.map((item) => ({
      user_id: userId,
      ...item,
    }));
    const { error } = await supabaseAdmin.from("message_logs").insert(payload);

    if (error) {
      if (isDev) console.error("Message log insert failed", error);
      return;
    }

    // 3. Send response to the user
    return {
      success: true,
      count: payload.length,
    };
  } catch (error) {
    if (isDev) console.error("createMessageLogService error:", error);
    return;
  }
};

export default createMessageLogService;
