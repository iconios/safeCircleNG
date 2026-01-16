import { Response } from "express";
import { isDev } from "./devEnv.util.ts";

const resServerError = (res: Response, error: any) => {
  return res.status(500).json({
    success: false,
    message: "Internal server error",
    error: {
      code: "INTERNAL_SERVER_ERROR",
      details: isDev ? error : "An unexpected error occurred",
    },
    metadata: {
      timestamp: new Date().toISOString(),
    },
  });
};

export default resServerError;
