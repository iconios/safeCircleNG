// Authenticate token
/*
#Plan:
1. Accept and validate token
2. Authenticate token
3. Attach user id to request
*/

import { NextFunction, Response } from "express";
import { AuthRequest } from "../types/auth.types.ts";
import { supabaseAdmin } from "../config/supabase.ts";
import { isDev } from "../utils/devEnv.util.ts";

const authenticateToken = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) => {
  const now = new Date();
  try {
    // 1. Accept and validate token
    if (!req.token || typeof req.token !== "string") {
      return res.status(401).json({
        success: false,
        message: "User token not found or format invalid",
        data: null,
        error: {
          code: "USER_TOKEN_NOT_FOUND_OR_INVALID",
          details: "User token not found or format invalid",
        },
        metadata: {
          timestamp: now.toISOString(),
        },
      });
    }

    // 2. Authenticate token
    const {
      data: { user },
      error,
    } = await supabaseAdmin.auth.getUser(req.token);
    if (error) {
      return res.status(401).json({
        success: false,
        message: "Error authenticating user",
        data: null,
        error: {
          code: "USER_AUTH_ERROR",
          details: isDev
            ? (error.message ?? "Error authenticating user")
            : "Error authenticating user",
        },
        metadata: {
          timestamp: now.toISOString(),
        },
      });
    }

    if (user === null) {
      return res.status(401).json({
        success: false,
        message: "User not found",
        data: null,
        error: {
          code: "USER_NOT_FOUND",
          details: "User not found",
        },
        metadata: {
          timestamp: now.toISOString(),
        },
      });
    }

    // 3. Attach user id to request
    req.userId = user.id;
    next();
  } catch (error) {
    console.error("authenticateToken error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal server error",
      data: {},
      error: {
        code: "INTERNAL_ERROR",
        details: "Unexpected error while authenticating token",
      },
      metadata: {
        timestamp: now.toISOString(),
      },
    });
  }
};

export default authenticateToken;
