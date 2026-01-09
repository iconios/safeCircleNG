import { supabaseAdmin } from "../config/supabase.ts";

const validateJourney = async (userId: string, journeyId: string, at: Date) => {
  try {
    if (!journeyId) {
      return {
        success: false,
        message: "Journey Id required",
        data: {},
        error: {
          code: "JOURNEY_ID_REQUIRED",
          details: "Journey Id is required",
        },
        metadata: {
          timestamp: at.toISOString(),
        },
      };
    }

    const { data: journeyData, error: journeyError } = await supabaseAdmin
      .from("journeys")
      .select("journey_id")
      .eq("journey_id", journeyId)
      .eq("user_id", userId)
      .maybeSingle();

    if (journeyError) {
      return {
        success: false,
        message: "Error while confirming journey",
        data: {},
        error: {
          code: "JOURNEY_CONFIRMATION_ERROR",
          details: "Error while confirming journey",
        },
        metadata: {
          timestamp: at.toISOString(),
        },
      };
    }

    if (!journeyData) {
      return {
        success: false,
        message: "Journeys not found",
        data: {},
        error: {
          code: "NOT_FOUND",
          details: "Journeys not found",
        },
        metadata: {
          timestamp: at.toISOString(),
        },
      };
    }

    return {
      success: true,
      message: "Journey validated",
      data: journeyData,
      error: null,
      metadata: {
        timestamp: at.toISOString(),
      },
    };
  } catch (error) {
    console.error("Journey validation error", error);

    return {
      success: false,
      message: "Internal server error",
      data: {},
      error: {
        code: "INTERNAL_ERROR",
        details: "Unexpected error during journey validation",
      },
      metadata: {
        timestamp: at.toISOString(),
      },
    };
  }
};

export default validateJourney;
