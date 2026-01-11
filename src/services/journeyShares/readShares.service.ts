// Read journey shares service
/*
#Plan:
1. Accept and validate the user id
2. Accept and validate the journey id
3. Read journey shares
4. Send response to the user
*/

import { ZodError } from "zod";
import {
  journeyInputDTO,
  journeyInputSchema,
} from "../../types/journey.types.ts";
import validateJourney from "../../utils/validateJourney.util.ts";
import validateUser from "../../utils/validateUser.util.ts";
import { supabaseAdmin } from "../../config/supabase.ts";
import { isDev } from "../../utils/devEnv.util.ts";

const readJourneySharesService = async (
  journeySharesInput: journeyInputDTO,
) => {
  const now = new Date();
  try {
    // 1. Accept and validate user id
    const { user_id, journey_id } =
      journeyInputSchema.parse(journeySharesInput);
    const userValidation = await validateUser(user_id, now);
    if (!userValidation.success) {
      return userValidation;
    }

    // 2. Accept and validate the journey id
    const journeyValidation = await validateJourney(user_id, journey_id, now);
    if (!journeyValidation.success) {
      return journeyValidation;
    }

    // 3. Read journey shares
    const { data, error: fetchError } = await supabaseAdmin
      .from("journey_shares")
      .select()
      .eq("journey_id", journey_id)
      .eq("user_id", user_id)
      .order("created_at", { ascending: false });
    if (fetchError) {
      return {
        success: false,
        message: "Error fetching journey shares",
        data: [],
        error: {
          code: "JOURNEY_SHARES_FETCH_ERROR",
          details: isDev
            ? (fetchError?.message ?? "Error fetching journey shares")
            : "Error fetching journey shares",
        },
        metadata: {
          timestamp: now.toISOString(),
          user_id,
          journey_id,
        },
      };
    }

    // 4. Send response to the user
    const isZeroData = !data || data.length === 0;
    return {
      success: true,
      message: isZeroData
        ? "No journey shares found"
        : "Journey shares fetched successfully",
      data,
      error: null,
      metadata: {
        timestamp: now.toISOString(),
        user_id,
        journey_id,
      },
    };
  } catch (error) {
    console.error("readJourneySharesService error:", error);

    if (error instanceof ZodError) {
      return {
        success: false,
        message: "Journey shares data validation error",
        data: [],
        error: {
          code: "VALIDATION_ERROR",
          details: isDev
            ? (error?.message ?? "Journey shares data validation error")
            : "Journey shares data validation error",
        },
        metadata: {
          timestamp: now.toISOString(),
        },
      };
    }

    return {
      success: false,
      message: "Internal server error",
      data: [],
      error: {
        code: "INTERNAL_ERROR",
        details: "Unexpected error while fetching journey shares",
      },
      metadata: {
        timestamp: now.toISOString(),
      },
    };
  }
};

export default readJourneySharesService;
