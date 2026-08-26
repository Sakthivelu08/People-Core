import { Request, Response, NextFunction } from 'express';
import { EmployeeService } from '../services/employee.service';

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

      if (!azure_oid || !name || !email) {
        res.status(400).json({ error: 'Missing required fields: azure_oid, name, and email are mandatory.' });
        return;
      }

      const employeeId = await EmployeeService.registerEmployee({
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
      });

      res.status(201).json({
        message: 'Employee registered successfully, default leave balance and onboarding tasks initialized.',
        employeeId
      });
    } catch (error: any) {
      // Check for duplicate key error
      if (error.code === 'ER_DUP_ENTRY') {
        res.status(409).json({ error: 'Conflict: An employee with this email or Azure OID already exists.' });
      } else {
        next(error);
      }
    }
  }
}
