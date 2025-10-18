import { DataTypes, Model } from "sequelize";
import type { Optional } from "sequelize";
import sequelize from "../config/db.ts";

// Define attributes for the table
interface IdempotencyAttributes {
  key: string;
  method: string;
  path: string;
  response_code: number;
  response_body: any;
}

// For creation, some fields (like timestamps) are optional
interface IdempotencyCreationAttributes
  extends Optional<IdempotencyAttributes, "created_at" | "updated_at"> {}

class IdempotencyStore
  extends Model<IdempotencyAttributes, IdempotencyCreationAttributes>
  implements IdempotencyAttributes
{
  declare key: string;
  declare method: string;
  declare path: string;
  declare response_code: number;
  declare response_body: any;
  declare readonly created_at: Date;
  declare readonly updated_at: Date;
}

IdempotencyStore.init(
  {
    key: {
      type: DataTypes.STRING,
      primaryKey: true
    },
    method: {
      type: DataTypes.STRING,
      allowNull: false
    },
    path: {
      type: DataTypes.STRING,
      allowNull: false
    },
    response_code: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    response_body: {
      type: DataTypes.JSON,
      allowNull: false
    }
  },
  {
    sequelize,
    tableName: "idempotency_store",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at"
  }
);

export default IdempotencyStore;
