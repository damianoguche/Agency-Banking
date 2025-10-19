"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn("ledger_audit_log", "review_status", {
      type: Sequelize.ENUM("pending", "under_review", "resolved"),
      defaultValue: "pending"
    });
    await queryInterface.addColumn("ledger_audit_log", "reviewed_by", {
      type: Sequelize.STRING,
      allowNull: true
    });
    await queryInterface.addColumn("ledger_audit_log", "resolution_notes", {
      type: Sequelize.TEXT,
      allowNull: true
    });
    await queryInterface.addColumn("ledger_audit_log", "resolved_at", {
      type: Sequelize.DATE,
      allowNull: true
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn("ledger_audit_log", "reviewed_by");
    await queryInterface.removeColumn("ledger_audit_log", "resolution_notes");
    await queryInterface.removeColumn("ledger_audit_log", "resolved_at");
  }
};
