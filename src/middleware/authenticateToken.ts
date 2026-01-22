// Authenticate token
/*
#Plan:
1. Accept and validate token
2. Authenticate token
3. Attach user id to request
*/

import { NextFunction, Response } from "express";
import { AuthRequest, tokenPayload } from "../types/auth.types.ts";
import { supabaseAdmin } from "../config/supabase.ts";
import { isDev } from "../utils/devEnv.util.ts";
import jwt from "jsonwebtoken";

const authenticateToken = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) => {
  const now = new Date();
  const JWT_SECRET = process.env.JWT_SECRET;
  if (!JWT_SECRET) {
    throw new Error("JWT SECRET is required");
  }
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
    const decoded: tokenPayload = await jwt.verify(req.token, JWT_SECRET);
    if (typeof decoded !== "object") {
      return res.status(401).json({
        success: false,
        message: "Invalid token",
        data: null,
        error: {
          code: "INVALID_TOKEN",
          details: "Invalid token",
        },
        metadata: {
          timestamp: now.toISOString(),
        },
      });
    }
    const { data: userData, error: userError } = await supabaseAdmin
      .from("users")
      .select("id")
      .eq("id", decoded.userId)
      .eq("phone_number", decoded.phoneNumber)
      .maybeSingle();
    if (userError) {
      return res.status(401).json({
        success: false,
        message: "Error fetching user",
        data: null,
        error: {
          code: "USER_FETCH_ERROR",
          details: isDev
            ? (userError.message ?? "Error fetching user")
            : "Error fetching user",
        },
        metadata: {
          timestamp: now.toISOString(),
        },
      });
    }

    if (!userData) {
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
    req.userId = userData.id;
    next();
  } catch (error) {
    console.error("authenticateToken error:", error);

    if (error instanceof jwt.TokenExpiredError) {
      return res.status(401).json({
        success: false,
        message: "Expired token",
        data: null,
        error: {
          code: "EXPIRED_TOKEN",
          details: "Expired token",
        },
        metadata: {
          timestamp: now.toISOString(),
        },
      });
    }

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
