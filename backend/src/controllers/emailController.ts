import { Request, Response, NextFunction } from "express";
import { emailService } from "../services/emailService";
import { emailQueue } from "../queues/emailQueue";
import { createAppError } from "../middleware/errorHandler";

export const emailController = {
  async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const email = await emailService.create(req.body);

      const delay = new Date(email.scheduledAt).getTime() - Date.now();
      const jobId = await emailQueue.addEmail(email, delay > 0 ? delay : 0);
      await emailService.updateJobId(email.id, jobId);

      res.status(201).json({
        success: true,
        data: { ...email, jobId },
        message: "Email scheduled successfully",
      });
    } catch (err) {
      next(err);
    }
  },

  async getAll(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const pageSize = parseInt(req.query.pageSize as string) || 10;
      const status = req.query.status as string | undefined;

      const result = await emailService.getAll(page, pageSize, status);
      res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  },

  async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const email = await emailService.getById(req.params.id);
      if (!email) {
        throw createAppError("Email not found", 404);
      }
      res.json({ success: true, data: email });
    } catch (err) {
      next(err);
    }
  },

  async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const email = await emailService.update(req.params.id, req.body);
      if (!email) {
        throw createAppError("Email not found", 404);
      }

      if (email.jobId) {
        await emailQueue.removeJob(email.jobId);
      }

      const delay = new Date(email.scheduledAt).getTime() - Date.now();
      const newJobId = await emailQueue.addEmail(email, delay > 0 ? delay : 0);
      await emailService.updateJobId(email.id, newJobId);

      res.json({
        success: true,
        data: { ...email, jobId: newJobId },
        message: "Email updated and rescheduled",
      });
    } catch (err) {
      next(err);
    }
  },

  async cancel(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const email = await emailService.getById(req.params.id);
      if (!email) {
        throw createAppError("Email not found", 404);
      }

      if (email.jobId) {
        await emailQueue.removeJob(email.jobId);
      }

      const cancelled = await emailService.cancel(req.params.id);
      res.json({
        success: true,
        data: cancelled,
        message: "Email cancelled",
      });
    } catch (err) {
      next(err);
    }
  },

  async delete(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const email = await emailService.getById(req.params.id);
      if (!email) {
        throw createAppError("Email not found", 404);
      }

      if (email.jobId) {
        await emailQueue.removeJob(email.jobId);
      }

      await emailService.delete(req.params.id);
      res.json({
        success: true,
        message: "Email deleted",
      });
    } catch (err) {
      next(err);
    }
  },

  async getStats(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const stats = await emailService.getStats();
      res.json({ success: true, data: stats });
    } catch (err) {
      next(err);
    }
  },
};
