import DashboardShell from '@/components/layout/dashboard-shell';
import { CommunityProvider } from '@/lib/community-context';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <CommunityProvider>
      <DashboardShell>{children}</DashboardShell>
    </CommunityProvider>
  );
}
