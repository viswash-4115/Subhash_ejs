import { Request, Response, NextFunction } from "express";
import { ZodSchema } from "zod";

export function validate(schema: ZodSchema) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      const firstError = result.error.errors[0];
      _res.status(400).json({
        success: false,
        error: firstError.message,
      });
      return;
    }
    req.body = result.data;
    next();
  };
}
