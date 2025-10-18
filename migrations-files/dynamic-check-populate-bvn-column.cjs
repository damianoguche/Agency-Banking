/**
 * Instead of relying only on a static CHECK constraint, we’ll
 * implement a dynamic BVN validation trigger that automatically
 * verifies the BVN on every INSERT or UPDATE — and rejects invalid
 * ones immediately at the database level.
 *
 * A trigger, however: Runs custom logic before insert/update amd can
 * throw descriptive errors
 */

"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    const tableName = "customers";

    // Add BVN column if missing
    const tableInfo = await queryInterface.describeTable(tableName);
    if (!tableInfo.bvn) {
      await queryInterface.addColumn(tableName, "bvn", {
        type: Sequelize.STRING(11),
        allowNull: true,
        unique: true
      });
      console.log("Added 'bvn' column");
    }

    // Create validation trigger (MySQL syntax)
    await queryInterface.sequelize.query(`
      DROP TRIGGER IF EXISTS validate_bvn_before_insert;
    `);

    await queryInterface.sequelize.query(`
      CREATE TRIGGER validate_bvn_before_insert
      BEFORE INSERT ON ${tableName}
      FOR EACH ROW
      BEGIN
        IF NEW.bvn IS NOT NULL AND (NEW.bvn NOT REGEXP '^[0-9]{11}$') THEN
          SIGNAL SQLSTATE '45000'
          SET MESSAGE_TEXT = 'Invalid BVN: must be exactly 11 numeric digits.';
        END IF;
      END;
    `);

    await queryInterface.sequelize.query(`
      DROP TRIGGER IF EXISTS validate_bvn_before_update;
    `);
    await queryInterface.sequelize.query(`
      CREATE TRIGGER validate_bvn_before_update
      BEFORE UPDATE ON ${tableName}
      FOR EACH ROW
      BEGIN
        IF NEW.bvn IS NOT NULL AND (NEW.bvn NOT REGEXP '^[0-9]{11}$') THEN
          SIGNAL SQLSTATE '45000'
          SET MESSAGE_TEXT = 'Invalid BVN: must be exactly 11 numeric digits.';
        END IF;
      END;
    `);

    console.log("Added BVN validation triggers for INSERT and UPDATE.");

    // Generate 20 unique BVNs and populate existing customers
    const bvnList = new Set();
    while (bvnList.size < 20) {
      const randomBvn = String(
        Math.floor(10000000000 + Math.random() * 90000000000)
      );
      bvnList.add(randomBvn);
    }
    const bvns = Array.from(bvnList);

    const [customers] = await queryInterface.sequelize.query(`
      SELECT id FROM ${tableName} LIMIT 20;
    `);

    for (let i = 0; i < customers.length; i++) {
      const id = customers[i].id;
      const bvn = bvns[i];
      await queryInterface.sequelize.query(`
        UPDATE ${tableName} SET bvn = '${bvn}' WHERE id = ${id};
      `);
    }

    console.log(`Populated ${customers.length} records with valid BVNs`);
  },

  async down(queryInterface, Sequelize) {
    const tableName = "customers";

    // Drop triggers first
    await queryInterface.sequelize.query(
      `DROP TRIGGER IF EXISTS validate_bvn_before_insert;`
    );
    await queryInterface.sequelize.query(
      `DROP TRIGGER IF EXISTS validate_bvn_before_update;`
    );

    console.log("Dropped BVN validation triggers.");

    // Remove BVN column if exists
    const tableInfo = await queryInterface.describeTable(tableName);
    if (tableInfo.bvn) {
      await queryInterface.removeColumn(tableName, "bvn");
      console.log("Removed 'bvn' column.");
    }
  }
};
