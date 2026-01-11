// Delete journey share
/*
#Plan:
1. Accept and validate the user id
2. Accept and validate the journey share id belongs to user
3. Delete journey share
4. Send response to the user
*/

import { ZodError } from "zod";
import { supabaseAdmin } from "../../config/supabase.ts";
import {
  deleteJourneySharesInput,
  deleteJourneySharesInputSchema,
} from "../../types/journeyShares.types.ts";
import validateUser from "../../utils/validateUser.util.ts";
import { isDev } from "../../utils/devEnv.util.ts";

const deleteJourneyShareService = async (
  journeyShareInputData: deleteJourneySharesInput,
) => {
  const now = new Date();
  try {
    // 1. Accept and validate user id
    const { user_id, journey_share_id } = deleteJourneySharesInputSchema.parse(
      journeyShareInputData,
    );
    const userValidation = await validateUser(user_id, now);
    if (!userValidation.success) {
      return userValidation;
    }

    // 2. Accept and validate the journey share id belongs to user
    const { data: journeyShareData, error: journeyShareError } =
      await supabaseAdmin
        .from("journey_shares")
        .select("id")
        .eq("id", journey_share_id)
        .eq("user_id", user_id)
        .maybeSingle();

    if (journeyShareError) {
      return {
        success: false,
        message: "Error while confirming journey share",
        data: null,
        error: {
          code: "JOURNEY_SHARE_CONFIRMATION_ERROR",
          details: "Error while confirming journey share",
        },
        metadata: {
          timestamp: now.toISOString(),
          user_id,
          journey_share_id,
        },
      };
    }

    if (!journeyShareData) {
      return {
        success: false,
        message: "Journey share not found",
        data: null,
        error: {
          code: "NOT_FOUND",
          details: "Journey share not found",
        },
        metadata: {
          timestamp: now.toISOString(),
          user_id,
          journey_share_id,
        },
      };
    }

    // 3. Delete journey share
    const { error } = await supabaseAdmin
      .from("journey_shares")
      .delete()
      .eq("id", journey_share_id)
      .eq("user_id", user_id);
    if (error) {
      return {
        success: false,
        message: "Error deleting journey share",
        data: null,
        error: {
          code: "JOURNEY_SHARE_DELETION_ERROR",
          details: isDev
            ? (error?.message ?? "Error deleting journey share")
            : "Error deleting journey share",
        },
        metadata: {
          timestamp: now.toISOString(),
          user_id,
          journey_share_id,
        },
      };
    }

    // 4. Send response to the user
    return {
      success: true,
      message: "Journey share deleted successfully",
      data: null,
      error: null,
      metadata: {
        timestamp: now.toISOString(),
        user_id,
        journey_share_id,
      },
    };
  } catch (error) {
    console.error("deleteJourneyShareService error:", error);

    if (error instanceof ZodError) {
      return {
        success: false,
        message: "Journey share data validation error",
        data: null,
        error: {
          code: "VALIDATION_ERROR",
          details: isDev
            ? (error?.message ?? "Journey share data validation error")
            : "Journey share data validation error",
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
        details: "Unexpected error while deleting journey share",
      },
      metadata: {
        timestamp: now.toISOString(),
      },
    };
  }
};

export default deleteJourneyShareService;
