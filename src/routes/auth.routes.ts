import express from "express";
import {
  signupController,
  verifyOtpController,
} from "../controllers/auth.controller.ts";

const authRouter = express.Router();

// Auth routes
authRouter.post("/signup", signupController);
authRouter.post("/otp/verify", verifyOtpController);

export default authRouter;
