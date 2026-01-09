// Read journey locations service
/*
#Plan:
1. Accept and validate the user id
2. Accept and validate the journey id
3. Get the journey locations
4. Send response to user
*/

import { ZodError } from "zod";
import {
  journeyInputDTO,
  journeyInputSchema,
} from "../../types/journey.types.ts";
import validateJourney from "../../utils/validateJourney.util.ts";
import validateUser from "../../utils/validateUser.util.ts";
import { supabaseAdmin } from "../../config/supabase.ts";

const readJourneyLocationsService = async (
  journeyLocationInput: journeyInputDTO,
) => {
  const now = new Date();
  const NODE_ENV = process.env.NODE_ENV ?? "production";
  try {
    // 1. Accept and validate user id
    const { user_id, journey_id } =
      journeyInputSchema.parse(journeyLocationInput);
    const userValidation = await validateUser(user_id, now);
    if (!userValidation.success) {
      return userValidation;
    }

    // 2. Accept and validate the journey id
    const journeyValidation = await validateJourney(user_id, journey_id, now);
    if (!journeyValidation.success) {
      return journeyValidation;
    }

    // 3. Get the journey locations
    const { data, error } = await supabaseAdmin
      .from("journey_locations")
      .select()
      .eq("journey_id", journey_id)
      .order("created_at", { ascending: true });
    if (error) {
      return {
        success: false,
        message: "Error fetching journey locations",
        data: [],
        error: {
          code: "JOURNEY_LOCATION_READ_ERROR",
          details:
            NODE_ENV === "development"
              ? (error?.message ?? "Error fetching journey locations")
              : "Error fetching journey locations",
        },
        metadata: {
          timestamp: now.toISOString(),
          user_id,
          journey_id,
        },
      };
    }

    const isZeroData = !data || data.length === 0;
    return {
      success: true,
      message: isZeroData
        ? "No journey locations found"
        : "Journey locations fetched successfully",
      data,
      error: null,
      metadata: {
        timestamp: now.toISOString(),
        user_id,
        journey_id,
      },
    };
  } catch (error) {
    console.error("readJourneyLocationsService error:", error);

    if (error instanceof ZodError) {
      return {
        success: false,
        message: "Journey location data validation error",
        data: [],
        error: {
          code: "VALIDATION_ERROR",
          details:
            NODE_ENV === "development"
              ? (error?.message ?? "Journey location data validation error")
              : "Journey location data validation error",
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
        details: "Unexpected error while reading journey locations",
      },
      metadata: {
        timestamp: now.toISOString(),
      },
    };
  }
};

export default readJourneyLocationsService;
