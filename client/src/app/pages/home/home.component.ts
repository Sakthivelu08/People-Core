import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { DatePipe, TitleCasePipe, UpperCasePipe } from '@angular/common';
import { MsalService } from '@azure/msal-angular';
import { ApiService } from '../../services/api.service';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [FormsModule, DatePipe, TitleCasePipe, UpperCasePipe],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent implements OnInit {
  profile: any;
  photoUrl: string | null = null;
  groups: any[] = [];
  roles: any[] = [];
  dbProfile: any = null;

  activeTab: 'profile' | 'leaves' | 'onboarding' | 'insights' | 'admin' = 'profile';

  employeesList: any[] = [];
  selectedEmployee: any = null;
  selectedTasks: any[] = [];
  adminProgress: number = 0;
  showAddForm: boolean = false;
  newEmployee = { name: '', email: '', azure_oid: 'generate', job_title: '', department: '', office_location: '', mobile_phone: '', role: 'Employee', join_date: '' };
  addEmployeeSuccess: string | null = null;
  addEmployeeError: string | null = null;

  // Leaves state
  leaveBalances: any = null;
  leaveRequests: any[] = [];
  newLeave = { type: 'annual', start_date: '', end_date: '', days: 1, reason: '' };
  leaveSuccess: string | null = null;
  leaveError: string | null = null;

  // Onboarding state
  onboardingTasks: any[] = [];

  // Insights state
  narrativeSummary: string = '';
  engagementScores: any[] = [];
  attritionRisk: any[] = [];

  constructor(
    private http: HttpClient,
    private msal: MsalService,
    private api: ApiService
  ) {}

  async ngOnInit() {
    const account = this.msal.instance.getActiveAccount();
    if (!account) return;

    // Roles from token
    this.roles = account.idTokenClaims?.roles as string[] || [];

    // Fetch Graph Profile
    this.fetchGraphProfile(account);

    // Fetch all backend API data
    this.fetchDbProfile();
    this.fetchLeaveData();
    this.fetchOnboardingData();
  }

  // Check if User is Admin
  get isAdmin(): boolean {
    return this.roles.includes('Admin') || (this.dbProfile && this.dbProfile.role === 'Admin');
  }

  // Fetch Microsoft Graph info
  async fetchGraphProfile(account: any) {
    try {
      const result = await this.msal.instance.acquireTokenSilent({
        scopes: ['User.Read', 'Group.Read.All', 'Directory.Read.All'],
        account
      });

      const headers = { Authorization: `Bearer ${result.accessToken}` };

      this.http.get('https://graph.microsoft.com/v1.0/me', { headers })
        .subscribe((data: any) => {
          this.profile = data;
        });

      this.http.get('https://graph.microsoft.com/v1.0/me/photo/$value', { headers, responseType: 'blob' })
        .subscribe({
          next: (blob) => {
            this.photoUrl = URL.createObjectURL(blob);
          },
          error: () => (this.photoUrl = null)
        });

      this.http.get('https://graph.microsoft.com/v1.0/me/memberOf', { headers })
        .subscribe((groups: any) => {
          this.groups = groups.value || [];
        });
    } catch (err) {
      console.error('Error fetching Graph API details:', err);
    }
  }

  // Fetch employee details from MySQL via Express backend
  fetchDbProfile() {
    this.api.getProfile().subscribe({
      next: (data) => {
        this.dbProfile = data;
        // In case the admin role is defined in the db and not the ID token, refresh insights
        this.fetchInsightsData();
      },
      error: (err) => console.error('Failed to load DB profile:', err)
    });
  }

  // Fetch Leave Balances and History
  fetchLeaveData() {
    this.api.getLeaveBalances().subscribe({
      next: (data) => this.leaveBalances = data,
      error: (err) => console.error('Failed to fetch leave balances:', err)
    });

    this.api.getLeaveRequests().subscribe({
      next: (data) => this.leaveRequests = data,
      error: (err) => console.error('Failed to fetch leave requests:', err)
    });
  }

  // Fetch Onboarding Checklist
  fetchOnboardingData() {
    this.api.getOnboardingTasks().subscribe({
      next: (data) => this.onboardingTasks = data,
      error: (err) => console.error('Failed to fetch onboarding tasks:', err)
    });
  }

  // Fetch AI insights narrative & metrics
  fetchInsightsData() {
    this.api.getNarrativeSummary().subscribe({
      next: (data) => this.narrativeSummary = data.narrative || '',
      error: (err) => console.error('Failed to fetch narrative summary:', err)
    });

    this.api.getEngagementScores().subscribe({
      next: (data) => this.engagementScores = data,
      error: (err) => console.error('Failed to fetch engagement scores:', err)
    });

    // If Admin, load attrition risk scores
    if (this.isAdmin) {
      this.api.getAttritionRisk().subscribe({
        next: (data) => this.attritionRisk = data,
        error: (err) => console.error('Failed to fetch attrition risk scores:', err)
      });
    }
  }

  // Submit Leave Request Form
  submitLeave() {
    this.leaveSuccess = null;
    this.leaveError = null;

    if (!this.newLeave.start_date || !this.newLeave.end_date || !this.newLeave.reason || this.newLeave.days <= 0) {
      this.leaveError = 'Please fill out all fields with valid values.';
      return;
    }

    this.api.submitLeaveRequest(this.newLeave).subscribe({
      next: (res) => {
        this.leaveSuccess = 'Leave request submitted successfully!';
        this.newLeave = { type: 'annual', start_date: '', end_date: '', days: 1, reason: '' };
        this.fetchLeaveData(); // refresh leaves
      },
      error: (err) => {
        this.leaveError = err.error?.error || 'Failed to submit leave request.';
      }
    });
  }

  // Admin: Approve Leave Request
  approveLeave(id: string) {
    this.api.approveLeaveRequest(id).subscribe({
      next: () => this.fetchLeaveData(),
      error: (err) => console.error('Failed to approve request:', err)
    });
  }

  // Admin: Reject Leave Request
  rejectLeave(id: string) {
    this.api.rejectLeaveRequest(id).subscribe({
      next: () => this.fetchLeaveData(),
      error: (err) => console.error('Failed to reject request:', err)
    });
  }

  // Toggle Onboarding Task Checked Status
  toggleTask(task: any) {
    this.api.toggleOnboardingTask(task.id).subscribe({
      next: (res) => {
        task.completed = res.completed;
        task.completed_date = res.completed_date;
      },
      error: (err) => {
        console.error('Failed to toggle task:', err);
      }
    });
  }

  calculateAdminProgress() {
    if (!this.selectedTasks || this.selectedTasks.length === 0) {
      this.adminProgress = 0;
      return;
    }
    const completed = this.selectedTasks.filter(t => t.completed).length;
    this.adminProgress = Math.round((completed / this.selectedTasks.length) * 100);
  }

  fetchAdminData() {
    this.api.getEmployees().subscribe({
      next: (data) => {
        this.employeesList = data;
      },
      error: (err) => console.error('Failed to fetch employees list:', err)
    });
  }

  selectEmployee(emp: any) {
    this.selectedEmployee = emp;
    this.selectedTasks = [];
    this.adminProgress = 0;
    this.api.getOnboardingTasks(emp.id).subscribe({
      next: (data) => {
        this.selectedTasks = data;
        this.calculateAdminProgress();
      },
      error: (err) => console.error('Failed to fetch employee onboarding tasks:', err)
    });
  }

  toggleAdminTask(task: any) {
    this.api.toggleOnboardingTask(task.id).subscribe({
      next: (res) => {
        task.completed = res.completed;
        task.completed_date = res.completed_date;
        this.calculateAdminProgress();
      },
      error: (err) => console.error('Failed to toggle onboarding task:', err)
    });
  }

  addEmployee() {
    this.addEmployeeSuccess = null;
    this.addEmployeeError = null;
    this.api.registerEmployee(this.newEmployee).subscribe({
      next: (res) => {
        this.addEmployeeSuccess = 'Employee registered successfully!';
        this.newEmployee = { name: '', email: '', azure_oid: 'generate', job_title: '', department: '', office_location: '', mobile_phone: '', role: 'Employee', join_date: '' };
        this.fetchAdminData();
      },
      error: (err) => {
        this.addEmployeeError = err.error?.error || 'Failed to register employee.';
      }
    });
  }

  logout() {
    this.msal.logoutRedirect();
  }
}

