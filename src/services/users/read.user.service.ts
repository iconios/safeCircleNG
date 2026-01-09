// Read User Service
/*
#Plan:
1. Get and validate the user id
2. Fetch the user details from the database and select non-sensitive data
3. Send result to caller
*/

import { supabaseAdmin } from "../../config/supabase.ts";
import { ReadUserDTO } from "../../types/user.types.ts";

const ReadUserService = async (userId: string) => {
  try {
    // 1. Get and validate the user id
    if (!userId?.trim()) {
      return {
        success: false,
        message: "User Id required",
        data: {},
        error: {
          code: "MISSING_PARAMETER",
          details: "User Id is required",
        },
        metadata: {
          timestamp: new Date().toISOString(),
          userId: "",
        },
      };
    }

    // 2. Fetch the user details from the database and select non-sensitive data
    const { data, error } = await supabaseAdmin
      .from("users")
      .select(
        "id, email, first_name, phone_number, phone_verified, user_type, subscription_tier, last_login_at, status",
      )
      .eq("id", userId)
      .single();
    if (error) {
      const errorMessage = error.message || "Error fetching user";
      return {
        success: false,
        message: errorMessage,
        data: {},
        error: {
          code: error.code || "DATABASE_ERROR",
          details: error.details || "Error fetching user from database",
        },
        metadata: {
          timestamp: new Date().toISOString(),
          userId,
        },
      };
    }

    // 3. Send result to caller
    return {
      success: true,
      message: "User fetched successfully",
      data: data as ReadUserDTO,
      error: null,
      metadata: {
        timestamp: new Date().toISOString(),
        userId,
      },
    };
  } catch (error: any) {
    return {
      success: false,
      message: "Unexpected server error",
      data: {},
      error: {
        code: "INTERNAL_SERVER_ERROR",
        details: error?.message || "Unknown error",
      },
      metadata: {
        timestamp: new Date().toISOString(),
        userId,
      },
    };
  }
};

export default ReadUserService;
