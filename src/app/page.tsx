import { getSessions } from '@/lib/api';
import { DashboardClient } from '@/components/dashboard-client';
import type { Session } from '@/lib/types';
import { ShaderAnimation } from '@/components/shader-animation';

export default async function DashboardPage() {
  const sessions: Session[] = await getSessions();

  return (
    <div className="relative min-h-screen w-full">
      <ShaderAnimation />
      <div className="absolute inset-0 z-10 flex items-center justify-center">
        <div className="container mx-auto p-4 sm:p-6 lg:p-8">
          <DashboardClient initialSessions={sessions} />
        </div>
      </div>
    </div>
  );
}
