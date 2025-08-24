import type { Session, Shot, Metrics } from './types';

let sessions: Session[] = [
  {
    id: '1',
    date: '2024-08-20T12:00:00.000Z',
    shots: [
      { x: 1, y: 2 },
      { x: -3, y: -4 },
    ],
    metrics: { accuracy: 85.5, grouping: 7.2, time: 120 },
  },
  {
    id: '2',
    date: '2024-08-21T14:30:00.000Z',
    shots: [
      { x: 5, y: -1 },
      { x: 6, y: 0 },
    ],
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
