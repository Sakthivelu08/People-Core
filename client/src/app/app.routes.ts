import { Routes } from "@angular/router";
import { authGuard } from "./auth/auth.guard";
import { adminGuard } from "./auth/role.guard";

export const routes: Routes = [
  {
    path: "",
    redirectTo: "login",
    pathMatch: "full"
  },
  {
    path: "login",
    loadComponent: () =>
      import("./auth/login/login.component").then(m => m.LoginComponent),
    canActivate: [authGuard]
  },
  {
    path: "employee",
    loadComponent: () =>
      import("./shared/layout/shell/shell.component").then(m => m.ShellComponent),
    canActivate: [authGuard],
    children: [
      {
        path: "",
        redirectTo: "profile",
        pathMatch: "full"
      },
      {
        path: "profile",
        loadComponent: () =>
          import("./pages/home/home.component").then(m => m.HomeComponent),
      },
      {
        path: "leave",
        loadComponent: () =>
          import("./pages/leave/leave.component").then(m => m.LeaveComponent),
      },
      {
        path: "onboarding",
        loadComponent: () =>
          import("./pages/onboarding/onboarding.component").then(m => m.OnboardingComponent),
      }
    ]
  },
  {
    path: "admin",
    loadComponent: () =>
      import("./shared/layout/shell/shell.component").then(m => m.ShellComponent),
    canActivate: [authGuard, adminGuard],
    children: [
      {
        path: "",
        redirectTo: "dashboard",
        pathMatch: "full"
      },
      {
        path: "dashboard",
        loadComponent: () =>
          import("./pages/admin/admin-dashboard/admin-dashboard.component").then(m => m.AdminDashboardComponent),
      },
      {
        path: "onboarding",
        loadComponent: () =>
          import("./pages/admin/onboarding-mgmt/onboarding-mgmt.component").then(m => m.OnboardingMgmtComponent),
      },
      {
        path: "insights",
        loadComponent: () =>
          import("./pages/insights/insights.component").then(m => m.InsightsComponent),
      },
      {
        path: "employees/add",
        loadComponent: () =>
          import("./pages/admin/add-employee/add-employee.component").then(m => m.AddEmployeeComponent),
      }
    ]
  },
  {
    path: "**",
    redirectTo: "employee/profile"
  }
];
