/**
 * This script: ====Data Retention and Archival Automation===
 * Keeps the previous validation + logging logic intact.
 * Adds an archive table (bvn_audit_archive).
 * Adds a MySQL Event Scheduler job that runs nightly to move records
 * older than 90 days to the archive.
 * Aligns with CBN, ISO 27001, and NDPA principles — around audit
 * trail retention and data lifecycle management.
 */

/**
 * ==========IT Risk & Audit Benefits===========
CONTROLS	                          DESCRIPTION
Integrity Control	                Prevents invalid BVNs from entering the system.
Auditability	                    Captures all failed BVN attempts with metadata.
Traceability	                    Logs include user, customer ID, and IP address.
Retention Policy	                Old logs are archived after 90 days — not deleted.
Non-repudiation Evidence	        Supports forensic analysis for regulator audits.
*/

"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    const tableName = "customers";

    // Create the main audit log table
    await queryInterface.createTable("bvn_audit_log", {
      id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
      customer_id: { type: Sequelize.INTEGER, allowNull: true },
      attempted_bvn: { type: Sequelize.STRING(50), allowNull: false },
      operation_type: { type: Sequelize.STRING(20), allowNull: false },
      attempted_by: { type: Sequelize.STRING(100), allowNull: true },
      ip_address: { type: Sequelize.STRING(45), allowNull: true },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP")
      }
    });

    // Create the archive table
    await queryInterface.createTable("bvn_audit_archive", {
      id: { type: Sequelize.INTEGER, allowNull: false, primaryKey: true },
      customer_id: { type: Sequelize.INTEGER, allowNull: true },
      attempted_bvn: { type: Sequelize.STRING(50), allowNull: false },
      operation_type: { type: Sequelize.STRING(20), allowNull: false },
      attempted_by: { type: Sequelize.STRING(100), allowNull: true },
      ip_address: { type: Sequelize.STRING(45), allowNull: true },
      created_at: { type: Sequelize.DATE, allowNull: false },
      archived_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP")
      }
    });

    console.log("Created 'bvn_audit_archive' table for log retention.");

    // Add BVN column if missing
    const tableInfo = await queryInterface.describeTable(tableName);
    if (!tableInfo.bvn) {
      await queryInterface.addColumn(tableName, "bvn", {
        type: Sequelize.STRING(11),
        allowNull: true,
        unique: true
      });
      console.log("Added 'bvn' column to customers table.");
    }

    // Drop old triggers (if they exist)
    await queryInterface.sequelize.query(`
      DROP TRIGGER IF EXISTS validate_bvn_before_insert;
      DROP TRIGGER IF EXISTS validate_bvn_before_update;
    `);

    // Add new validation triggers with full audit trail
    await queryInterface.sequelize.query(`
      CREATE TRIGGER validate_bvn_before_insert
      BEFORE INSERT ON ${tableName}
      FOR EACH ROW
      BEGIN
        DECLARE user_ip VARCHAR(45);
        SET user_ip = (SELECT SUBSTRING_INDEX(host, ':', 1)
                       FROM performance_schema.threads
                       WHERE thread_id = CONNECTION_ID()
                       LIMIT 1);

        IF NEW.bvn IS NOT NULL AND (NEW.bvn NOT REGEXP '^[0-9]{11}$') THEN
          INSERT INTO bvn_audit_log (customer_id, attempted_bvn, operation_type, attempted_by, ip_address)
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
        SET user_ip = (SELECT SUBSTRING_INDEX(host, ':', 1)
                       FROM performance_schema.threads
                       WHERE thread_id = CONNECTION_ID()
                       LIMIT 1);

        IF NEW.bvn IS NOT NULL AND (NEW.bvn NOT REGEXP '^[0-9]{11}$') THEN
          INSERT INTO bvn_audit_log (customer_id, attempted_bvn, operation_type, attempted_by, ip_address)
          VALUES (OLD.id, NEW.bvn, 'UPDATE', USER(), user_ip);
          SIGNAL SQLSTATE '45000'
          SET MESSAGE_TEXT = 'Invalid BVN: must be exactly 11 numeric digits.';
        END IF;
      END;
    `);

    console.log("Created triggers with BVN validation and audit trail.");

    // Add nightly archive job (MySQL Event Scheduler)
    await queryInterface.sequelize.query(`
      SET GLOBAL event_scheduler = ON;

      CREATE EVENT IF NOT EXISTS archive_old_bvn_audit_logs
      ON SCHEDULE EVERY 1 DAY
      STARTS CURRENT_TIMESTAMP + INTERVAL 1 DAY
      DO
      BEGIN
        INSERT INTO bvn_audit_archive (id, customer_id, attempted_bvn, operation_type, attempted_by, ip_address, created_at)
        SELECT id, customer_id, attempted_bvn, operation_type, attempted_by, ip_address, created_at
        FROM bvn_audit_log
        WHERE created_at < NOW() - INTERVAL 90 DAY;

        DELETE FROM bvn_audit_log
        WHERE created_at < NOW() - INTERVAL 90 DAY;
      END;
    `);

    console.log("Nightly archive job created (retains 90 days of audit logs).");
  },

  async down(queryInterface) {
    // Drop triggers and archive job
    await queryInterface.sequelize.query(`
      DROP EVENT IF EXISTS archive_old_bvn_audit_logs;
      DROP TRIGGER IF EXISTS validate_bvn_before_insert;
      DROP TRIGGER IF EXISTS validate_bvn_before_update;
    `);

    await queryInterface.dropTable("bvn_audit_archive");
    await queryInterface.dropTable("bvn_audit_log");

    console.log("Rolled back BVN audit, validation, and archive setup.");
  }
};
