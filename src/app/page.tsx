import { getSessions } from '@/lib/api';
import { DashboardClient } from '@/components/dashboard-client';
import type { Session } from '@/lib/types';

export default async function DashboardPage() {
  const sessions: Session[] = await getSessions();

  return (
    <div className="container mx-auto p-4 sm:p-6 lg:p-8">
      <DashboardClient initialSessions={sessions} />
    </div>
  );
}
