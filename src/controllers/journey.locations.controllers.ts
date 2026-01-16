// Journey Locations Controller
/*
#Plan:
1. Accept and validate user input
2. Pass the data to the service layer for processing
3. Handle success and error responses
*/

import { Response } from "express";
import { AuthRequest } from "../types/auth.types.ts";
import resServerError from "../utils/resServerError.util.ts";
import { journeyLocationInsert } from "../types/journeyLocation.types.ts";
import createJourneyLocationService from "../services/journeyLocations/createLocation.service.ts";
import readJourneyLocationsService from "../services/journeyLocations/readLocations.service.ts";

// Create journey location controller
const createJourneyLocationController = async (
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

    const journeyLocationData = req.body as journeyLocationInsert;
    if (!journeyLocationData) {
      return res.status(400).json({
        success: false,
        message: "Journey location data is required",
        data: null,
        error: {
          code: "JOURNEY_LOCATION_DATA_REQUIRED",
          details: "Journey location data is required",
        },
        metadata: {
          timestamp: new Date().toISOString(),
        },
      });
    }

    // 2. Pass the data to the service layer for processing
    const journeyLocationInput = {
      user_id: userId,
      journey_id: journeyId,
    };
    const result = await createJourneyLocationService(
      journeyLocationInput,
      journeyLocationData,
    );

    // 3. Handle success and error responses
    if (!result.success) {
      switch (result.error?.code) {
        case "VALIDATION_ERROR":
          return res.status(422).json(result);
        case "JOURNEY_LOCATION_CONFIRMATION_ERROR":
        case "NOT_FOUND":
          return res.status(404).json(result);
        case "JOURNEY_LOCATION_CREATION_ERROR":
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

// Read Journey Locations Controller
const readJourneyLocationsController = async (
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

    // 2. Pass the data to the service layer for processing
    const journeyLocationInput = {
      user_id: userId,
      journey_id: journeyId,
    };
    const result = await readJourneyLocationsService(journeyLocationInput);

    // 3. Handle success and error responses
    if (!result.success) {
      switch (result.error?.code) {
        case "VALIDATION_ERROR":
          return res.status(422).json(result);
        case "JOURNEY_LOCATION_READ_ERROR":
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

export { createJourneyLocationController, readJourneyLocationsController };
