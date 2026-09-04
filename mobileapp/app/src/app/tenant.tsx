import { RoleDashboard } from '@/components/demo/role-dashboard';
import { personaConfigs } from '@/features/personas/persona-config';

export default function TenantDashboardScreen() {
  return <RoleDashboard config={personaConfigs.tenant} />;
}
