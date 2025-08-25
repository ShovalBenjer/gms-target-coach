import { LandingPageClient } from '@/components/landing-page-client';
import { ShaderAnimation } from '@/components/shader-animation';

export default async function LandingPage() {
  return (
    <div className="relative min-h-screen w-full">
      <ShaderAnimation />
      <div className="absolute inset-0 z-10 flex items-center justify-center">
        <div className="container mx-auto p-4 sm:p-6 lg:p-8">
          <LandingPageClient />
        </div>
      </div>
    </div>
  );
}