import express from "express";
import { authenticate } from "../middleware/authMiddleware.ts";
import { setPin, changePin } from "../controllers/walletController.ts";

const router = express.Router();

router.post("/set-pin", authenticate, setPin);
router.post("/change-pin", authenticate, changePin);

export default router;
