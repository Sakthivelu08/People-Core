import { Routes } from "@angular/router";
import { authGuard } from "./auth/auth.guard";

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
    path: "home",
    loadComponent: () =>
      import("./pages/home/home.component").then(m => m.HomeComponent),
    canActivate: [authGuard]
  },
  {
    path: "**",
    redirectTo: "login"
  }
];
