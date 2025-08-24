import { type Room, type Player } from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  // Room management
  createRoom(hostId: string, questions: string[]): Promise<string>;
  getRoom(code: string): Promise<Room | undefined>;
  updateRoom(code: string, updates: Partial<Room>): Promise<void>;
  deleteRoom(code: string): Promise<void>;
  
  // Player management
  addPlayerToRoom(code: string, socketId: string, name: string): Promise<void>;
  removePlayerFromRoom(code: string, socketId: string): Promise<void>;
  getPlayerName(code: string, socketId: string): Promise<string | undefined>;
  
  // Answer management
  submitAnswer(code: string, socketId: string, answer: string): Promise<void>;
  clearAnswers(code: string): Promise<void>;
  getAllAnswers(code: string): Promise<Array<{ name: string; answer: string }>>;
  getAnswerCount(code: string): Promise<number>;
  getPlayerCount(code: string): Promise<number>;
}

export class MemStorage implements IStorage {
  private rooms: Map<string, Room> = new Map();

  private generateRoomCode(): string {
    let code: string;
    do {
      code = Math.floor(1000 + Math.random() * 9000).toString();
    } while (this.rooms.has(code));
    return code;
  }

  async createRoom(hostId: string, questions: string[]): Promise<string> {
    const code = this.generateRoomCode();
    const room: Room = {
      code,
      hostId,
      questions: questions.filter(q => q.trim().length > 0),
      currentQuestionIndex: 0,
      players: {},
      answers: {},
      state: 'waiting'
    };
    
    this.rooms.set(code, room);
    return code;
  }

  async getRoom(code: string): Promise<Room | undefined> {
    return this.rooms.get(code);
  }

  async updateRoom(code: string, updates: Partial<Room>): Promise<void> {
    const room = this.rooms.get(code);
    if (room) {
      Object.assign(room, updates);
    }
  }

  async deleteRoom(code: string): Promise<void> {
    this.rooms.delete(code);
  }

  async addPlayerToRoom(code: string, socketId: string, name: string): Promise<void> {
    const room = this.rooms.get(code);
    if (room) {
      room.players[socketId] = name.trim();
    }
  }

  async removePlayerFromRoom(code: string, socketId: string): Promise<void> {
    const room = this.rooms.get(code);
    if (room) {
      delete room.players[socketId];
      delete room.answers[socketId];
    }
  }

  async getPlayerName(code: string, socketId: string): Promise<string | undefined> {
    const room = this.rooms.get(code);
    return room?.players[socketId];
  }

  async submitAnswer(code: string, socketId: string, answer: string): Promise<void> {
    const room = this.rooms.get(code);
    if (room && room.players[socketId]) {
      room.answers[socketId] = answer.trim();
    }
  }

  async clearAnswers(code: string): Promise<void> {
    const room = this.rooms.get(code);
    if (room) {
      room.answers = {};
    }
  }

  async getAllAnswers(code: string): Promise<Array<{ name: string; answer: string }>> {
    const room = this.rooms.get(code);
    if (!room) return [];
    
    return Object.entries(room.answers).map(([socketId, answer]) => ({
      name: room.players[socketId] || 'Unknown',
      answer
    }));
  }

  async getAnswerCount(code: string): Promise<number> {
    const room = this.rooms.get(code);
    return room ? Object.keys(room.answers).length : 0;
  }

  async getPlayerCount(code: string): Promise<number> {
    const room = this.rooms.get(code);
    return room ? Object.keys(room.players).length : 0;
  }
}

export const storage = new MemStorage();
