// Journey Shares Controller
/*
#Plan:
1. Accept and validate user input
2. Pass the data to the service layer for processing
3. Handle success and error responses
*/

import { Response } from "express";
import { AuthRequest } from "../types/auth.types.ts";
import resServerError from "../utils/resServerError.util.ts";
import {
  journeySharesInsert,
  journeySharesUpdate,
} from "../types/journeyShares.types.ts";
import createJourneySharesService from "../services/journeyShares/createShares.service.ts";
import readJourneySharesService from "../services/journeyShares/readShares.service.ts";
import updateJourneySharesService from "../services/journeyShares/updateShares.service.ts";
import deleteJourneyShareService from "../services/journeyShares/deleteShares.service.ts";

// Create a new journey share
const createJourneyShareController = async (
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

    const circleMemberId = req.params.circleMemberId;
    if (!circleMemberId) {
      return res.status(401).json({
        success: false,
        message: "Circle Member ID is required",
        data: null,
        error: {
          code: "CIRCLE_MEMBER_ID_REQUIRED",
          details: "Circle Member ID is required",
        },
        metadata: {
          timestamp: new Date().toISOString(),
        },
      });
    }

    const journeyShareData = req.body as journeySharesInsert;
    if (!journeyShareData) {
      return res.status(400).json({
        success: false,
        message: "Journey share data is required",
        data: null,
        error: {
          code: "JOURNEY_SHARE_DATA_REQUIRED",
          details: "Journey share data is required",
        },
        metadata: {
          timestamp: new Date().toISOString(),
        },
      });
    }

    // 2. Pass the data to the service layer for processing
    const result = await createJourneySharesService(
      {
        user_id: userId,
        journey_id: journeyId,
        circle_member_id: circleMemberId,
      },
      journeyShareData,
    );

    // 3. Handle success and error responses
    if (!result.success) {
      switch (result.error?.code) {
        case "DUPLICATE_SHARE":
          return res.status(409).json(result);
        case "JOURNEY_SHARES_VALIDATION_ERROR":
          return res.status(422).json(result);
        case "INTERNAL_ERROR":
          return res.status(500).json(result);
        default:
          return res.status(400).json(result);
      }
    }

    // Return success response
    return res.status(201).json(result);
  } catch (error) {
    resServerError(res, error);
  }
};

// Read journey shares
const readJourneySharesController = async (req: AuthRequest, res: Response) => {
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
    const result = await readJourneySharesService({
      user_id: userId,
      journey_id: journeyId,
    });

    // 3. Handle success and error responses
    if (!result.success) {
      switch (result.error?.code) {
        case "VALIDATION_ERROR":
          return res.status(422).json(result);
        case "INTERNAL_ERROR":
        case "JOURNEY_SHARES_FETCH_ERROR":
          return res.status(500).json(result);
        default:
          return res.status(400).json(result);
      }
    }

    // Return success response
    return res.status(200).json(result);
  } catch (error) {
    resServerError(res, error);
  }
};

// Update a journey share
const updateJourneyShareController = async (
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

    const circleMemberId = req.params.circleMemberId;
    if (!circleMemberId) {
      return res.status(401).json({
        success: false,
        message: "Circle Member ID is required",
        data: null,
        error: {
          code: "CIRCLE_MEMBER_ID_REQUIRED",
          details: "Circle Member ID is required",
        },
        metadata: {
          timestamp: new Date().toISOString(),
        },
      });
    }

    const journeyShareData = req.body as journeySharesUpdate;
    if (!journeyShareData) {
      return res.status(400).json({
        success: false,
        message: "Journey share data is required",
        data: null,
        error: {
          code: "JOURNEY_SHARE_DATA_REQUIRED",
          details: "Journey share data is required",
        },
        metadata: {
          timestamp: new Date().toISOString(),
        },
      });
    }

    // 2. Pass the data to the service layer for processing
    const result = await updateJourneySharesService(
      {
        user_id: userId,
        journey_id: journeyId,
        circle_member_id: circleMemberId,
      },
      journeyShareData,
    );

    // 3. Handle success and error responses
    if (!result.success) {
      switch (result.error?.code) {
        case "VALIDATION_ERROR":
          return res.status(422).json(result);
        case "JOURNEY_SHARE_UPDATE_ERROR":
        case "INTERNAL_ERROR":
          return res.status(500).json(result);
        case "NOT_FOUND":
          return res.status(404).json(result);
        default:
          return res.status(400).json(result);
      }
    }
  } catch (error) {
    resServerError(res, error);
  }
};

// Delete a journey share
const deleteJourneyShareController = async (
  req: AuthRequest,
  res: Response,
) => {
  try {
    // 1. Accept and validate user input
    const userId = req.userId as string;

    const journeyShareId = req.params.journeyShareId;
    if (!journeyShareId) {
      return res.status(401).json({
        success: false,
        message: "Journey Share ID is required",
        data: null,
        error: {
          code: "JOURNEY_SHARE_ID_REQUIRED",
          details: "Journey Share ID is required",
        },
        metadata: {
          timestamp: new Date().toISOString(),
        },
      });
    }

    // 2. Pass the data to the service layer for processing
    const result = await deleteJourneyShareService({
      user_id: userId,
      journey_share_id: journeyShareId,
    });

    // 3. Handle success and error responses
    if (!result.success) {
      switch (result.error?.code) {
        case "VALIDATION_ERROR":
          return res.status(422).json(result);
        case "INTERNAL_ERROR":
        case "JOURNEY_SHARE_DELETION_ERROR":
          return res.status(500).json(result);
        case "JOURNEY_SHARE_CONFIRMATION_ERROR":
          return res.status(500).json(result);
        case "NOT_FOUND":
          return res.status(404).json(result);
        default:
          return res.status(400).json(result);
      }
    }

    // Return success response
    return res.status(200).json(result);
  } catch (error) {
    resServerError(res, error);
  }
};

export {
  createJourneyShareController,
  readJourneySharesController,
  updateJourneyShareController,
  deleteJourneyShareController,
};
