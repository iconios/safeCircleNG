// Create emergency alert service
/*
#Plan:
1. Accept and validate the user id
2. Accept, validate the emergency id exists belonging to the user and it's unresolved
3. Accept, validate the new emergency alert data and create emergency alert
4. Send response to user
*/

import { ZodError } from "zod";
import {
  emergencyAlertInputDTO,
  emergencyAlertsInputSchema,
  emergencyAlertsInsert,
  emergencyAlertsInsertSchema,
} from "../../types/emergencyAlert.types.ts";
import validateUser from "../../utils/validateUser.util.ts";
import { supabaseAdmin } from "../../config/supabase.ts";
import { isDev } from "../../utils/devEnv.util.ts";

const createEmergencyAlertService = async (
  alertInputData: emergencyAlertInputDTO,
  createAlertData: emergencyAlertsInsert,
) => {
  const now = new Date();
  try {
    // 1. Accept and validate the user id
    const { user_id, emergency_id } =
      emergencyAlertsInputSchema.parse(alertInputData);
    const userValidation = await validateUser(user_id, now);
    if (!userValidation.success) {
      return userValidation;
    }

    // 2. Accept, validate the emergency id exists belonging to the user and it's unresolved
    const { data: emergency, error: emergencyError } = await supabaseAdmin
      .from("emergencies")
      .select("id, resolved_at")
      .eq("id", emergency_id)
      .eq("user_id", user_id)
      .maybeSingle();

    if (emergencyError) {
      return {
        success: false,
        message: "Error validating emergency",
        data: null,
        error: {
          code: "EMERGENCY_VALIDATION_ERROR",
          details: isDev
            ? (emergencyError.message ?? "Error validating emergency")
            : "Error validating emergency",
        },
        metadata: {
          timestamp: now.toISOString(),
          user_id,
          emergency_id,
        },
      };
    }

    if (!emergency) {
      return {
        success: false,
        message: "Emergency not found",
        data: null,
        error: {
          code: "NOT_FOUND",
          details: "Emergency not found",
        },
        metadata: {
          timestamp: now.toISOString(),
          user_id,
          emergency_id,
        },
      };
    }

    if (emergency.resolved_at) {
      return {
        success: false,
        message: "Emergency already resolved",
        data: null,
        error: {
          code: "EMERGENCY_ALREADY_RESOLVED",
          details: "Emergency already resolved",
        },
        metadata: {
          timestamp: now.toISOString(),
          user_id,
          emergency_id,
        },
      };
    }

    // 3. Accept, validate the new emergency alert data and create emergency alert
    const validatedInput = emergencyAlertsInsertSchema.parse(createAlertData);
    const { data: createdAlert, error } = await supabaseAdmin
      .from("emergency_alerts")
      .insert({
        emergency_id,
        ...validatedInput,
      })
      .select()
      .single();
    if (error) {
      return {
        success: false,
        message: "Error creating emergency alert",
        data: null,
        error: {
          code: "EMERGENCY_ALERT_CREATION_ERROR",
          details: isDev
            ? (error?.message ?? "Error creating emergency alert")
            : "Error creating emergency alert",
        },
        metadata: {
          timestamp: now.toISOString(),
          user_id,
          emergency_id,
        },
      };
    }

    // 4. Send response to user
    return {
      success: true,
      message: "Emergency alert created successfully",
      data: createdAlert,
      error: null,
      metadata: {
        timestamp: now.toISOString(),
        user_id,
        emergency_id,
      },
    };
  } catch (error) {
    console.error("createEmergencyAlertService error:", error);

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
        details: "Unexpected error while creating emergency alert",
      },
      metadata: {
        timestamp: now.toISOString(),
      },
    };
  }
};

export default createEmergencyAlertService;
