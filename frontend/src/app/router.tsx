// The route tree. Every navigable surface in one place.
//
// Access control is layered, and this file is the SHALLOWEST layer: routes
// gate on authentication only, screens hide actions with can(), the API checks
// capabilities, and RLS decides what any query returns. Deep-linking to a page
// your role never uses just shows you an empty, harmless view.

import { Navigate, Route, Routes } from "react-router-dom";
import { DesignSystemRoute } from "@ds/DesignSystemRoute";
import { AccountsPage, ActivityPage } from "@features/admin/pages";
import { ContractsPage, ContractDetailPage, TasksPage } from "@features/delivery/pages";
import {
  AcceptInvitationPage, ForcedPasswordChange, LoginPage, ResetPasswordPage,
} from "@features/identity/pages";
import { BillingPage } from "@features/ledger/pages";
import {
  MyProposalsPage, OpportunitiesPage, RequestDetailPage, RequestNewPage, RequestsPage,
} from "@features/marketplace/pages";
import {
  CapacityPage, EquipmentPage, LoanQueuePage, NetworkPage, RosterPage,
} from "@features/network/pages";
import { OnboardingQueuePage } from "@features/onboarding/pages";
import { Gate1Page, QaQueuePage } from "@features/qa/pages";
import { useAuth } from "@shared/auth";
import { OverviewPage } from "./overview";
import { Shell } from "./shell/Shell";

export function AppRouter() {
  const { session } = useAuth();

  // anonymous surface
  if (!session) {
    return (
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/accept-invitation" element={<AcceptInvitationPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    );
  }

  // a provisioned password must be replaced before anything else
  if (session.must_change_password) {
    return <ForcedPasswordChange session={session} />;
  }

  return (
    <Shell>
      <Routes>
        <Route path="/" element={<OverviewPage />} />

        {/* marketplace */}
        <Route path="/requests" element={<RequestsPage />} />
        <Route path="/requests/new" element={<RequestNewPage />} />
        <Route path="/requests/:id" element={<RequestDetailPage />} />
        <Route path="/opportunities" element={<OpportunitiesPage />} />
        <Route path="/proposals" element={<MyProposalsPage />} />

        {/* delivery — same detail view, two entry paths */}
        <Route path="/contracts" element={<ContractsPage />} />
        <Route path="/contracts/:id" element={<ContractDetailPage />} />
        <Route path="/deliveries" element={<ContractsPage />} />
        <Route path="/deliveries/:id" element={<ContractDetailPage />} />
        <Route path="/tasks" element={<TasksPage />} />

        {/* qa — gate 2 for the delivery partner, gate 1 for the supplier */}
        <Route path="/qa" element={<QaQueuePage />} />
        <Route path="/review" element={<Gate1Page />} />

        {/* network */}
        <Route path="/network" element={<NetworkPage />} />
        <Route path="/equipment" element={<EquipmentPage />} />
        <Route path="/inventory" element={<EquipmentPage />} />
        <Route path="/loans" element={<LoanQueuePage />} />
        <Route path="/roster" element={<RosterPage />} />
        <Route path="/capacity" element={<CapacityPage />} />

        {/* ledger */}
        <Route path="/billing" element={<BillingPage />} />

        {/* platform ops */}
        <Route path="/onboarding" element={<OnboardingQueuePage />} />
        <Route path="/accounts" element={<AccountsPage />} />
        <Route path="/activity" element={<ActivityPage />} />

        {/* shared */}
        <Route path="/design" element={<DesignSystemRoute />} />
        <Route path="/login" element={<Navigate to="/" replace />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Shell>
  );
}
