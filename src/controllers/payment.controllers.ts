// Payment controller implementation
/*
#Plan:
1. Accept and validate user input
2. Pass the data to the service layer for processing
3. Handle success and error responses
*/

import { Response } from "express";
import { AuthRequest } from "../types/auth.types.ts";
import resServerError from "../utils/resServerError.util.ts";
import { paymentInsert } from "../types/payment.types.ts";
import createPaymentService from "../services/payments/createPayment.service.ts";
import readPaymentService from "../services/payments/readPayment.service.ts";

// Create payment controller
const createPaymentController = async (req: AuthRequest, res: Response) => {
  try {
    // 1. Accept and validate user input
    const userId = req.userId as string;

    const paymentData = req.body as paymentInsert;
    if (!paymentData) {
      return res.status(400).json({
        success: false,
        message: "Payment data is required",
        data: null,
        error: {
          code: "PAYMENT_DATA_REQUIRED",
          details: "Payment data is required",
        },
        metadata: {
          timestamp: new Date().toISOString(),
        },
      });
    }

    // 2. Pass the data to the service layer for processing
    const result = await createPaymentService({ user_id: userId }, paymentData);

    // 3. Handle success and error responses
    if (!result.success) {
      switch (result.error?.code) {
        case "VALIDATION_ERROR":
          return res.status(422).json(result);
        case "PAYMENT_CREATION_ERROR":
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

// Get payments controller
const getPaymentsController = async (req: AuthRequest, res: Response) => {
  try {
    // 1. Accept and validate user input
    const userId = req.userId as string;

    // 2. Pass the data to the service layer for processing
    const result = await readPaymentService({ user_id: userId });

    // 3. Handle success and error responses
    if (!result.success) {
      switch (result.error?.code) {
        case "PAYMENT_FETCH_ERROR":
        case "INTERNAL_ERROR":
          return res.status(500).json(result);
        case "PAYMENT_NOT_FOUND":
          return res.status(404).json(result);
        case "VALIDATION_ERROR":
          return res.status(422).json(result);
        default:
          return res.status(400).json(result);
      }
    }

    return res.status(200).json(result);
  } catch (error) {
    resServerError(res, error);
  }
};

export { createPaymentController, getPaymentsController };
