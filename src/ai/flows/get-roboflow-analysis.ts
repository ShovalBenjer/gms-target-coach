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
import Roboflow from 'roboflow';

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
    const apiKey = process.env.ROBOFLOW_API_KEY;
    const modelId = process.env.ROBOFLOW_MODEL_ID;

    if (!apiKey || !modelId) {
      throw new Error('Roboflow API key or model ID is not configured.');
    }
    
    const rf = new Roboflow({ apiKey });
    const project = rf.workspace().project(modelId.split('/')[0]);
    const model = project.version(Number(modelId.split('/')[1])).model;

    try {
      const imageBuffer = Buffer.from(input.photoDataUri.split(',')[1], 'base64');
      const result = await model.predict(imageBuffer);
      
      const predictions = result.predictions || [];

      const shots = predictions.map((item: any) => ({
        x: item.x,
        y: item.y
      }));

      return { shots };
    } catch (error) {
      console.error('Roboflow SDK error:', error);
      throw new Error(`Roboflow analysis failed.`);
    }
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
