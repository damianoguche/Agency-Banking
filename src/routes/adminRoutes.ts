import { Router } from "express";
import { getCustomers, getEvents } from "../controllers/adminController.ts";
import { authenticate } from "../middleware/authMiddleware.ts";

const router = Router();

router.get("/customers", authenticate, getCustomers);
router.get("/events", authenticate, getEvents);

export default router;
