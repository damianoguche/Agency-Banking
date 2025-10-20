"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.LedgerAuditLog = void 0;
var sequelize_1 = require("sequelize");
var db_ts_1 = require("../config/db.ts");
var LedgerAuditLog = /** @class */ (function (_super) {
    __extends(LedgerAuditLog, _super);
    function LedgerAuditLog() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    return LedgerAuditLog;
}(sequelize_1.Model));
exports.LedgerAuditLog = LedgerAuditLog;
LedgerAuditLog.init({
    id: {
        type: sequelize_1.DataTypes.INTEGER.UNSIGNED,
        autoIncrement: true,
        primaryKey: true
    },
    walletId: {
        type: sequelize_1.DataTypes.BIGINT,
        allowNull: false
    },
    computed_balance: {
        type: sequelize_1.DataTypes.DECIMAL(20, 2),
        allowNull: false
    },
    actual_balance: {
        type: sequelize_1.DataTypes.DECIMAL(20, 2),
        allowNull: false
    },
    difference: {
        type: sequelize_1.DataTypes.DECIMAL(20, 2),
        allowNull: false
    },
    status: {
        type: sequelize_1.DataTypes.ENUM("consistent", "inconsistent"),
        defaultValue: "inconsistent"
    },
    review_status: {
        type: sequelize_1.DataTypes.ENUM("pending", "under_review", "resolved"),
        defaultValue: "pending"
    },
    reviewed_by: {
        type: sequelize_1.DataTypes.STRING(255),
        allowNull: true
    },
    resolution_notes: {
        type: sequelize_1.DataTypes.TEXT,
        allowNull: true
    },
    resolved_at: {
        type: sequelize_1.DataTypes.DATE,
        allowNull: true
    },
    created_at: {
        type: sequelize_1.DataTypes.DATE,
        defaultValue: sequelize_1.DataTypes.NOW
    },
    updated_at: {
        // DB-level fallback
        type: sequelize_1.DataTypes.DATE,
        allowNull: false,
        defaultValue: sequelize_1.DataTypes.NOW
    }
}, {
    sequelize: db_ts_1.default,
    modelName: "LedgerAuditLog",
    tableName: "ledger_audit_log",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at"
});
