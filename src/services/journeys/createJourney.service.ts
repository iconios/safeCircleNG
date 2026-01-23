// Create Journey Service
/*
#Plan:
1. Accept and validate userId
2. Accept and validate journey data
3. Create journey
4. Notify circle members is share_with_circle = true
    - Fetch the circle members
    - Send SMS with unique link to each circle member
5. Send response to user
*/

import { uuidv4, ZodError } from "zod";
import {
  JourneyInsert,
  JourneyInsertSchema,
  JourneyRow,
} from "../../types/journey.types";
import validateUser from "../../utils/validateUser.util";
import { supabaseAdmin } from "../../config/supabase";

const createJourneyService = async (
  userId: string,
  journeyData: JourneyInsert,
) => {
  const now = new Date();
  try {
    // 1. Accept and validate the user Id
    const userValidation = await validateUser(userId, now);
    if (!userValidation.success) {
      return userValidation;
    }

    // 2. Accept and validate journey data
    const validatedInput = JourneyInsertSchema.parse(journeyData);

    // 3. Create journey
    const journey_token = uuidv4();
    const { data, error } = await supabaseAdmin
      .from("journeys")
      .insert({
        user_id: userId,
        journey_token,
        ...validatedInput,
      })
      .select()
      .single();

    if (error || !data) {
      return {
        success: false,
        message: "Error creating journey",
        data: null,
        error: {
          code: "JOURNEY_CREATION_ERROR",
          details: error?.message ?? "Journey creation failed",
        },
        metadata: {
          timestamp: now.toISOString(),
          user_id: userId,
        },
      };
    }

    // 4. Send response to user
    const createdJourney: JourneyRow = data;
    return {
      success: true,
      message: "Journey created successfully",
      data: createdJourney,
      error: null,
      metadata: {
        timestamp: now.toISOString(),
        user_id: userId,
      },
    };
  } catch (error) {
    console.error("createJourneyService error:", error);
    if (error instanceof ZodError) {
      return {
        success: false,
        message: "Journey data validation error",
        data: null,
        error: {
          code: "VALIDATION_ERROR",
          details: error?.message ?? "Journey data validation error",
        },
        metadata: {
          timestamp: now.toISOString(),
          user_id: userId,
        },
      };
    }

    return {
      success: false,
      message: "Internal server error",
      data: null,
      error: {
        code: "INTERNAL_ERROR",
        details: "Unexpected error while creating journey",
      },
      metadata: {
        timestamp: now.toISOString(),
        user_id: userId,
      },
    };
  }
};

export default createJourneyService;
