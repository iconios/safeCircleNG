// Read journey by id service
/*
#Plan:
1. Accept and validate the user id and journey id
2. Fetch the journey id
3. Send response to user
*/

import { ZodError } from "zod";
import { supabaseAdmin } from "../../config/supabase.ts";
import {
  JourneyRow,
  journeyInputDTO,
  journeyInputSchema,
} from "../../types/journey.types.ts";
import validateUser from "../../utils/validateUser.util.ts";

const readJourneyByIdService = async (readJourneyData: journeyInputDTO) => {
  const NODE_ENV = process.env.NODE_ENV ?? "production";
  const now = new Date();
  try {
    // 1. Accept and validate the user id and journey id
    const { user_id, journey_id } = journeyInputSchema.parse(readJourneyData);
    const userValidation = await validateUser(user_id, now);
    if (!userValidation.success) {
      return userValidation;
    }

    // 2. Fetch the journey id
    const { data, error } = await supabaseAdmin
      .from("journeys")
      .select("*")
      .eq("journey_id", journey_id)
      .eq("user_id", user_id)
      .maybeSingle();

    if (error) {
      return {
        success: false,
        message: "Error fetching journey",
        data: {},
        error: {
          code: "FETCH_ERROR",
          details:
            NODE_ENV === "development"
              ? error.message
              : "Error fetching journey",
        },
        metadata: {
          timestamp: now.toISOString(),
          user_id,
          journey_id,
        },
      };
    }

    if (!data) {
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

    // 3. Send response to user
    const journeyData: JourneyRow = data;
    return {
      success: true,
      message: "Journey fetched successfully",
      data: journeyData,
      error: null,
      metadata: {
        timestamp: now.toISOString(),
        user_id,
        journey_id,
      },
    };
  } catch (error) {
    console.error("Error fetching journey", error);

    if (error instanceof ZodError) {
      return {
        success: false,
        message: "Error validating the input data",
        data: {},
        error: {
          code: "VALIDATION_ERROR",
          details: "Error while validating the input data",
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
        details: "Unexpected error while fetching journey",
      },
      metadata: {
        timestamp: now.toISOString(),
      },
    };
  }
};

export default readJourneyByIdService;
