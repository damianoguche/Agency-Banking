/**
 * The migration to automatically log every invalid BVN attempt into
 * a new table bvn_audit_log — capturing:
 * The Customer ID (if available),
 * The IP address of the client (via MySQL session variable),
 * The User/DB account that executed the operation,
 * The invalid BVN attempted
 * The operation type (INSERT or UPDATE)
 * The timestamp
 * Optionally the username or system user (if available in session
 * context).
 * A non-repudiation evidence — A prove that all BVN violations were
 * caught, blocked, and logged during an audit.
 * Ensures audit trail answers all 5 Ws:
 * Who, What, When, Where, and Why (validation failure)
 */

"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    const tableName = "customers";

    // Create the audit log table
    await queryInterface.createTable("bvn_audit_log", {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      customer_id: {
        type: Sequelize.INTEGER,
        allowNull: true
      },
      attempted_bvn: {
        type: Sequelize.STRING(50),
        allowNull: false
      },
      operation_type: {
        type: Sequelize.STRING(20),
        allowNull: false
      },
      attempted_by: {
        type: Sequelize.STRING(100),
        allowNull: true
      },
      ip_address: {
        type: Sequelize.STRING(45), // supports IPv4 and IPv6
        allowNull: true
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP")
      }
    });

    console.log("Created 'bvn_audit_log' table for invalid BVN attempts.");

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

    // Drop any existing triggers to avoid duplicates
    await queryInterface.sequelize.query(`
      DROP TRIGGER IF EXISTS validate_bvn_before_insert;
      DROP TRIGGER IF EXISTS validate_bvn_before_update;
    `);

    // Create new triggers with audit logging
    await queryInterface.sequelize.query(`
      CREATE TRIGGER validate_bvn_before_insert
      BEFORE INSERT ON ${tableName}
      FOR EACH ROW
      BEGIN
        DECLARE user_ip VARCHAR(45);
        -- Try to capture IP address (MySQL 8.0+ supports host variables)
        SET user_ip = (SELECT SUBSTRING_INDEX(host, ':', 1) FROM performance_schema.threads WHERE thread_id = CONNECTION_ID() LIMIT 1);

        IF NEW.bvn IS NOT NULL AND (NEW.bvn NOT REGEXP '^[0-9]{11}$') THEN
          INSERT INTO bvn_audit_log (customer_id, attempted_bvn, operation_type, attempted_by,  ip_address)
          VALUES (NEW.id, NEW.bvn, 'INSERT', USER(), user_ip);
          SIGNAL SQLSTATE '45000'
          SET MESSAGE_TEXT = 'Invalid BVN: must be exactly 11 numeric digits.';
        END IF;
      END;
    `);

    await queryInterface.sequelize.query(`
      CREATE TRIGGER validate_bvn_before_update
      BEFORE UPDATE ON ${tableName}
      FOR EACH ROW
      BEGIN
        DECLARE user_ip VARCHAR(45);
        SET user_ip = (SELECT SUBSTRING_INDEX(host, ':', 1) FROM performance_schema.threads WHERE thread_id = CONNECTION_ID() LIMIT 1);

        IF NEW.bvn IS NOT NULL AND (NEW.bvn NOT REGEXP '^[0-9]{11}$') THEN
          INSERT INTO bvn_audit_log (customer_id, attempted_bvn, operation_type, attempted_by, ip_address)
          VALUES (OLD.id, NEW.bvn, 'UPDATE', USER(), user_ip);
          SIGNAL SQLSTATE '45000'
          SET MESSAGE_TEXT = 'Invalid BVN: must be exactly 11 numeric digits.';
        END IF;
      END;
    `);

    console.log("Added BVN validation triggers with audit logging.");

    // Populate 20 sample BVNs for existing records
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

    // Drop triggers
    await queryInterface.sequelize.query(`
      DROP TRIGGER IF EXISTS validate_bvn_before_insert;
      DROP TRIGGER IF EXISTS validate_bvn_before_update;
    `);

    // Drop audit table
    await queryInterface.dropTable("bvn_audit_log");

    // Remove BVN column if it exists
    const tableInfo = await queryInterface.describeTable(tableName);
    if (tableInfo.bvn) {
      await queryInterface.removeColumn(tableName, "bvn");
    }

    console.log("Rolled back BVN audit and validation setup.");
  }
};
