export interface Shot {
  x: number;
  y: number;
}

export interface Metrics {
  accuracy: number;
  grouping: number;
  time: number; // in seconds
}

export interface Session {
  id: string;
  date: string;
  shots: Shot[];
  metrics: Metrics;
  advice?: string[];
}
