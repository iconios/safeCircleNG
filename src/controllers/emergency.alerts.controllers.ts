// Emergency Alerts Controllers
/*
#Plan:
1. Accept and validate user input
2. Pass the data to the service layer for processing
3. Handle success and error responses
*/

import { Response } from "express";
import { AuthRequest } from "../types/auth.types.ts";
import resServerError from "../utils/resServerError.util.ts";
import createEmergencyAlertService from "../services/emergencyAlerts/createAlert.service.ts";
import { emergencyAlertsInsert } from "../types/emergencyAlert.types.ts";
import readEmergencyAlertsService from "../services/emergencyAlerts/readAlert.service.ts";

const createEmergencyAlertController = async (
  req: AuthRequest,
  res: Response,
) => {
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

    const alertData = req.body as emergencyAlertsInsert;
    if (!alertData) {
      return res.status(400).json({
        success: false,
        message: "Emergency alert data is required",
        data: null,
        error: {
          code: "EMERGENCY_ALERT_DATA_REQUIRED",
          details: "Emergency alert data is required",
        },
        metadata: {
          timestamp: new Date().toISOString(),
        },
      });
    }

    // 2. Pass the data to the service layer for processing
    const result = await createEmergencyAlertService(
      { user_id: userId, emergency_id: emergencyId },
      alertData,
    );

    // 3. Handle success and error responses
    if (!result.success) {
      switch (result.error?.code) {
        case "EMERGENCY_VALIDATION_ERROR":
        case "NOT_FOUND":
        case "EMERGENCY_ALREADY_RESOLVED":
          return res.status(404).json(result);
        case "EMERGENCY_ALERT_CREATION_ERROR":
        case "VALIDATION_ERROR":
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

const readEmergencyAlertController = async (
  req: AuthRequest,
  res: Response,
) => {
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
    const result = await readEmergencyAlertsService({
      user_id: userId,
      emergency_id: emergencyId,
    });

    // 3. Handle success and error responses
    if (!result.success) {
      switch (result.error?.code) {
        case "EMERGENCY_VALIDATION_ERROR":
        case "NOT_FOUND":
          return res.status(404).json(result);
        case "EMERGENCY_ALERTS_FETCH_ERROR":
        case "VALIDATION_ERROR":
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

export { createEmergencyAlertController, readEmergencyAlertController };
