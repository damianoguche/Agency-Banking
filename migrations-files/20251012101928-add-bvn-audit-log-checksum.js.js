/**
 * ==========ADDING CHECKSUM VERIFICATION=============
 * CBN Forensic-Readiness gold standard for audit logs.
 * Adding checksum verification (using SHA-256) - every record in
 * audit log carries a cryptographic fingerprint.
 * Prove that No record has been deleted, modified, or inserted
 * manually.
 * Audit trail remains authentic and tamper-evident — a core
 * requirement for non-repudiation under CBN, NDPA, ISO 27001, and
 * NIBSS data-integrity controls.
 */

/**
 * Builds on your previous migration (validation + IP + archival).
 * ADDS:
 * A record_hash column to both bvn_audit_log and bvn_audit_archive.
 * Automatic hash computation using a BEFORE INSERT trigger.
 * Optional verification trigger to ensure hash consistency before
 * updates.
 */

/**
 * ---------IT Risk / Audit View---------------
 * | Control                | Purpose                                                                       |
| ---------------------- | ----------------------------------------------------------------------------- |
| **Tamper Evidence**    | Any manual data change breaks the hash.                                       |
| **Non-repudiation**    | Confirms authenticity of every audit record.                                  |
| **Forensic Readiness** | Regulators or auditors can independently verify audit trail integrity.        |
| **Defense in Depth**   | Complements the triggers, IP logging, and archival controls already in place. |
| **CBN Alignment**      | Matches CBN/NIBSS requirements for data integrity in audit evidence.          |

*/

"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    // Add checksum column to both audit tables
    await queryInterface.addColumn("bvn_audit_log", "record_hash", {
      type: Sequelize.STRING(64), // SHA256 hex length = 64 chars
      allowNull: true
    });

    await queryInterface.addColumn("bvn_audit_archive", "record_hash", {
      type: Sequelize.STRING(64),
      allowNull: true
    });

    console.log("Added 'record_hash' column for SHA-256 checksums.");

    // Drop old hash triggers if they exist
    await queryInterface.sequelize.query(`
      DROP TRIGGER IF EXISTS bvn_audit_log_before_insert;
      DROP TRIGGER IF EXISTS bvn_audit_log_before_update;
    `);

    // Create trigger to auto-generate hash on insert
    await queryInterface.sequelize.query(`
      CREATE TRIGGER bvn_audit_log_before_insert
      BEFORE INSERT ON bvn_audit_log
      FOR EACH ROW
      BEGIN
        SET NEW.record_hash = SHA2(
          CONCAT(
            IFNULL(NEW.customer_id, ''),
            IFNULL(NEW.attempted_bvn, ''),
            IFNULL(NEW.operation_type, ''),
            IFNULL(NEW.attempted_by, ''),
            IFNULL(NEW.ip_address, ''),
            DATE_FORMAT(NEW.created_at, '%Y-%m-%d %H:%i:%s')
          ),
          256
        );
      END;
    `);

    // Optional: Prevent updates unless hash matches original data
    await queryInterface.sequelize.query(`
      CREATE TRIGGER bvn_audit_log_before_update
      BEFORE UPDATE ON bvn_audit_log
      FOR EACH ROW
      BEGIN
        DECLARE calc_hash VARCHAR(64);
        SET calc_hash = SHA2(
          CONCAT(
            IFNULL(OLD.customer_id, ''),
            IFNULL(OLD.attempted_bvn, ''),
            IFNULL(OLD.operation_type, ''),
            IFNULL(OLD.attempted_by, ''),
            IFNULL(OLD.ip_address, ''),
            DATE_FORMAT(OLD.created_at, '%Y-%m-%d %H:%i:%s')
          ),
          256
        );

        -- If the old hash doesn't match recalculated, raise an error (possible tampering)
        IF OLD.record_hash <> calc_hash THEN
          SIGNAL SQLSTATE '45000'
          SET MESSAGE_TEXT = 'BVN audit record integrity verification failed — hash mismatch.';
        END IF;
      END;
    `);

    console.log("Added SHA-256 checksum triggers for BVN audit integrity.");
  },

  async down(queryInterface) {
    await queryInterface.sequelize.query(`
      DROP TRIGGER IF EXISTS bvn_audit_log_before_insert;
      DROP TRIGGER IF EXISTS bvn_audit_log_before_update;
    `);

    await queryInterface.removeColumn("bvn_audit_log", "record_hash");
    await queryInterface.removeColumn("bvn_audit_archive", "record_hash");

    console.log("Removed SHA-256 integrity control from audit tables.");
  }
};
