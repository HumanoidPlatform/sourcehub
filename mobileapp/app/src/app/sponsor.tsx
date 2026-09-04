import { RoleDashboard } from '@/components/demo/role-dashboard';
import { personaConfigs } from '@/features/personas/persona-config';

export default function SponsorDashboardScreen() {
  return <RoleDashboard config={personaConfigs.sponsor} />;
}
