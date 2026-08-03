-- Enable required PostgreSQL extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "citext";

-- Log successful initialization
DO $$
BEGIN
  RAISE NOTICE 'SENYX ERP database initialized successfully';
END $$;
