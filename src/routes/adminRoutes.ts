import { Router } from "express";
import { getCustomers, getEvents } from "../controllers/adminController.ts";

const router = Router();

router.get("/customers", getCustomers);
router.get("/events", getEvents);

export default router;
