import { Model, DataTypes } from "sequelize";
import sequelize from "../config/db.ts";

export class Outbox extends Model {
  declare id: number;
  declare aggregate_type: string; // "Transaction"
  declare aggregate_id: string; // transaction reference
  declare event_type: string; // "WalletCredited"
  declare payload: string; // JSON string
  declare published: boolean;
  declare published_at?: Date | null;
  declare created_at: Date;
  declare updated_at: Date;
}

Outbox.init(
  {
    aggregate_type: { type: DataTypes.STRING, allowNull: false },
    aggregate_id: { type: DataTypes.STRING, allowNull: false },
    event_type: { type: DataTypes.STRING, allowNull: false },
    payload: { type: DataTypes.JSON, allowNull: false },
    published: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false
    },
    published_at: { type: DataTypes.DATE, allowNull: true }
  },
  {
    sequelize,
    modelName: "Outbox",
    tableName: "outbox",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
    indexes: [
      { fields: ["aggregate_type", "aggregate_id"] },
      { fields: ["published"] }
    ]
  }
);

export default Outbox;
