import express from "express";
import {
  authController,
  verifyOtpController,
} from "../controllers/auth.controller";

const authRouter = express.Router();

// Auth routes
authRouter.post("/signup", authController);
authRouter.post("/otp/verify", verifyOtpController);
authRouter.post("/login", authController);

export default authRouter;
