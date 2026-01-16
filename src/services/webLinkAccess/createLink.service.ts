// Create web link access service
/*
#Plan:
1. Accept and validate the user id
2. Accept, validate, ensure journey id belongs to user
3. Accept, validate, ensure emergency id belongs to user
4. Accept and validate web link access data
5. Create web link access data
6. Send response to user
*/

import { ZodError } from "zod";
import {
  webLinkAccessInputDTO,
  webLinkAccessInputSchema,
  webLinkAccessInsert,
  webLinkAccessInsertSchema,
} from "../../types/webLink.types.ts";
import validateUser from "../../utils/validateUser.util.ts";
import { supabaseAdmin } from "../../config/supabase.ts";
import { isDev } from "../../utils/devEnv.util.ts";

const createWebLinkAccessService = async (
  webLinkAccessInput: webLinkAccessInputDTO,
  createWebLinkAccess: webLinkAccessInsert,
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
          journey_id,
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
          code: "NOT_FOUND",
          details: "Journey not found",
        },
        metadata: {
          timestamp: now.toISOString(),
          user_id,
          journey_id,
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
          journey_id,
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
          code: "NOT_FOUND",
          details: "Emergency not found",
        },
        metadata: {
          timestamp: now.toISOString(),
          user_id,
          journey_id,
          emergency_id,
        },
      };
    }

    if (emergency.resolved_at) {
      return {
        success: false,
        message: "Emergency already resolved",
        data: {},
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

    // 4. Accept and validate, web link access data
    const validatedInput = webLinkAccessInsertSchema.parse(createWebLinkAccess);

    // 5. Create web link access data
    const web_link_token = crypto.randomUUID();
    const { data, error } = await supabaseAdmin
      .from("web_link_access")
      .insert({
        journey_id,
        emergency_id,
        web_link_token,
        ...validatedInput,
      })
      .select()
      .single();
    if (error) {
      return {
        success: false,
        message: "Error creating web link access",
        data: {},
        error: {
          code: "WEB_LINK_ACCESS_CREATION_ERROR",
          details: isDev
            ? (error.message ?? "Error creating web link access")
            : "Error creating web link access",
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
      message: "Web link access created successfully",
      data,
      error: null,
      metadata: {
        timestamp: now.toISOString(),
        user_id,
        journey_id,
        emergency_id,
      },
    };
  } catch (error) {
    console.error("webLinkAccessService error:", error);

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
        details: "Unexpected error while creating web link access",
      },
      metadata: {
        timestamp: now.toISOString(),
      },
    };
  }
};

export default createWebLinkAccessService;
