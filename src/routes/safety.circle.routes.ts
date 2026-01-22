import express from "express";
import {
  alertCircleMembersController,
  createSafetyCircleController,
  deleteSafetyCircleController,
  readSafetyCircleController,
  updateSafetyCircleController,
} from "../controllers/safety.circles.controllers";
import authenticateToken from "../middleware/authenticateToken";

const safetyCircleRouter = express.Router();

// Apply authentication middleware to all safety circle routes
safetyCircleRouter.use(authenticateToken);

// Safety Circle Routes
safetyCircleRouter.post("/", createSafetyCircleController);
safetyCircleRouter.get("/", readSafetyCircleController);
safetyCircleRouter.patch("/:safetyCircleId", updateSafetyCircleController);
safetyCircleRouter.delete("/:safetyCircleId", deleteSafetyCircleController);
safetyCircleRouter.post(
  "/journey/:journeyId/alert",
  alertCircleMembersController,
);

export default safetyCircleRouter;
