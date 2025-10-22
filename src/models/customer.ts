import { DataTypes, Model } from "sequelize";
import sequelize from "../config/db.ts";
import type { Optional } from "sequelize";
import Wallet from "./wallet.ts";

interface CustomerAttributes {
  id: number;
  fullName: string;
  phoneNumber: string;
  password: string;
  email?: string;
  bvn?: number;
  status?: string;
  created_at?: Date;
  updated_at?: Date;
}

interface CustomerCreationAttributes
  extends Optional<CustomerAttributes, "id" | "created_at"> {}

export class Customer
  extends Model<CustomerAttributes, CustomerCreationAttributes>
  implements CustomerAttributes
{
  declare id: number;
  declare fullName: string;
  declare phoneNumber: string;
  declare email?: string;
  declare password: string;
  declare bvn?: number;
  declare status?: string;
  declare readonly created_at?: Date;
  declare readonly updated_at?: Date;

  // Make TS knows about the association
  declare wallets?: Wallet[];
}

Customer.init(
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true
    },
    fullName: {
      type: DataTypes.STRING,
      allowNull: false
    },
    phoneNumber: {
      type: DataTypes.STRING,
      allowNull: false
    },
    email: {
      type: DataTypes.STRING,
      allowNull: true
    },
    password: {
      type: DataTypes.STRING,
      allowNull: false
    },
    bvn: {
      type: DataTypes.BIGINT.UNSIGNED,
      allowNull: true
    },
    status: {
      type: DataTypes.ENUM("active", "inactive"),
      defaultValue: "active"
    },
    created_at: {
      //DB-leel fallback
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    },
    updated_at: {
      // DB-level fallback
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    }
  },
  {
    sequelize,
    modelName: "Customer",
    tableName: "customers",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
    indexes: [
      {
        unique: true,
        fields: ["phoneNumber", "email", "bvn"]
      }
    ]
  }
);

Customer.hasMany(Wallet, {
  foreignKey: "customerId",
  as: "wallets",
  onDelete: "CASCADE" // if customer is deleted, delete wallets
});

Wallet.belongsTo(Customer, {
  foreignKey: "customerId",
  as: "customer"
});
