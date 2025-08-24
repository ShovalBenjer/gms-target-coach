export interface Shot {
  x: number;
  y: number;
  detection_id: string;
  timestamp: string;
}

export interface Metrics {
  groupSize: number;
  groupCenter: { x: number, y: number };
  groupOffset: number;
  consistency: number;
  time: number; // in seconds
  cadence: number; // shots per minute
}

export interface Session {
  id: string;
  date: string;
  shots: Shot[];
  metrics: Metrics;
  advice?: string[];
}
