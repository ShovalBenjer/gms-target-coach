import type { Session, Shot, Metrics } from './types';

const generateRandomShots = (count: number): Shot[] => {
  return Array.from({ length: count }, () => ({
    x: Math.random() * 20 - 10,
    y: Math.random() * 20 - 10,
  }));
};

let sessions: Session[] = [
  {
    id: '1',
    date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    shots: generateRandomShots(10),
    metrics: { accuracy: 85.5, grouping: 7.2, time: 120 },
  },
  {
    id: '2',
    date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    shots: generateRandomShots(15),
    metrics: { accuracy: 92.1, grouping: 5.4, time: 150 },
  },
];

export const getSessions = async (): Promise<Session[]> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(sessions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
    }, 500);
  });
};

export const getSessionById = async (id: string): Promise<Session | undefined> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(sessions.find((session) => session.id === id));
    }, 300);
  });
};

export const createSession = async (data: { shots: Shot[]; metrics: Metrics }): Promise<Session> => {
  return new Promise((resolve) => {
    const newSession: Session = {
      id: (sessions.length + 1).toString(),
      date: new Date().toISOString(),
      ...data,
    };
    sessions.push(newSession);
    setTimeout(() => {
      resolve(newSession);
    }, 500);
  });
};
