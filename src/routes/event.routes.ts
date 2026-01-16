import express from "express";
import {
  createEventController,
  deleteEventController,
  readEventController,
  updateEventController,
} from "../controllers/event.controllers.ts";
const eventRouter = express.Router();

// Event routes
eventRouter.post("/", createEventController);
eventRouter.get("/eventCode/:eventCode", readEventController);
eventRouter.patch("/eventCode/:eventCode", updateEventController);
eventRouter.delete(
  "/eventCode/:eventCode/eventId/:eventId",
  deleteEventController,
);

export default eventRouter;
