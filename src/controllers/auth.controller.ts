// src/controllers/auth.controller.ts
/*
#Plan:
1. Accept and validate user input
2. Pass the data to the service layer for processing
3. Handle success and error responses
*/

import { Request, Response } from "express";
import signUpAuthService from "../services/auth/signup.auth.service";
import verifyOtpAuthService from "../services/auth/verifyOtp.auth.service";
import resServerError from "../utils/resServerError.util";
import {
  AuthRequest,
  loginInputDTO,
  SignUpDataDTO,
  VerifyOtpDataDTO,
} from "../types/auth.types";
import loginAuthService from "../services/auth/login.auth.service";

const signupController = async (req: Request, res: Response) => {
  try {
    // 1. Accept and validate user input
    const signUpData = req.body as SignUpDataDTO;

    if (!signUpData) {
      return res.status(400).json({
        success: false,
        message: "SignUp data is required",
        error: {
          code: "NO_DATA_PROVIDED",
          details: "No SignUp data provided in the request body",
        },
        metadata: {
          timestamp: new Date().toISOString(),
        },
      });
    }

    // 2. Pass the data to the service layer for processing
    const result = await signUpAuthService(signUpData);

    // 3. Handle success and error responses
    if (!result.success) {
      switch (result.error?.code) {
        case "ACCOUNT_LOCKED":
          return res.status(423).json(result);
        case "USER_EXISTS":
          return res.status(409).json(result);
        case "OTP_COOLDOWN":
          return res.status(429).json(result);
        case "CREATE_USER_ERROR":
        case "SIGNUP_ERROR":
          return res.status(500).json(result);
        case "VALIDATION_ERROR":
          return res.status(422).json(result);
        default:
          return res.status(400).json(result);
      }
    }

    return res.status(201).json(result);
  } catch (error) {
    resServerError(res, error);
  }
};

const verifyOtpController = async (req: Request, res: Response) => {
  try {
    // 1. Accept and validate user input
    const verifyOtpData = req.body as VerifyOtpDataDTO;

    if (!verifyOtpData) {
      return res.status(400).json({
        success: false,
        message: "Verify OTP data is required",
        error: {
          code: "NO_DATA_PROVIDED",
          details: "No Verify OTP data provided in the request body",
        },
        metadata: {
          timestamp: new Date().toISOString(),
        },
      });
    }

    // 2. Pass the data to the service layer for processing
    const result = await verifyOtpAuthService(verifyOtpData);

    // 3. Handle success and error responses
    if (!result.success) {
      switch (result.error?.code) {
        case "NOT_FOUND":
          return res.status(404).json(result);
        case "ACCOUNT_INACTIVE":
          return res.status(403).json(result);
        case "LIMIT_EXCEEDED":
          return res.status(429).json(result);
        case "INVALID_OTP":
          return res.status(401).json(result);
        case "SERVICE_OUTAGE":
          return res.status(503).json(result);
        case "VALIDATION_ERROR":
          return res.status(422).json(result);
        case "VERIFICATION_ERROR":
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

const loginController = async (req: AuthRequest, res: Response) => {
  try {
    // 1. Accept and validate user input
    const loginData = req.body as loginInputDTO;

    if (!loginData) {
      return res.status(400).json({
        success: false,
        message: "Login data is required",
        error: {
          code: "NO_DATA_PROVIDED",
          details: "No login data provided in the request body",
        },
        metadata: {
          timestamp: new Date().toISOString(),
        },
      });
    }

    // 2. Pass the data to the service layer for processing
    const result = await loginAuthService(loginData);

    // 3. Handle success and error responses
    if (!result.success) {
      switch (result.error?.code) {
        case "USER_FETCH_ERROR":
        case "USER_NOT_FOUND":
          return res.status(404).json(result);
        case "USER_SUSPENDED":
          return res.status(403).json(result);
        case "PHONE_UNVERIFIED":
          return res.status(409).json(result);
        case "ACCOUNT_LOCKED":
        case "OTP_COOLDOWN":
        case "LIMIT_EXCEEDED":
          return res.status(429).json(result);
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

export { signupController, verifyOtpController, loginController };
