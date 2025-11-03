import type { Request, Response } from "express";
import { Customer } from "../models/customer.ts";
import { Op } from "sequelize";
import { SystemEvent } from "../models/systemEvent.ts";
import { logEvent } from "../utils/logEvent.ts";

/**
 * GET /admin/customers
 * Accessible by: Admins
 * Supports pagination & search
 * Response matches React UsersList component
 */
export const getCustomers = async (req: Request, res: Response) => {
  try {
    const {
      page = "1",
      limit = "20",
      search = ""
    } = req.query as Record<string, string>;

    const offset = (parseInt(page) - 1) * parseInt(limit);

    const whereClause =
      search.trim().length > 0
        ? {
            [Op.or]: [
              { fullName: { [Op.iLike]: `%${search}%` } },
              { email: { [Op.iLike]: `%${search}%` } }
            ]
          }
        : {};

    const { rows, count } = await Customer.findAndCountAll({
      where: whereClause,
      limit: parseInt(limit),
      offset,
      order: [["created_at", "DESC"]],
      attributes: [
        "id",
        ["fullName", "name"], // alias matches frontend
        "email",
        "role",
        "status",
        ["created_at", "joinedAt"] // alias for frontend
      ]
    });

    return res.status(200).json({
      success: true,
      total: count,
      customers: rows
    });
  } catch (err) {
    console.error("Error fetching customers:", err);
    return res.status(500).json({
      success: false,
      message: "An error occurred while fetching customers"
    });
  }
};

/**
 * PUT /admin/customers/:id/role
 * Accessible by: Admins
 * Body: { role: 'user' | 'agent' | 'admin' }
 */
export const updateCustomerRole = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { role } = req.body;

    if (!["user", "agent", "admin"].includes(role)) {
      return res.status(400).json({
        success: false,
        message: "Invalid role provided"
      });
    }

    const customer = await Customer.findByPk(id);
    if (!customer) {
      return res.status(404).json({
        success: false,
        message: "Customer not found"
      });
    }

    const oldRole = customer.role;
    await customer.update({ role });

    // Log the role update as a system event
    await logEvent(
      "role_update",
      `Admin updated role for ${customer.fullName} from '${oldRole}' to '${role}'`
    );

    return res.status(200).json({
      success: true,
      message: "Customer role updated"
    });
  } catch (err: any) {
    return res.status(500).json({
      success: false,
      message: err.message
    });
  }
};

/**
 * GET /admin/events
 * Accessible by: Admins
 * Query params:
 * - page: number (default 1)
 * - limit: number (default 20)
 * - type: string (optional)
 * - startDate: string (optional)
 * - endDate: string (optional)
 *
 * Supports pagination & filtering by type or date range.
 */

export const getEvents = async (req: Request, res: Response) => {
  try {
    const {
      page = "1",
      limit = "20",
      type = "",
      startDate = "",
      endDate = ""
    } = req.query as Record<string, string>;

    const offset = (parseInt(page) - 1) * parseInt(limit);

    // Build dynamic filters
    const whereClause: Record<string, any> = {};

    if (type.trim()) whereClause.type = type;

    if (startDate && endDate) {
      whereClause.created_at = {
        [Op.between]: [new Date(startDate), new Date(endDate)]
      };
    } else if (startDate) {
      whereClause.created_at = { [Op.gte]: new Date(startDate) };
    } else if (endDate) {
      whereClause.created_at = { [Op.lte]: new Date(endDate) };
    }

    const { rows, count } = await SystemEvent.findAndCountAll({
      where: whereClause,
      limit: parseInt(limit),
      offset,
      order: [["created_at", "DESC"]],
      attributes: ["id", "type", "message", ["created_at", "timestamp"]]
    });

    return res.status(200).json({
      success: true,
      total: count,
      events: rows
    });
  } catch (err) {
    console.error("Error fetching events:", err);
    return res.status(500).json({
      success: false,
      message: "An error occurred while fetching system events"
    });
  }
};
