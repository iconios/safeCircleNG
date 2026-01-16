// Create event service
/*
#Plan:
1. Accept and validate the event data
2. Create event
3. Send response to user
*/

import { ZodError } from "zod";
import { isDev } from "../../utils/devEnv.util.ts";
import { eventInsert, eventInsertSchema } from "../../types/event.types.ts";
import { v4 as uuidv4 } from "uuid";
import generateRandomSixDigits from "../../utils/generateRandom.util.ts";
import { supabaseAdmin } from "../../config/supabase.ts";
import { EVENT_PERIOD_IN_DAYS } from "../../config/appConfig.ts";

const createEventService = async (eventData: eventInsert) => {
  const now = new Date();
  const SAFECIRCLE_BASE_URL = process.env.SAFECIRCLE_BASE_URL;

  if (!SAFECIRCLE_BASE_URL) {
    return {
      success: false,
      message: "Server configuration error",
      data: null,
      error: {
        code: "CONFIG_ERROR",
        details: "SAFECIRCLE_BASE_URL is not configured",
      },
      metadata: {
        timestamp: now.toISOString(),
      },
    };
  }

  try {
    // 1. Accept and validate the event data
    const { name, ...otherData } = eventInsertSchema.parse(eventData);

    // 2. Create event
    const baseSlug = name
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");

    const eventCodePartial = baseSlug.slice(0, 20).toUpperCase();
    const randomNumbers = generateRandomSixDigits();
    const eventSlug = `${baseSlug}-${randomNumbers}`;
    const admin_secret_key = uuidv4();
    const event_code = `${eventCodePartial}-${randomNumbers}`;
    const dashboard_url = `${SAFECIRCLE_BASE_URL}/org/${eventSlug}?ec=${event_code}`;
    const start_time = now;
    const end_time = new Date();
    end_time.setDate(end_time.getDate() + EVENT_PERIOD_IN_DAYS);
    const { data, error } = await supabaseAdmin
      .from("events")
      .insert({
        name,
        event_code,
        admin_secret_key,
        dashboard_url,
        start_time,
        end_time,
        slug: eventSlug,
        ...otherData,
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
        admin_secret_key, 
        dashboard_url, 
        venue_name, 
        venue_address, 
        venue_latitude, 
        venue_longitude`,
      )
      .single();

    if (error) {
      return {
        success: false,
        message: "Error creating event",
        data: null,
        error: {
          code: "EVENT_CREATION_ERROR",
          details: isDev
            ? (error?.message ?? "Error creating event")
            : "Error creating event",
        },
        metadata: {
          timestamp: now.toISOString(),
        },
      };
    }

    // 3. Send response to user
    return {
      success: true,
      message: "Event created successfully",
      data,
      error: null,
      metadata: {
        timestamp: now.toISOString(),
      },
    };
  } catch (error) {
    if (isDev) {
      console.error("createEventService error:", error);
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
      data: {},
      error: {
        code: "INTERNAL_ERROR",
        details: "Unexpected error while creating event",
      },
      metadata: {
        timestamp: now.toISOString(),
      },
    };
  }
};

export default createEventService;
