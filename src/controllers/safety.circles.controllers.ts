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

// Create Safety Circle Controller
const createSafetyCircleController = async (
  req: AuthRequest,
  res: Response,
) => {
  try {
  } catch (error) {
    resServerError(res, error);
  }
};

// Read Safety Circle Controller
const readSafetyCircleController = async (req: AuthRequest, res: Response) => {
  try {
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
