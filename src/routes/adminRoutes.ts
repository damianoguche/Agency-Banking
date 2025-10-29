import { Router } from "express";
import {
  getCustomers,
  getEvents,
  updateCustomerRole
} from "../controllers/adminController.ts";
import { authenticate } from "../middleware/authMiddleware.ts";

const router = Router();

router.get("/customers", authenticate, getCustomers);
router.get("/events", authenticate, getEvents);
router.put("/customers/:id/role", authenticate, updateCustomerRole);

export default router;
