"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    const tableName = "customers";

    // Check if the BVN column already exists
    const tableInfo = await queryInterface.describeTable(tableName);

    if (!tableInfo.bvn) {
      console.log("Adding 'bvn' column to customers table...");
      await queryInterface.addColumn(tableName, "bvn", {
        type: Sequelize.STRING(11),
        allowNull: true,
        unique: true
      });
    } else {
      console.log("'bvn' column already exists — skipping addColumn");
    }

    // Add CHECK constraint (enforce 11-digit numeric BVN)
    // For MySQL: use REGEXP to match exactly 11 digits.
    try {
      await queryInterface.sequelize.query(`
        ALTER TABLE ${tableName}
        ADD CONSTRAINT chk_bvn_format
        CHECK (bvn REGEXP '^[0-9]{11}$' OR bvn IS NULL);
      `);
      console.log("Added CHECK constraint: BVN must be 11 digits numeric.");
    } catch (err) {
      console.warn(
        "Could not add CHECK constraint (dialect may not support it):",
        err.message
      );
    }

    // Generate 20 unique BVNs (each 11 digits)
    const bvnList = new Set();

    while (bvnList.size < 20) {
      const randomBvn = String(
        Math.floor(10000000000 + Math.random() * 90000000000)
      );
      bvnList.add(randomBvn);
    }

    const bvns = Array.from(bvnList);

    // Fetch up to 20 existing customers
    const [customers] = await queryInterface.sequelize.query(`
      SELECT id FROM ${tableName} LIMIT 20;
    `);

    // Update each one with a unique BVN
    for (let i = 0; i < customers.length; i++) {
      const id = customers[i].id;
      const bvn = bvns[i];
      await queryInterface.sequelize.query(`
        UPDATE ${tableName} SET bvn = '${bvn}' WHERE id = ${id};
      `);
    }

    console.log(`Populated ${customers.length} customers with BVNs`);
  },

  async down(queryInterface, Sequelize) {
    const tableName = "customers";

    // Remove constraint if it exists
    try {
      await queryInterface.sequelize.query(`
        ALTER TABLE ${tableName}
        DROP CHECK chk_bvn_format;
      `);
      console.log("Removed CHECK constraint.");
    } catch (err) {
      console.warn("Could not remove CHECK constraint:", err.message);
    }

    // Rollback: remove the bvn column entirely
    // const tableInfo = await queryInterface.describeTable(tableName);
    // if (tableInfo.bvn) {
    //   await queryInterface.removeColumn(tableName, "bvn");
    //   console.log("Removed 'bvn' column from customers table.");
    // }

    // Rollback: clear BVNs that were set by this migration
    await queryInterface.sequelize.query(`
      UPDATE ${tableName} SET bvn = NULL;
    `);
    console.log("BVN column set to NULL");
  }
};
