import TopNavigation from '@/components/layout/top-navigation';
import { CommunityProvider } from '@/lib/community-context';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <CommunityProvider>
      <div className="min-h-screen bg-slate-50 flex flex-col antialiased">
        <TopNavigation />
        <main className="flex-1 w-full max-w-7xl mx-auto p-4 md:p-8">
          {children}
        </main>
      </div>
    </CommunityProvider>
  );
}
