// Delete event service
/*
#Plan:
1. Accept and validate event code and id
2. Delete event
3. Send response to user
*/

import { ZodError } from "zod";
import { isDev } from "../../utils/devEnv.util.ts";
import {
  deleteEventInput,
  deleteEventInputSchema,
} from "../../types/event.types.ts";
import { supabaseAdmin } from "../../config/supabase.ts";

const deleteEventService = async (eventInputData: deleteEventInput) => {
  const now = new Date();
  try {
    // 1. Accept and validate event code and id
    const { event_code, event_id } = deleteEventInputSchema.parse({
      ...eventInputData,
      event_code: eventInputData.event_code.toUpperCase(),
    });

    // 2. Delete event
    const { data, error } = await supabaseAdmin
      .from("events")
      .delete()
      .eq("event_code", event_code)
      .eq("id", event_id)
      .select("id")
      .maybeSingle();
    if (error) {
      return {
        success: false,
        message: "Error deleting event",
        data: null,
        error: {
          code: "EVENT_DELETION_ERROR",
          details: isDev
            ? (error?.message ?? "Error deleting event")
            : "Error deleting event",
        },
        metadata: {
          timestamp: now.toISOString(),
          event_code,
          event_id,
        },
      };
    }

    if (!data) {
      return {
        success: false,
        message: "No event found",
        data: null,
        error: {
          code: "EVENT_NOT_FOUND",
          details: "No event found",
        },
        metadata: {
          timestamp: now.toISOString(),
          event_code,
          event_id,
        },
      };
    }

    // 3. Send response to user
    return {
      success: true,
      message: "Event deleted successfully",
      data,
      error: null,
      metadata: {
        timestamp: now.toISOString(),
        event_code,
        event_id,
      },
    };
  } catch (error) {
    if (isDev) {
      console.error("deleteEventService error:", error);
    }

    if (error instanceof ZodError) {
      return {
        success: false,
        message: "Invalid event delete input",
        data: null,
        error: {
          code: "VALIDATION_ERROR",
          details: isDev
            ? (error?.message ?? "Invalid event delete input")
            : "Invalid event delete input",
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
        details: "Unexpected error while deleting event",
      },
      metadata: {
        timestamp: now.toISOString(),
      },
    };
  }
};
export default deleteEventService;
