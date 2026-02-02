// Read journey service
/*
#Plan:
1. Accept and validate user id
2. Fetch the journeys
3. Send response to user
*/

import { supabaseAdmin } from "../../config/supabase";
import { JourneyRow } from "../../types/journey.types";
import { isDev } from "../../utils/devEnv.util";
import validateUser from "../../utils/validateUser.util";
import logger from "../../config/logger";
import { randomUUID } from "node:crypto";

const journey = logger.child({
  service: "readJourneyService",
  requestId: randomUUID(),
});

const readJourneyService = async (userId: string) => {
  const now = new Date();
  try {
    // 1. Accept and validate user id
    const userValidation = await validateUser(userId, now);
    if (!userValidation.success) {
      journey.info("User validation failed", {
        userId,
      });
      return userValidation;
    }

    // 2. Fetch the journeys
    const { data, error: journeysError } = await supabaseAdmin
      .from("journeys")
      .select()
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .range(0, 19);

    if (journeysError) {
      journey.info("Error fetching journeys", {
        userId,
      });
      return {
        success: false,
        message: "Error fetching journeys",
        data: [],
        error: {
          code: "FETCH_ERROR",
          details: isDev
            ? (journeysError.message ?? "Error fetching journeys")
            : "Error fetching journeys",
        },
        metadata: {
          timestamp: now.toISOString(),
          user_id: userId,
        },
      };
    }

    // 3. Send response to user
    const journeysData: JourneyRow[] = data ?? [];
    return {
      success: true,
      message:
        journeysData.length === 0
          ? "No journeys found"
          : "Journeys fetched successfully",
      data: journeysData,
      error: null,
      metadata: {
        timestamp: now.toISOString(),
        user_id: userId,
      },
    };
  } catch (error) {
    journey.error("Internal server error", {
      userId,
      error,
    });
    return {
      success: false,
      message: "Internal server error",
      data: [],
      error: {
        code: "INTERNAL_ERROR",
        details: "Unexpected error while fetching journeys",
      },
      metadata: {
        timestamp: now.toISOString(),
        user_id: userId,
      },
    };
  }
};

export default readJourneyService;
