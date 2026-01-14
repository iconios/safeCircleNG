// Read event service
/*
#Plan:
1. Accept and validate event code
2. Fetch event
3. Send response to user
*/

import { ZodError } from "zod";
import { isDev } from "../../utils/devEnv.util.ts";
import { eventInputDTO, eventInputSchema } from "../../types/event.types.ts";
import { supabaseAdmin } from "../../config/supabase.ts";

const readEventService = async (eventInput: eventInputDTO) => {
  const now = new Date();
  try {
    // 1. Accept and validate event code
    const { event_code } = eventInputSchema.parse({
      ...eventInput,
      event_code: eventInput.event_code.toUpperCase(),
    });

    // 2. Fetch event
    const { data, error } = await supabaseAdmin
      .from("events")
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
      .eq("is_active", true)
      .maybeSingle();

    if (error) {
      return {
        success: false,
        message: "Error fetching event",
        data: null,
        error: {
          code: "EVENT_FETCH_ERROR",
          details: isDev
            ? (error?.message ?? "Error fetching event")
            : "Error fetching event",
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

    // 3. Send response to user
    return {
      success: true,
      message: "Event fetched successfully",
      data,
      error: null,
      metadata: {
        timestamp: now.toISOString(),
        event_code,
      },
    };
  } catch (error) {
    if (isDev) {
      console.error("readEventService error:", error);
    }

    if (error instanceof ZodError) {
      return {
        success: false,
        message: "Invalid event lookup input",
        data: null,
        error: {
          code: "VALIDATION_ERROR",
          details: isDev
            ? (error?.message ?? "Invalid event lookup input")
            : "Invalid event lookup input",
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
        details: "Unexpected error while fetching event",
      },
      metadata: {
        timestamp: now.toISOString(),
      },
    };
  }
};

export default readEventService;
