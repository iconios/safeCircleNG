import express from "express";
import {
  createSafetyCircleController,
  deleteSafetyCircleController,
  readSafetyCircleController,
  updateSafetyCircleController,
} from "../controllers/safety.circles.controllers.ts";
import authenticateToken from "../middleware/authenticateToken.ts";

const safetyCircleRouter = express.Router();

// Apply authentication middleware to all safety circle routes
safetyCircleRouter.use(authenticateToken);

// Safety Circle Routes
safetyCircleRouter.post("/", createSafetyCircleController);
safetyCircleRouter.get("/", readSafetyCircleController);
safetyCircleRouter.patch(
  "/:safetyCircleId",
  updateSafetyCircleController,
);
safetyCircleRouter.delete(
  "/:safetyCircleId",
  deleteSafetyCircleController,
);

export default safetyCircleRouter;
