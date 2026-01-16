// Event controller implementation
/*
#Plan:
1. Accept and validate user input
2. Pass the data to the service layer for processing
3. Handle success and error responses
*/

import { Response } from "express";
import { AuthRequest } from "../types/auth.types.ts";
import resServerError from "../utils/resServerError.util.ts";
import { eventInsert, eventUpdate } from "../types/event.types.ts";
import createEventService from "../services/events/createEvent.service.ts";
import readEventService from "../services/events/readEvent.service.ts";
import updateEventService from "../services/events/updateEvent.service.ts";
import deleteEventService from "../services/events/deleteEvent.service.ts";

// Create event controller
const createEventController = async (req: AuthRequest, res: Response) => {
  try {
    // 1. Accept and validate user input
    const eventData = req.body as eventInsert;
    if (!eventData) {
      return res.status(400).json({
        success: false,
        message: "Event data is required",
        data: null,
        error: {
          code: "EVENT_DATA_REQUIRED",
          details: "Event data is required",
        },
        metadata: {
          timestamp: new Date().toISOString(),
        },
      });
    }

    // 2. Pass the data to the service layer for processing
    const result = await createEventService(eventData);

    // 3. Handle success and error responses
    if (!result.success) {
      switch (result.error?.code) {
        case "EVENT_CREATION_ERROR":
        case "INTERNAL_ERROR":
          return res.status(500).json(result);
        case "VALIDATION_ERROR":
          return res.status(422).json(result);
        default:
          return res.status(400).json(result);
      }
    }

    res.status(201).json(result);
  } catch (error) {
    resServerError(res, error);
  }
};

// Read event controller
const readEventController = async (req: AuthRequest, res: Response) => {
  try {
    // 1. Accept and validate user input
    const eventCode = req.params.eventCode as string;
    if (!eventCode) {
      return res.status(400).json({
        success: false,
        message: "Event code is required",
        data: null,
        error: {
          code: "EVENT_CODE_REQUIRED",
          details: "Event code is required",
        },
        metadata: {
          timestamp: new Date().toISOString(),
        },
      });
    }

    // 2. Pass the data to the service layer for processing
    const result = await readEventService({ event_code: eventCode });

    // 3. Handle success and error responses
    if (!result.success) {
      switch (result.error?.code) {
        case "EVENT_FETCH_ERROR":
        case "INTERNAL_ERROR":
          return res.status(500).json(result);
        case "EVENT_NOT_FOUND":
          return res.status(404).json(result);
        case "VALIDATION_ERROR":
          return res.status(422).json(result);
        default:
          return res.status(400).json(result);
      }
    }

    res.status(200).json(result);
  } catch (error) {
    resServerError(res, error);
  }
};

// Update event controller
const updateEventController = async (req: AuthRequest, res: Response) => {
  try {
    // 1. Accept and validate user input
    const eventCode = req.params.eventCode as string;
    if (!eventCode) {
      return res.status(400).json({
        success: false,
        message: "Event code is required",
        data: null,
        error: {
          code: "EVENT_CODE_REQUIRED",
          details: "Event code is required",
        },
        metadata: {
          timestamp: new Date().toISOString(),
        },
      });
    }

    const updateData = req.body as eventUpdate;
    if (!updateData) {
      return res.status(400).json({
        success: false,
        message: "Event update data is required",
        data: null,
        error: {
          code: "EVENT_UPDATE_DATA_REQUIRED",
          details: "Event update data is required",
        },
        metadata: {
          timestamp: new Date().toISOString(),
        },
      });
    }

    // 2. Pass the data to the service layer for processing
    const result = await updateEventService(
      { event_code: eventCode },
      updateData,
    );

    // 3. Handle success and error responses
    if (!result.success) {
      switch (result.error?.code) {
        case "VALIDATION_ERROR":
          return res.status(422).json(result);
        case "EMPTY_UPDATE":
        case "EVENT_NOT_FOUND":
          return res.status(404).json(result);
        case "EVENT_UPDATE_ERROR":
        case "INTERNAL_ERROR":
          return res.status(500).json(result);
        default:
          return res.status(400).json(result);
      }
    }

    res.status(200).json(result);
  } catch (error) {
    resServerError(res, error);
  }
};

const deleteEventController = async (req: AuthRequest, res: Response) => {
  try {
    // 1. Accept and validate user input
    const eventCode = req.params.eventCode as string;
    if (!eventCode) {
      return res.status(400).json({
        success: false,
        message: "Event code is required",
        data: null,
        error: {
          code: "EVENT_CODE_REQUIRED",
          details: "Event code is required",
        },
        metadata: {
          timestamp: new Date().toISOString(),
        },
      });
    }

    const eventId = req.params.eventId as string;
    if (!eventId) {
      return res.status(400).json({
        success: false,
        message: "Event id is required",
        data: null,
        error: {
          code: "EVENT_ID_REQUIRED",
          details: "Event id is required",
        },
        metadata: {
          timestamp: new Date().toISOString(),
        },
      });
    }

    // 2. Pass the data to the service layer for processing
    const result = await deleteEventService({
      event_code: eventCode,
      event_id: eventId,
    });

    // 3. Handle success and error responses
    if (!result.success) {
      switch (result.error?.code) {
        case "EVENT_DELETION_ERROR":
        case "INTERNAL_ERROR":
          return res.status(500).json(result);
        case "EVENT_NOT_FOUND":
          return res.status(404).json(result);
        case "VALIDATION_ERROR":
          return res.status(422).json(result);
        default:
          return res.status(400).json(result);
      }
    }

    res.status(200).json(result);
  } catch (error) {
    resServerError(res, error);
  }
};

export {
  createEventController,
  readEventController,
  updateEventController,
  deleteEventController,
};
