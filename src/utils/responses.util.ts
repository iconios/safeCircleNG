import { Response } from "express";

export const successResponseUtil = (
  message: string,
  data?: any,
  metadata?: Object,
) => {
  return {
    success: true,
    message,
    data,
    error: null,
    metadata: {
      timestamp: new Date().toISOString(),
      ...metadata,
    },
  };
};

export const errorResponseUtil = (
  message: string,
  error: any,
  metadata?: Object,
) => {
  return {
    success: false,
    message,
    data: null,
    error,
    metadata: {
      timestamp: new Date().toISOString(),
      ...metadata,
    },
  };
};

export const successResponseService = (res: Response, successMessage: any) => {
  return res.status(200).json(successMessage);
};

export const errorResponseService = (
  res: Response,
  statusCode: number,
  errorMessage: any,
) => {
  return res.status(statusCode).json(errorMessage);
};
