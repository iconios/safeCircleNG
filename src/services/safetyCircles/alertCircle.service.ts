// Alert Circle Members Service
/*
#Plan:
1. Accept and validate the input
2. Fetch circle members
3. Create web access tokens for the number of members
4. Send SMS with web link access to each member
5. Update the total_alerts_received for each successfully sent sms to circle member
6. Log the SMS sent
7. Send response to user  
*/

import { ZodError } from "zod";
import { supabaseAdmin } from "../../config/supabase";
import {
  alertCircleInput,
  alertCircleInputSchema,
  alertMessageType,
  alertMessageTypeSchema,
  alertSMSResponse,
} from "../../types/safetyCircle.types";
import { webLinkToken } from "../../types/webLink.types";
import { isDev } from "../../utils/devEnv.util";
import createWebLinkAccessService from "../webLinkAccess/createLink.service";
import SendSMSUtil from "../../utils/sendSMS.util";
import {
  channelTypeEnum,
  smsResponseData,
} from "../../types/messageLogs.types";
import messageConstructor from "../../utils/messageConstructor";
import createMessageLogService from "../messageLogs/createLog.service";
import logger from "../../config/logger";
import { randomUUID } from "node:crypto";
import { errorResponseUtil } from "../../utils/responses.util";

const safetyCircle = logger.child({
  service: "alertCircleMembersService",
  requestId: randomUUID(),
});

const alertCircleMembersService = async (
  alertCircleInput: alertCircleInput,
  messageType: alertMessageType,
) => {
  const now = new Date();
  const SAFECIRCLE_BASE_URL = process.env.SAFECIRCLE_BASE_URL;
  if (!SAFECIRCLE_BASE_URL) {
    throw new Error("Safecircle base url required");
  }
  try {
    // 1. Accept and validate the input
    const { user_id, journey_id, emergency_id } =
      alertCircleInputSchema.parse(alertCircleInput);
    const { data: userData, error: userError } = await supabaseAdmin
      .from("users")
      .select("id, first_name")
      .eq("id", user_id)
      .maybeSingle();

    if (userError) {
      safetyCircle.info("Error while confirming user", {
        user_id,
        journey_id,
        emergency_id,
        reason: "USER_CONFIRMATION_ERROR",
      });
      return errorResponseUtil(
        "Error while confirming user",
        {
          code: "USER_CONFIRMATION_ERROR",
          details: "Error while confirming user",
        },
        {
          user_id,
          journey_id,
          emergency_id,
        },
      );
    }

    if (!userData) {
      safetyCircle.info("User not found", {
        user_id,
        journey_id,
        emergency_id,
        reason: "USER_NOT_FOUND",
      });
      return errorResponseUtil(
        "User not found",
        {
          code: "USER_NOT_FOUND",
          details: "User not found",
        },
        {
          user_id,
          journey_id,
          emergency_id,
        },
      );
    }

    const { data: journeyData, error: journeyError } = await supabaseAdmin
      .from("journeys")
      .select("journey_id, start_location_name, destination_name")
      .eq("journey_id", journey_id)
      .eq("user_id", user_id)
      .maybeSingle();

    if (journeyError) {
      safetyCircle.info("Error while confirming journey", {
        user_id,
        journey_id,
        emergency_id,
        reason: "JOURNEY_CONFIRMATION_ERROR",
      });
      return errorResponseUtil(
        "Error while confirming journey",
        {
          code: "JOURNEY_CONFIRMATION_ERROR",
          details: "Error while confirming journey",
        },
        {
          user_id,
          journey_id,
          emergency_id,
        },
      );
    }

    if (!journeyData) {
      safetyCircle.info("Journeys not found", {
        user_id,
        journey_id,
        emergency_id,
        reason: "JOURNEY_NOT_FOUND",
      });
      return errorResponseUtil(
        "Journeys not found",
        {
          code: "JOURNEY_NOT_FOUND",
          details: "Journeys not found",
        },
        {
          user_id,
          journey_id,
          emergency_id,
        },
      );
    }

    if (emergency_id) {
      const { error } = await supabaseAdmin
        .from("emergencies")
        .select("id")
        .eq("journey_id", journey_id)
        .eq("user_id", user_id)
        .eq("id", emergency_id)
        .single();
      if (error) {
        safetyCircle.error("No emergency found for the journey", {
          user_id,
          journey_id,
          emergency_id,
          reason: "EMERGENCY_NOT_FOUND",
          error,
        });
        return errorResponseUtil(
          "No emergency found for the journey",
          {
            code: "EMERGENCY_NOT_FOUND",
            details: isDev
              ? (error.message ?? "No emergency found for the journey")
              : "No emergency found for the journey",
          },
          {
            user_id,
            journey_id,
            emergency_id,
          },
        );
      }
    }

    const validatedMessageType = alertMessageTypeSchema.parse(messageType);

    // 2. Fetch circle members
    const { data: circleData, error } = await supabaseAdmin
      .from("safety_circles")
      .select("id, contact_phone, contact_name")
      .eq("user_id", user_id)
      .eq("is_verified", true)
      .eq("is_active", true)
      .eq("receive_sms", true);
    if (error) {
      safetyCircle.error("Error fetching circle members", {
        user_id,
        journey_id,
        emergency_id,
        reason: "CIRCLE_MEMBERS_FETCH_ERROR",
        error,
      });
      return errorResponseUtil(
        "Error fetching circle members",
        {
          code: "CIRCLE_MEMBERS_FETCH_ERROR",
          details: error
            ? (error.message ?? "Error fetching circle members")
            : "Error fetching circle members",
        },
        {
          user_id,
          journey_id,
        },
      );
    }

    if (!circleData || circleData.length === 0) {
      safetyCircle.error("No verified & active circle members found", {
        user_id,
        journey_id,
        emergency_id,
        reason: "CIRCLE_MEMBERS_NOT_FOUND",
        error,
      });
      return errorResponseUtil(
        "No verified & active circle members found",
        {
          code: "CIRCLE_MEMBERS_NOT_FOUND",
          details: "No verified & active circle members found",
        },
        {
          user_id,
          journey_id,
        },
      );
    }

    // 3. Create web access tokens for the number of members
    const circleMembersCount = circleData.length;
    const webLinkData = {
      user_id,
      journey_id,
      emergency_id: emergency_id ?? null,
      count: circleMembersCount,
    };
    const webLinkResult = await createWebLinkAccessService(webLinkData, {
      web_link_type: "journey",
    });
    let webLinks: webLinkToken[] = [];
    if (webLinkResult.success && webLinkResult.data) {
      webLinks = webLinkResult.data;
    }

    if (
      !webLinkResult.success ||
      !webLinks ||
      webLinks.length !== circleData.length
    ) {
      safetyCircle.info("Failed to generate access links for circle members", {
        user_id,
        journey_id,
        emergency_id,
        reason: "WEB_LINK_GENERATION_FAILED",
      });
      return errorResponseUtil(
        "Failed to generate access links for circle members",
        {
          code: "WEB_LINK_GENERATION_FAILED",
          details: "Mismatch between circle members and generated links",
        },
        {
          user_id,
          journey_id,
          emergency_id,
        },
      );
    }

    // 4. Send SMS with web link access to each member
    let smsLogs: smsResponseData[] = [];
    let smsError: alertSMSResponse[] = [];
    let smsSuccess: alertSMSResponse[] = [];
    for (let index = 0; index < circleData.length; index++) {
      const member = circleData[index];
      const token = webLinks[index].web_link_token;
      const web_link = `${SAFECIRCLE_BASE_URL}/webaccess/${token}`;
      const message = messageConstructor(
        messageType,
        member.contact_name,
        journeyData.destination_name,
        web_link,
        userData.first_name,
      );
      const response = await SendSMSUtil(
        member.contact_phone,
        message,
        "generic",
      );
      if (response.success) {
        smsSuccess.push({
          contactName: member.contact_name,
          contactPhone: member.contact_phone,
          circleMemberId: member.id,
        });
      } else {
        smsError.push({
          contactName: member.contact_name,
          contactPhone: member.contact_phone,
          circleMemberId: member.id,
        });
      }

      smsLogs.push({
        to_number: member.contact_phone,
        to_name: member.contact_name,
        delivery_status: response.success ? "sent" : "failed",
        web_link,
        web_link_token: token,
        message_text: message,
      });
    }

    // 5. Update the total_alerts_received for each successfully sent sms to circle member
    const successIds = smsSuccess.map((s) => s.circleMemberId);
    if (smsSuccess.length > 0) {
      const { error } = await supabaseAdmin.rpc("increment_alerts_received", {
        circle_ids: successIds,
      });

      if (error && isDev) {
        console.error("increment_alerts_received RPC failed", error.message);
      }
    }

    // 6. Log the SMS sent
    const smsLogPayload = smsLogs.map((log) => ({
      message_text: log.message_text,
      web_link_token: log.web_link_token,
      to_number: log.to_number,
      to_name: log.to_name,
      delivery_status: log.delivery_status,
      message_type: validatedMessageType,
      journey_id,
      emergency_id,
      channel_type: channelTypeEnum.enum.sms,
      web_link: log.web_link,
    }));
    try {
      if (smsLogPayload.length > 0) {
        await createMessageLogService(userData.id, smsLogPayload);
      }
    } catch (error) {
      if (isDev) {
        console.error("createMessageLogService error:", error);
      }
    }

    const returnMessage = () => {
      if (smsError.length === 0) {
        return "SMS sent successfully";
      } else if (smsError.length === circleData.length) {
        return "All SMS notifications failed";
      } else return "Some SMS notifications failed";
    };
    return {
      success: smsError.length === 0,
      message: returnMessage(),
      data: smsLogs.map(({ to_name, to_number, delivery_status }) => ({
        to_name,
        to_number,
        delivery_status,
      })),
      error: null,
      metadata: {
        timestamp: now.toISOString(),
        user_id,
        journey_id,
        emergency_id,
        sentCount: circleMembersCount - smsError.length,
        totalCount: circleMembersCount,
        failed: smsError,
      },
    };
  } catch (error) {
    if (isDev) {
      safetyCircle.error("alertCircleMembersService error:", error);
    }

    if (error instanceof ZodError) {
      safetyCircle.error("Circle alert data validation error", {
        reason: "VALIDATION_ERROR",
        error,
      });
      return errorResponseUtil(
        "Circle alert data validation error",
        {
          code: "VALIDATION_ERROR",
          details: isDev
            ? (error?.message ?? "Circle alert data validation error")
            : "Circle alert data validation error",
        },
        {},
      );
    }

    safetyCircle.error("Internal server error", {
      reason: "INTERNAL_ERROR",
      error,
    });
    return errorResponseUtil(
      "Internal server error",
      {
        code: "INTERNAL_ERROR",
        details: "Unexpected error while creating alert",
      },
      {},
    );
  }
};

export default alertCircleMembersService;
