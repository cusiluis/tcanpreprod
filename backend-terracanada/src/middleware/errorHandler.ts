import { Request, Response, NextFunction } from 'express';
import { ApiResponse } from '../types';

export class AppError extends Error {
  constructor(
    public message: string,
    public statusCode: number = 500,
    public code?: string
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export const errorHandler = (
  err: AppError | Error,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const error = err instanceof AppError ? err : new AppError(err.message, 500);

  const response: ApiResponse = {
    success: false,
    error: {
      message: error.message,
      code: error.code || 'INTERNAL_ERROR'
    },
    timestamp: new Date().toISOString()
  };

  console.error(`[${error.statusCode}] ${error.message}`);

  res.status(error.statusCode).json(response);
};

export const asyncHandler = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};
