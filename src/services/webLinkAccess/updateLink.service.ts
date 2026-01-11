// Update web link access service
/*
#Plan:
1. Accept and validate the user id
2. Accept, validate, ensure journey id belongs to user
3. Accept, validate, ensure emergency id belongs to user
4. Accept and validate the web link access update data
5. Update the web link access data
6. Send response to user
*/

import { ZodError } from "zod";
import {
  webLinkAccessInputDTO,
  webLinkAccessInputSchema,
  webLinkAccessUpdate,
  webLinkAccessUpdateSchema,
} from "../../types/webLink.types.ts";
import { supabaseAdmin } from "../../config/supabase.ts";
import validateUser from "../../utils/validateUser.util.ts";
import { isDev } from "../../utils/devEnv.util.ts";

const updateWebLinkAccessService = async (
  webLinkAccessInput: webLinkAccessInputDTO,
  updateWebLinkAccessData: webLinkAccessUpdate,
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
          journey_id,
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
          journey_id,
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
          journey_id,
        },
      };
    }

    if (!emergency) {
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
          user_id,
          emergency_id,
          journey_id,
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
          journey_id,
          emergency_id,
        },
      };
    }

    // 4. Accept and validate the web link access update data
    const validatedInput = webLinkAccessUpdateSchema.parse(
      updateWebLinkAccessData,
    );

    // 5. Update the web link access data
    const { data, error: updateError } = await supabaseAdmin
      .from("web_link_access")
      .update(validatedInput)
      .eq("journey_id", journey_id)
      .eq("emergency_id", emergency_id)
      .select()
      .maybeSingle();
    if (updateError) {
      return {
        success: false,
        message: "Error updating web link access",
        data: {},
        error: {
          code: "WEB_LINK_ACCESS_UPDATE_ERROR",
          details: isDev
            ? (updateError.message ?? "Error updating web link access")
            : "Error updating web link access",
        },
        metadata: {
          timestamp: now.toISOString(),
          user_id,
          emergency_id,
          journey_id,
        },
      };
    }

    if (!data) {
      return {
        success: false,
        message: "Web link access not found",
        data: null,
        error: {
          code: "WEB_LINK_ACCESS_NOT_FOUND",
          details: "Web link access not found",
        },
        metadata: {
          timestamp: now.toISOString(),
          user_id,
          journey_id,
          emergency_id,
        },
      };
    }

    // 6. Send response to user
    return {
      success: true,
      message: "Web link access updated successfully",
      data,
      error: null,
      metadata: {
        timestamp: now.toISOString(),
        user_id,
        emergency_id,
        journey_id,
      },
    };
  } catch (error) {
    console.error("updateWebLinkAccessService error:", error);

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
        details: "Unexpected error while updating web link access",
      },
      metadata: {
        timestamp: now.toISOString(),
      },
    };
  }
};

export default updateWebLinkAccessService;
