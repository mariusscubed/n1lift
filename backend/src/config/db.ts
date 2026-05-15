import sql from 'mssql';
import dotenv from 'dotenv';

dotenv.config();

/** MSSQL connection pool configuration */
const config: sql.config = {
  server: process.env.DB_SERVER || 'localhost',
  database: process.env.DB_DATABASE || 'n1lift',
  user: process.env.DB_USER || 'sa',
  password: process.env.DB_PASSWORD || '',
  port: parseInt(process.env.DB_PORT || '1433', 10),
  options: {
    encrypt: true,
    trustServerCertificate: true, // set false in production with a valid cert
  },
  pool: {
    max: 10,
    min: 0,
    idleTimeoutMillis: 30000,
  },
};

let pool: sql.ConnectionPool | null = null;

/**
 * Initialises and returns the shared MSSQL connection pool.
 */
export async function connectDB(): Promise<sql.ConnectionPool> {
  if (!pool) {
    pool = await new sql.ConnectionPool(config).connect();
    console.log('Connected to Microsoft SQL Server');
  }
  return pool;
}

/**
 * Returns the existing pool (throws if not yet initialised).
 */
export function getPool(): sql.ConnectionPool {
  if (!pool) throw new Error('Database not initialised. Call connectDB() first.');
  return pool;
}

export { sql };
