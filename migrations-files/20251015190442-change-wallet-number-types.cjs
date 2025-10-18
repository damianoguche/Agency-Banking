"use strict";

/**
 * This time it will:
Drop the incompatible foreign key constraints.
Convert the columns from INTEGER to VARCHAR.
Keep your data (unless MySQL needs to truncate — but for dev, it’s fine).
*/

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // 1Drop old foreign key constraints first
    await queryInterface.removeConstraint(
      "transactions",
      "transactions_ibfk_1"
    );
    await queryInterface
      .removeConstraint("transactions", "transactions_ibfk_2")
      .catch(() => {});

    // Change column types
    await queryInterface.changeColumn("transactions", "senderWalletNumber", {
      type: Sequelize.STRING,
      allowNull: true
    });
    await queryInterface.changeColumn("transactions", "receiverWalletNumber", {
      type: Sequelize.STRING,
      allowNull: true
    });
  },

  async down(queryInterface, Sequelize) {
    // Optional rollback: restore the columns and constraints
    await queryInterface.changeColumn("transactions", "senderWalletNumber", {
      type: Sequelize.INTEGER.UNSIGNED,
      allowNull: true
    });
    await queryInterface.changeColumn("transactions", "receiverWalletNumber", {
      type: Sequelize.INTEGER.UNSIGNED,
      allowNull: true
    });

    // Recreate constraints (optional)
    await queryInterface.addConstraint("transactions", {
      fields: ["senderWalletNumber"],
      type: "foreign key",
      name: "transactions_ibfk_1",
      references: {
        table: "wallets",
        field: "id"
      }
    });

    await queryInterface.addConstraint("transactions", {
      fields: ["receiverWalletNumber"],
      type: "foreign key",
      name: "transactions_ibfk_2",
      references: {
        table: "wallets",
        field: "id"
      }
    });
  }
};
