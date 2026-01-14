// Update event service
/*
#Plan:
1. Accept and validate event code
2. Accept and validate event update data
3. Update the event
4. Send response to user
*/

import { ZodError } from "zod";
import { isDev } from "../../utils/devEnv.util.ts";
import {
  eventInputDTO,
  eventInputSchema,
  eventUpdate,
  eventUpdateSchema,
} from "../../types/event.types.ts";
import { supabaseAdmin } from "../../config/supabase.ts";

const updateEventService = async (
  eventInput: eventInputDTO,
  updateEventData: eventUpdate,
) => {
  const now = new Date();
  try {
    // 1. Accept and validate event code
    const { event_code } = eventInputSchema.parse({
      ...eventInput,
      event_code: eventInput.event_code.toUpperCase(),
    });

    // 2. Accept and validate event update data
    const validatedInput = eventUpdateSchema.parse(updateEventData);
    if (Object.keys(validatedInput).length === 0) {
      return {
        success: false,
        message: "No update fields provided",
        data: null,
        error: {
          code: "EMPTY_UPDATE",
          details: "At least one field must be provided for update",
        },
        metadata: {
          timestamp: now.toISOString(),
          event_code,
        },
      };
    }
    // 3. Update the event
    const { data, error } = await supabaseAdmin
      .from("events")
      .update({
        ...validatedInput,
      })
      .select(
        `id, 
        name, 
        description, 
        event_code, 
        start_time, 
        end_time, 
        is_active, 
        organizer_name, 
        organizer_contact, 
        organizer_email, 
        max_participants, 
        participant_count, 
        dashboard_url, 
        venue_name, 
        venue_address, 
        venue_latitude, 
        venue_longitude`,
      )
      .eq("event_code", event_code)
      .maybeSingle();
    if (error) {
      return {
        success: false,
        message: "Error updating event",
        data: null,
        error: {
          code: "EVENT_UPDATE_ERROR",
          details: isDev
            ? (error?.message ?? "Error updating event")
            : "Error updating event",
        },
        metadata: {
          timestamp: now.toISOString(),
          event_code,
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
        },
      };
    }

    // 4. Send response to user
    return {
      success: true,
      message: "Event updated successfully",
      data,
      error: null,
      metadata: {
        timestamp: now.toISOString(),
        event_code,
      },
    };
  } catch (error) {
    if (isDev) {
      console.error("updateEventService error:", error);
    }

    if (error instanceof ZodError) {
      return {
        success: false,
        message: "Event data validation error",
        data: null,
        error: {
          code: "VALIDATION_ERROR",
          details: isDev
            ? (error?.message ?? "Event data validation error")
            : "Event data validation error",
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
        details: "Unexpected error while updating event",
      },
      metadata: {
        timestamp: now.toISOString(),
      },
    };
  }
};

export default updateEventService;
