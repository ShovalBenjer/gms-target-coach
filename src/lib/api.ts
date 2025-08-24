import type { Session, Shot, Metrics } from './types';

let sessions: Session[] = [];

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
