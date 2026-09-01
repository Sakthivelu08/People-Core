import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables from server/.env
dotenv.config({ path: path.join(__dirname, '../../.env') });

const isSslEnabled = process.env.DB_SSL === 'true' || 
                     (process.env.DB_HOST && (process.env.DB_HOST.includes('tidbcloud.com') || process.env.DB_HOST.includes('azure.com')));

const dbConfig: any = {
  host: process.env.DB_HOST || '127.0.0.1',
  port: parseInt(process.env.DB_PORT || '3306', 10),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'peoplecore',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 0,
  ssl: isSslEnabled ? { minVersion: 'TLSv1.2', rejectUnauthorized: false } : undefined
};

console.log(`[Database] Initializing connection pool for ${dbConfig.user}@${dbConfig.host}:${dbConfig.port}/${dbConfig.database}`);

export const pool = mysql.createPool(dbConfig);

// Helper function to query the database
export async function query<T = any>(sql: string, params?: any[]): Promise<T> {
  const [results] = await pool.execute(sql, params);
  return results as T;
}

// Check database connection health with retry logic
export async function checkConnection(retries: number = 5, delayMs: number = 3000): Promise<boolean> {
  for (let i = 1; i <= retries; i++) {
    try {
      const connection = await pool.getConnection();
      console.log('[Database] Connection verified successfully.');
      connection.release();
      return true;
    } catch (error: any) {
      console.error(`[Database] Connection attempt ${i}/${retries} failed:`, error.message);
      if (i < retries) {
        console.log(`[Database] Retrying in ${delayMs / 1000} seconds...`);
        await new Promise((resolve) => setTimeout(resolve, delayMs));
      }
    }
  }
  return false;
}
