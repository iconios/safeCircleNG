import express from "express";
import authenticateToken from "../middleware/authenticateToken.ts";
import {
  createJourneyController,
  deleteJourneyController,
  readJourneysController,
  updateJourneyController,
} from "../controllers/journey.controllers.ts";

const journeyRouter = express.Router();

journeyRouter.post("/", authenticateToken, createJourneyController);
journeyRouter.get("/", authenticateToken, readJourneysController);
journeyRouter.patch("/:journeyId", authenticateToken, updateJourneyController);
journeyRouter.delete("/:journeyId", authenticateToken, deleteJourneyController);

export default journeyRouter;
