CREATE TABLE audit_log (
    id BIGSERIAL PRIMARY KEY,
    table_name VARCHAR(100) NOT NULL,
    record_id BIGINT NOT NULL,
    operation VARCHAR(10) NOT NULL,  -- INSERT, UPDATE, DELETE
    old_data JSONB,
    new_data JSONB,
    executed_by VARCHAR(100),
    executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    record_hash TEXT  -- optional: cryptographic hash for non-repudiation
);


CREATE OR REPLACE FUNCTION fn_audit_log()
RETURNS TRIGGER AS $$
DECLARE
    v_old JSONB;
    v_new JSONB;
    v_hash TEXT;
BEGIN
    IF (TG_OP = 'DELETE') THEN
        v_old := to_jsonb(OLD);
        v_new := NULL;
    ELSIF (TG_OP = 'UPDATE') THEN
        v_old := to_jsonb(OLD);
        v_new := to_jsonb(NEW);
    ELSIF (TG_OP = 'INSERT') THEN
        v_old := NULL;
        v_new := to_jsonb(NEW);
    END IF;

    -- Optional cryptographic hash for integrity verification
    v_hash := encode(digest(COALESCE(v_old::text,'') || COALESCE(v_new::text,''), 'sha256'), 'hex');

    INSERT INTO audit_log (
        table_name,
        record_id,
        operation,
        old_data,
        new_data,
        executed_by,
        record_hash
    ) VALUES (
        TG_TABLE_NAME,
        COALESCE(NEW.id, OLD.id),
        TG_OP,
        v_old,
        v_new,
        current_user,
        v_hash
    );

    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Triggers For Tables
CREATE TRIGGER trg_wallet_audit
AFTER INSERT OR UPDATE OR DELETE ON wallets
FOR EACH ROW EXECUTE FUNCTION fn_audit_log();

CREATE TRIGGER trg_customer_audit
AFTER INSERT OR UPDATE OR DELETE ON customers
FOR EACH ROW EXECUTE FUNCTION fn_audit_log();
