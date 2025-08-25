'use client';

import { useRouter } from 'next/navigation';
import { PlusCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function LandingPageClient() {
  const router = useRouter();

  return (
    <div className="flex flex-col items-center justify-center space-y-6 text-center">
      <h1 className="font-headline text-5xl font-bold tracking-tight text-white drop-shadow-lg sm:text-6xl lg:text-7xl">
        AI-Powered Shooting Analysis
      </h1>
      <p className="max-w-2xl text-lg text-neutral-300 drop-shadow-md sm:text-xl">
        Transform your practice with real-time feedback. GMShooter analyzes your
        shot placement, grouping, and consistency to provide actionable
        insights and AI coaching.
      </p>
      <div className="flex flex-col gap-4 sm:flex-row">
        <Button
          size="lg"
          onClick={() => router.push('/dashboard')}
          className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg"
        >
          <PlusCircle className="mr-2 h-5 w-5" />
          Go To Dashboard
        </Button>
        <Button
          size="lg"
          variant="secondary"
          onClick={() => router.push('/session/live')}
          className="shadow-lg"
        >
          Start a Live Session
        </Button>
      </div>
    </div>
  );
}