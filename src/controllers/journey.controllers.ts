// src/controllers/journey.controllers.ts
/*
#Plan:
1. Accept and validate user input
2. Pass the data to the service layer for processing
3. Handle success and error responses
*/

import { Response } from "express";
import createJourneyService from "../services/journeys/createJourney.service.ts";
import { AuthRequest } from "../types/auth.types.ts";
import readJourneyService from "../services/journeys/readJourney.service.ts";
import updateJourneyService from "../services/journeys/updateJourney.service.ts";
import deleteJourneyService from "../services/journeys/deleteJourney.service.ts";
import { JourneyInsert, JourneyUpdate } from "../types/journey.types.ts";
import resServerError from "../utils/resServerError.util.ts";

// Create journey controller
const createJourneyController = async (req: AuthRequest, res: Response) => {
  try {
    // 1. Accept and validate user input
    const userId = req.userId as string;

    const journeyData = req.body as JourneyInsert;
    if (!journeyData) {
      return res.status(400).json({
        success: false,
        message: "Journey data is required",
        data: null,
        error: {
          code: "JOURNEY_DATA_REQUIRED",
          details: "Journey data is required",
        },
        metadata: {
          timestamp: new Date().toISOString(),
        },
      });
    }

    // 2. Pass the data to the service layer for processing
    const result = await createJourneyService(userId, journeyData);

    // 3. Handle success and error responses
    if (!result.success) {
      switch (result.error?.code) {
        case "VALIDATION_ERROR":
          return res.status(422).json(result);
        case "JOURNEY_CREATION_ERROR":
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

// Read Journeys Controller
const readJourneysController = async (req: AuthRequest, res: Response) => {
  try {
    // 1. Accept and validate user input
    const userId = req.userId as string;

    // 2. Pass the data to the service layer for processing
    const result = await readJourneyService(userId);

    // 3. Handle success and error responses
    if (!result.success) {
      switch (result.error?.code) {
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

// update Journey Controller
const updateJourneyController = async (req: AuthRequest, res: Response) => {
  try {
    // 1. Accept and validate user input
    const userId = req.userId as string;
    const journeyId = req.params.journeyId;
    const journeyData = req.body as JourneyUpdate;

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

    if (!journeyData) {
      return res.status(400).json({
        success: false,
        message: "Journey data is required",
        data: null,
        error: {
          code: "JOURNEY_DATA_REQUIRED",
          details: "Journey data is required",
        },
        metadata: {
          timestamp: new Date().toISOString(),
        },
      });
    }

    // 2. Pass the data to the service layer for processing
    const result = await updateJourneyService(
      { user_id: userId, journey_id: journeyId },
      journeyData,
    );

    // 3. Handle success and error responses
    if (!result.success) {
      switch (result.error?.code) {
        case "VALIDATION_ERROR":
          return res.status(422).json(result);
        case "JOURNEY_UPDATE_ERROR":
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

// delete Journey Controller
const deleteJourneyController = async (req: AuthRequest, res: Response) => {
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
    const result = await deleteJourneyService({
      user_id: userId,
      journey_id: journeyId,
    });

    // 3. Handle success and error responses
    if (!result.success) {
      switch (result.error?.code) {
        case "VALIDATION_ERROR":
          return res.status(422).json(result);
        case "JOURNEY_DELETION_ERROR":
        case "INTERNAL_ERROR":
          return res.status(500).json(result);
        case "NOT_FOUND":
          return res.status(404).json(result);
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
  createJourneyController,
  readJourneysController,
  updateJourneyController,
  deleteJourneyController,
};
