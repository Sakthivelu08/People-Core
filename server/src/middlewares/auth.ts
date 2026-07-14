import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import jwksClient from 'jwks-rsa';
import dotenv from 'dotenv';
import path from 'path';
import { pool } from '../config/db';
import { AuthUser } from '../types';

dotenv.config({ path: path.join(__dirname, '../../.env') });

const validateAzureToken = process.env.VALIDATE_AZURE_TOKEN === 'true';
const tenantId = process.env.AZURE_TENANT_ID;
const clientId = process.env.AZURE_CLIENT_ID;

// Configure JWKS client to fetch Microsoft public certificates
const client = jwksClient({
  jwksUri: `https://login.microsoftonline.com/common/discovery/v2.0/keys`,
  cache: true,
  rateLimit: true,
  jwksRequestsPerMinute: 10
});

function getKey(header: jwt.JwtHeader, callback: jwt.SigningKeyCallback) {
  client.getSigningKey(header.kid, (err, key) => {
    if (err) {
      callback(err);
    } else {
      const signingKey = key?.getPublicKey();
      callback(null, signingKey);
    }
  });
}

export async function authenticate(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    let azureOid: string | null = null;
    let email: string | null = null;

    if (validateAzureToken) {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        res.status(401).json({ error: 'Unauthorized: Missing or invalid Authorization header.' });
        return;
      }

      const token = authHeader.split(' ')[1];

      // Verify Entra ID Token
      await new Promise<void>((resolve, reject) => {
        const options: jwt.VerifyOptions = {
          audience: clientId,
          issuer: `https://login.microsoftonline.com/${tenantId}/v2.0`
        };

        jwt.verify(token, getKey, options, (err, decoded: any) => {
          if (err) {
            reject(err);
          } else {
            azureOid = decoded.oid;
            email = decoded.preferred_username || decoded.email;
            resolve();
          }
        });
      });
    } else {
      // In development mode, check header x-user-oid, fallback to default seed admin employee
      const testOid = req.headers['x-user-oid'] || req.headers['X-User-Oid'];
      if (testOid) {
        azureOid = testOid as string;
      } else {
        // Fallback to Sakthivelu Selvam's seed azure_oid for local ease of access
        azureOid = 'a5d0a53b-8704-4866-aa37-0ea2a9f93238';
      }
    }

    if (!azureOid) {
      res.status(401).json({ error: 'Unauthorized: Unable to resolve user identity.' });
      return;
    }

    // Query employee from database
    const [rows]: any = await pool.execute(
      'SELECT id, azure_oid, name, email, role, department FROM employees WHERE azure_oid = ?',
      [azureOid]
    );

    if (!rows || rows.length === 0) {
      // In development, if user is not in DB, we can automatically create a test employee to make testing frictionless.
      if (!validateAzureToken) {
        const newId = azureOid; // Use OID as UUID for test simplicty or generate
        console.log(`[Auth] Temp-creating dev user in database for OID: ${azureOid}`);
        
        await pool.execute(
          `INSERT INTO employees (id, azure_oid, name, email, job_title, department, role, status)
           VALUES (?, ?, ?, ?, 'Developer', 'Engineering', 'Employee', 'active')`,
          [newId, azureOid, 'Test User', `${azureOid}@example.com`]
        );

        // Also initialize their leave balance
        await pool.execute(
          `INSERT INTO leave_balances (id, employee_id) VALUES (UUID(), ?)`,
          [newId]
        );

        const user: AuthUser = {
          id: newId,
          azure_oid: azureOid,
          name: 'Test User',
          email: `${azureOid}@example.com`,
          role: 'Employee',
          department: 'Engineering'
        };
        req.user = user;
        next();
        return;
      }

      res.status(403).json({ error: 'Forbidden: User identity verified but no matching employee profile exists.' });
      return;
    }

    const matchedEmployee = rows[0];
    req.user = {
      id: matchedEmployee.id,
      azure_oid: matchedEmployee.azure_oid,
      name: matchedEmployee.name,
      email: matchedEmployee.email,
      role: matchedEmployee.role,
      department: matchedEmployee.department || 'General'
    };

    next();
  } catch (error: any) {
    console.error('[AuthMiddleware] Authentication error:', error.message);
    res.status(401).json({ error: `Unauthorized: ${error.message}` });
  }
}

// Middleware to restrict access to Admins only
export function authorizeAdmin(req: Request, res: Response, next: NextFunction): void {
  if (!req.user || req.user.role !== 'Admin') {
    res.status(403).json({ error: 'Forbidden: Administrative privileges required.' });
    return;
  }
  next();
}
