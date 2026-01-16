import { rateLimit } from "express-rate-limit";

const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  limit: 100,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  ipv6Subnet: 56,
  message: {
    success: false,
    message:
      "Too many requests from this IP, please try again after 15 minutes",
    data: null,
    error: {
      code: "RATE_LIMIT_EXCEEDED",
      details:
        "You have exceeded the maximum number of requests allowed. Please try again later.",
    },
    metadata: {
      timestamp: new Date().toISOString(),
    },
  },
});

export { authRateLimiter };
