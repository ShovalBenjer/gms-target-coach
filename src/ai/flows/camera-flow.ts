/**
 * @fileOverview Manages the camera server session and frame retrieval.
 *
 * - manageCamera - A tool to control the camera session (start, stop).
 * - fetchNextFrame - A flow to get the next frame from the camera server.
 */
'use server';
import { ai } from '@/ai/genkit';
import { z } from 'zod';

const BASE_URL = process.env.NEXT_PUBLIC_CAMERA_SERVER_URL || '';
const HEADERS = { 'ngrok-skip-browser-warning': 'true' };
const POST_HEADERS = { ...HEADERS, 'Content-Type': 'application/json' };

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

        // If a session is already running, the server might return 409 Conflict.
        // We treat this as a success, similar to the Python example.
        if (response.status === 409) {
          console.log('Camera session already running, reusing.');
          // You might want to fetch the current session ID here if needed.
          return { success: true, status: 'already_running' };
        }
        
        if (!response.ok) {
          const errorText = await response.text();
          console.error('Failed to start camera session:', errorText);
          throw new Error(`Failed to start camera session: ${errorText}`);
        }

        const data = await response.json();
        return { success: true, sessionId: data.session_id, status: data.status };
      } catch (error) {
        console.error('Error starting camera session:', error);
        return { success: false, status: 'Error starting session' };
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


// Flow to fetch the next frame
export const fetchNextFrame = ai.defineFlow(
  {
    name: 'fetchNextFrame',
    inputSchema: z.object({
      sinceId: z.number().optional(),
    }),
    outputSchema: z.object({
      frameId: z.number().nullable(),
      sessionId: z.string().nullable(),
      frameDataUri: z.string().nullable(),
    }),
  },
  async ({ sinceId }) => {
    try {
      const params = new URLSearchParams({ timeout: '10' });
      if (sinceId) {
        params.set('since', sinceId.toString());
      }
      
      const response = await fetch(`${BASE_URL}/frame/next?${params.toString()}`, {
        headers: HEADERS,
      });

      if (response.status === 204) {
        return { frameId: null, sessionId: null, frameDataUri: null };
      }

      if (!response.ok) {
        console.error('Failed to fetch frame:', await response.text());
        throw new Error('Failed to fetch frame');
      }

      const frameId = parseInt(response.headers.get('X-Frame-Id') || '0', 10);
      const sessionId = response.headers.get('X-Session-Id');
      const arrayBuffer = await response.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      const frameDataUri = `data:image/jpeg;base64,${buffer.toString('base64')}`;

      return { frameId, sessionId, frameDataUri };
    } catch (error) {
      console.error('Error fetching next frame:', error);
      return { frameId: null, sessionId: null, frameDataUri: null };
    }
  }
);
