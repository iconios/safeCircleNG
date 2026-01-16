import express from "express";
import authenticateToken from "../middleware/authenticateToken.ts";
import {
  createEmergencyAlertController,
  readEmergencyAlertController,
} from "../controllers/emergency.alerts.controllers.ts";
const emergencyAlertsRouter = express.Router();

// Middleware to authenticate token for all emergency alerts routes
emergencyAlertsRouter.use(authenticateToken);

// Emergency Alerts Routes
emergencyAlertsRouter.post(
  "/:emergencyId/alerts",
  createEmergencyAlertController,
);
emergencyAlertsRouter.get("/:emergencyId/alerts", readEmergencyAlertController);

export default emergencyAlertsRouter;
