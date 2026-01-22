import { supabaseAdmin } from "../config/supabase";

const validateUser = async (
  userId: string,
  at: Date,
  metadata?: Record<string, unknown>,
) => {
  try {
    if (!userId?.trim()) {
      return {
        success: false,
        message: "User Id required",
        data: null,
        error: {
          code: "USER_ID_REQUIRED",
          details: "User Id is required",
        },
        metadata: {
          timestamp: at.toISOString(),
          ...metadata,
        },
      };
    }

    const { data: userData, error: userError } = await supabaseAdmin
      .from("users")
      .select("id")
      .eq("id", userId)
      .maybeSingle();

    if (userError) {
      return {
        success: false,
        message: "Error while confirming user",
        data: null,
        error: {
          code: "USER_CONFIRMATION_ERROR",
          details: "Error while confirming user",
        },
        metadata: {
          timestamp: at.toISOString(),
          ...metadata,
        },
      };
    }

    if (!userData) {
      return {
        success: false,
        message: "User not found",
        data: null,
        error: {
          code: "USER_NOT_FOUND",
          details: "User not found",
        },
        metadata: {
          timestamp: at.toISOString(),
          ...metadata,
        },
      };
    }

    return {
      success: true,
      message: "User validated",
      data: userData,
      error: null,
      metadata: {
        timestamp: at.toISOString(),
        ...metadata,
      },
    };
  } catch (error) {
    console.error("User validation error", error);

    return {
      success: false,
      message: "Internal server error",
      data: null,
      error: {
        code: "INTERNAL_ERROR",
        details: "Unexpected error during user validation",
      },
      metadata: {
        timestamp: at.toISOString(),
        ...metadata,
      },
    };
  }
};

export default validateUser;
