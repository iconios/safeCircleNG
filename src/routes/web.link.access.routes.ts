import express from "express";
import authenticateToken from "../middleware/authenticateToken.ts";
import {
  createWebLinkAccessController,
  getWebLinkAccessController,
  revokeWebLinkAccessController,
  updateWebLinkAccessController,
} from "../controllers/web.link.access.controllers.ts";

const webLinkAccessRouter = express.Router();


// Apply authentication middleware to all routes in this router
webLinkAccessRouter.use(authenticateToken);

// Define routes for web link access
webLinkAccessRouter.post(
  "/journeys/:journeyId/emergencies/:emergencyId",
  createWebLinkAccessController,
);
webLinkAccessRouter.get(
  "/journeys/:journeyId/emergencies/:emergencyId",
  getWebLinkAccessController,
);
webLinkAccessRouter.delete(
  "/journeys/:journeyId/emergencies/:emergencyId",
  revokeWebLinkAccessController,
);
webLinkAccessRouter.patch(
  "/journeys/:journeyId/emergencies/:emergencyId",
  updateWebLinkAccessController,
);

export default webLinkAccessRouter;
