// Create circle contacts list
/*
#Plan:
1. Accept and validate the user Id
2. Create circle record with owner ID
3. For each member:
   - Create circle membership record
   - Status: 'pending' for non-owner
   - Generate invitation token
   - Queue invitation notification
4. Return circle details with pending members
5. Track circle creation in analytics
*/

import { randomUUID } from "crypto";
import logger from "../../config/logger";
import { CreateCircleListDTO } from "../../types/safetyCircle.types";
import validateUser from "../../utils/validateUser.util";
import { supabaseAdmin } from "../../config/supabase";
import {
  errorResponseUtil,
  successResponseUtil,
} from "../../utils/responses.util";
import { ZodError } from "zod";

const safetyCircleList = logger.child({
  service: "createCircleMemberService",
  requestId: randomUUID(),
});

const createCircleMembersListService = async (
  userId: string,
  memberList: CreateCircleListDTO,
) => {
  const now = new Date(Date.now());
  try {
    // 1. Accept and validate the user Id
    const userValidation = await validateUser(userId, now);
    if (!userValidation.success) {
      safetyCircleList.info("User validation failed", {
        userId,
      });
      return userValidation;
    }

    // 2. Create circle record with owner ID
    // 3. For each member:
    //    - Create circle membership record
    //    - Status: 'pending' for non-owner
    //    - Generate invitation token
    //    - Queue invitation notification
    const circleListLength = memberList.length;
    let newContacts = [];
    for (let index = 0; index < circleListLength - 1; ++index) {
      newContacts[index] = {
        ...memberList[index],
        verification_token: randomUUID(),
        is_verified: false,
        user_id: userId,
      };
    }
    const { data, error: creationError } = await supabaseAdmin
      .from("safety_circle")
      .insert(newContacts)
      .select();
    if (creationError) {
      safetyCircleList.error("Error creating circle members", {
        userId,
        reason: "CIRCLE_MEMBER_CREATION_ERROR",
        error: creationError,
      });
      return errorResponseUtil(
        creationError.message,
        {
          code: creationError.code,
          details: creationError.details,
        },
        {
          user_id: userId,
        },
      );
    }

    // 4. Return circle details with pending members
    return successResponseUtil("New contacts created successfully", data, {
      user_id: userId,
      timestamp: now.toString(),
    });
  } catch (error) {
    safetyCircleList.error("createCircleMembersListService error:", error);

    if (error instanceof ZodError) {
      safetyCircleList.error("Error creating circle members", {
        userId,
        reason: "CIRCLE_MEMBER_CREATION_ERROR",
        error,
      });
      return errorResponseUtil(
        "Error validating circle data",
        {
          code: "VALIDATION_ERROR",
          details: "Error validating circle data",
        },
        {
          user_id: userId,
        },
      );
    }

    safetyCircleList.error("Internal server error", {
      userId,
      reason: "INTERNAL_ERROR",
      error,
    });
    return errorResponseUtil(
      "Internal server error",
      {
        code: "INTERNAL_ERROR",
        details: "Unexpected error while creating cirle members",
      },
      {
        user_id: userId,
      },
    );
  }
};

export default createCircleMembersListService;
