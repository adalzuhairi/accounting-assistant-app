import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";
import { AuthProvider } from "./hooks/use-auth";
import { ProtectedRoute } from "./lib/protected-route";
import { CalculatorProvider } from "./contexts/CalculatorContext";
import AuthPage from "./pages/auth-page";
import DashboardPage from "./pages/dashboard-page";
import InvoicesPage from "./pages/invoices-page";
import PaymentsPage from "./pages/payments-page";
import ReportsPage from "./pages/reports-page";
import ProfilePage from "./pages/profile-page";
import UsersPage from "./pages/users-page";
import ClientsPage from "./pages/clients-page";

function Router() {
  return (
    <Switch>
      <Route path="/auth" component={AuthPage} />
      <ProtectedRoute path="/" component={DashboardPage} />
      <ProtectedRoute path="/invoices" component={InvoicesPage} />
      <ProtectedRoute path="/payments" component={PaymentsPage} />
      <ProtectedRoute path="/clients" component={ClientsPage} />
      <ProtectedRoute path="/reports" component={ReportsPage} />
      <ProtectedRoute path="/profile" component={ProfilePage} />
      <ProtectedRoute path="/users" component={UsersPage} />
      <Route path="/:rest*">
        <NotFound />
      </Route>
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <CalculatorProvider>
          <Router />
          <Toaster />
        </CalculatorProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
