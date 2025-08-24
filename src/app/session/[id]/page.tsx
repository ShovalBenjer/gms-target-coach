import { getSessionById } from '@/lib/api';
import { analyzeShootingSession } from '@/ai/flows/analyze-shooting-session';
import { AnalysisResults } from '@/components/analysis-results';
import { notFound } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default async function ReportPage({ params }: { params: { id: string } }) {
  const session = await getSessionById(params.id);

  if (!session) {
    notFound();
  }

  const analysisInput = {
    shots: session.shots,
    metrics: session.metrics,
    userSkillLevel: 'intermediate',
  };

  const analysis = await analyzeShootingSession(analysisInput);

  return (
    <div className="container mx-auto p-4 sm:p-6 lg:p-8">
      <AnalysisResults session={session} advice={analysis.coachingAdvice} />
    </div>
  );
}
