import { createBrowserRouter } from "react-router";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { MainLayout } from "./components/MainLayout";
import { DashboardPage } from "./components/DashboardPage";
import { OverviewDashboard } from "./components/OverviewDashboard";
import { DocumentsPage } from "./components/DocumentsPage";
import { SettingsPage } from "./components/SettingsPage";
import { LoginPage } from "./components/auth/LoginPage";
import { RegisterPage } from "./components/auth/RegisterPage";
import { ForgotPasswordPage } from "./components/auth/ForgotPasswordPage";

export const router = createBrowserRouter([
  {
    // Protected routes — require authentication
    Component: ProtectedRoute,
    children: [
      {
        path: "/",
        Component: MainLayout,
        children: [
          { index: true, Component: DashboardPage },
          { path: "overview", Component: OverviewDashboard },
          { path: "documents", Component: DocumentsPage },
          { path: "settings", Component: SettingsPage },
        ],
      },
    ],
  },
  // Public routes — no auth required
  { path: "/login", Component: LoginPage },
  { path: "/register", Component: RegisterPage },
  { path: "/forgot-password", Component: ForgotPasswordPage },
]);
