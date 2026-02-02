// Read journey by id service
/*
#Plan:
1. Accept and validate the user id and journey id
2. Fetch the journey id
3. Send response to user
*/

import { ZodError } from "zod";
import { supabaseAdmin } from "../../config/supabase";
import {
  JourneyRow,
  journeyInputDTO,
  journeyInputSchema,
} from "../../types/journey.types";
import validateUser from "../../utils/validateUser.util";
import logger from "../../config/logger";
import { randomUUID } from "node:crypto";

const journey = logger.child({
  service: "readJourneyByIdService",
  requestId: randomUUID(),
});

const readJourneyByIdService = async (readJourneyData: journeyInputDTO) => {
  const NODE_ENV = process.env.NODE_ENV ?? "production";
  const now = new Date();
  try {
    // 1. Accept and validate the user id and journey id
    const { user_id, journey_id } = journeyInputSchema.parse(readJourneyData);
    const userValidation = await validateUser(user_id, now);
    if (!userValidation.success) {
      journey.info("User validation failed", {
        userId: user_id,
      });
      return userValidation;
    }

    // 2. Fetch the journey id
    const { data, error } = await supabaseAdmin
      .from("journeys")
      .select("*")
      .eq("journey_id", journey_id)
      .eq("user_id", user_id)
      .maybeSingle();

    if (error) {
      journey.error("Error fetching journey", {
        userId: user_id,
        journeyId: journey_id,
        error,
      });
      return {
        success: false,
        message: "Error fetching journey",
        data: null,
        error: {
          code: "FETCH_ERROR",
          details:
            NODE_ENV === "development"
              ? error.message
              : "Error fetching journey",
        },
        metadata: {
          timestamp: now.toISOString(),
          user_id,
          journey_id,
        },
      };
    }

    if (!data) {
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
        },
      };
    }

    // 3. Send response to user
    const journeyData: JourneyRow = data;
    return {
      success: true,
      message: "Journey fetched successfully",
      data: journeyData,
      error: null,
      metadata: {
        timestamp: now.toISOString(),
        user_id,
        journey_id,
      },
    };
  } catch (error) {
    if (error instanceof ZodError) {
      journey.error("Error validating the input data", {
        error,
      });
      return {
        success: false,
        message: "Error validating the input data",
        data: {},
        error: {
          code: "VALIDATION_ERROR",
          details: "Error while validating the input data",
        },
        metadata: {
          timestamp: now.toISOString(),
        },
      };
    }

    journey.error("Internal server error", {
      error,
    });
    return {
      success: false,
      message: "Internal server error",
      data: {},
      error: {
        code: "INTERNAL_ERROR",
        details: "Unexpected error while fetching journey",
      },
      metadata: {
        timestamp: now.toISOString(),
      },
    };
  }
};

export default readJourneyByIdService;
