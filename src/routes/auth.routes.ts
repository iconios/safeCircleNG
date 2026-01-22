import express from "express";
import {
  loginController,
  signupController,
  verifyOtpController,
} from "../controllers/auth.controller.ts";

const authRouter = express.Router();

// Auth routes
authRouter.post("/signup", signupController);
authRouter.post("/otp/verify", verifyOtpController);
authRouter.post("/login", loginController);

export default authRouter;
