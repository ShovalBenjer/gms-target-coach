'use client';

import { useRouter } from 'next/navigation';
import { ArrowLeft, BrainCircuit, CheckCircle, Gauge, Lightbulb, ScatterChart as ScatterChartIcon, Timer } from 'lucide-react';
import type { Session } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';
import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ZAxis,
  ResponsiveContainer,
  Label,
} from 'recharts';
import { useEffect, useState } from 'react';

interface AnalysisResultsProps {
  session: Session;
  advice: string[];
}

const FormattedDate = ({ dateString }: { dateString: string }) => {
  const [formattedDate, setFormattedDate] = useState('');

  useEffect(() => {
    setFormattedDate(
      new Date(dateString).toLocaleDateString('en-us', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    );
  }, [dateString]);

  return <>{formattedDate}</>;
};

const MetricCard = ({
  icon,
  title,
  value,
  unit,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  value: string;
  unit?: string;
  description: string;
}) => (
  <Card>
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
      <CardTitle className="text-sm font-medium">{title}</CardTitle>
      {icon}
    </CardHeader>
    <CardContent>
      <div className="text-2xl font-bold">
        {value}
        {unit && <span className="text-xs text-muted-foreground">{unit}</span>}
      </div>
      <p className="text-xs text-muted-foreground">{description}</p>
    </CardContent>
  </Card>
);

export function AnalysisResults({ session, advice }: AnalysisResultsProps) {
  const router = useRouter();

  const chartConfig = {
    shots: {
      label: 'Shots',
      color: 'hsl(var(--accent))',
    },
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Button variant="outline" size="sm" onClick={() => router.push('/')}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Button>
          <h1 className="mt-2 font-headline text-3xl font-bold tracking-tight">
            Performance Report
          </h1>
          <p className="text-muted-foreground">
            Analysis for session on <FormattedDate dateString={session.date} />
          </p>
        </div>
      </div>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          icon={<CheckCircle className="h-4 w-4 text-muted-foreground" />}
          title="Accuracy"
          value={session.metrics.accuracy.toFixed(1)}
          unit="%"
          description="Overall shot accuracy"
        />
        <MetricCard
          icon={<Gauge className="h-4 w-4 text-muted-foreground" />}
          title="Grouping"
          value={session.metrics.grouping.toFixed(2)}
          unit=" in"
          description="Average shot deviation"
        />
        <MetricCard
          icon={<Timer className="h-4 w-4 text-muted-foreground" />}
          title="Session Time"
          value={`${String(Math.floor(session.metrics.time / 60)).padStart(2, '0')}:${String(
            session.metrics.time % 60
          ).padStart(2, '0')}`}
          description="Total duration of session"
        />
        <MetricCard
          icon={<ScatterChartIcon className="h-4 w-4 text-muted-foreground" />}
          title="Total Shots"
          value={session.shots.length.toString()}
          description="Total shots fired in session"
        />
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-5">
        <Card className="lg:col-span-3">
          <CardHeader>
            <div className="flex items-center gap-2">
                <ScatterChartIcon className="h-6 w-6" />
                <CardTitle>Shot Distribution</CardTitle>
            </div>
            <CardDescription>
              A visual representation of all your shots on the target.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="aspect-square h-[400px] w-full">
              <ResponsiveContainer>
                <ScatterChart
                    margin={{ top: 20, right: 20, bottom: 20, left: 20, }}
                    >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" dataKey="x" name="x" domain={[-12, 12]} ticks={[-10, -5, 0, 5, 10]} >
                         <Label value="Horizontal" offset={-15} position="insideBottom" />
                    </XAxis>
                    <YAxis type="number" dataKey="y" name="y" domain={[-12, 12]} ticks={[-10, -5, 0, 5, 10]} >
                        <Label value="Vertical" angle={-90} offset={-5} position="insideLeft" />
                    </YAxis>
                    <ZAxis type="number" range={[100]} />
                    <Tooltip
                        cursor={{ strokeDasharray: '3 3' }}
                        content={<ChartTooltipContent hideLabel />}
                        />
                    <Scatter name="Shots" data={session.shots} fill="hsl(var(--primary))" />
                </ScatterChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center gap-2">
                <BrainCircuit className="h-6 w-6 text-primary" />
                <CardTitle>AI-Powered Coaching</CardTitle>
            </div>
            <CardDescription>
              Personalized tips to improve your technique.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-4">
              {advice.map((tip, index) => (
                <li key={index} className="flex items-start gap-3">
                  <Lightbulb className="mt-1 h-5 w-5 shrink-0 text-accent" />
                  <span className="text-sm">{tip}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
