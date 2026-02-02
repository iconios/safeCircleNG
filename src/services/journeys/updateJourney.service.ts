// Update journey service
/*
#Plan:
1. Accept and validate user id
2. Accept and validate journey id
3. Validate and update journey data
4. Send response to user
*/

import { ZodError } from "zod";
import { supabaseAdmin } from "../../config/supabase";
import {
  journeyInputDTO,
  journeyInputSchema,
  JourneyRow,
  JourneyUpdate,
  JourneyUpdateSchema,
} from "../../types/journey.types";
import validateJourney from "../../utils/validateJourney.util";
import validateUser from "../../utils/validateUser.util";
import { isDev } from "../../utils/devEnv.util";
import logger from "../../config/logger";
import { randomUUID } from "node:crypto";

const journey = logger.child({
  service: "updateJourneyService",
  requestId: randomUUID(),
});

const updateJourneyService = async (
  updateJourneyInput: journeyInputDTO,
  updateData: JourneyUpdate,
) => {
  const now = new Date();
  try {
    // 1. Accept and validate user id
    const { user_id, journey_id } =
      journeyInputSchema.parse(updateJourneyInput);
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
      journey.info("User validation failed", {
        userId: user_id,
        journeyId: journey_id,
      });
      return journeyValidation;
    }

    // 3. Validate and update journey data
    const validatedInput = JourneyUpdateSchema.parse(updateData);
    const { data, error } = await supabaseAdmin
      .from("journeys")
      .update(validatedInput)
      .eq("journey_id", journey_id)
      .eq("user_id", user_id)
      .select()
      .single();

    if (error) {
      journey.error("Error updating journey", {
        userId: user_id,
        journeyId: journey_id,
        error,
      });
      return {
        success: false,
        message: "Error updating journey",
        data: null,
        error: {
          code: "JOURNEY_UPDATE_ERROR",
          details: isDev ? error.message : "Error updating journey",
        },
        metadata: {
          timestamp: now.toISOString(),
          user_id,
          journey_id,
        },
      };
    }

    // 4. Send response to user
    const updatedJourneyData: JourneyRow = data;
    return {
      success: true,
      message: "Journey updated successfully",
      data: updatedJourneyData,
      error: null,
      metadata: {
        timestamp: now.toISOString(),
        user_id,
        journey_id,
      },
    };
  } catch (error) {
    if (error instanceof ZodError) {
      journey.error("Error validating journey update data", {
        error,
      });
      return {
        success: false,
        message: "Error validating journey update data",
        data: null,
        error: {
          code: "VALIDATION_ERROR",
          details: "Error validating journey update data",
        },
        metadata: {
          timestamp: now.toISOString(),
        },
      };
    }

    journey.error("Internal server error", {
      error,
    });
    return {
      success: false,
      message: "Internal server error",
      data: null,
      error: {
        code: "INTERNAL_ERROR",
        details: "unexpected error while updating journey",
      },
      metadata: {
        timestamp: now.toISOString(),
      },
    };
  }
};

export default updateJourneyService;
