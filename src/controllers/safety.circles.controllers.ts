// src/controllers/safety.circles.controllers.ts
/*
#Plan:
1. Accept and validate user input
2. Pass the data to the service layer for processing
3. Handle success and error responses
*/

import resServerError from "../utils/resServerError.util.ts";
import { Response } from "express";
import { AuthRequest } from "../types/auth.types.ts";
import { CreateCircleDataDTO, SafetyCircleUpdate } from "../types/safetyCircle.types.ts";
import createCircleMemberService from "../services/safetyCircles/createCircle.service.ts";
import readCircleMemberService from "../services/safetyCircles/readCircle.service.ts";
import updateCircleMemberService from "../services/safetyCircles/updateCircle.service.ts";
import deleteCircleMemberService from "../services/safetyCircles/deleteCircle.service.ts";

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
    const result = await updateCircleMemberService(userId, circleId, updateData);

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
export {
  createSafetyCircleController,
  readSafetyCircleController,
  updateSafetyCircleController,
  deleteSafetyCircleController,
};
