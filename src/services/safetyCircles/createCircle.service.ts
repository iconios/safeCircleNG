// Create a Circle Member Service
/*
#Plan:
1. Accept and validate the user Id
2. Accept and validate the: 
    a. contact name format 
    b. contact phone fomat 
    c. and the relationship
3. Create the circle member
4. Send response to user  
*/

import { ZodError } from "zod";
import { supabaseAdmin } from "../../config/supabase";
import {
  CreateCircleDataDTO,
  CreateCircleDataSchema,
  SafetyCircleInsert,
} from "../../types/safetyCircle.types";
import validateUser from "../../utils/validateUser.util";
import { isDev } from "../../utils/devEnv.util";

const createCircleMemberService = async (
  userId: string,
  createCircleData: CreateCircleDataDTO,
) => {
  const now = new Date(Date.now());
  try {
    // 1. Accept and validate the user Id
    const userValidation = await validateUser(userId, now);
    if (!userValidation.success) {
      return userValidation;
    }

    // 2. Accept and validate the:
    //      a. contact name format
    //      b. contact phone fomat
    //      c. and the relationship
    const validatedInput = CreateCircleDataSchema.parse(createCircleData);

    // 3. Create the circle member
    const { data, error: circleError } = await supabaseAdmin
      .from("safety_circles")
      .insert({
        user_id: userId,
        ...validatedInput,
      })
      .select()
      .single();

    if (circleError) {
      return {
        success: false,
        message: "Error creating circle member",
        data: null,
        error: {
          code: "CIRCLE_MEMBER_CREATION_ERROR",
          details: isDev ? circleError.message : "Error creating circle member",
        },
        metadata: {
          timestamp: now.toISOString(),
          user_id: userId,
        },
      };
    }

    // 4. Send response to user
    const circleData: SafetyCircleInsert = data;
    return {
      success: true,
      message: "Circle member created successfully",
      data: {
        id: circleData.id,
        contact_name: circleData.contact_name,
        contact_phone: circleData.contact_phone,
        relationship: circleData.relationship,
      },
      error: null,
      metadata: {
        timestamp: now.toISOString(),
        user_id: userId,
      },
    };
  } catch (error) {
    console.error("createCircleMemberService error:", error);

    if (error instanceof ZodError) {
      return {
        success: false,
        message: "Error validating circle data",
        data: null,
        error: {
          code: "VALIDATION_ERROR",
          details: "Error validating circle data",
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
        details: "Unexpected error while creating cirle member",
      },
      metadata: {
        timestamp: now.toISOString(),
        user_id: userId,
      },
    };
  }
};

export default createCircleMemberService;
