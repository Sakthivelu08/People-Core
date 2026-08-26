import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { MsalService } from '@azure/msal-angular';
import { ApiService } from '../../../services/api.service';
import { MICROSOFT_GRAPH_CONFIG } from '../../../core/constants/config.constants';
import { DropdownComponent } from '../../../shared/components/dropdown/dropdown.component';
import { SnackbarService } from '../../../core/services/snackbar.service';

@Component({
  selector: 'app-add-employee',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, DropdownComponent],
  templateUrl: './add-employee.component.html',
  styleUrls: ['./add-employee.component.scss']
})
export class AddEmployeeComponent implements OnInit {
  employeeForm!: FormGroup;
  submitting = signal<boolean>(false);

  departmentOptions = [
    { value: 'Engineering', label: 'Engineering' },
    { value: 'HR', label: 'HR' },
    { value: 'Sales', label: 'Sales' },
    { value: 'Support', label: 'Support' }
  ];

  roleOptions = [
    { value: 'Employee', label: 'Employee (Self-Service Only)' },
    { value: 'Admin', label: 'Admin (Full Dashboard Access)' }
  ];

  private fb = inject(FormBuilder);
  private api = inject(ApiService);
  private msal = inject(MsalService);
  private http = inject(HttpClient);
  private snackbar = inject(SnackbarService);

  ngOnInit() {
    this.employeeForm = this.fb.group({
      name: ['', [Validators.required, Validators.pattern(/^[a-zA-Z\s]+$/)]],
      email: ['', [Validators.required, Validators.email]],
      jobTitle: ['', Validators.required],
      department: ['Engineering', Validators.required],
      role: ['Employee', Validators.required]
    });
  }

  onSubmit() {
    if (this.employeeForm.invalid) return;

    this.submitting.set(true);

    const formVal = this.employeeForm.value;

    // Trigger Microsoft Graph API creation sequence
    this.createInAzureAndLocal(formVal);
  }

  async createInAzureAndLocal(employee: any) {
    const account = this.msal.instance.getActiveAccount();
    let azureOid: string = crypto.randomUUID(); // Fallback UUID
    let graphSyncSuccess = false;

    if (account) {
      try {
        console.log('[Graph API] Attempting to retrieve token for User.ReadWrite.All scope...');
        const tokenResult = await this.msal.instance.acquireTokenSilent({
          scopes: MICROSOFT_GRAPH_CONFIG.scopes.directoryRead,
          account
        });

        if (tokenResult && tokenResult.accessToken) {
          // Construct Graph User Object
          const userPayload = {
            accountEnabled: true,
            displayName: employee.name,
            mailNickname: employee.name.toLowerCase().replace(/\s+/g, ''),
            userPrincipalName: employee.email,
            mail: employee.email,
            jobTitle: employee.jobTitle,
            department: employee.department,
            passwordProfile: {
              forceChangePasswordNextSignIn: true,
              password: 'TempPassword@123' // Initial password for new hire
            }
          };

          console.log('[Graph API] Programmatically creating user in Azure Directory...');
          const graphUser: any = await this.http.post(
            `${MICROSOFT_GRAPH_CONFIG.baseUrl}${MICROSOFT_GRAPH_CONFIG.endpoints.users}`,
            userPayload,
            { headers: { Authorization: `Bearer ${tokenResult.accessToken}` } }
          ).toPromise();

          if (graphUser && graphUser.id) {
            azureOid = graphUser.id;
            graphSyncSuccess = true;
            console.log(`[Graph API] User successfully created in Entra ID with OID: ${azureOid}`);
          }
        }
      } catch (err: any) {
        console.warn('[Graph API] Graph creation failed or unauthorized. Proceeding with database fallback. Error:', err.message);
      }
    }

    // Register user in the local container database
    this.api.registerEmployee({
      azure_oid: azureOid,
      name: employee.name,
      email: employee.email,
      job_title: employee.jobTitle,
      department: employee.department,
      role: employee.role
    }).subscribe({
      next: () => {
        this.submitting.set(false);
        this.employeeForm.reset({ department: 'Engineering', role: 'Employee' });
        
        if (graphSyncSuccess) {
          this.snackbar.success('Employee successfully created in both Azure Entra ID and local database!');
        } else {
          this.snackbar.warning('Employee registered in the local database successfully. Azure Entra ID sync bypassed (Graph permissions unavailable).');
        }
      },
      error: (err) => {
        this.submitting.set(false);
        this.snackbar.error(err.error?.error || 'Database registration failed. Please try again.');
        console.error('[AddEmployee] Registration error:', err);
      }
    });
  }
}
