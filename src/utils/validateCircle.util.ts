import { supabaseAdmin } from "../config/supabase.ts";

const validateCircle = async (circleId: string, userId: string, at: Date) => {
  try {
    if (!circleId) {
      return {
        success: false,
        message: "Circle member Id required",
        data: {},
        error: {
          code: "CIRCLE_ID_REQUIRED",
          details: "Circle member Id is required",
        },
        metadata: {
          timestamp: at.toISOString(),
        },
      };
    }

    const { data: circleData, error: circleError } = await supabaseAdmin
      .from("safety_circles")
      .select("id")
      .eq("id", circleId)
      .eq("user_id", userId)
      .maybeSingle();

    if (circleError) {
      return {
        success: false,
        message: "Error while confirming circle member",
        data: {},
        error: {
          code: "CIRCLE_CONFIRMATION_ERROR",
          details: "Error while confirming circle member",
        },
        metadata: {
          timestamp: at.toISOString(),
        },
      };
    }

    if (!circleData) {
      return {
        success: false,
        message: "Circle member not found",
        data: {},
        error: {
          code: "NOT_FOUND",
          details: "Circle member not found",
        },
        metadata: {
          timestamp: at.toISOString(),
        },
      };
    }

    return {
      success: true,
      message: "Circle member validated",
      data: circleData,
      error: null,
      metadata: {
        timestamp: at.toISOString(),
      },
    };
  } catch (error) {
    console.error("Circle member validation error", error);

    return {
      success: false,
      message: "Internal server error",
      data: {},
      error: {
        code: "INTERNAL_ERROR",
        details: "Unexpected error during circle member validation",
      },
      metadata: {
        timestamp: at.toISOString(),
      },
    };
  }
};

export default validateCircle;
