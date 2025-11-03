import { DataTypes, Model } from "sequelize";
import sequelize from "../config/db.ts";

export class SystemEvent extends Model {
  declare id: string;
  declare type: string;
  declare message: string;
  declare createdAt: Date;
}

SystemEvent.init(
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      primaryKey: true,
      autoIncrement: true
    },
    type: {
      type: DataTypes.STRING,
      allowNull: false
    },
    message: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    createdAt: {
      type: DataTypes.DATE,
      allowNull: false,
      field: "created_at",
      defaultValue: DataTypes.NOW
    }
  },
  {
    sequelize,
    modelName: "SystemEvent",
    tableName: "system_events",
    timestamps: false // optional — disable Sequelize auto timestamps
  }
);
