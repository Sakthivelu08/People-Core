import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables from server/.env
dotenv.config({ path: path.join(__dirname, '../../.env') });

const dbConfig = {
  host: process.env.DB_HOST || '127.0.0.1',
  port: parseInt(process.env.DB_PORT || '3306', 10),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'peoplecore',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 0
};

console.log(`[Database] Initializing connection pool for ${dbConfig.user}@${dbConfig.host}:${dbConfig.port}/${dbConfig.database}`);

export const pool = mysql.createPool(dbConfig);

// Helper function to query the database
export async function query<T = any>(sql: string, params?: any[]): Promise<T> {
  const [results] = await pool.execute(sql, params);
  return results as T;
}

// Check database connection health
export async function checkConnection(): Promise<boolean> {
  try {
    const connection = await pool.getConnection();
    console.log('[Database] Connection verified successfully.');
    connection.release();
    return true;
  } catch (error: any) {
    console.error('[Database] Connection failed:', error.message);
    return false;
  }
}
