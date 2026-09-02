import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ApiService } from '../../../services/api.service';
import { MetricCardComponent } from '../../../shared/components/metric-card/metric-card.component';
import { TableComponent } from '../../../shared/components/table/table.component';
import { ModalComponent } from '../../../shared/components/modal/modal.component';
import { BeautifulDatePipe } from '../../../shared/pipes/beautiful-date.pipe';
import { SnackbarService } from '../../../core/services/snackbar.service';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, MetricCardComponent, TableComponent, ModalComponent, BeautifulDatePipe],
  templateUrl: './admin-dashboard.component.html',
  styleUrls: ['./admin-dashboard.component.scss']
})
export class AdminDashboardComponent implements OnInit {
  stats = signal({
    totalEmployees: 0,
    pendingLeaves: 0,
    highRiskCount: 0,
    onboardingOpen: 0
  });

  employeesList = signal<any[]>([]);
  pendingLeavesList = signal<any[]>([]);
  highRiskEmployees = signal<any[]>([]);
  loading = signal<boolean>(true);

  // Modal State for Reusable Delete Confirmation
  deleteModalOpen = signal<boolean>(false);
  employeeToDelete = signal<{ id: string; name: string } | null>(null);

  employeeHeaders = ['Employee', 'Role', 'Department', 'Job Title', 'Status', 'Actions'];
  leaveHeaders = ['Employee', 'Type', 'Duration', 'Reason', 'Actions'];
  riskHeaders = ['Employee', 'Department', 'Risk Score', 'Key Risk Factors'];

  private api = inject(ApiService);
  private snackbar = inject(SnackbarService);

  ngOnInit() {
    this.loadData();
  }

  loadData() {
    this.loading.set(true);
    
    // 1. Fetch Employees
    this.api.getEmployees().subscribe({
      next: (employees) => {
        this.employeesList.set(employees);
        this.stats.update(s => ({ ...s, totalEmployees: employees.length }));
      },
      error: (err) => {
        console.error('Failed to load employees count:', err);
        this.snackbar.error('Failed to load employee count.');
      }
    });

    // 2. Fetch Leave Requests
    this.api.getLeaveRequests().subscribe({
      next: (requests) => {
        const pending = requests.filter((r: any) => r.status === 'pending');
        this.pendingLeavesList.set(pending);
        this.stats.update(s => ({ ...s, pendingLeaves: pending.length }));
      },
      error: (err) => {
        console.error('Failed to load leave requests:', err);
        this.snackbar.error('Failed to load leave requests list.');
      }
    });

    // 3. Fetch Attrition Risk
    this.api.getAttritionRisk().subscribe({
      next: (risks) => {
        const high = risks.filter((r: any) => r.risk_level === 'high');
        this.highRiskEmployees.set(high);
        this.stats.update(s => ({ ...s, highRiskCount: high.length }));
      },
      error: (err) => {
        console.error('Failed to load attrition risks:', err);
        this.snackbar.error('Failed to load attrition metrics.');
      }
    });

    // 4. Fetch Onboarding Tasks
    this.api.getOnboardingTasks().subscribe({
      next: (tasks) => {
        this.stats.update(s => ({ ...s, onboardingOpen: tasks.filter((t: any) => !t.completed).length }));
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Failed to load onboarding tasks:', err);
        this.snackbar.error('Failed to load onboarding status.');
        this.loading.set(false);
      }
    });
  }

  confirmDeleteEmployee(id: string, name: string) {
    this.employeeToDelete.set({ id, name });
    this.deleteModalOpen.set(true);
  }

  closeDeleteModal() {
    this.deleteModalOpen.set(false);
    this.employeeToDelete.set(null);
  }

  performDeleteEmployee() {
    const target = this.employeeToDelete();
    if (!target) return;

    this.api.deleteEmployee(target.id).subscribe({
      next: () => {
        this.snackbar.success(`Employee "${target.name}" deleted successfully!`);
        this.closeDeleteModal();
        this.loadData();
      },
      error: (err) => {
        console.error('Failed to delete employee:', err);
        this.snackbar.error('Failed to delete employee.');
        this.closeDeleteModal();
      }
    });
  }

  approveLeave(id: string) {
    this.api.approveLeaveRequest(id).subscribe({
      next: () => {
        this.snackbar.success('Leave request approved!');
        this.loadData();
      },
      error: (err) => {
        console.error('Failed to approve leave:', err);
        this.snackbar.error('Failed to approve leave request.');
      }
    });
  }

  rejectLeave(id: string) {
    this.api.rejectLeaveRequest(id).subscribe({
      next: () => {
        this.snackbar.info('Leave request rejected.');
        this.loadData();
      },
      error: (err) => {
        console.error('Failed to reject leave:', err);
        this.snackbar.error('Failed to reject leave request.');
      }
    });
  }
}
