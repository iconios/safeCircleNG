// Subscription Controllers
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
  subscriptionInsert,
  subscriptionUpdate,
} from "../types/subscription.types.ts";
import createSubscriptionService from "../services/subscriptions/createSubscription.service.ts";
import readSubscriptionService from "../services/subscriptions/readSubscription.service.ts";
import cancelSubscriptionService from "../services/subscriptions/cancelSubscription.service.ts";
import updateSubscriptionService from "../services/subscriptions/updateSubscription.service.ts";

const createSubscriptionController = async (
  req: AuthRequest,
  res: Response,
) => {
  try {
    // 1. Accept and validate user input
    const userId = req.userId as string;

    const subscriptionData = req.body as subscriptionInsert;
    if (!subscriptionData) {
      return res.status(400).json({
        success: false,
        message: "Subscription data is required",
        data: null,
        error: {
          code: "SUBSCRIPTION_DATA_REQUIRED",
          details: "Subscription data is required",
        },
        metadata: {
          timestamp: new Date().toISOString(),
        },
      });
    }

    // 2. Pass the data to the service layer for processing
    const result = await createSubscriptionService(
      { user_id: userId },
      subscriptionData,
    );

    // 3. Handle success and error responses
    if (!result.success) {
      switch (result.error?.code) {
        case "VALIDATION_ERROR":
          return res.status(422).json(result);
        case "SUBSCRIPTION_ALREADY_EXISTS":
          return res.status(409).json(result);
        case "SUBSCRIPTION_CREATION_ERROR":
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

const getSubscriptionsController = async (req: AuthRequest, res: Response) => {
  try {
    // 1. Accept and validate user input
    const userId = req.userId as string;

    // 2. Pass the data to the service layer for processing
    const result = await readSubscriptionService({ user_id: userId });

    // 3. Handle success and error responses
    if (!result.success) {
      switch (result.error?.code) {
        case "VALIDATION_ERROR":
          return res.status(422).json(result);
        case "SUBSCRIPTION_FETCH_ERROR":
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
const cancelSubscriptionController = async (
  req: AuthRequest,
  res: Response,
) => {
  try {
    // 1. Accept and validate user input
    const userId = req.userId as string;

    // 2. Pass the data to the service layer for processing
    const result = await cancelSubscriptionService({ user_id: userId });

    // 3. Handle success and error responses
    if (!result.success) {
      switch (result.error?.code) {
        case "VALIDATION_ERROR":
          return res.status(422).json(result);
        case "SUBSCRIPTION_UPDATE_ERROR":
        case "INTERNAL_ERROR":
          return res.status(500).json(result);
        case "SUBSCRIPTION_NOT_FOUND_OR_CANCELLED":
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
const updateSubscriptionController = async (
  req: AuthRequest,
  res: Response,
) => {
  try {
    // 1. Accept and validate user input
    const userId = req.userId as string;

    const updateData = req.body as subscriptionUpdate;
    if (!updateData) {
      return res.status(400).json({
        success: false,
        message: "Subscription update data is required",
        data: null,
        error: {
          code: "SUBSCRIPTION_UPDATE_DATA_REQUIRED",
          details: "Subscription update data is required",
        },
        metadata: {
          timestamp: new Date().toISOString(),
        },
      });
    }

    // 2. Pass the data to the service layer for processing
    const result = await updateSubscriptionService(
      { user_id: userId },
      updateData,
    );

    // 3. Handle success and error responses
    if (!result.success) {
      switch (result.error?.code) {
        case "VALIDATION_ERROR":
          return res.status(422).json(result);
        case "SUBSCRIPTION_UPDATE_ERROR":
        case "INTERNAL_ERROR":
          return res.status(500).json(result);
        case "SUBSCRIPTION_NOT_FOUND":
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
  createSubscriptionController,
  getSubscriptionsController,
  cancelSubscriptionController,
  updateSubscriptionController,
};
