import express from "express";
import authenticateToken from "../middleware/authenticateToken.ts";
import {
  createJourneyLocationController,
  readJourneyLocationsController,
} from "../controllers/journey.locations.controllers.ts";

const journeyLocationRouter = express.Router();

// Apply authentication middleware to all routes in this router
journeyLocationRouter.use(authenticateToken);

// Define routes for journey locations
journeyLocationRouter.post(
  "/journeys/:journeyId/locations",
  createJourneyLocationController,
);
journeyLocationRouter.get(
  "/journeys/:journeyId/locations",
  readJourneyLocationsController,
);

export default journeyLocationRouter;
