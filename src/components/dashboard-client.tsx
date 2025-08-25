'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { PlusCircle, FileText, LayoutDashboard } from 'lucide-react';
import type { Session } from '@/lib/types';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from './ui/badge';

interface DashboardClientProps {
  initialSessions: Session[];
}

const FormattedDate = ({ dateString }: { dateString: string }) => {
  const [formattedDate, setFormattedDate] = useState('');

  useEffect(() => {
    setFormattedDate(
      new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    );
  }, [dateString]);

  return <>{formattedDate}</>;
};

export function DashboardClient({ initialSessions }: DashboardClientProps) {
  const [sessions] = useState<Session[]>(initialSessions);
  const router = useRouter();

  const getPerformanceBadge = (grouping: number) => {
    if (grouping < 50) 
      return <Badge variant="default" className="bg-green-500 hover:bg-green-600">Excellent</Badge>;
    if (grouping < 100) 
      return <Badge variant="secondary" className="bg-yellow-500 text-black hover:bg-yellow-600">Good</Badge>;
    return <Badge variant="destructive">Needs Improvement</Badge>;
  };

  return (
    <div className="space-y-8 text-white">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <h1 className="font-headline text-4xl font-bold tracking-tight text-white drop-shadow-lg">Dashboard</h1>
          <p className="text-neutral-300 drop-shadow-md">
            Review your past performance and start new shooting sessions.
          </p>
        </div>
        <Button size="lg" onClick={() => router.push('/session/live')} className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg">
          <PlusCircle className="mr-2 h-5 w-5" />
          Start New Session
        </Button>
      </div>

      <Card className="border-neutral-700 bg-black/30 backdrop-blur-sm">
        <CardHeader>
          <div className="flex items-center gap-2">
            <LayoutDashboard className="h-6 w-6" />
            <CardTitle className="text-white">Session History</CardTitle>
          </div>
          <CardDescription className="text-neutral-400">
            A log of all your completed shooting sessions.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow className="border-neutral-700 hover:bg-neutral-800/50">
                <TableHead className="text-white">Date</TableHead>
                <TableHead className="text-center text-white">Total Shots</TableHead>
                <TableHead className="text-center text-white">Group Size (px)</TableHead>
                <TableHead className="text-center text-white">Consistency (px)</TableHead>
                <TableHead className="text-center text-white">Performance</TableHead>
                <TableHead className="text-right text-white">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sessions.length > 0 ? (
                sessions.map((session) => (
                  <TableRow key={session.id} className="border-neutral-800 hover:bg-neutral-900/50">
                    <TableCell className="text-neutral-300">
                      <FormattedDate dateString={session.date} />
                    </TableCell>
                    <TableCell className="text-center text-neutral-300">{session.shots.length}</TableCell>
                    <TableCell className="text-center text-neutral-300">{session.metrics.groupSize.toFixed(2)}</TableCell>
                    <TableCell className="text-center text-neutral-300">{session.metrics.consistency.toFixed(2)}</TableCell>
                    <TableCell className="text-center">
                      {getPerformanceBadge(session.metrics.groupSize)}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="outline"
                        size="sm"
                        className="border-primary text-primary hover:bg-primary hover:text-primary-foreground"
                        onClick={() => router.push(`/session/${session.id}`)}
                      >
                        <FileText className="mr-2 h-4 w-4" />
                        View Report
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="h-24 text-center text-neutral-400">
                    No sessions found. Start a new one to see your results!
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
