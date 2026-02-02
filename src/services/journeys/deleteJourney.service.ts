// Delete journey service
/*
#Plan:
1. Accept and validate user id
2. Accept and validate journey id
3. Delete journey
4. Send response to user
*/

import { ZodError } from "zod";
import { supabaseAdmin } from "../../config/supabase";
import { journeyInputDTO, journeyInputSchema } from "../../types/journey.types";
import validateJourney from "../../utils/validateJourney.util";
import validateUser from "../../utils/validateUser.util";
import { isDev } from "../../utils/devEnv.util";
import logger from "../../config/logger";
import { randomUUID } from "node:crypto";

const journey = logger.child({
  service: "deleteJourneyService",
  requestId: randomUUID(),
});

const deleteJourneyService = async (deleteJourneyData: journeyInputDTO) => {
  const now = new Date();
  try {
    // 1. Accept and validate user id
    const { user_id, journey_id } = journeyInputSchema.parse(deleteJourneyData);
    const userValidation = await validateUser(user_id, now);
    if (!userValidation.success) {
      journey.info("User validation failed", {
        userId: user_id,
      });
      return userValidation;
    }

    // 2. Accept and validate journey id
    const journeyValidation = await validateJourney(user_id, journey_id, now);
    if (!journeyValidation.success) {
      journey.info("Journey validation failed", {
        userId: user_id,
        journeyId: journey_id,
      });
      return journeyValidation;
    }

    // 3. Delete journey
    const { error, count } = await supabaseAdmin
      .from("journeys")
      .delete()
      .eq("journey_id", journey_id)
      .eq("user_id", user_id);
    if (error) {
      journey.error("Error deleting journey", {
        userId: user_id,
        journeyId: journey_id,
        reason: "JOURNEY_DELETION_ERROR",
        error,
      });
      return {
        success: false,
        message: "Error deleting journey",
        data: null,
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
      journey.info("Journey not found", {
        userId: user_id,
        journeyId: journey_id,
        reason: "NOT_FOUND",
        error,
      });
      return {
        success: false,
        message: "Journey not found",
        data: null,
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
      data: null,
      error: null,
      metadata: {
        timestamp: now.toISOString(),
        user_id,
        journey_id,
      },
    };
  } catch (error) {
    if (error instanceof ZodError) {
      journey.error("Error validating journey data", {
        reason: "VALIDATION_ERROR",
        error,
      });
      return {
        success: false,
        message: "Error validating journey data",
        data: null,
        error: {
          code: "VALIDATION_ERROR",
          details: isDev ? error.message : "Error validating journey data",
        },
        metadata: {
          timestamp: now.toISOString(),
        },
      };
    }

    journey.error("Internal server error", {
      reason: "INTERNAL_ERROR",
      error,
    });
    return {
      success: false,
      message: "Internal server error",
      data: null,
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
