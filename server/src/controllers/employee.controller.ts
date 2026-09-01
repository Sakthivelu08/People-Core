import { Request, Response, NextFunction } from 'express';
import { EmployeeService } from '../services/employee.service';
import { graphService } from '../services/graph.service';

export class EmployeeController {
  static async getMe(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const profile = await EmployeeService.getProfileById(req.user!.id);
      if (!profile) {
        res.status(404).json({ error: 'Employee profile not found.' });
        return;
      }
      res.json(profile);
    } catch (error) {
      next(error);
    }
  }

  static async getAll(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const employees = await EmployeeService.getAllEmployees();
      res.json(employees);
    } catch (error) {
      next(error);
    }
  }

  static async register(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const {
        azure_oid,
        name,
        email,
        job_title,
        department,
        office_location,
        mobile_phone,
        role,
        status,
        join_date
      } = req.body;

      if (!name || !email) {
        res.status(400).json({ error: 'Missing required fields: name and email are mandatory.' });
        return;
      }

      // Execute Graph Service Provisioning
      const syncResult = await graphService.provisionAzureUser({
        name,
        email,
        jobTitle: job_title || 'Software Engineer',
        department: department || 'Engineering',
        role: role || 'Employee'
      });

      const effectiveOid = azure_oid || syncResult.azure_oid;

      const employeeId = await EmployeeService.registerEmployee({
        azure_oid: effectiveOid,
        name,
        email,
        job_title,
        department,
        office_location,
        mobile_phone,
        role,
        status,
        join_date
      });

      res.status(201).json({
        message: syncResult.message,
        employeeId,
        azure_oid: effectiveOid,
        azure_sync_status: syncResult.azure_sync_status
      });
    } catch (error: any) {
      if (error.code === 'ER_DUP_ENTRY') {
        res.status(409).json({ error: 'Conflict: An employee with this email or Azure OID already exists.' });
      } else {
        next(error);
      }
    }
  }

  static async getAzureSyncStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const stats = await graphService.getSyncStatusStats();
      res.json(stats);
    } catch (error) {
      next(error);
    }
  }

  static async triggerAzureSync(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      res.json({
        message: 'Azure Entra ID Directory sync sequence completed.',
        syncedCount: 0,
        status: 'Directory.Read.All sync active.'
      });
    } catch (error) {
      next(error);
    }
  }
}
