// Update emergency service
/*
#Plan:
1. Accept and validate user id
2. Accept and validate journey id
3. Check if emergency is available
4. validate update data and update emergency
5. Send response to user
*/

import { ZodError } from "zod";
import { supabaseAdmin } from "../../config/supabase.ts";
import {
  emergencyInputDTO,
  emergencyInputSchema,
  emergencyUpdate,
  emergencyUpdateSchema,
} from "../../types/emergency.types.ts";
import validateUser from "../../utils/validateUser.util.ts";
import validateJourney from "../../utils/validateJourney.util.ts";

const updateEmergencyService = async (
  emergencyInputData: emergencyInputDTO,
  emergencyUpdateData: emergencyUpdate,
) => {
  const now = new Date();
  const NODE_ENV = process.env.NODE_ENV ?? "production";
  try {
    // 1. Accept and validate user id
    const { user_id, journey_id } =
      emergencyInputSchema.parse(emergencyInputData);
    const userValidation = await validateUser(user_id, now);
    if (!userValidation.success) {
      return userValidation;
    }

    // 2. Accept and validate journey id
    const journeyValidation = await validateJourney(user_id, journey_id, now);
    if (!journeyValidation.success) {
      return journeyValidation;
    }

    // 3. Check if emergency is available
    const { data: emergencyData, error } = await supabaseAdmin
      .from("emergencies")
      .select("id")
      .eq("journey_id", journey_id)
      .eq("user_id", user_id)
      .maybeSingle();
    if (error || !emergencyData) {
      return {
        success: false,
        message: "Emergency not found",
        data: {},
        error: {
          code: "NOT_FOUND",
          details:
            NODE_ENV === "development"
              ? (error?.message ?? "Emergency not found")
              : "Emergency not found",
        },
        metadata: {
          timestamp: now.toISOString(),
          user_id,
          journey_id,
        },
      };
    }

    // 4. validate update data and update emergency
    const validatedInput = emergencyUpdateSchema.parse(emergencyUpdateData);
    const { data: updatedEmergency, error: updateError } = await supabaseAdmin
      .from("emergencies")
      .update(validatedInput)
      .eq("id", emergencyData.id)
      .eq("user_id", user_id)
      .select()
      .single();
    if (updateError) {
      return {
        success: false,
        message: "Error updating emergency",
        data: {},
        error: {
          code: "EMERGENCY_UPDATE_ERROR",
          details:
            NODE_ENV === "development"
              ? (updateError?.message ?? "Error updating emergency")
              : "Error updating emergency",
        },
        metadata: {
          timestamp: now.toISOString(),
          user_id,
          journey_id,
        },
      };
    }

    // 5. Send response to user
    return {
      success: true,
      message: "Emergency updated successfully",
      data: updatedEmergency,
      error: null,
      metadata: {
        timestamp: now.toISOString(),
        user_id,
        journey_id,
      },
    };
  } catch (error) {
    console.error("Error updating emergency", error);

    if (error instanceof ZodError) {
      return {
        success: false,
        message: "Emergency data validation error",
        data: {},
        error: {
          code: "VALIDATION_ERROR",
          details:
            NODE_ENV === "development"
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
      data: {},
      error: {
        code: "INTERNAL_ERROR",
        details: "Unexpected error while updating emergency",
      },
      metadata: {
        timestamp: now.toISOString(),
      },
    };
  }
};

export default updateEmergencyService;
