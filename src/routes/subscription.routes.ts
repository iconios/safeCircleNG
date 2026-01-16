import express from "express";
import authenticateToken from "../middleware/authenticateToken.ts";
import {
  cancelSubscriptionController,
  createSubscriptionController,
  getSubscriptionsController,
  updateSubscriptionController,
} from "../controllers/subscription.controllers.ts";
const subscriptionRouter = express.Router();

subscriptionRouter.use(authenticateToken);

subscriptionRouter.post("/", createSubscriptionController);
subscriptionRouter.get("/", getSubscriptionsController);
subscriptionRouter.put("/", updateSubscriptionController);
subscriptionRouter.delete("/", cancelSubscriptionController);

export default subscriptionRouter;
