// Read emergency by journey service
/*
#Plan:
1. Accept and validate user id
2. Accept and validate journey id
3. Fetch emergency
4. Send response to user
*/

import { ZodError } from "zod";
import {
  emergencyInputDTO,
  emergencyInputSchema,
} from "../../types/emergency.types.ts";
import validateUser from "../../utils/validateUser.util.ts";
import validateJourney from "../../utils/validateJourney.util.ts";
import { supabaseAdmin } from "../../config/supabase.ts";
import { isDev } from "../../utils/devEnv.util.ts";

const readEmergencyByJourneyService = async (
  emergencyDataInput: emergencyInputDTO,
) => {
  const now = new Date();
  try {
    // 1. Accept and validate user id
    const { user_id, journey_id } =
      emergencyInputSchema.parse(emergencyDataInput);
    const userValidation = await validateUser(user_id, now);
    if (!userValidation.success) {
      return userValidation;
    }

    // 2. Accept and validate journey id
    const journeyValidation = await validateJourney(user_id, journey_id, now);
    if (!journeyValidation.success) {
      return journeyValidation;
    }

    // 3. Fetch emergency
    const { data, error } = await supabaseAdmin
      .from("emergencies")
      .select("*")
      .eq("journey_id", journey_id)
      .eq("user_id", user_id)
      .maybeSingle();
    if (error) {
      return {
        success: false,
        message: "Error reading emergency",
        data: null,
        error: {
          code: "EMERGENCY_FETCH_ERROR",
          details: isDev
            ? (error.message ?? "Error fetching emergency")
            : "Error fetching emergency",
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
      message: data ? "Emergency fetched successfully" : "No emergency found",
      data,
      error: null,
      metadata: {
        timestamp: now.toISOString(),
        user_id,
        journey_id,
      },
    };
  } catch (error) {
    console.error("Error reading emergencies", error);

    if (error instanceof ZodError) {
      return {
        success: false,
        message: "Emergency data validation error",
        data: null,
        error: {
          code: "VALIDATION_ERROR",
          details: isDev
            ? (error?.message ?? "Emergency data validation error")
            : "Emergency data validation error",
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
        details: "Unexpected error while reading emergency",
      },
      metadata: {
        timestamp: now.toISOString(),
      },
    };
  }
};

export default readEmergencyByJourneyService;
