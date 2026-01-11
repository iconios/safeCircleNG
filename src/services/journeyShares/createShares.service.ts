// Create journey shares service
/*
#Plan:
1. Accept and validate the user id
2. Accept and validate the journey id
3. Accept and validate the circle member id
4. Accept and validate the journey shares data
5. Ensure journey share doesn't exist already for circle member
5. Create journey shares
6. Send response to the user
*/

import { ZodError } from "zod";
import {
  journeySharesInputDTO,
  journeySharesInputSchema,
  journeySharesInsert,
  journeySharesInsertSchema,
} from "../../types/journeyShares.types.ts";
import validateUser from "../../utils/validateUser.util.ts";
import validateJourney from "../../utils/validateJourney.util.ts";
import validateCircle from "../../utils/validateCircle.util.ts";
import { supabaseAdmin } from "../../config/supabase.ts";
import { isDev } from "../../utils/devEnv.util.ts";

const createJourneySharesService = async (
  journeySharesInput: journeySharesInputDTO,
  createJourneySharesData: journeySharesInsert,
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

    // 4. Accept and validate the journey shares data
    const validatedInput = journeySharesInsertSchema.parse(
      createJourneySharesData,
    );

    // 5. Ensure journey share doesn't exist already for circle member
    const { data: existingShare } = await supabaseAdmin
      .from("journey_shares")
      .select("id")
      .eq("journey_id", journey_id)
      .eq("circle_member_id", circle_member_id)
      .maybeSingle();

    if (existingShare) {
      return {
        success: false,
        message: "Journey already shared with this member",
        data: null,
        error: {
          code: "DUPLICATE_SHARE",
          details: "Journey already shared with this circle member",
        },
        metadata: {
          timestamp: now.toISOString(),
          user_id,
          journey_id,
          circle_member_id,
        },
      };
    }

    // 6. Create journey shares
    const { data, error } = await supabaseAdmin
      .from("journey_shares")
      .insert({
        journey_id,
        circle_member_id,
        ...validatedInput,
      })
      .select()
      .single();

    if (error) {
      return {
        success: false,
        message: "Error creating journey shares",
        data: {},
        error: {
          code: "JOURNEY_SHARES_VALIDATION_ERROR",
          details: isDev
            ? (error?.message ?? "Error creating journey shares")
            : "Error creating journey shares",
        },
        metadata: {
          timestamp: now.toISOString(),
          user_id,
          journey_id,
          circle_member_id,
        },
      };
    }

    // 7. Send response to the user
    return {
      success: true,
      message: "Journey shares created successfully",
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
    console.error("createJourneySharesService error:", error);

    if (error instanceof ZodError) {
      return {
        success: false,
        message: "Journey shares data validation error",
        data: {},
        error: {
          code: "VALIDATION_ERROR",
          details: isDev
            ? (error?.message ?? "Journey shares data validation error")
            : "Journey shares data validation error",
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
        details: "Unexpected error while creating journey shares",
      },
      metadata: {
        timestamp: now.toISOString(),
      },
    };
  }
};

export default createJourneySharesService;
