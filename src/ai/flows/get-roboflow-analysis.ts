/**
 * @fileOverview A Roboflow integration for analyzing shooting target images.
 *
 * - getRoboflowAnalysis - A function that handles the Roboflow analysis process.
 * - RoboflowAnalysisInput - The input type for the getRoboflowAnalysis function.
 * - RoboflowAnalysisOutput - The return type for the getRoboflowAnalysis function.
 */
'use server';

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import type { RoboflowAnalysisOutput } from '@/lib/types';

const RoboflowAnalysisInputSchema = z.object({
  photoDataUri: z
    .string()
    .describe(
      "A photo of a shooting target, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'"
    ),
});

const RoboflowAnalysisOutputSchema = z.array(z.any());

export const getRoboflowAnalysis = ai.defineFlow(
  {
    name: 'getRoboflowAnalysis',
    inputSchema: RoboflowAnalysisInputSchema,
    outputSchema: RoboflowAnalysisOutputSchema,
  },
  async (input) => {
    const apiKey = process.env.ROBOFLOW_API_KEY;
    const workspaceId = process.env.ROBOFLOW_WORKSPACE_ID;
    const workflowId = process.env.ROBOFLOW_WORKFLOW_ID;
    const apiUrl = process.env.NEXT_PUBLIC_ROBOFLOW_API_URL;

    if (!apiKey || !workflowId || !workspaceId || !apiUrl) {
      throw new Error('Roboflow environment variables are not configured.');
    }
    
    // Roboflow's API expects the image data to be just the base64 part
    const base64Image = input.photoDataUri.split(',')[1];

    try {
      const response = await fetch(`${apiUrl}/workflows/${workspaceId}/${workflowId}?api_key=${apiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          image: {
            type: "base64",
            value: base64Image
          }
        }),
      });

      if (!response.ok) {
        const errorBody = await response.text();
        console.error('Roboflow API error:', response.status, errorBody);
        throw new Error(`Failed to get analysis from Roboflow: ${response.statusText}`);
      }

      const result: RoboflowAnalysisOutput[] = await response.json();
      return result;

    } catch (error) {
      console.error('Error in getRoboflowAnalysis flow:', error);
      return [];
    }
  }
);
