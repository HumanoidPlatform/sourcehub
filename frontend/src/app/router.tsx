// The route tree. Every navigable surface in one place.
//
// Access control is layered, and this file is the SHALLOWEST layer: routes
// gate on authentication only, screens hide actions with can(), the API checks
// capabilities, and RLS decides what any query returns. Deep-linking to a page
// your role never uses just shows you an empty, harmless view.

import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import { DesignSystemRoute } from "@ds/DesignSystemRoute";
import { AccountDetailPage } from "@features/admin/account-detail";
import { AccountsPage, ActivityPage } from "@features/admin/pages";
import { ContractsPage, ContractDetailPage, TasksPage } from "@features/delivery/pages";
import {
  AcceptInvitationPage, ForcedPasswordChange, LoginPage, ResetPasswordPage, TaskOfferPage,
} from "@features/identity/pages";
import { UsersPage } from "@features/identity/users";
import { BillingPage } from "@features/ledger/pages";
import { PrivacyPage } from "@features/legal/pages";
import {
  MyProposalsPage, OpportunitiesPage, RequestDetailPage, RequestNewPage, RequestsPage,
} from "@features/marketplace/pages";
import {
  CapacityPage, EquipmentPage, LoanQueuePage, NetworkPage, RosterPage,
} from "@features/network/pages";
import { NotificationsPage } from "@features/notify/pages";
import { OnboardingQueuePage } from "@features/onboarding/pages";
import { Gate1Page, QaQueuePage } from "@features/qa/pages";
import { identityOf, returnPath, useAuth } from "@shared/auth";
import { ErrorBoundary } from "./error-boundary";
import { NotFoundPage } from "./not-found";
import { OverviewPage } from "./overview";
import { Shell } from "./shell/Shell";

export function AppRouter() {
  const { session } = useAuth();
  // Read before the early returns below, as the rules of hooks require.
  const location = useLocation();

  // Token links belong to whoever holds the token, not to whoever happens to
  // be signed in on this browser. They lived on the anonymous surface only, so
  // following one while signed in fell through to the catch-all and dropped
  // you in your OWN workspace — which read as "the invitation worked", however
  // stale, wrong, or addressed to someone else it was.
  const tokenRoutes = (
    <>
      <Route path="/accept-invitation" element={<AcceptInvitationPage />} />
      <Route path="/reset-password" element={<ResetPasswordPage />} />
      <Route path="/offer" element={<TaskOfferPage />} />
      {/* Public for the same reason: the phone's privacy notice opens this in a
          browser that is not signed in, and the Play listing will point at it. */}
      <Route path="/privacy" element={<PrivacyPage />} />
    </>
  );

  // anonymous surface
  if (!session) {
    return (
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        {tokenRoutes}
        {/* Remember where the user was — the page they were on when the
            session expired, or the link they followed while signed out — so
            signing in returns them there rather than to the overview. */}
        <Route
          path="*"
          element={<Navigate to="/login" replace state={{ from: location.pathname + location.search }} />}
        />
      </Routes>
    );
  }

  // a provisioned password must be replaced before anything else
  if (session.must_change_password) {
    return <ForcedPasswordChange session={session} />;
  }

  return (
    // Keyed on who is signed in: when another tab signs in as someone else,
    // every page starts over. The emptied cache (shared/auth) replaces the
    // previous person's data; this replaces what they had typed, filtered or
    // left open, which would otherwise carry into the new person's session.
    <Shell key={identityOf(session)}>
      {/* A page that throws shows an error in place of itself; the sidebar and
          top bar survive, and navigating elsewhere clears it. */}
      <ErrorBoundary scope="page" resetKey={location.pathname}>
      <Routes>
        <Route path="/" element={<OverviewPage />} />

        {tokenRoutes}

        {/* marketplace */}
        <Route path="/requests" element={<RequestsPage />} />
        <Route path="/requests/new" element={<RequestNewPage />} />
        {/* same builder, loading an existing draft */}
        <Route path="/requests/:id/edit" element={<RequestNewPage />} />
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
        <Route path="/accounts/:id" element={<AccountDetailPage />} />
        <Route path="/activity" element={<ActivityPage />} />

        {/* shared */}
        {/* Reached from the account menu, not the rail: managing colleagues is
            an account concern, not a workspace one. The page renders its own
            controls only for an owner or manager, and the server enforces the
            same rule — so a member who types the URL sees the list and no
            buttons, which is what they are entitled to. */}
        <Route path="/users" element={<UsersPage />} />
        <Route path="/notifications" element={<NotificationsPage />} />
        {/* Development builds only. In production /design falls through to the
            catch-all below and reads "Page not found". */}
        {import.meta.env.DEV && <Route path="/design" element={<DesignSystemRoute />} />}
        <Route path="/login" element={<Navigate to={returnPath(location.state)} replace />} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
      </ErrorBoundary>
    </Shell>
  );
}
