'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Timer, XCircle, Loader2, Play, Pause } from 'lucide-react';
import type { Shot, Metrics } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TargetVisualization } from '@/components/target-visualization';
import { createSession } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { getRoboflowAnalysis } from '@/ai/flows/get-roboflow-analysis';
import { manageCamera, fetchNextFrame } from '@/ai/flows/camera-flow';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

const SessionControls = ({
  time,
  shotsCount,
  onEnd,
  isRunning,
  toggleRunning,
  isLoading
}: {
  time: number;
  shotsCount: number;
  onEnd: () => void;
  isRunning: boolean;
  toggleRunning: () => void;
  isLoading: boolean;
}) => (
  <Card>
    <CardHeader>
      <div className="flex items-center gap-2">
        <Timer className="h-6 w-6" />
        <CardTitle>Session Info</CardTitle>
      </div>
    </CardHeader>
    <CardContent className="space-y-6">
      <div className="flex justify-around text-center">
        <div>
          <p className="text-3xl font-bold font-mono">{String(Math.floor(time / 60)).padStart(2, '0')}:{String(time % 60).padStart(2, '0')}</p>
          <p className="text-sm text-muted-foreground">Time Elapsed</p>
        </div>
        <div>
          <p className="text-3xl font-bold font-mono">{shotsCount}</p>
          <p className="text-sm text-muted-foreground">Shots Fired</p>
        </div>
      </div>
      <div className="flex flex-col gap-2">
        <Button onClick={toggleRunning} variant={isRunning ? 'secondary' : 'default'}>
          {isRunning ? <><Pause className="mr-2 h-4 w-4" /> Pause Session</> : <><Play className="mr-2 h-4 w-4" /> Resume Session</>}
        </Button>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="destructive" disabled={shotsCount === 0 || isLoading}>
              {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <XCircle className="mr-2 h-4 w-4" />}
              End Session & Analyze
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you sure you want to end the session?</AlertDialogTitle>
              <AlertDialogDescription>
                This will finalize the session and proceed to the performance analysis. You won't be able to record more shots.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={onEnd}>Continue</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </CardContent>
  </Card>
);

export function LiveSession() {
  const [shots, setShots] = useState<Shot[]>([]);
  const [time, setTime] = useState(0);
  const [isRunning, setIsRunning] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  
  const router = useRouter();
  const { toast } = useToast();
  const lastFrameId = useRef<number | undefined>();
  const isPolling = useRef(false);
  const seenShotIds = useRef(new Set());

  // Start/Stop camera session
  useEffect(() => {
    manageCamera({ action: 'start', fps: 1 }).then(res => {
        if(res.success){
            toast({ title: 'Camera session started' });
        } else {
            toast({ variant: 'destructive', title: 'Failed to start camera session' });
        }
    });

    return () => {
      manageCamera({ action: 'stop' }).then(res => {
         if(res.success){
            toast({ title: 'Camera session stopped' });
        }
      });
    };
  }, [toast]);
  
  const handleAnalysis = useCallback(async (photoDataUri: string, frame_timestamp: string) => {
     try {
      const analysis = await getRoboflowAnalysis({ photoDataUri });
      if (analysis.predictions.length > 0) {
        const newShots: Shot[] = [];
        analysis.predictions.forEach(p => {
          if (!seenShotIds.current.has(p.detection_id)) {
            seenShotIds.current.add(p.detection_id);
            newShots.push({
              x: p.x,
              y: p.y,
              detection_id: p.detection_id,
              timestamp: frame_timestamp,
            });
          }
        });

        if (newShots.length > 0) {
          setShots((prev) => [...prev, ...newShots]);
           toast({
              title: `${newShots.length} New Shot(s) Detected!`,
              description: `Added to session.`,
            });
        }
      }
    } catch (e) {
      toast({
        variant: "destructive",
        title: 'Analysis Failed',
        description: 'Could not analyze the image.',
      });
      console.error(e);
    }
  }, [toast]);

  // Fetch and analyze frames continuously
  useEffect(() => {
    const poll = async () => {
      if (!isRunning || isPolling.current) return;

      isPolling.current = true;
      try {
        const result = await fetchNextFrame({ sinceId: lastFrameId.current });
        if (result.frameId && result.frameDataUri) {
          lastFrameId.current = result.frameId;
          handleAnalysis(result.frameDataUri, new Date().toISOString());
        }
      } catch (e) {
        console.error(e);
      } finally {
        isPolling.current = false;
        setTimeout(poll, 1000); // Poll every second
      }
    };

    poll();
    
  }, [isRunning, handleAnalysis]);

  // Timer
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isRunning) {
      interval = setInterval(() => {
        setTime((prevTime) => prevTime + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isRunning]);

  const toggleRunning = () => {
    setIsRunning(!isRunning);
  }

  const handleEndSession = async () => {
    if (shots.length === 0) {
      toast({
        variant: "destructive",
        title: "Session cannot be empty",
        description: "Please capture at least one shot before ending the session.",
      })
      return;
    };
    setIsLoading(true);

    const targetCenterX = 500 / 2; // Assuming target size is 500px for visualization
    const targetCenterY = 500 / 2;

    const getDistance = (x1: number, y1: number, x2: number, y2: number) => {
        return Math.sqrt(Math.pow(x1 - x2, 2) + Math.pow(y1 - y2, 2));
    };
    
    // Group Size
    let maxDistance = 0;
    for (let i = 0; i < shots.length; i++) {
        for (let j = i + 1; j < shots.length; j++) {
            const distance = getDistance(shots[i].x, shots[i].y, shots[j].x, shots[j].y);
            if (distance > maxDistance) {
                maxDistance = distance;
            }
        }
    }
    
    // Group Center (MPI)
    const avgX = shots.reduce((sum, shot) => sum + shot.x, 0) / shots.length;
    const avgY = shots.reduce((sum, shot) => sum + shot.y, 0) / shots.length;

    // Group Offset
    const offset = getDistance(avgX, avgY, targetCenterX, targetCenterY);

    // Consistency (Standard Deviation)
    const distancesFromMpi = shots.map(s => getDistance(s.x, s.y, avgX, avgY));
    const meanDistanceFromMpi = distancesFromMpi.reduce((sum, d) => sum + d, 0) / distancesFromMpi.length;
    const consistency = Math.sqrt(distancesFromMpi.reduce((sum, d) => sum + Math.pow(d - meanDistanceFromMpi, 2), 0) / distancesFromMpi.length);

    // Cadence
    const sortedShots = [...shots].sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
    const splitTimes = [];
    for (let i = 1; i < sortedShots.length; i++) {
      const timeDiff = (new Date(sortedShots[i].timestamp).getTime() - new Date(sortedShots[i-1].timestamp).getTime()) / 1000;
      splitTimes.push(timeDiff);
    }
    const avgSplit = splitTimes.reduce((sum, t) => sum + t, 0) / (splitTimes.length || 1);
    const cadence = avgSplit > 0 ? 60 / avgSplit : 0;
    
    const metrics: Metrics = {
        groupSize: maxDistance,
        groupCenter: {x: avgX, y: avgY},
        groupOffset: offset,
        consistency: consistency,
        time,
        cadence: cadence
    };

    try {
      const newSession = await createSession({ shots, metrics });
      toast({
        title: 'Session Saved!',
        description: 'Redirecting to your performance report.',
      });
      router.push(`/session/${newSession.id}`);
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error Saving Session',
        description: 'Could not save your session. Please try again.',
      });
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-4 sm:p-6 lg:p-8">
      <div className="mb-6 space-y-1">
        <h1 className="font-headline text-3xl font-bold tracking-tight">Live Session</h1>
        <p className="text-muted-foreground">
          Real-time shooting analysis is active. New shots are detected automatically.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <TargetVisualization shots={shots} />
        </div>
        <div className="flex flex-col gap-6">
          <SessionControls
            time={time}
            shotsCount={shots.length}
            onEnd={handleEndSession}
            isRunning={isRunning}
            toggleRunning={toggleRunning}
            isLoading={isLoading}
          />
        </div>
      </div>
    </div>
  );
}
