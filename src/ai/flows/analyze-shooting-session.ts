'use server';

/**
 * @fileOverview Provides AI-powered coaching advice based on shooting session data.
 *
 * - analyzeShootingSession - Analyzes shooting data and provides personalized coaching advice.
 * - AnalyzeShootingSessionInput - The input type for the analyzeShootingSession function.
 * - AnalyzeShootingSessionOutput - The return type for the analyzeShootingSession function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const AnalyzeShootingSessionInputSchema = z.object({
  shots: z
    .array(
      z.object({
        x: z.number().describe('The x coordinate of the shot on the target.'),
        y: z.number().describe('The y coordinate of the shot on the target.'),
      })
    )
    .describe('An array of shot coordinates from the shooting session.'),
  metrics: z
    .object({
      accuracy: z.number().describe('The overall accuracy score of the session.'),
      grouping: z.number().describe('The grouping score of the shots.'),
      time: z.number().describe('The time taken for the shooting session.'),
    })
    .describe('Performance metrics from the shooting session.'),
  userSkillLevel: z
    .string() 
    .describe('The skill level of the user (e.g., beginner, intermediate, advanced).'),
});
export type AnalyzeShootingSessionInput = z.infer<typeof AnalyzeShootingSessionInputSchema>;

const AnalyzeShootingSessionOutputSchema = z.object({
  coachingAdvice: z
    .array(z.string())
    .describe('An array of personalized coaching tips to improve shooting technique.'),
});
export type AnalyzeShootingSessionOutput = z.infer<typeof AnalyzeShootingSessionOutputSchema>;

export async function analyzeShootingSession(
  input: AnalyzeShootingSessionInput
): Promise<AnalyzeShootingSessionOutput> {
  return analyzeShootingSessionFlow(input);
}

const determineApplicableTips = ai.defineTool({
  name: 'determineApplicableTips',
  description: 'Determines which shooting tips are most applicable to the user based on their skill level and shooting data.',
  inputSchema: z.object({
    userSkillLevel: z
      .string()
      .describe('The skill level of the user (e.g., beginner, intermediate, advanced).'),
    accuracy: z.number().describe('The overall accuracy score of the session.'),
    grouping: z.number().describe('The grouping score of the shots.'),
  }),
  outputSchema: z.array(z.string()),
},
async (input) => {
  const {
    userSkillLevel,
    accuracy,
    grouping
  } = input;

    const beginnerTips = [
      'Focus on aligning your sights properly.',
      'Practice your stance for better stability.',
      'Dry fire practice can help improve trigger control.',
    ];

    const intermediateTips = [
      'Work on reducing trigger anticipation.',
      'Refine your grip for better recoil management.',
      'Incorporate breathing techniques for steadier aim.',
    ];

    const advancedTips = [
      'Practice rapid target acquisition.',
      'Analyze your shot patterns to identify subtle errors.',
      'Experiment with different shooting positions for versatility.',
    ];

    let applicableTips = [];

    if (userSkillLevel === 'beginner') {
      applicableTips = beginnerTips;
    } else if (userSkillLevel === 'intermediate') {
      applicableTips = intermediateTips;
    } else {
      applicableTips = advancedTips;
    }

  if (accuracy < 0.7) {
      applicableTips.push('Focus on consistent sight alignment and trigger pull.');
    }

    if (grouping < 0.6) {
      applicableTips.push(
        'Practice dry firing to improve trigger control and reduce movement.'
      );
    }

    return applicableTips;
});

const analyzeShootingSessionPrompt = ai.definePrompt({
  name: 'analyzeShootingSessionPrompt',
  tools: [determineApplicableTips],
  input: {schema: AnalyzeShootingSessionInputSchema},
  output: {schema: AnalyzeShootingSessionOutputSchema},
  prompt: `Analyze the following shooting session data to provide personalized coaching advice.

Shooting Session Data:
Shots: {{shots}}
Metrics: {{metrics}}
User Skill Level: {{userSkillLevel}}

Based on the user's skill level and shooting data, use the determineApplicableTips tool to determine which shooting tips are most applicable. Provide coaching advice based on the identified areas for improvement.`, 
});

const analyzeShootingSessionFlow = ai.defineFlow(
  {
    name: 'analyzeShootingSessionFlow',
    inputSchema: AnalyzeShootingSessionInputSchema,
    outputSchema: AnalyzeShootingSessionOutputSchema,
  },
  async input => {
    const {output} = await analyzeShootingSessionPrompt(input);
    return output!;
  }
);
