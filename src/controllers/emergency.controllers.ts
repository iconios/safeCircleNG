// Emergency Controllers
/*
#Plan:
1. Accept and validate user input
2. Pass the data to the service layer for processing
3. Handle success and error responses
*/

import { Response } from "express";
import { AuthRequest } from "../types/auth.types.ts";
import resServerError from "../utils/resServerError.util.ts";
import { emergencyInsert, emergencyUpdate } from "../types/emergency.types.ts";
import createEmergencyService from "../services/emergencies/createEmergency.service.ts";
import readEmergencyService from "../services/emergencies/readEmergency.service.ts";
import updateEmergencyService from "../services/emergencies/updateEmergency.service.ts";
import deleteEmergencyService from "../services/emergencies/deleteEmergency.service.ts";

// Create Emergency Controller
const createEmergencyController = async (req: AuthRequest, res: Response) => {
  try {
    // 1. Accept and validate user input
    const userId = req.userId as string;

    const journeyId = req.params.journeyId;
    if (!journeyId) {
      return res.status(401).json({
        success: false,
        message: "Journey ID is required",
        data: null,
        error: {
          code: "JOURNEY_ID_REQUIRED",
          details: "Journey ID is required",
        },
        metadata: {
          timestamp: new Date().toISOString(),
        },
      });
    }

    const emergencyData = req.body as emergencyInsert;
    if (!emergencyData) {
      return res.status(400).json({
        success: false,
        message: "Emergency data is required",
        data: null,
        error: {
          code: "EMERGENCY_DATA_REQUIRED",
          details: "Emergency data is required",
        },
        metadata: {
          timestamp: new Date().toISOString(),
        },
      });
    }

    // 2. Pass the data to the service layer for processing
    const result = await createEmergencyService(
      { user_id: userId, journey_id: journeyId },
      emergencyData,
    );

    // 3. Handle success and error responses
    if (!result.success) {
      switch (result.error?.code) {
        case "JOURNEY_NOT_ACTIVE":
        case "ACTIVE_EMERGENCY_EXISTS":
        case "EMERGENCY_ALREADY_EXISTS":
          return res.status(400).json(result);
        default:
          return res.status(500).json(result);
      }
    }

    return res.status(201).json(result);
  } catch (error) {
    resServerError(res, error);
  }
};

// Read Emergency Controller
const readEmergencyController = async (req: AuthRequest, res: Response) => {
  try {
    // 1. Accept and validate user input
    const userId = req.userId as string;

    const journeyId = req.params.journeyId;
    if (!journeyId) {
      return res.status(401).json({
        success: false,
        message: "Journey ID is required",
        data: null,
        error: {
          code: "JOURNEY_ID_REQUIRED",
          details: "Journey ID is required",
        },
        metadata: {
          timestamp: new Date().toISOString(),
        },
      });
    }

    // 2. Pass the data to the service layer for processing
    const result = await readEmergencyService({
      user_id: userId,
      journey_id: journeyId,
    });

    // 3. Handle success and error responses
    if (!result.success) {
      switch (result.error?.code) {
        case "JOURNEY_NOT_FOUND":
        case "EMERGENCY_NOT_FOUND":
          return res.status(404).json(result);
        default:
          return res.status(500).json(result);
      }
    }

    return res.status(200).json(result);
  } catch (error) {
    resServerError(res, error);
  }
};

// Update Emergency Controller
const updateEmergencyController = async (req: AuthRequest, res: Response) => {
  try {
    // 1. Accept and validate user input
    const userId = req.userId as string;

    const journeyId = req.params.journeyId;
    if (!journeyId) {
      return res.status(401).json({
        success: false,
        message: "Journey ID is required",
        data: null,
        error: {
          code: "JOURNEY_ID_REQUIRED",
          details: "Journey ID is required",
        },
        metadata: {
          timestamp: new Date().toISOString(),
        },
      });
    }

    const emergencyData = req.body as emergencyUpdate;
    if (!emergencyData) {
      return res.status(400).json({
        success: false,
        message: "Emergency data is required",
        data: null,
        error: {
          code: "EMERGENCY_DATA_REQUIRED",
          details: "Emergency data is required",
        },
        metadata: {
          timestamp: new Date().toISOString(),
        },
      });
    }

    // 2. Pass the data to the service layer for processing
    const result = await updateEmergencyService(
      { user_id: userId, journey_id: journeyId },
      emergencyData,
    );

    // 3. Handle success and error responses
    if (!result.success) {
      switch (result.error?.code) {
        case "NOT_FOUND":
          return res.status(404).json(result);
        case "VALIDATION_ERROR":
          return res.status(422).json(result);
        case "EMERGENCY_UPDATE_ERROR":
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

// Delete Emergency Controller
const deleteEmergencyController = async (req: AuthRequest, res: Response) => {
  try {
    // 1. Accept and validate user input
    const userId = req.userId as string;

    const emergencyId = req.params.emergencyId;
    if (!emergencyId) {
      return res.status(401).json({
        success: false,
        message: "Emergency ID is required",
        data: null,
        error: {
          code: "EMERGENCY_ID_REQUIRED",
          details: "Emergency ID is required",
        },
        metadata: {
          timestamp: new Date().toISOString(),
        },
      });
    }

    // 2. Pass the data to the service layer for processing
    const result = await deleteEmergencyService({
      user_id: userId,
      emergency_id: emergencyId,
    });

    // 3. Handle success and error responses
    if (!result.success) {
      switch (result.error?.code) {
        case "NOT_FOUND":
          return res.status(404).json(result);
        case "VALIDATION_ERROR":
          return res.status(422).json(result);
        case "EMERGENCY_DELETION_ERROR":
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
  createEmergencyController,
  readEmergencyController,
  updateEmergencyController,
  deleteEmergencyController,
};
