// Delete emergency service
/*
#Plan:
1. Accept and validate the user id
2. Accept and validate the emergency id
3. Delete emergency
4. Send response to user
*/

import { ZodError } from "zod";
import { supabaseAdmin } from "../../config/supabase.ts";
import {
  deleteEmergencyDTO,
  deleteEmergencySchema,
} from "../../types/emergency.types.ts";
import validateUser from "../../utils/validateUser.util.ts";

const deleteEmergencyService = async (
  emergencyInputData: deleteEmergencyDTO,
) => {
  const now = new Date();
  const NODE_ENV = process.env.NODE_ENV ?? "production";
  try {
    // 1. Accept and validate user id
    const { user_id, emergency_id } =
      deleteEmergencySchema.parse(emergencyInputData);
    const userValidation = await validateUser(user_id, now);
    if (!userValidation.success) {
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
      return {
        success: false,
        message: "Error while confirming emergency",
        data: {},
        error: {
          code: "EMERGENCY_CONFIRMATION_ERROR",
          details:
            NODE_ENV === "development"
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
        data: {},
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
      return {
        success: false,
        message: "Error deleting emergency",
        data: {},
        error: {
          code: "EMERGENCY_DELETION_ERROR",
          details:
            NODE_ENV === "development"
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
      data: {},
      error: null,
      metadata: {
        timestamp: now.toISOString(),
        user_id,
        emergency_id,
      },
    };
  } catch (error) {
    console.error("deleteEmergencyService error:", error);

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
        details: "Unexpected error while deleting emergency",
      },
      metadata: {
        timestamp: now.toISOString(),
      },
    };
  }
};

export default deleteEmergencyService;
