// Delete emergency service
/*
#Plan:
1. Accept and validate the user id
2. Accept and validate the emergency id
3. Delete emergency
4. Send response to user
*/

import { ZodError } from "zod";
import { supabaseAdmin } from "../../config/supabase";
import {
  deleteEmergencyDTO,
  deleteEmergencySchema,
} from "../../types/emergency.types";
import validateUser from "../../utils/validateUser.util";
import { isDev } from "../../utils/devEnv.util";
import logger from "../../config/logger";
import { randomUUID } from "node:crypto";

const emergencyLog = logger.child({
  service: "deleteEmergencyService",
  requestId: randomUUID(),
});

const deleteEmergencyService = async (
  emergencyInputData: deleteEmergencyDTO,
) => {
  const now = new Date();
  try {
    // 1. Accept and validate user id
    const { user_id, emergency_id } =
      deleteEmergencySchema.parse(emergencyInputData);
    const userValidation = await validateUser(user_id, now);
    if (!userValidation.success) {
      emergencyLog.info("User validation failed", {
        userId: user_id,
        emergencyId: emergency_id,
      });
      return userValidation;
    }

    // 2. Accept and validate emergency id;
    const { data: emergencyData, error: emergencyError } = await supabaseAdmin
      .from("emergencies")
      .select("id")
      .eq("id", emergency_id)
      .eq("user_id", user_id)
      .maybeSingle();

    if (emergencyError) {
      emergencyLog.error("Error while confirming emergency", {
        userId: user_id,
        emergencyId: emergency_id,
        error: emergencyError,
      });
      return {
        success: false,
        message: "Error while confirming emergency",
        data: null,
        error: {
          code: "EMERGENCY_CONFIRMATION_ERROR",
          details: isDev
            ? (emergencyError?.message ?? "Error while confirming emergency")
            : "Error while confirming emergency",
        },
        metadata: {
          timestamp: now.toISOString(),
          emergency_id,
          user_id,
        },
      };
    }

    if (!emergencyData) {
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
          emergency_id,
          user_id,
        },
      };
    }

    // 3. Delete emergency
    const { error } = await supabaseAdmin
      .from("emergencies")
      .delete()
      .eq("id", emergency_id)
      .eq("user_id", user_id);
    if (error) {
      emergencyLog.error("Error deleting emergency", {
        userId: user_id,
        emergencyId: emergency_id,
        error,
      });
      return {
        success: false,
        message: "Error deleting emergency",
        data: null,
        error: {
          code: "EMERGENCY_DELETION_ERROR",
          details: isDev
            ? (error.message ?? "Error deleting emergency")
            : "Error deleting emergency",
        },
        metadata: {
          timestamp: now.toISOString(),
          emergency_id,
          user_id,
        },
      };
    }

    return {
      success: true,
      message: "Emergency deleted successfully",
      data: null,
      error: null,
      metadata: {
        timestamp: now.toISOString(),
        user_id,
        emergency_id,
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
        details: "Unexpected error while deleting emergency",
      },
      metadata: {
        timestamp: now.toISOString(),
      },
    };
  }
};

export default deleteEmergencyService;
