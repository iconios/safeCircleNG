// src/controllers/message.logs.controllers.ts
/*
#Plan:
1. Accept and validate user input
2. Pass the data to the service layer for processing
3. Handle success and error responses
*/

import { Response } from "express";
import { AuthRequest } from "../types/auth.types.ts";
import resServerError from "../utils/resServerError.util.ts";
import { messageLogsInsert } from "../types/messageLogs.types.ts";
import createMessageLogService from "../services/messageLogs/createLog.service.ts";
import readMessageLogService from "../services/messageLogs/readLog.service.ts";

// Create message log controller
const createMessageLogController = async (req: AuthRequest, res: Response) => {
  try {
    // 1. Accept and validate user input
    const userId = req.userId as string;

    const messageLogData = req.body as messageLogsInsert;
    if (!messageLogData) {
      return res.status(400).json({
        success: false,
        message: "Message log data is required",
        data: null,
        error: {
          code: "MESSAGE_LOG_DATA_REQUIRED",
          details: "Message log data is required",
        },
        metadata: {
          timestamp: new Date().toISOString(),
        },
      });
    }

    // 2. Pass the data to the service layer for processing
    const result = await createMessageLogService(userId, messageLogData);

    // 3. Handle success and error responses
    if (!result.success) {
      switch (result.error?.code) {
        case "VALIDATION_ERROR":
          return res.status(422).json(result);
        case "MESSAGE_LOG_CREATION_ERROR":
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

// Read message logs controller
const readMessageLogsController = async (req: AuthRequest, res: Response) => {
  try {
    // 1. Accept and validate user input
    const userId = req.userId as string;

    // 2. Pass the data to the service layer for processing
    const result = await readMessageLogService(userId);

    // 3. Handle success and error responses
    if (!result.success) {
      switch (result.error?.code) {
        case "MESSAGE_LOG_FETCH_ERROR":
        case "INTERNAL_ERROR":
          return res.status(500).json(result);
        case "MESSAGE_LOG_NOT_FOUND":
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

export { createMessageLogController, readMessageLogsController };
