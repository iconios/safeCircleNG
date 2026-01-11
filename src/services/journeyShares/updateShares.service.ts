// Update journey shares service
/*
#Plan:
1. Accept and validate the user id
2. Accept and validate the journey id
3. Accept and validate the circle member id
4. Accept and validate the journey shares update data
5. Update journey shares
6. Send response to the user
*/

import { ZodError } from "zod";
import {
  journeySharesInputDTO,
  journeySharesInputSchema,
  journeySharesUpdate,
  journeySharesUpdateSchema,
} from "../../types/journeyShares.types.ts";
import validateCircle from "../../utils/validateCircle.util.ts";
import validateJourney from "../../utils/validateJourney.util.ts";
import validateUser from "../../utils/validateUser.util.ts";
import { supabaseAdmin } from "../../config/supabase.ts";
import { isDev } from "../../utils/devEnv.util.ts";

const updateJourneySharesService = async (
  journeySharesInput: journeySharesInputDTO,
  updateJourneySharesData: journeySharesUpdate,
) => {
  const now = new Date();
  try {
    // 1. Accept and validate user id
    const { user_id, journey_id, circle_member_id } =
      journeySharesInputSchema.parse(journeySharesInput);
    const userValidation = await validateUser(user_id, now);
    if (!userValidation.success) {
      return userValidation;
    }

    // 2. Accept and validate the journey id
    const journeyValidation = await validateJourney(user_id, journey_id, now);
    if (!journeyValidation.success) {
      return journeyValidation;
    }

    // 3. Accept and validate the circle member id
    const circleValidation = await validateCircle(
      circle_member_id,
      user_id,
      now,
    );
    if (!circleValidation.success) {
      return circleValidation;
    }

    // 4. Accept and validate the journey shares update data
    const validatedInput = journeySharesUpdateSchema.parse(
      updateJourneySharesData,
    );

    // 5. Update journey shares
    const { data, error } = await supabaseAdmin
      .from("journey_shares")
      .update(validatedInput)
      .eq("journey_id", journey_id)
      .eq("user_id", user_id)
      .eq("circle_member_id", circle_member_id)
      .select()
      .maybeSingle();
    if (error) {
      return {
        success: false,
        message: "Error updating journey share",
        data: {},
        error: {
          code: "JOURNEY_SHARE_UPDATE_ERROR",
          details: isDev
            ? (error?.message ?? "Error updating journey share")
            : "Error updating journey share",
        },
        metadata: {
          timestamp: now.toISOString(),
          user_id,
          journey_id,
          circle_member_id,
        },
      };
    }

    if (!data) {
      return {
        success: false,
        message: "Journey share not found",
        data: {},
        error: {
          code: "NOT_FOUND",
          details: "Journey share not found",
        },
        metadata: {
          timestamp: now.toISOString(),
          user_id,
          journey_id,
          circle_member_id,
        },
      };
    }

    // 6. Send response to the user
    return {
      success: true,
      message: "Journey share updated successfully",
      data,
      error: null,
      metadata: {
        timestamp: now.toISOString(),
        user_id,
        journey_id,
        circle_member_id,
      },
    };
  } catch (error) {
    console.error("updateJourneySharesService error:", error);

    if (error instanceof ZodError) {
      return {
        success: false,
        message: "Journey share data validation error",
        data: {},
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
      data: {},
      error: {
        code: "INTERNAL_ERROR",
        details: "Unexpected error while updating journey share",
      },
      metadata: {
        timestamp: now.toISOString(),
      },
    };
  }
};

export default updateJourneySharesService;
