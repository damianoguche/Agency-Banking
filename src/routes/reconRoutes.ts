import { Router } from "express";
import {
  fixWallet,
  getInconsistencies,
  recalBalance
} from "../controllers/reconController.ts";

const router = Router();

router.get("/inconsistencies", getInconsistencies);
router.get("/:auditId/recalc", recalBalance);
router.post("/:auditId/fix", fixWallet);

export default router;
