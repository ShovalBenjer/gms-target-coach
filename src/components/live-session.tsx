
'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, Pause, Play, XCircle, Camera, Bot } from 'lucide-react';
import type { Shot, Metrics, RoboflowAnalysisOutput } from '@/lib/types';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
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
} from '@/components/ui/alert-dialog';
import { TargetVisualization } from './target-visualization';

const StatBox = ({ label, value }: { label: string; value: string }) => (
  <div className="rounded-lg bg-background/50 p-4 text-center shadow-inner">
    <p className="font-mono text-3xl font-bold text-foreground">{value}</p>
    <p className="text-sm text-muted-foreground">{label}</p>
  </div>
);

export function LiveSession() {
  const [shots, setShots] = useState<Shot[]>([]);
  const [sessionMetrics, setSessionMetrics] = useState<Metrics>({
    groupSize: 0,
    groupCenter: { x: 0, y: 0 },
    groupOffset: 0,
    consistency: 0,
    time: 0,
    cadence: 0,
  });
  const [time, setTime] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [latestAnalysis, setLatestAnalysis] =
    useState<RoboflowAnalysisOutput['output'][0] | null>(null);
  const [latestFrame, setLatestFrame] = useState<string | null>(null);

  const router = useRouter();
  const { toast } = useToast();
  const lastFrameId = useRef<number | undefined>();
  const isPolling = useRef(false);
  const seenShotIds = useRef(new Set());
  
  const cameraFeedUrl = process.env.NEXT_PUBLIC_CAMERA_SERVER_URL ? `${process.env.NEXT_PUBLIC_CAMERA_SERVER_URL}/frame/latest` : null;

  // Start/Stop camera session
  useEffect(() => {
    manageCamera({ action: 'start', fps: 1 }).then((res) => {
      if (res.success) {
        toast({ title: 'Camera session started' });
        setIsRunning(true);
      } else {
        toast({
          variant: 'destructive',
          title: 'Failed to start camera session',
        });
      }
    });

    return () => {
      setIsRunning(false);
      manageCamera({ action: 'stop' }).then((res) => {
        if (res.success) {
          toast({ title: 'Camera session stopped' });
        }
      });
    };
  }, [toast]);

  // Recalculate metrics when shots change
  useEffect(() => {
    if (shots.length < 2) {
      setSessionMetrics((prev) => ({
        ...prev,
        groupSize: 0,
        consistency: 0,
        cadence: 0,
      }));
      return;
    }

    const getDistance = (x1: number, y1: number, x2: number, y2: number) => {
      return Math.sqrt(Math.pow(x1 - x2, 2) + Math.pow(y1 - y2, 2));
    };

    let maxDistance = 0;
    for (let i = 0; i < shots.length; i++) {
      for (let j = i + 1; j < shots.length; j++) {
        const distance = getDistance(
          shots[i].x,
          shots[i].y,
          shots[j].x,
          shots[j].y
        );
        if (distance > maxDistance) {
          maxDistance = distance;
        }
      }
    }

    const avgX = shots.reduce((sum, shot) => sum + shot.x, 0) / shots.length;
    const avgY = shots.reduce((sum, shot) => sum + shot.y, 0) / shots.length;
    
    const imageWidth = latestAnalysis?.image?.width ?? 0;
    const imageHeight = latestAnalysis?.image?.height ?? 0;

    const targetCenterX = imageWidth / 2;
    const targetCenterY = imageHeight / 2;
    const offset = getDistance(avgX, avgY, targetCenterX, targetCenterY);

    const distancesFromMpi = shots.map((s) =>
      getDistance(s.x, s.y, avgX, avgY)
    );
    const stdDev = Math.sqrt(
      distancesFromMpi.reduce(
        (sum, d) =>
          sum +
          Math.pow(
            d -
              distancesFromMpi.reduce((a, b) => a + b) /
                distancesFromMpi.length,
            2
          ),
        0
      ) /
        (distancesFromMpi.length - 1 || 1)
    );

    const sortedShots = [...shots].sort(
      (a, b) =>
        new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );
    const splitTimes = [];
    if (sortedShots.length > 1) {
      for (let i = 1; i < sortedShots.length; i++) {
        const timeDiff =
          (new Date(sortedShots[i].timestamp).getTime() -
            new Date(sortedShots[i - 1].timestamp).getTime()) /
          1000;
        splitTimes.push(timeDiff);
      }
    }
    const avgSplit =
      splitTimes.reduce((sum, t) => sum + t, 0) / (splitTimes.length || 1);
    const cadence = avgSplit > 0 ? 60 / avgSplit : 0;

    setSessionMetrics({
      groupSize: maxDistance,
      groupCenter: { x: avgX, y: avgY },
      groupOffset: offset,
      consistency: stdDev,
      time: time,
      cadence: cadence,
    });
  }, [shots, latestAnalysis, time]);

  const handleAnalysis = useCallback(
    async (photoDataUri: string) => {
      try {
        const result = await getRoboflowAnalysis({ photoDataUri });

        if (!result || result.length === 0) return;

        const analysis = result[0];
        setLatestAnalysis(analysis);

        const newShots: Shot[] = [];
        if (analysis.predictions?.predictions) {
            analysis.predictions.predictions.forEach((p: any) => {
            if (!seenShotIds.current.has(p.detection_id)) {
                seenShotIds.current.add(p.detection_id);
                newShots.push({
                ...p,
                timestamp: new Date(
                    analysis.predictions.frame_timestamp
                ).toISOString(),
                });
            }
            });
        }
        

        if (newShots.length > 0) {
          setShots((prev) => [...prev, ...newShots]);
          toast({
            title: `${newShots.length} New Shot(s) Detected!`,
            description: `Total shots: ${[...shots, ...newShots].length}`,
          });
        }
      } catch (e) {
        toast({
          variant: 'destructive',
          title: 'Analysis Failed',
          description: 'Could not analyze the image.',
        });
        console.error(e);
      }
    },
    [toast, shots]
  );
  
    // Fetch and analyze frames continuously
    useEffect(() => {
        const poll = async () => {
        if (!isRunning || isPolling.current) return;

        isPolling.current = true;
        try {
            const result = await fetchNextFrame({ sinceId: lastFrameId.current });
            if (result.frameId && result.frameDataUri) {
            lastFrameId.current = result.frameId;
            await handleAnalysis(result.frameDataUri);
            }
        } catch (e) {
            console.error(e);
        } finally {
            isPolling.current = false;
            if (isRunning) {
                // Use a timeout to avoid a tight loop, especially if errors occur
                setTimeout(poll, 1000); 
            }
        }
        };

        if (isRunning) {
            poll();
        }
  }, [isRunning, handleAnalysis]);

  // Update latest frame for display
  useEffect(() => {
    const fetchLatest = () => {
        if (isRunning && cameraFeedUrl) {
            fetch(`${cameraFeedUrl}?t=${new Date().getTime()}`, { headers: { 'ngrok-skip-browser-warning': 'true' } })
                .then(res => {
                    if (res.ok) return res.blob();
                    return null;
                })
                .then(blob => {
                    if (blob) {
                        setLatestFrame(URL.createObjectURL(blob));
                    }
                })
                .catch(err => console.error("Failed to fetch latest frame:", err));
        }
    };
    const interval = setInterval(fetchLatest, 1000); // Fetch every second
    return () => clearInterval(interval);
  }, [isRunning, cameraFeedUrl]);


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
  };

  const handleEndSession = async () => {
    if (shots.length === 0) {
      toast({
        variant: 'destructive',
        title: 'Session cannot be empty',
        description:
          'Please capture at least one shot before ending the session.',
      });
      return;
    }
    setIsLoading(true);

    const finalMetrics = { ...sessionMetrics, time };

    try {
      const newSession = await createSession({ shots, metrics: finalMetrics });
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

  const formattedTime =
    String(Math.floor(time / 60)).padStart(2, '0') +
    ':' +
    String(time % 60).padStart(2, '0');

  return (
    <div className="container mx-auto p-4 sm:p-6 lg:p-8">
      <div className="mb-6 space-y-1">
        <h1 className="font-headline text-3xl font-bold tracking-tight">
          Live Session
        </h1>
        <p className="text-muted-foreground">
          Real-time shooting analysis is active. New shots are detected
          automatically.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 lg:items-start">
        <div className="grid grid-cols-1 gap-6">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Camera className="h-6 w-6" />
                <CardTitle>Live Camera Feed</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              {latestFrame ? (
                <img
                  src={latestFrame}
                  alt="Live camera feed"
                  className="w-full rounded-md"
                />
              ) : (
                <div className="flex h-64 w-full items-center justify-center rounded-md bg-muted text-muted-foreground">
                  Camera feed starting...
                </div>
              )}
            </CardContent>
          </Card>

           <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Bot className="h-6 w-6 text-primary" />
                <CardTitle>Roboflow Analysis</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              {latestAnalysis?.image_output?.value ? (
                <img
                  src={latestAnalysis.image_output.value}
                  alt="Roboflow analysis"
                  className="w-full rounded-md"
                />
              ) : (
                <div className="flex h-64 w-full items-center justify-center rounded-md bg-muted text-muted-foreground">
                  Waiting for first analysis...
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="flex flex-col gap-6 lg:sticky lg:top-20">
          <Card className="bg-card">
            <CardHeader>
              <CardTitle>Mid-Session Report</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <StatBox label="Time Elapsed" value={formattedTime} />
                <StatBox label="Shots Fired" value={shots.length.toString()} />
                <StatBox
                  label="Group Size (px)"
                  value={sessionMetrics.groupSize.toFixed(1)}
                />
                <StatBox
                  label="Cadence (SPM)"
                  value={sessionMetrics.cadence.toFixed(1)}
                />
              </div>
              <div className="flex flex-col gap-2 pt-4">
                <Button
                  onClick={toggleRunning}
                  variant={isRunning ? 'secondary' : 'default'}
                  size="lg"
                >
                  {isRunning ? (
                    <>
                      <Pause className="mr-2 h-4 w-4" /> Pause Session
                    </>
                  ) : (
                    <>
                      <Play className="mr-2 h-4 w-4" /> Resume Session
                    </>
                  )}
                </Button>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="destructive"
                      size="lg"
                      disabled={shots.length === 0 || isLoading}
                    >
                      {isLoading ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <XCircle className="mr-2 h-4 w-4" />
                      )}
                      End & Analyze
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>
                        Are you sure you want to end the session?
                      </AlertDialogTitle>
                      <AlertDialogDescription>
                        This will finalize the session and proceed to the
                        performance analysis.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={handleEndSession}>
                        End Session
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </CardContent>
          </Card>

          <TargetVisualization shots={shots} />

        </div>
      </div>
    </div>
  );
}

