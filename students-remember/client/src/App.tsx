import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import Home from "@/pages/Home";
import Dashboard from "@/pages/Dashboard";
import TeamDetail from "@/pages/TeamDetail";
import StudentDetail from "@/pages/StudentDetail";
import EditStudentPhoto from "@/pages/EditStudentPhoto";
import GroupingSuggestions from "@/pages/GroupingSuggestions";
import TeamManagement from "@/pages/TeamManagement";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";

function Router() {
  return (
    <Switch>
      <Route path={"/"} component={Home} />
      <Route path={"/dashboard"} component={Dashboard} />
      <Route path={"/team/:teamId/grouping"} component={GroupingSuggestions} />
      <Route path={"/team/:teamId/manage"} component={TeamManagement} />
      <Route path={"/team/:teamId"} component={TeamDetail} />
      <Route path={"/student/:studentId/edit-photo"} component={EditStudentPhoto} />
      <Route path={"/student/:studentId"} component={StudentDetail} />
      <Route path={"/404"} component={NotFound} />
      {/* Final fallback route */}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
