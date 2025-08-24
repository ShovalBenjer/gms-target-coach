# **App Name**: GMShooter

## Core Features:

- Real-time Target Display: Live Session Page: Display a real-time digital target reflecting detected shot locations from the video feed using TargetVisualization and CameraCapture components.
- Session History: User Dashboard: Allow users to view past sessions and their performance history.
- Performance Reporting: Detailed Report Page: Provide a detailed performance report after each session, displaying metrics, charts, and AI-powered coaching advice via AnalysisResults component.
- Camera Stream: Camera Integration: Connect to the Raspberry Pi Camera Server API (long-polling) to fetch frames, convert to Base64, and send to Roboflow.
- Shot Detection: Use Roboflow Vision Model API to detect bullet holes in the video feed and log shot data (position on target).
- AI Coaching: Based on shooting patterns and metrics, offer AI-powered coaching advice to improve the user's shooting technique, using a tool to determine which tips are most applicable.

## Style Guidelines:

- Primary color: A saturated blue (#29ABE2) to convey trust, clarity, and focus, all of which are relevant to training applications.
- Background color: Light gray (#F0F0F0), which keeps the screen clean and minimizes distractions, allowing the content to stand out; note that its hue aligns with the blue of the primary color.
- Accent color: Yellow-orange (#F9A825) provides a contrasting color for highlights and calls to action.
- Font pairing: 'Space Grotesk' (sans-serif) for headlines and 'Inter' (sans-serif) for body text.
- Code font: 'Source Code Pro' for displaying the inevitable code snippets.
- Use clear and intuitive icons from the Shadcn/UI library, emphasizing consistency across the interface.
- Implement a responsive layout that adapts seamlessly to different screen sizes.