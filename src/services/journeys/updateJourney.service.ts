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
      return userValidation;
    }

    // 2. Accept and validate journey id
    const journeyValidation = await validateJourney(user_id, journey_id, now);
    if (!journeyValidation.success) {
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
    console.error("Error updating journey", error);

    if (error instanceof ZodError) {
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
