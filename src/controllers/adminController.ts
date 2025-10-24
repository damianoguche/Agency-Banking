import type { Request, Response } from "express";
import { Customer } from "../models/customer.ts";
import { Op } from "sequelize";

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
      data: rows
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

    await customer.update({ role });

    return res.status(200).json({
      success: true,
      message: "Customer role updated successfully"
    });
  } catch (err) {
    console.error("Error updating customer role:", err);
    return res.status(500).json({
      success: false,
      message: "An error occurred while updating customer role"
    });
  }
};

export const getEvents = async (req: Request, res: Response) => {};
