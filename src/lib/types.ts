export interface Shot {
  x: number;
  y: number;
  width: number;
  height: number;
  confidence: number;
  class: string;
  class_id: number;
  detection_id: string;
  timestamp: string;
}

export interface Metrics {
  groupSize: number;
  groupCenter: { x: number, y: number };
  groupOffset: number;
  consistency: number;
  time: number;
  cadence: number; 
}

export interface Session {
  id: string;
  date: string;
  shots: Shot[];
  metrics: Metrics;
  advice?: string[];
}

export interface RoboflowAnalysisOutput {
  inference_id: string;
  image: {
    width: number;
    height: number;
  };
  predictions: {
    predictions: Shot[],
    frame_timestamp: string,
  };
  image_output?: {
    type: string;
    value: string; // base64 encoded string
  },
  video_metadata?: {
    [key: string]: any;
  }
}
