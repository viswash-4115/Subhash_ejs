import { Router } from "express";
import { emailController } from "../controllers/emailController";
import { validate } from "../middleware/validate";
import {
  createScheduledEmailSchema,
  updateScheduledEmailSchema,
} from "../types/validation";

const router = Router();

router.get("/stats", emailController.getStats);
router.get("/", emailController.getAll);
router.get("/:id", emailController.getById);
router.post("/", validate(createScheduledEmailSchema), emailController.create);
router.put("/:id", validate(updateScheduledEmailSchema), emailController.update);
router.patch("/:id/cancel", emailController.cancel);
router.delete("/:id", emailController.delete);

export default router;
