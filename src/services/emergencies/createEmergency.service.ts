// Create emergency service
/*
#Plan:
1. Accept and validate the user id
2. 2. Accept, validate and check if the journey is active
3. Check if an emergency already exists for the journey
4. Create emergency and terminate journey
5. Send response to user
*/

import { ZodError } from "zod";
import {
  emergencyInputDTO,
  emergencyInputSchema,
  emergencyInsert,
  emergencyInsertSchema,
  emergencyRow,
} from "../../types/emergency.types";
import validateUser from "../../utils/validateUser.util";
import { supabaseAdmin } from "../../config/supabase";
import { isDev } from "../../utils/devEnv.util";
import logger from "../../config/logger";
import { randomUUID } from "node:crypto";

const emergencyLog = logger.child({
  service: "createEmergencyService",
  requestId: randomUUID(),
});

const createEmergencyService = async (
  emergencyInput: emergencyInputDTO,
  createEmergencyData: emergencyInsert,
) => {
  const now = new Date();
  try {
    // 1. Accept and validate the user id
    const { user_id, journey_id } = emergencyInputSchema.parse(emergencyInput);
    const userValidation = await validateUser(user_id, now);
    if (!userValidation.success) {
      emergencyLog.info("User validation failed", {
        userId: user_id,
        journeyId: journey_id,
      });
      return userValidation;
    }

    // 2. Accept, validate and check if the journey is active
    const { data: activeJourney } = await supabaseAdmin
      .from("journeys")
      .select("journey_id")
      .eq("journey_id", journey_id)
      .eq("user_id", user_id)
      .eq("status", "active")
      .maybeSingle();
    if (!activeJourney) {
      return {
        success: false,
        message: "No active journey found",
        data: null,
        error: {
          code: "JOURNEY_NOT_ACTIVE",
          details: "Emergency cannot be created for inactive journey",
        },
        metadata: {
          timestamp: now.toISOString(),
          user_id,
          journey_id,
        },
      };
    }

    // 3. Check if an emergency already exists for the journey
    const { data: activeEmergency } = await supabaseAdmin
      .from("emergencies")
      .select("id")
      .eq("journey_id", journey_id)
      .eq("user_id", user_id)
      .maybeSingle();
    if (activeEmergency) {
      return {
        success: false,
        message: "Active emergency already exists",
        data: null,
        error: {
          code: "ACTIVE_EMERGENCY_EXISTS",
          details: "A journey could only have one emergency",
        },
        metadata: {
          timestamp: now.toISOString(),
          user_id,
          journey_id,
        },
      };
    }

    // 4. Create emergency and terminate journey
    const validatedInput = emergencyInsertSchema.parse(createEmergencyData);
    const { data, error } = await supabaseAdmin
      .from("emergencies")
      .insert({
        ...validatedInput,
        user_id,
        journey_id,
      })
      .select()
      .single();

    if (error?.code === "23505") {
      emergencyLog.error("Emergency already exists", {
        userId: user_id,
        journeyId: journey_id,
        error,
      });
      return {
        success: false,
        message: "Emergency already exists",
        error: {
          code: "EMERGENCY_ALREADY_EXISTS",
          details: "A journey may only have one emergency",
        },
        metadata: {
          timestamp: now.toISOString(),
          user_id,
          journey_id,
        },
      };
    }
    if (error) {
      emergencyLog.error("Error creating emergency", {
        userId: user_id,
        journeyId: journey_id,
        error,
      });
      return {
        success: false,
        message: "Error creating emergency",
        data: null,
        error: {
          code: "EMERGENCY_CREATION_ERROR",
          details: isDev
            ? (error.message ?? "Error creating emergency")
            : "Error creating emergency",
        },
        metadata: {
          timestamp: now.toISOString(),
          user_id,
          journey_id,
        },
      };
    }

    const { error: terminationError } = await supabaseAdmin
      .from("journeys")
      .update({
        status: "emergency",
        terminated_at: now,
        termination_reason: "emergency",
      })
      .eq("journey_id", journey_id)
      .eq("user_id", user_id);
    if (terminationError) {
      emergencyLog.error("Error terminating journey", {
        userId: user_id,
        journeyId: journey_id,
        terminationError,
      });
      await supabaseAdmin
        .from("emergencies")
        .delete()
        .eq("journey_id", data.journey_id)
        .eq("user_id", user_id);
      return {
        success: false,
        message: "Error terminating journey",
        data: null,
        error: {
          code: "JOURNEY_TERMINATION_ERROR",
          details: isDev
            ? (terminationError.message ?? "Error terminating journey")
            : "Error terminating journey",
        },
        metadata: {
          timestamp: now.toISOString(),
          user_id,
          journey_id,
        },
      };
    }

    //5. Send response to user
    const emergencyCreatedData: emergencyRow = data;
    return {
      success: true,
      message: "Emergency created successfully",
      data: emergencyCreatedData,
      error: null,
      metadata: {
        timestamp: now.toISOString(),
        user_id,
        journey_id,
      },
    };
  } catch (error) {
    if (error instanceof ZodError) {
      emergencyLog.error("Emergency data validation error", {
        error,
      });
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

    emergencyLog.error("Internal server error", {
      error,
    });
    return {
      success: false,
      message: "Internal server error",
      data: null,
      error: {
        code: "INTERNAL_ERROR",
        details: "Unexpected error while creating emergency",
      },
      metadata: {
        timestamp: now.toISOString(),
      },
    };
  }
};

export default createEmergencyService;
