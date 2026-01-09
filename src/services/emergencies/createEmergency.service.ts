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
} from "../../types/emergency.types.ts";
import validateUser from "../../utils/validateUser.util.ts";
import { supabaseAdmin } from "../../config/supabase.ts";

const createEmergencyService = async (
  emergencyInput: emergencyInputDTO,
  createEmergencyData: emergencyInsert,
) => {
  const now = new Date();
  const NODE_ENV = process.env.NODE_ENV ?? "production";
  try {
    // 1. Accept and validate the user id
    const { user_id, journey_id } = emergencyInputSchema.parse(emergencyInput);
    const userValidation = await validateUser(user_id, now);
    if (!userValidation.success) {
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
        data: {},
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
        data: {},
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
      return {
        success: false,
        message: "Error creating emergency",
        data: {},
        error: {
          code: "EMERGENCY_CREATION_ERROR",
          details:
            NODE_ENV === "development"
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
      await supabaseAdmin
        .from("emergencies")
        .delete()
        .eq("journey_id", data.journey_id)
        .eq("user_id", user_id);
      return {
        success: false,
        message: "Error terminating journey",
        data: {},
        error: {
          code: "JOURNEY_TERMINATION_ERROR",
          details:
            NODE_ENV === "development"
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
    console.error("Error creating emergency", error);

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
        details: "Unexpected error while creating emergency",
      },
      metadata: {
        timestamp: now.toISOString(),
      },
    };
  }
};

export default createEmergencyService;
