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

const RoboflowAnalysisInputSchema = z.object({
  photoDataUri: z
    .string()
    .describe(
      "A photo of a shooting target, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
});
export type RoboflowAnalysisInput = z.infer<typeof RoboflowAnalysisInputSchema>;

const RoboflowAnalysisOutputSchema = z.object({
  shots: z.array(
    z.object({
      x: z.number().describe('The x coordinate of the shot on the target.'),
      y: z.number().describe('The y coordinate of the shot on the target.'),
    })
  ),
});

export type RoboflowAnalysisOutput = z.infer<
  typeof RoboflowAnalysisOutputSchema
>;

const roboflowTool = ai.defineTool(
  {
    name: 'roboflowTool',
    description: 'Get shot data from Roboflow',
    inputSchema: RoboflowAnalysisInputSchema,
    outputSchema: RoboflowAnalysisOutputSchema,
  },
  async (input) => {
    const response = await fetch(
      `https://detect.roboflow.com/${process.env.ROBOFLOW_MODEL_ID}?api_key=${process.env.ROBOFLOW_API_KEY}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: input.photoDataUri,
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Roboflow API error:', errorText);
      throw new Error(`Roboflow API request failed: ${response.statusText}`);
    }

    const data = await response.json();

    const shots = data.predictions.map((prediction: any) => ({
      x: prediction.x,
      y: prediction.y,
    }));

    return { shots };
  }
);

export const getRoboflowAnalysis = ai.defineFlow(
  {
    name: 'getRoboflowAnalysis',
    inputSchema: RoboflowAnalysisInputSchema,
    outputSchema: RoboflowAnalysisOutputSchema,
  },
  async (input) => {
    return await roboflowTool(input);
  }
);
