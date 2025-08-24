'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Camera, Timer, Video, XCircle, Loader2, Play, Pause } from 'lucide-react';
import type { Shot, Metrics } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TargetVisualization } from '@/components/target-visualization';
import { createSession } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { getRoboflowAnalysis } from '@/ai/flows/get-roboflow-analysis';
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
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';

const CameraCapture = ({ onCapture, isRunning, videoRef, hasCameraPermission }: { onCapture: () => void, isRunning: boolean, videoRef: React.RefObject<HTMLVideoElement>, hasCameraPermission: boolean | null }) => (
  <Card className="h-full">
    <CardHeader>
      <div className="flex items-center gap-2">
        <Video className="h-6 w-6" />
        <CardTitle>Live Feed</CardTitle>
      </div>
    </CardHeader>
    <CardContent className="flex flex-col items-center gap-4">
      <div className="relative w-full overflow-hidden rounded-lg border bg-secondary aspect-video flex items-center justify-center">
        <video ref={videoRef} className="w-full aspect-video rounded-md" autoPlay muted playsInline />
        {hasCameraPermission === false && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center text-white p-4">
            Camera permission denied. Please enable it in your browser settings.
          </div>
        )}
      </div>
      <Button onClick={onCapture} disabled={!isRunning || !hasCameraPermission}>
        <Camera className="mr-2 h-4 w-4" />
        Capture Shot
      </Button>
    </CardContent>
  </Card>
);

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
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    const getCameraPermission = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        setHasCameraPermission(true);

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (error) {
        console.error('Error accessing camera:', error);
        setHasCameraPermission(false);
        toast({
          variant: 'destructive',
          title: 'Camera Access Denied',
          description: 'Please enable camera permissions in your browser settings to use this app.',
        });
      }
    };

    getCameraPermission();
  }, [toast]);
  

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isRunning) {
      interval = setInterval(() => {
        setTime((prevTime) => prevTime + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isRunning]);

  const handleCaptureShot = useCallback(async () => {
    if (!isRunning || !videoRef.current) return;
  
    const video = videoRef.current;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const context = canvas.getContext('2d');
    if (context) {
      context.drawImage(video, 0, 0, canvas.width, canvas.height);
      const photoDataUri = canvas.toDataURL('image/jpeg');
      
      toast({
        title: 'Capturing Shot...',
        description: 'Analyzing image with Roboflow.',
      });

      try {
        const analysis = await getRoboflowAnalysis({ photoDataUri });
        if (analysis.shots.length > 0) {
          setShots((prev) => [...prev, ...analysis.shots]);
          toast({
            title: `${analysis.shots.length} Shot(s) Captured!`,
            description: `New shots recorded.`,
          });
        } else {
          toast({
            variant: "destructive",
            title: 'No shots detected',
            description: 'Roboflow could not detect any shots in the image.',
          });
        }
      } catch (e) {
        toast({
          variant: "destructive",
          title: 'Analysis Failed',
          description: 'Could not analyze the image.',
        });
        console.error(e);
      }
    }
  }, [isRunning, toast]);
  
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

    const metrics: Metrics = {
      accuracy: Math.random() * 20 + 80, // 80-100
      grouping: Math.random() * 5 + 1, // 1-6
      time,
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
          Your real-time shooting analysis is active.
        </p>
      </div>

      {hasCameraPermission === false && (
        <Alert variant="destructive" className="mb-4">
          <AlertTitle>Camera Access Required</AlertTitle>
          <AlertDescription>
            Please allow camera access to use this feature. You may need to reload the page after granting permission.
          </AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <TargetVisualization shots={shots} />
        </div>
        <div className="flex flex-col gap-6">
          <CameraCapture onCapture={handleCaptureShot} isRunning={isRunning} videoRef={videoRef} hasCameraPermission={hasCameraPermission} />
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
