// Create journey location service
/*
#Plan:
1. Accept and validate user id
2. Accept, validate and ensure journey status is active
3. Validate new journey location data and create journey location
4. Send response to user
*/

import { ZodError } from "zod";
import { supabaseAdmin } from "../../config/supabase.ts";
import {
  journeyInputDTO,
  journeyInputSchema,
} from "../../types/journey.types.ts";
import {
  journeyLocationInsert,
  journeyLocationInsertSchema,
} from "../../types/journeyLocation.types.ts";
import validateUser from "../../utils/validateUser.util.ts";

const createJourneyLocationService = async (
  journeyLocationInput: journeyInputDTO,
  journeyLocationData: journeyLocationInsert,
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

    // 2. Accept, validate and ensure journey status is active
    const { data: journeyData, error: journeyError } = await supabaseAdmin
      .from("journeys")
      .select("journey_id")
      .eq("journey_id", journey_id)
      .eq("user_id", user_id)
      .eq("status", "active")
      .limit(1)
      .maybeSingle();

    if (journeyError) {
      return {
        success: false,
        message: "Error while confirming journey location",
        data: {},
        error: {
          code: "JOURNEY_LOCATION_CONFIRMATION_ERROR",
          details:
            NODE_ENV === "development"
              ? (journeyError.message ??
                "Error while confirming journey location")
              : "Error while confirming journey location",
        },
        metadata: {
          timestamp: now.toISOString(),
          user_id,
          journey_id,
        },
      };
    }

    if (!journeyData) {
      return {
        success: false,
        message: "Journey not found",
        data: {},
        error: {
          code: "NOT_FOUND",
          details: "Journey not found",
        },
        metadata: {
          timestamp: now.toISOString(),
          user_id,
          journey_id,
        },
      };
    }

    // 3. Validate new journey location data and create journey location
    const validatedInput =
      journeyLocationInsertSchema.parse(journeyLocationData);
    const { data, error } = await supabaseAdmin
      .from("journey_locations")
      .insert({
        ...validatedInput,
        journey_id: journeyData.journey_id,
      })
      .select()
      .single();
    if (error) {
      return {
        success: false,
        message: "Error while creating journey location",
        data: {},
        error: {
          code: "JOURNEY_LOCATION_CREATION_ERROR",
          details:
            NODE_ENV === "development"
              ? (error.message ?? "Error while creating journey location")
              : "Error while creating journey location",
        },
        metadata: {
          timestamp: now.toISOString(),
          user_id,
          journey_id,
        },
      };
    }

    // 4. Send response to user
    return {
      success: true,
      message: "Journey location created successfully",
      data,
      error: null,
      metadata: {
        timestamp: now.toISOString(),
        user_id,
        journey_id,
      },
    };
  } catch (error) {
    console.error("createJourneyLocationService error", error);

    if (error instanceof ZodError) {
      return {
        success: false,
        message: "Journey location data validation error",
        data: {},
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
      data: {},
      error: {
        code: "INTERNAL_ERROR",
        details: "Unexpected error while creating journey location ",
      },
      metadata: {
        timestamp: now.toISOString(),
      },
    };
  }
};

export default createJourneyLocationService;
