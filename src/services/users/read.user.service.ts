// Read User Service
/*
#Plan:
1. Get and validate the user id
2. Fetch the user details from the database and select non-sensitive data
3. Send result to caller
*/

import { supabaseAdmin } from "../../config/supabase";
import { ReadUserDTO } from "../../types/user.types";
import {
  errorResponseUtil,
  successResponseUtil,
} from "../../utils/responses.util";

const ReadUserService = async (userId: string) => {
  try {
    // 1. Get and validate the user id
    if (!userId?.trim()) {
      return errorResponseUtil(
        "User Id required",
        {
          code: "MISSING_PARAMETER",
          details: "User Id is required",
        },
        { userId: "" },
      );
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
      return errorResponseUtil(
        errorMessage,
        {
          code: error.code || "DATABASE_ERROR",
          details: error.details || "Error fetching user from database",
        },
        { userId },
      );
    }

    // 3. Send result to caller
    return successResponseUtil(
      "User fetched successfully",
      data as ReadUserDTO,
      { userId },
    );
  } catch (error: any) {
    return errorResponseUtil(
      "Unexpected server error",
      {
        code: "INTERNAL_SERVER_ERROR",
        details: error?.message || "Unknown error",
      },
      { userId },
    );
  }
};

export default ReadUserService;
