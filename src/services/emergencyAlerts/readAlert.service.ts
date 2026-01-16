// Read emergency alerts service
/*
#Plan:
1. Accept and validate the user id
2. Accept, validate the emergency id and it belongs to the user
3. Fetch the emergency alerts
4. Send response to the user
*/

import { ZodError } from "zod";
import {
  emergencyAlertInputDTO,
  emergencyAlertsInputSchema,
} from "../../types/emergencyAlert.types.ts";
import validateUser from "../../utils/validateUser.util.ts";
import { supabaseAdmin } from "../../config/supabase.ts";
import { isDev } from "../../utils/devEnv.util.ts";

const readEmergencyAlertsService = async (
  alertInputData: emergencyAlertInputDTO,
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

    // 2. Accept, validate the emergency id and it belongs to the user
    const { data: emergency, error: emergencyError } = await supabaseAdmin
      .from("emergencies")
      .select("id")
      .eq("id", emergency_id)
      .eq("user_id", user_id)
      .maybeSingle();

    if (emergencyError) {
      return {
        success: false,
        message: "Error validating emergency",
        data: [],
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
        data: [],
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

    // 3. Fetch the emergency alerts
    const { data: fetchedData, error: fetchError } = await supabaseAdmin
      .from("emergency_alerts")
      .select()
      .eq("emergency_id", emergency_id)
      .order("created_at", { ascending: true });
    if (fetchError) {
      return {
        success: false,
        message: "Error fetching emergency alerts",
        data: [],
        error: {
          code: "EMERGENCY_ALERTS_FETCH_ERROR",
          details: isDev
            ? (fetchError.message ?? "Error fetching emergency alerts")
            : "Error fetching emergency alerts",
        },
        metadata: {
          timestamp: now.toISOString(),
          user_id,
          emergency_id,
        },
      };
    }

    // 4. Send response to the user
    const isZeroData = !fetchedData || fetchedData?.length === 0;
    return {
      success: true,
      message: isZeroData
        ? "No emergency alerts found"
        : "Emergency alerts fetched successfully",
      data: fetchedData,
      error: null,
      metadata: {
        timestamp: now.toISOString(),
        user_id,
        emergency_id,
      },
    };
  } catch (error) {
    console.error("readEmergencyAlertsService error:", error);

    if (error instanceof ZodError) {
      return {
        success: false,
        message: "Emergency data validation error",
        data: {},
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
      data: {},
      error: {
        code: "INTERNAL_ERROR",
        details: "Unexpected error while reading emergency alerts",
      },
      metadata: {
        timestamp: now.toISOString(),
      },
    };
  }
};

export default readEmergencyAlertsService;
