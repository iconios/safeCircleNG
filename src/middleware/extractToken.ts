import { NextFunction, Response } from "express";
import { AuthRequest } from "../types/auth.types.ts";

const extractToken = (req: AuthRequest, _res: Response, next: NextFunction) => {
  const authHeader = req.get("authorization");

  if (authHeader?.startsWith("Bearer ")) {
    req.token = authHeader.slice(7).trim();
  } else {
    req.token = undefined;
  }

  next();
};

export default extractToken;
