import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  createRoutesFromElements,
  createBrowserRouter,
  Route,
  RouterProvider,
  useLocation,
  Navigate,
} from "react-router-dom";
import Root from "@/pages/root.tsx";
import LoginPage from "@/pages/auth/login-page.tsx";
import RegisterPage from "@/pages/auth/register-page.tsx";
import { AuthProvider, useAuth } from "@/context/auth-context.tsx";
import { Loader2 } from "lucide-react";
import { ThemeProvider } from "@/context/theme-context.tsx";
import NonConformitiesPage from "@/pages/non-conformities/non-conformities-page.tsx";
import IndicatorsPage from "@/pages/indicators/indicators-page.tsx";
import ProcessesPage from "./pages/processes/processes-page";
import ScopePage from "./pages/scope/scope-page";
import SystemPolicyPage from "./pages/system-policy/system-policy-page";
import ResponsibilityAuthorityPage from "./pages/responsibility-authority/responsibility-authority-page";
import LeadershipCommitmentPage from "./pages/leadership-commitment/leadership-commitment-page";
import AwarenessPage from "./pages/awareness/awareness-page";
import ChangesPage from "./pages/changes/changes-page";
import InterestedPartiesPage from "./pages/interested-parties/interested-parties-page";
import SwotAnalysisPage from "./pages/swot/swot-page";
import RisksOpportunitiesPage from "./pages/risks-opportunities/risks-opportunities";
import QualityObjectivesPage from "./pages/quality-objectives/quality-objectives-page";
import CommunicationPage from "./pages/communication/communication-page";
import ResourcesPage from "./pages/resources-page";
import AuditsPage from "./pages/audits/audits-page";
import DepartmentsPage from "./pages/departments/departments-page";
import UsersPage from "./pages/users/users-page";
import ImprovementOpportunitiesPage from "./pages/improvement-opportunities/improvement-opportunities-page";
import CustomerSatisfactionPage from "./pages/customer-satisfaction/customer-satisfaction-page";
import ManagementReviewPage from "./pages/management-review/management-review-page";
import SuppliersPage from "./pages/suppliers/suppliers-page";
import YearsPage from "./pages/years/years-page";

// eslint-disable-next-line react-refresh/only-export-components
const RequireAuth = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
};

// eslint-disable-next-line react-refresh/only-export-components
const RequireGuest = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (isAuthenticated) {
    // If authenticated, redirect to the 'from' state (if available) or the dashboard
    const from = (location.state as any)?.from?.pathname || "/";
    return <Navigate to={from} replace />;
  }

  return <>{children}</>;
};

const router = createBrowserRouter(
  createRoutesFromElements(
    <>
      <Route
        path="/"
        element={
          <RequireAuth>
            <Root />
          </RequireAuth>
        }
      >
        <Route index element={<Navigate to="/non-conformities" replace />} />
        <Route
          path="ambito"
          element={<ScopePage />}
          handle={{
            group: "4. Contexto da Organização",
            breadcrumb: () => "4.3. Âmbito",
          }}
        />
        <Route
          path="politica-sg"
          element={<SystemPolicyPage />}
          handle={{
            group: "5. Liderança",
            breadcrumb: () => "5.2. Política do Sistema e sua Divulgação",
          }}
        />
        <Route
          path="atribuicoes-responsabilidades"
          element={<ResponsibilityAuthorityPage />}
          handle={{
            group: "5. Liderança",
            breadcrumb: () => "5.3. Atribuições, Responsabilidades e Autoridades",
          }}
        />
        <Route
          path="lideranca-compromisso"
          element={<LeadershipCommitmentPage />}
          handle={{
            group: "5. Liderança",
            breadcrumb: () => "5.1. Liderança e Compromisso",
          }}
        />
        <Route
          path="consciencializacao"
          element={<AwarenessPage />}
          handle={{
            group: "7. Suporte",
            breadcrumb: () => "7.3. Consciencialização",
          }}
        />
        <Route
          path="recursos"
          element={<ResourcesPage />}
          handle={{
            group: "7. Suporte",
            breadcrumb: () => "7.1. Recursos",
          }}
        />
        <Route
          path="comunicacao"
          element={<CommunicationPage />}
          handle={{
            group: "7. Suporte",
            breadcrumb: () => "7.4. Comunicação",
          }}
        />
        <Route
          path="objetivos-sg"
          element={<QualityObjectivesPage />}
          handle={{
            group: "6. Planeamento",
            breadcrumb: () => "6.2. Objetivos do SG",
          }}
        />
        <Route
          path="alteracoes"
          element={<ChangesPage />}
          handle={{
            group: "6. Planeamento",
            breadcrumb: () => "6.3. Alterações",
          }}
        />
        <Route
          path="partes-interessadas"
          element={<InterestedPartiesPage />}
          handle={{
            group: "4. Contexto da Organização",
            breadcrumb: () => "4.2. Partes Interessadas",
          }}
        />
        <Route
          path="analise-swot"
          element={<SwotAnalysisPage />}
          handle={{
            group: "4. Contexto da Organização",
            breadcrumb: () => "4.1. Análise SWOT",
          }}
        />
        <Route
          path="riscos-oportunidades"
          element={<RisksOpportunitiesPage />}
          handle={{
            group: "6. Planeamento",
            breadcrumb: () => "6.1. Riscos e Oportunidades",
          }}
        />
        <Route
          path="non-conformities"
          element={<NonConformitiesPage />}
          handle={{
            group: "10. Melhoria",
            breadcrumb: () => "10.2. Tratamento de Não Conformidades",
          }}
        />
        <Route
          path="processos"
          element={<ProcessesPage />}
          handle={{
            group: "4. Contexto da Organização",
            breadcrumb: () => "4.4. Diagrama de Macro Processos",
          }}
        />
        <Route
          path="fornecedores-externos"
          element={<SuppliersPage />}
          handle={{
            group: "8. Operacionalização",
            breadcrumb: () => "8.4.1. Avaliação de Fornecedores",
          }}
        />
        <Route
          path="indicadores"
          element={<IndicatorsPage />}
          handle={{
            group: "9. Avaliação de desempenho",
            breadcrumb: () => "9.1. Indicadores de Desempenho",
          }}
        />
        <Route
          path="satisfacao-estudantes"
          element={<CustomerSatisfactionPage />}
          handle={{
            group: "9. Avaliação de desempenho",
            breadcrumb: () => "9.1.2. Satisfação dos Estudantes",
          }}
        />
        <Route
          path="auditorias"
          element={<AuditsPage />}
          handle={{
            group: "9. Avaliação de desempenho",
            breadcrumb: () => "9.2. Auditorias",
          }}
        />
        <Route
          path="revisao-gestao"
          element={<ManagementReviewPage />}
          handle={{
            group: "9. Avaliação de desempenho",
            breadcrumb: () => "9.3. Revisão pela Gestão",
          }}
        />
        <Route
          path="departamentos"
          element={<DepartmentsPage />}
          handle={{
            group: "Plataforma",
            breadcrumb: () => "Departamentos",
          }}
        />
        <Route
          path="utilizadores"
          element={<UsersPage />}
          handle={{
            group: "Plataforma",
            breadcrumb: () => "Utilizadores",
          }}
        />
        <Route
          path="anos"
          element={<YearsPage />}
          handle={{
            group: "Plataforma",
            breadcrumb: () => "Anos",
          }}
        />
        <Route
          path="oportunidades-melhoria"
          element={<ImprovementOpportunitiesPage />}
          handle={{
            group: "10. Melhoria",
            breadcrumb: () => "10.3.1. Oportunidades de Melhoria",
          }}
        />
      </Route>

      <Route
        path="/login"
        element={
          <RequireGuest>
            <LoginPage />
          </RequireGuest>
        }
      />

      <Route
        path="/register"
        element={
          <RequireGuest>
            <RegisterPage />
          </RequireGuest>
        }
      />
    </>
  )
);

const queryClient = new QueryClient();

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <ThemeProvider defaultTheme="system" storageKey="ui-theme">
          <RouterProvider router={router} />
        </ThemeProvider>
      </AuthProvider>
    </QueryClientProvider>
  </StrictMode>
);
