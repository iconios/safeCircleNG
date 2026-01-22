import express from "express";
import authenticateToken from "../middleware/authenticateToken.ts";
import {
  createMessageLogController,
  readMessageLogsController,
} from "../controllers/message.logs.controllers.ts";
const messageLogsRouter = express.Router();

// Apply middleware to all message log routes
messageLogsRouter.use(authenticateToken);

// Message log routes
messageLogsRouter.post("/", createMessageLogController);
messageLogsRouter.get("/", readMessageLogsController);

export default messageLogsRouter;
