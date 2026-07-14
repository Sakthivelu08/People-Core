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
    path: "",
    loadComponent: () =>
      import("./shared/layout/shell/shell.component").then(m => m.ShellComponent),
    canActivate: [authGuard],
    children: [
      {
        path: "home",
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
      },
      {
        path: "insights",
        loadComponent: () =>
          import("./pages/insights/insights.component").then(m => m.InsightsComponent),
        canActivate: [adminGuard],
      },
      {
        path: "admin/onboarding",
        loadComponent: () =>
          import("./pages/admin/onboarding-mgmt/onboarding-mgmt.component")
            .then(m => m.OnboardingMgmtComponent),
        canActivate: [adminGuard],
      },
    ]
  },
  {
    path: "**",
    redirectTo: "login"
  }
];
