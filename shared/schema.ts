import { z } from "zod";

// Question with correct answer
export const questionSchema = z.object({
  question: z.string(),
  correctAnswer: z.string()
});

// Room and game state types
export const roomSchema = z.object({
  code: z.string().length(4),
  hostId: z.string(),
  questions: z.array(questionSchema),
  currentQuestionIndex: z.number(),
  players: z.record(z.string(), z.string()), // socketId -> playerName
  answers: z.record(z.string(), z.string()), // socketId -> answer
  scores: z.record(z.string(), z.number()).default({}), // socketId -> score
  state: z.enum(['waiting', 'question', 'voting', 'revealing', 'complete'])
});

export const playerSchema = z.object({
  id: z.string(),
  name: z.string().min(1).max(30),
  roomCode: z.string().length(4),
  isHost: z.boolean().default(false)
});

// Socket event schemas
export const createRoomSchema = z.object({
  questions: z.array(questionSchema).min(1).max(100)
});

export const joinRoomSchema = z.object({
  code: z.string().length(4),
  name: z.string().min(1).max(30)
});

export const submitAnswerSchema = z.object({
  code: z.string().length(4),
  answer: z.string().min(1).max(500)
});

export const voteAnswerSchema = z.object({
  code: z.string().length(4),
  selectedAnswer: z.string()
});

export const hostActionSchema = z.object({
  code: z.string().length(4),
  action: z.enum(['start', 'show_voting', 'reveal', 'next'])
});

// Types
export type Question = z.infer<typeof questionSchema>;
export type Room = z.infer<typeof roomSchema>;
export type Player = z.infer<typeof playerSchema>;
export type CreateRoomData = z.infer<typeof createRoomSchema>;
export type JoinRoomData = z.infer<typeof joinRoomSchema>;
export type SubmitAnswerData = z.infer<typeof submitAnswerSchema>;
export type VoteAnswerData = z.infer<typeof voteAnswerSchema>;
export type HostActionData = z.infer<typeof hostActionSchema>;

// Socket event types
export interface ServerToClientEvents {
  'room:created': (data: { code: string }) => void;
  'room:joined': (data: { code: string; players: string[] }) => void;
  'room:players': (players: string[]) => void;
  'game:question': (data: { question: string; questionIndex: number; totalQuestions: number }) => void;
  'game:voting': (data: { answers: Array<{ answer: string; isCorrect?: boolean }> }) => void;
  'game:results': (data: { 
    correctAnswer: string; 
    scores: Array<{ name: string; score: number; gained: number }>; 
    leaderboard: Array<{ name: string; score: number }>;
  }) => void;
  'game:complete': () => void;
  'game:ended': () => void;
  'error': (message: string) => void;
}

export interface ClientToServerEvents {
  'room:create': (data: CreateRoomData) => void;
  'room:join': (data: JoinRoomData) => void;
  'answer:submit': (data: SubmitAnswerData) => void;
  'answer:vote': (data: VoteAnswerData) => void;
  'host:action': (data: HostActionData) => void;
}
