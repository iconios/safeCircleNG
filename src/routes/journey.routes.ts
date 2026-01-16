import express from "express";
import authenticateToken from "../middleware/authenticateToken.ts";
import {
  createJourneyController,
  deleteJourneyController,
  readJourneysController,
  updateJourneyController,
} from "../controllers/journey.controllers.ts";

const journeyRouter = express.Router();

// Apply authentication middleware to all journey routes
journeyRouter.use(authenticateToken);

journeyRouter.post("/", createJourneyController);
journeyRouter.get("/", readJourneysController);
journeyRouter.patch("/:journeyId", updateJourneyController);
journeyRouter.delete("/:journeyId", deleteJourneyController);

export default journeyRouter;
