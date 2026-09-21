import { redirect } from 'next/navigation';
import DashboardShell from '@/components/layout/dashboard-shell';
import { CommunityProvider } from '@/lib/community-context';
import { getAuthenticatedAdmin } from '@/lib/admin-check';

export const dynamic = 'force-dynamic';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const admin = await getAuthenticatedAdmin();
  if (!admin) {
    redirect('/login');
  }

  return (
    <CommunityProvider>
      <DashboardShell>{children}</DashboardShell>
    </CommunityProvider>
  );
}
