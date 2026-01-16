import express from "express";
import authenticateToken from "../middleware/authenticateToken.ts";
import {
  createPaymentController,
  getPaymentsController,
} from "../controllers/payment.controllers.ts";
const paymentRouter = express.Router();

paymentRouter.use(authenticateToken);

paymentRouter.post("/", createPaymentController);
paymentRouter.get("/", getPaymentsController);

export default paymentRouter;
