import { AuthRequest } from "../types/auth.types.ts";

const requireAuth = (req: AuthRequest) => {
  const userId = req.userId as string | undefined;
  if (!userId) {
    return {
      success: false,
      message: "User is not authenticated",
      data: null,
      error: {
        code: "USER_NOT_AUTHENTICATED",
        details: "User is not authenticated",
      },
      metadata: {
        timestamp: new Date().toISOString(),
      },
    };
  }

  return userId;
};

export default requireAuth;
