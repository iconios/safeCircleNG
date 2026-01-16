import express from "express";
import authenticateToken from "../middleware/authenticateToken.ts";
import {
  createJourneyShareController,
  deleteJourneyShareController,
  readJourneySharesController,
  updateJourneyShareController,
} from "../controllers/journey.shares.controllers.ts";

const journeySharesRouter = express.Router();

// Apply authentication middleware to all journey shares routes
journeySharesRouter.use(authenticateToken);

// Journey Shares Routes
journeySharesRouter.post(
  "/:journeyId/circle-members/:circleMemberId",
  createJourneyShareController,
);
journeySharesRouter.get("/:journeyId", readJourneySharesController);
journeySharesRouter.patch(
  "/:journeyId/circle-members/:circleMemberId",
  updateJourneyShareController,
);
journeySharesRouter.delete("/:journeyShareId", deleteJourneyShareController);

export default journeySharesRouter;
