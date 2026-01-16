// Read journey service
/*
#Plan:
1. Accept and validate user id
2. Fetch the journeys
3. Send response to user
*/

import { supabaseAdmin } from "../../config/supabase.ts";
import { JourneyRow } from "../../types/journey.types.ts";
import { isDev } from "../../utils/devEnv.util.ts";
import validateUser from "../../utils/validateUser.util.ts";

const readJourneyService = async (userId: string) => {
  const now = new Date();
  try {
    // 1. Accept and validate user id
    const userValidation = await validateUser(userId, now);
    if (!userValidation.success) {
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
    console.error("Error fetching journeys", error);

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
