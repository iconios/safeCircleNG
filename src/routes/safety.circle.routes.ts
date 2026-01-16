import express from "express";
import {
  createSafetyCircleController,
  deleteSafetyCircleController,
  readSafetyCircleController,
  updateSafetyCircleController,
} from "../controllers/safety.circles.controllers.ts";
import authenticateToken from "../middleware/authenticateToken.ts";
import { read } from "node:fs";

const safetyCircleRouter = express.Router();

safetyCircleRouter.post("/", authenticateToken, createSafetyCircleController);
safetyCircleRouter.get("/", authenticateToken, readSafetyCircleController);
safetyCircleRouter.patch(
  "/:safetyCircleId",
  authenticateToken,
  updateSafetyCircleController,
);
safetyCircleRouter.delete(
  "/:safetyCircleId",
  authenticateToken,
  deleteSafetyCircleController,
);

export default safetyCircleRouter;
