// Delete web link access service
/*
#Plan:
1. Accept and validate the user 
2. Accept, validate, ensure journey id belongs to user 
3. Accept, validate, ensure emergency id belongs to user 
4. Delete the web link access
5. Send response to the user
*/

import { ZodError } from "zod";
import {
  webLinkAccessInputDTO,
  webLinkAccessInputSchema,
} from "../../types/webLink.types.ts";
import { supabaseAdmin } from "../../config/supabase.ts";
import validateUser from "../../utils/validateUser.util.ts";
import { isDev } from "../../utils/devEnv.util.ts";

const deleteWebLinkAccessService = async (
  webLinkAccessInput: webLinkAccessInputDTO,
) => {
  const now = new Date();
  try {
    // 1. Accept and validate the user id
    const { user_id, journey_id, emergency_id } =
      webLinkAccessInputSchema.parse(webLinkAccessInput);
    const userValidation = await validateUser(user_id, now);
    if (!userValidation.success) {
      return userValidation;
    }

    // 2. Accept, validate, ensure journey id belongs to user
    const { data: journey, error: journeyError } = await supabaseAdmin
      .from("journeys")
      .select("journey_id")
      .eq("journey_id", journey_id)
      .eq("user_id", user_id)
      .maybeSingle();

    if (journeyError) {
      return {
        success: false,
        message: "Error validating journey",
        data: {},
        error: {
          code: "JOURNEY_VALIDATION_ERROR",
          details: isDev
            ? (journeyError.message ?? "Error validating journey")
            : "Error validating journey",
        },
        metadata: {
          timestamp: now.toISOString(),
          user_id,
          emergency_id,
        },
      };
    }

    if (!journey) {
      return {
        success: false,
        message: "Journey not found",
        data: {},
        error: {
          code: "JOURNEY_NOT_FOUND",
          details: "Journey not found",
        },
        metadata: {
          timestamp: now.toISOString(),
          user_id,
          emergency_id,
        },
      };
    }

    // 3. Accept, validate, ensure emergency id belongs to user
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
        data: {},
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
        data: {},
        error: {
          code: "EMERGENCY_NOT_FOUND",
          details: "Emergency not found",
        },
        metadata: {
          timestamp: now.toISOString(),
          user_id,
          emergency_id,
        },
      };
    }

    // 4. Delete the web link access
    const { error } = await supabaseAdmin
      .from("web_link_access")
      .delete()
      .eq("journey_id", journey_id)
      .eq("emergency_id", emergency_id);
    if (error) {
      return {
        success: false,
        message: "Error deleting web link access",
        data: {},
        error: {
          code: "EMERGENCY_VALIDATION_ERROR",
          details: isDev
            ? (error.message ?? "Error deleting web link access")
            : "Error deleting web link access",
        },
        metadata: {
          timestamp: now.toISOString(),
          user_id,
          emergency_id,
        },
      };
    }

    // 5. Send response to the user
    return {
      success: true,
      message: "Web link access deleted successfully",
      data: {},
      error: null,
      metadata: {
        timestamp: now.toISOString(),
        user_id,
        emergency_id,
      },
    };
  } catch (error) {
    console.error("deleteWebLinkAccessService error:", error);

    if (error instanceof ZodError) {
      return {
        success: false,
        message: "Web Link Access data validation error",
        data: {},
        error: {
          code: "VALIDATION_ERROR",
          details: error?.message ?? "Web Link Access data validation error",
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
        details: "Unexpected error while deleting web link access",
      },
      metadata: {
        timestamp: now.toISOString(),
      },
    };
  }
};

export default deleteWebLinkAccessService;
