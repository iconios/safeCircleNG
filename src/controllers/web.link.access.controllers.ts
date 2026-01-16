// Web Link Access Controllers
/*
#Plan:
1. Accept and validate user input
2. Pass the data to the service layer for processing
3. Handle success and error responses
*/

import { Response } from "express";
import { AuthRequest } from "../types/auth.types.ts";
import resServerError from "../utils/resServerError.util.ts";
import createWebLinkAccessService from "../services/webLinkAccess/createLink.service.ts";
import {
  webLinkAccessInsert,
  webLinkAccessUpdate,
} from "../types/webLink.types.ts";
import readWebLinkAccessService from "../services/webLinkAccess/readLink.service.ts";
import deleteWebLinkAccessService from "../services/webLinkAccess/deleteLink.service.ts";
import updateWebLinkAccessService from "../services/webLinkAccess/updateLink.service.ts";

// Create web link access controller
const createWebLinkAccessController = async (
  req: AuthRequest,
  res: Response,
) => {
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

    const webLinkAccessInput = req.body as webLinkAccessInsert;
    if (!webLinkAccessInput) {
      return res.status(400).json({
        success: false,
        message: "Web Link Access data is required",
        data: null,
        error: {
          code: "WEB_LINK_ACCESS_DATA_REQUIRED",
          details: "Web Link Access data is required",
        },
        metadata: {
          timestamp: new Date().toISOString(),
        },
      });
    }

    // 2. Pass the data to the service layer for processing
    const result = await createWebLinkAccessService(
      { user_id: userId, journey_id: journeyId, emergency_id: emergencyId },
      webLinkAccessInput,
    );

    // 3. Handle success and error responses
    if (!result.success) {
      switch (result.error?.code) {
        case "JOURNEY_VALIDATION_ERROR":
        case "NOT_FOUND":
          return res.status(404).json(result);
        case "EMERGENCY_VALIDATION_ERROR":
          return res.status(401).json(result);
        case "EMERGENCY_ALREADY_RESOLVED":
        case "VALIDATION_ERROR":
          return res.status(400).json(result);
        default:
          return res.status(500).json(result);
      }
    }
  } catch (error) {
    resServerError(res, error);
  }
};

// Get web link access controller
const getWebLinkAccessController = async (req: AuthRequest, res: Response) => {
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
    const result = await readWebLinkAccessService({
      user_id: userId,
      journey_id: journeyId,
      emergency_id: emergencyId,
    });

    // 3. Handle success and error responses
    if (!result.success) {
      switch (result.error?.code) {
        case "JOURNEY_VALIDATION_ERROR":
        case "WEB_LINK_ACCESS_NOT_FOUND":
        case "VALIDATION_ERROR":
        case "EMERGENCY_NOT_FOUND":
          return res.status(404).json(result);
        case "EMERGENCY_VALIDATION_ERROR":
          return res.status(401).json(result);
        case "WEB_LINK_ACCESS_FETCH_ERROR":
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

// Revoke web link access controller
const revokeWebLinkAccessController = async (
  req: AuthRequest,
  res: Response,
) => {
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
    const result = await deleteWebLinkAccessService({
      user_id: userId,
      journey_id: journeyId,
      emergency_id: emergencyId,
    });

    // 3. Handle success and error responses
    if (!result.success) {
      switch (result.error?.code) {
        case "JOURNEY_VALIDATION_ERROR":
        case "JOURNEY_NOT_FOUND":
        case "EMERGENCY_NOT_FOUND":
        case "VALIDATION_ERROR":
          return res.status(404).json(result);
        case "EMERGENCY_VALIDATION_ERROR":
          return res.status(401).json(result);
        case "WEB_LINK_ACCESS_DELETE_ERROR":
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

// Update web link access controller
const updateWebLinkAccessController = async (
  req: AuthRequest,
  res: Response,
) => {
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

    const webLinkAccessUpdateInput = req.body as webLinkAccessUpdate;
    if (!webLinkAccessUpdateInput) {
      return res.status(400).json({
        success: false,
        message: "Web Link Access update data is required",
        data: null,
        error: {
          code: "WEB_LINK_ACCESS_DATA_REQUIRED",
          details: "Web Link Access update data is required",
        },
        metadata: {
          timestamp: new Date().toISOString(),
        },
      });
    }

    // 2. Pass the data to the service layer for processing
    const result = await updateWebLinkAccessService(
      { user_id: userId, journey_id: journeyId, emergency_id: emergencyId },
      webLinkAccessUpdateInput,
    );

    // 3. Handle success and error responses
    if (!result.success) {
      switch (result.error?.code) {
        case "WEB_LINK_ACCESS_NOT_FOUND":
        case "JOURNEY_VALIDATION_ERROR":
        case "JOURNEY_NOT_FOUND":
        case "NOT_FOUND":
          return res.status(404).json(result);
        case "EMERGENCY_VALIDATION_ERROR":
          return res.status(401).json(result);
        case "WEB_LINK_ACCESS_UPDATE_ERROR":
        case "EMERGENCY_ALREADY_RESOLVED":
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

export {
  createWebLinkAccessController,
  getWebLinkAccessController,
  revokeWebLinkAccessController,
  updateWebLinkAccessController,
};
