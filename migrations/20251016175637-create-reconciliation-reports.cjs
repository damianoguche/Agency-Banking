// migrations/20251016-create-reconciliation-reports.js
"use strict";
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable("reconciliation_reports", {
      id: {
        type: Sequelize.BIGINT.UNSIGNED,
        autoIncrement: true,
        primaryKey: true
      },
      run_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP")
      },
      reference: { type: Sequelize.STRING(128), allowNull: true },
      debit_sum: { type: Sequelize.DECIMAL(30, 2), allowNull: true },
      credit_sum: { type: Sequelize.DECIMAL(30, 2), allowNull: true },
      issue: { type: Sequelize.STRING(512), allowNull: true },
      payload: { type: Sequelize.JSON, allowNull: true }
    });
  },
  down: async (queryInterface) => {
    await queryInterface.dropTable("reconciliation_reports");
  }
};
