// src/controllers/safety.circles.controllers.ts
/*
#Plan:
1. Accept and validate user input
2. Pass the data to the service layer for processing
3. Handle success and error responses
*/

import resServerError from "../utils/resServerError.util";
import { Response } from "express";
import { AuthRequest } from "../types/auth.types";
import {
  alertMessageType,
  CreateCircleDataDTO,
  SafetyCircleUpdate,
} from "../types/safetyCircle.types";
import createCircleMemberService from "../services/safetyCircles/createCircle.service";
import readCircleMemberService from "../services/safetyCircles/readCircle.service";
import updateCircleMemberService from "../services/safetyCircles/updateCircle.service";
import deleteCircleMemberService from "../services/safetyCircles/deleteCircle.service";
import alertCircleMembersService from "../services/safetyCircles/alertCircle.service";

// Create Safety Circle Controller
const createSafetyCircleController = async (
  req: AuthRequest,
  res: Response,
) => {
  try {
    // 1. Accept and validate user input
    const userId = req.userId as string;

    const circleData = req.body as CreateCircleDataDTO;
    if (!circleData) {
      return res.status(400).json({
        success: false,
        message: "Circle data is required",
        data: null,
        error: {
          code: "CIRCLE_DATA_REQUIRED",
          details: "Circle data is required",
        },
        metadata: {
          timestamp: new Date().toISOString(),
        },
      });
    }

    // 2. Pass the data to the service layer for processing
    const result = await createCircleMemberService(userId, circleData);

    // 3. Handle success and error responses
    if (!result.success) {
      switch (result.error?.code) {
        case "VALIDATION_ERROR":
          return res.status(422).json(result);
        case "CIRCLE_MEMBER_CREATION_ERROR":
        case "INTERNAL_ERROR":
          return res.status(500).json(result);
        default:
          return res.status(400).json(result);
      }
    }

    return res.status(201).json(result);
  } catch (error) {
    resServerError(res, error);
  }
};

// Read Safety Circle Controller
const readSafetyCircleController = async (req: AuthRequest, res: Response) => {
  try {
    // 1. Accept and validate user input
    const userId = req.userId as string;

    // 2. Pass the data to the service layer for processing
    const result = await readCircleMemberService(userId);

    // 3. Handle success and error responses
    if (!result.success) {
      switch (result.error?.code) {
        case "NOT_FOUND":
          return res.status(404).json(result);
        case "FETCH_ERROR":
        case "INTERNAL_ERROR":
          return res.status(500).json(result);
        default:
          return res.status(400).json(result);
      }
    }

    return res.status(200).json(result);
  } catch (error) {
    resServerError(res, error);
  }
};

// Update Safety Circle Controller
const updateSafetyCircleController = async (
  req: AuthRequest,
  res: Response,
) => {
  try {
    // 1. Accept and validate user input
    const userId = req.userId as string;

    const circleId = req.params.safetyCircleId;
    if (!circleId) {
      return res.status(400).json({
        success: false,
        message: "Circle id is required",
        data: null,
        error: {
          code: "CIRCLE_ID_REQUIRED",
          details: "Circle id is required",
        },
        metadata: {
          timestamp: new Date().toISOString(),
        },
      });
    }

    const updateData = req.body as SafetyCircleUpdate;
    if (!updateData) {
      return res.status(400).json({
        success: false,
        message: "Circle update data is required",
        data: null,
        error: {
          code: "CIRCLE_UPDATE_DATA_REQUIRED",
          details: "Circle update data is required",
        },
        metadata: {
          timestamp: new Date().toISOString(),
        },
      });
    }

    // 2. Pass the data to the service layer for processing
    const result = await updateCircleMemberService(
      userId,
      circleId,
      updateData,
    );

    // 3. Handle success and error responses
    if (!result.success) {
      switch (result.error?.code) {
        case "VALIDATION_ERROR":
        case "EMPTY_UPDATE":
        case "CIRCLE_NOT_FOUND":
          return res.status(404).json(result);
        case "CIRCLE_UPDATE_ERROR":
        case "INTERNAL_ERROR":
          return res.status(500).json(result);
        default:
          return res.status(400).json(result);
      }
    }

    return res.status(200).json(result);
  } catch (error) {
    resServerError(res, error);
  }
};

// Delete Safety Circle Controller
const deleteSafetyCircleController = async (
  req: AuthRequest,
  res: Response,
) => {
  try {
    // 1. Accept and validate user input
    const userId = req.userId as string;

    const circleId = req.params.safetyCircleId;
    if (!circleId) {
      return res.status(400).json({
        success: false,
        message: "Circle id is required",
        data: null,
        error: {
          code: "CIRCLE_ID_REQUIRED",
          details: "Circle id is required",
        },
        metadata: {
          timestamp: new Date().toISOString(),
        },
      });
    }

    // 2. Pass the data to the service layer for processing
    const result = await deleteCircleMemberService(userId, circleId);

    // 3. Handle success and error responses
    if (!result.success) {
      switch (result.error?.code) {
        case "CIRCLE_DELETE_ERROR":
        case "INTERNAL_ERROR":
          return res.status(500).json(result);
        default:
          return res.status(400).json(result);
      }
    }

    return res.status(200).json(result);
  } catch (error) {
    resServerError(res, error);
  }
};

const alertCircleMembersController = async (
  req: AuthRequest,
  res: Response,
) => {
  try {
    // 1. Accept and validate user input
    const user_id = req.userId as string;

    const journey_id = req.params.journeyId as string;
    if (!journey_id) {
      return res.status(400).json({
        success: false,
        message: "Journey id is required",
        data: null,
        error: {
          code: "JOURNEY_ID_REQUIRED",
          details: "Journey id is required",
        },
        metadata: {
          timestamp: new Date().toISOString(),
        },
      });
    }

    const emergency_id = req.body.emergencyId as string | null; // emergencyId is optional
    const message_type = req.body.messageType as alertMessageType;
    if (!message_type) {
      return res.status(400).json({
        success: false,
        message: "Message type is required",
        data: null,
        error: {
          code: "MESSAGE_TYPE_REQUIRED",
          details: "Message type is required",
        },
        metadata: {
          timestamp: new Date().toISOString(),
        },
      });
    }
    // 2. Pass the data to the service layer for processing
    const result = await alertCircleMembersService(
      {
        user_id,
        journey_id,
        emergency_id,
      },
      message_type,
    );

    // 3. Handle success and error responses
    if (!result.success) {
      switch (result.error?.code) {
        case "USER_NOT_FOUND":
        case "JOURNEY_NOT_FOUND":
        case "EMERGENCY_NOT_FOUND":
        case "CIRCLE_MEMBERS_NOT_FOUND":
          return res.status(404).json(result);

        case "USER_CONFIRMATION_ERROR":
        case "JOURNEY_CONFIRMATION_ERROR":
        case "CIRCLE_MEMBERS_FETCH_ERROR":
        case "VALIDATION_ERROR":
          return res.status(422).json(result);

        case "JOURNEY_ID_REQUIRED":
          return res.status(400).json(result);
        default:
          return res.status(500).json(result);
      }
    }

    return res.status(200).json(result);
  } catch (error) {
    resServerError(res, error);
  }
};

export {
  createSafetyCircleController,
  readSafetyCircleController,
  updateSafetyCircleController,
  deleteSafetyCircleController,
  alertCircleMembersController,
};
