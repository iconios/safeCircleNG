import express from "express";
import * as dotenv from "dotenv";
import cors from "cors";
import extractToken from "./middleware/extractToken";
import authRouter from "./routes/auth.routes";
import journeyRouter from "./routes/journey.routes";
import safetyCircleRouter from "./routes/safety.circle.routes";
import { authRateLimiter } from "./middleware/rateLimiter";
import journeyLocationRouter from "./routes/journey.location.routes";
import journeySharesRouter from "./routes/journey.shares.routes";
import emergencyRouter from "./routes/emergency.routes";
import emergencyAlertsRouter from "./routes/emergency.alerts.routes";
import webLinkAccessRouter from "./routes/web.link.access.routes";
import subscriptionRouter from "./routes/subscription.routes";
import paymentRouter from "./routes/payment.routes";
import organizationRouter from "./routes/organization.routes";
import eventRouter from "./routes/event.routes";
import messageLogsRouter from "./routes/message.logs.routes";
dotenv.config();

const app = express();
const PORT = process.env.PORT;
if (!PORT) {
  throw new Error("PORT configuration missing");
}

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(authRateLimiter);
app.use(extractToken);

app.get("/health", (_, res) => res.send("OK"));
app.use("/api/v1/auth", authRouter);
app.use("/api/v1/journeys", journeyRouter);
app.use("/api/v1/safety-circles", safetyCircleRouter);
app.use("/api/v1/journey-locations", journeyLocationRouter);
app.use("/api/v1/journey-shares", journeySharesRouter);
app.use("/api/v1/emergencies", emergencyRouter);
app.use("/api/v1/emergency-alerts", emergencyAlertsRouter);
app.use("/api/v1/web-link-access", webLinkAccessRouter);
app.use("/api/v1/subscriptions", subscriptionRouter);
app.use("/api/v1/payments", paymentRouter);
app.use("/api/v1/organizations", organizationRouter);
app.use("/api/v1/events", eventRouter);
app.use("/api/v1/message-logs", messageLogsRouter);

// No route found handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "Route not found",
    error: {
      code: "ROUTE_NOT_FOUND",
      details: `The route ${req.method} ${req.path} does not exist.`,
    },
    metadata: {
      timestamp: new Date().toISOString(),
    },
  });
});

app.listen(PORT, () => {
  console.log("Server running on PORT", PORT);
});
