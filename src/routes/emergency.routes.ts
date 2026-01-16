import express from "express";
import authenticateToken from "../middleware/authenticateToken.ts";
import {
  createEmergencyController,
  deleteEmergencyController,
  readEmergencyController,
  updateEmergencyController,
} from "../controllers/emergency.controllers.ts";

const emergencyRouter = express.Router();

// Apply authentication middleware to all emergency routes
emergencyRouter.use(authenticateToken);

// Emergency Routes
emergencyRouter.post("/:journeyId/emergency", createEmergencyController);
emergencyRouter.get("/:journeyId/emergency", readEmergencyController);
emergencyRouter.patch("/:journeyId/emergency", updateEmergencyController);
emergencyRouter.delete("/:emergencyId", deleteEmergencyController);

export default emergencyRouter;
