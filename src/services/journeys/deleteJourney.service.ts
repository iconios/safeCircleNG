// Delete journey service
/*
#Plan:
1. Accept and validate user id
2. Accept and validate journey id
3. Delete journey
4. Send response to user
*/

import { ZodError } from "zod";
import { supabaseAdmin } from "../../config/supabase.ts";
import {
  journeyInputDTO,
  journeyInputSchema,
} from "../../types/journey.types.ts";
import validateJourney from "../../utils/validateJourney.util.ts";
import validateUser from "../../utils/validateUser.util.ts";
import { isDev } from "../../utils/devEnv.util.ts";

const deleteJourneyService = async (deleteJourneyData: journeyInputDTO) => {
  const now = new Date();
  try {
    // 1. Accept and validate user id
    const { user_id, journey_id } = journeyInputSchema.parse(deleteJourneyData);
    const userValidation = await validateUser(user_id, now);
    if (!userValidation.success) {
      return userValidation;
    }

    // 2. Accept and validate journey id
    const journeyValidation = await validateJourney(user_id, journey_id, now);
    if (!journeyValidation.success) {
      return journeyValidation;
    }

    // 3. Delete journey
    const { error, count } = await supabaseAdmin
      .from("journeys")
      .delete()
      .eq("journey_id", journey_id)
      .eq("user_id", user_id);
    if (error) {
      return {
        success: false,
        message: "Error deleting journey",
        data: {},
        error: {
          code: "JOURNEY_DELETION_ERROR",
          details: isDev ? error.message : "Error deleting journey",
        },
        metadata: {
          timestamp: now.toISOString(),
          user_id,
          journey_id,
        },
      };
    }

    if (count === 0) {
      return {
        success: false,
        message: "Journey not found",
        data: {},
        error: {
          code: "NOT_FOUND",
          details: "Journey no longer exists",
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
      message: "Journey deleted successfully",
      data: {},
      error: null,
      metadata: {
        timestamp: now.toISOString(),
        user_id,
        journey_id,
      },
    };
  } catch (error) {
    console.error("Error deleting journey", error);

    if (error instanceof ZodError) {
      return {
        success: false,
        message: "Error validating journey data",
        data: {},
        error: {
          code: "VALIDATION_ERROR",
          details: isDev ? error.message : "Error validating journey data",
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
        details: "Unexpected error while deleting journey",
      },
      metadata: {
        timestamp: now.toISOString(),
      },
    };
  }
};

export default deleteJourneyService;
