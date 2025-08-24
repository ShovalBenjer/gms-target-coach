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
    if (grouping < 50) // Example threshold for 'Excellent'
      return <Badge variant="default" className="bg-green-500">Excellent</Badge>;
    if (grouping < 100) // Example threshold for 'Good'
      return <Badge variant="secondary" className="bg-yellow-500 text-black">Good</Badge>;
    return <Badge variant="destructive">Needs Improvement</Badge>;
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <h1 className="font-headline text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">
            Review your past performance and start new shooting sessions.
          </p>
        </div>
        <Button size="lg" onClick={() => router.push('/session/live')}>
          <PlusCircle className="mr-2 h-5 w-5" />
          Start New Session
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <LayoutDashboard className="h-6 w-6" />
            <CardTitle>Session History</CardTitle>
          </div>
          <CardDescription>
            A log of all your completed shooting sessions.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead className="text-center">Total Shots</TableHead>
                <TableHead className="text-center">Group Size (px)</TableHead>
                <TableHead className="text-center">Consistency (px)</TableHead>
                <TableHead className="text-center">Performance</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sessions.length > 0 ? (
                sessions.map((session) => (
                  <TableRow key={session.id}>
                    <TableCell>
                      <FormattedDate dateString={session.date} />
                    </TableCell>
                    <TableCell className="text-center">{session.shots.length}</TableCell>
                    <TableCell className="text-center">{session.metrics.groupSize.toFixed(2)}</TableCell>
                    <TableCell className="text-center">{session.metrics.consistency.toFixed(2)}</TableCell>
                    <TableCell className="text-center">
                      {getPerformanceBadge(session.metrics.groupSize)}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="outline"
                        size="sm"
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
                  <TableCell colSpan={6} className="h-24 text-center">
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
