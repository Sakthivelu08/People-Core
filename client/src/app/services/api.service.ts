import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_CONFIG } from '../core/constants/config.constants';

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private http = inject(HttpClient);
  private baseUrl = API_CONFIG.baseUrl;
  private endpoints = API_CONFIG.endpoints;

  // --- Employees ---
  getProfile(): Observable<any> {
    return this.http.get(`${this.baseUrl}${this.endpoints.employeeMe}`);
  }

  getEmployees(): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}${this.endpoints.employees}`);
  }

  registerEmployee(employee: any): Observable<any> {
    return this.http.post(`${this.baseUrl}${this.endpoints.employees}`, employee);
  }

  // --- Leaves ---
  getLeaveBalances(): Observable<any> {
    return this.http.get(`${this.baseUrl}${this.endpoints.leaveBalances}`);
  }

  getLeaveRequests(): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}${this.endpoints.leaveRequests}`);
  }

  submitLeaveRequest(request: { type: string; start_date: string; end_date: string; days: number; reason: string }): Observable<any> {
    return this.http.post(`${this.baseUrl}${this.endpoints.leaveRequests}`, request);
  }

  approveLeaveRequest(id: string): Observable<any> {
    return this.http.patch(`${this.baseUrl}${this.endpoints.leaveRequests}/${id}/approve`, {});
  }

  rejectLeaveRequest(id: string): Observable<any> {
    return this.http.patch(`${this.baseUrl}${this.endpoints.leaveRequests}/${id}/reject`, {});
  }

  // --- Onboarding ---
  getOnboardingTasks(employeeId?: string): Observable<any[]> {
    let params = new HttpParams();
    if (employeeId) {
      params = params.set('employeeId', employeeId);
    }
    const url = `${this.baseUrl}${this.endpoints.onboardingTasks}`;
    return this.http.get<any[]>(url, { params });
  }

  toggleOnboardingTask(id: string): Observable<any> {
    return this.http.patch(`${this.baseUrl}${this.endpoints.onboardingTasks}/${id}/toggle`, {});
  }

  // --- Insights ---
  getAttritionRisk(): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}${this.endpoints.attrition}`);
  }

  getEngagementScores(): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}${this.endpoints.engagement}`);
  }

  getNarrativeSummary(): Observable<any> {
    return this.http.get(`${this.baseUrl}${this.endpoints.narrative}`);
  }
}
