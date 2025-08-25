/**
 * @fileOverview Manages the camera server session and frame retrieval/analysis.
 *
 * - manageCamera - A tool to control the camera session (start, stop).
 * - fetchAndAnalyzeNextFrame - A flow to get the next frame and send it for analysis.
 */
'use server';

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { getRoboflowAnalysis } from './get-roboflow-analysis';
import type { RoboflowAnalysisOutput } from '@/lib/types';

const BASE_URL = process.env.NEXT_PUBLIC_CAMERA_SERVER_URL || '';
const POST_HEADERS = { 'Content-Type': 'application/json', 'ngrok-skip-browser-warning': 'true' };
const GET_HEADERS = { 'ngrok-skip-browser-warning': 'true' };

// Tool to manage the camera session
export const manageCamera = ai.defineTool(
  {
    name: 'manageCamera',
    description: 'Start or stop a camera session.',
    inputSchema: z.object({
      action: z.enum(['start', 'stop']),
      fps: z.number().optional().default(1),
    }),
    outputSchema: z.object({
      success: z.boolean(),
      sessionId: z.string().optional(),
      status: z.string().optional(),
    }),
  },
  async ({ action, fps }) => {
    if (action === 'start') {
      try {
        const response = await fetch(`${BASE_URL}/session/start`, {
          method: 'POST',
          headers: POST_HEADERS,
          body: JSON.stringify({ fps, force: true }),
        });
        
        if (response.status === 409) {
          console.log('Camera session already running, reusing.');
          return { success: true, status: 'already_running' };
        }
        
        if (!response.ok) {
          const errorText = await response.text();
          console.error('Failed to start camera session:', response.status, errorText);
          throw new Error(`Failed to start camera session: ${errorText}`);
        }

        const data = await response.json();
        return { success: true, sessionId: data.session_id, status: data.status };
      } catch (error) {
        console.error('Error starting camera session:', error);
        return { success: false, status: `Error: ${error instanceof Error ? error.message : String(error)}` };
      }
    } else { // stop
      try {
        const response = await fetch(`${BASE_URL}/session/close`, {
          method: 'POST',
          headers: POST_HEADERS,
        });
        if (!response.ok) {
            const errorText = await response.text();
            console.error('Failed to stop camera session:', errorText);
            return { success: false, status: 'Failed to stop session' };
        }
        const data = await response.json();
        return { success: true, status: data.stopped ? 'stopped' : 'error' };
      } catch (error) {
        console.error('Error stopping camera session:', error);
        return { success: false, status: 'Error stopping session' };
      }
    }
  }
);


// Flow to fetch the next frame and pass it to analysis
export const fetchAndAnalyzeNextFrame = ai.defineFlow(
  {
    name: 'fetchAndAnalyzeNextFrame',
    inputSchema: z.object({
      sinceId: z.number().optional(),
    }),
    outputSchema: z.array(z.any()), // Output of getRoboflowAnalysis
  },
  async ({ sinceId }) => {
    try {
      const params = new URLSearchParams({ timeout: '10' });
      if (sinceId !== undefined && sinceId !== null) {
        params.set('since', sinceId.toString());
      }
      
      const response = await fetch(`${BASE_URL}/frame/next?${params.toString()}`, {
        headers: GET_HEADERS,
      });

      if (response.status === 204) {
        // No new frame within timeout, return empty analysis
        return [];
      }

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Failed to fetch frame:', errorText);
        throw new Error('Failed to fetch frame');
      }

      const arrayBuffer = await response.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      const frameDataUri = `data:image/jpeg;base64,${buffer.toString('base64')}`;

      // Now, call the analysis flow with the new frame
      const analysisResult = await getRoboflowAnalysis({ photoDataUri: frameDataUri });

      return analysisResult;

    } catch (error) {
      console.error('Error in fetchAndAnalyzeNextFrame:', error);
      return [];
    }
  }
);