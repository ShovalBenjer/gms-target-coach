'use client';

import type { Shot } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Crosshair } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

const TARGET_SIZE = 500; // in pixels
const TARGET_RANGE = 12; // e.g., from -12 to +12 on each axis

export function TargetVisualization({ shots }: { shots: Shot[] }) {
  const getPosition = (coord: number) => {
    return ((coord + TARGET_RANGE) / (2 * TARGET_RANGE)) * TARGET_SIZE;
  };

  return (
    <Card className="h-full">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Crosshair className="h-6 w-6" />
          <CardTitle>Target Visualization</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="flex items-center justify-center p-2 sm:p-4">
        <TooltipProvider>
          <div
            className="relative bg-card"
            style={{ width: TARGET_SIZE, height: TARGET_SIZE }}
          >
            {/* Target Rings */}
            {[10, 8, 6, 4, 2].map((ring) => (
              <div
                key={ring}
                className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border border-dashed border-muted-foreground/50"
                style={{
                  width: `${(ring / TARGET_RANGE) * 100}%`,
                  height: `${(ring / TARGET_RANGE) * 100}%`,
                }}
              />
            ))}
             <div className="absolute left-1/2 top-1/2 h-2 w-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary"></div>
            {/* Crosshairs */}
            <div className="absolute left-0 top-1/2 w-full h-px bg-muted-foreground/30 -translate-y-1/2"></div>
            <div className="absolute top-0 left-1/2 h-full w-px bg-muted-foreground/30 -translate-x-1/2"></div>

            {/* Shots */}
            {shots.map((shot, index) => (
              <Tooltip key={index} delayDuration={0}>
                <TooltipTrigger asChild>
                  <div
                    className="absolute h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-accent ring-2 ring-accent/50 transition-transform duration-300 ease-out hover:scale-150"
                    style={{
                      left: `${getPosition(shot.x)}px`,
                      top: `${getPosition(shot.y)}px`,
                      animation: `shot-appear 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards`,
                    }}
                  />
                </TooltipTrigger>
                <TooltipContent>
                  <p>Shot {index + 1}: ({shot.x.toFixed(2)}, {shot.y.toFixed(2)})</p>
                </TooltipContent>
              </Tooltip>
            ))}
            <style jsx>{`
              @keyframes shot-appear {
                from {
                  transform: scale(0) translate(-50%, -50%);
                }
                to {
                  transform: scale(1) translate(-50%, -50%);
                }
              }
            `}</style>
          </div>
        </TooltipProvider>
      </CardContent>
    </Card>
  );
}
