import { useEffect, useRef, useState } from "react";
import { io, Socket } from "socket.io-client";
import { type ServerToClientEvents, type ClientToServerEvents } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";

type SocketType = Socket<ServerToClientEvents, ClientToServerEvents>;

export interface GameState {
  mode: 'select' | 'host' | 'player';
  roomCode: string | null;
  playerName: string | null;
  isHost: boolean;
  currentQuestion: string | null;
  questionIndex: number;
  totalQuestions: number;
  players: string[];
  answers: Array<{ name: string; answer: string }>;
  gamePhase: 'waiting' | 'question' | 'revealing' | 'complete';
  connected: boolean;
}

export function useSocket() {
  const socketRef = useRef<SocketType | null>(null);
  const { toast } = useToast();
  
  const [gameState, setGameState] = useState<GameState>({
    mode: 'select',
    roomCode: null,
    playerName: null,
    isHost: false,
    currentQuestion: null,
    questionIndex: 0,
    totalQuestions: 0,
    players: [],
    answers: [],
    gamePhase: 'waiting',
    connected: false
  });

  useEffect(() => {
    // Initialize socket connection
    socketRef.current = io({
      path: "/socket.io/"
    });

    const socket = socketRef.current;

    socket.on("connect", () => {
      setGameState(prev => ({ ...prev, connected: true }));
    });

    socket.on("disconnect", () => {
      setGameState(prev => ({ ...prev, connected: false }));
      toast({
        title: "Disconnected",
        description: "Lost connection to server",
        variant: "destructive"
      });
    });

    socket.on("room:created", (data: { code: string }) => {
      setGameState(prev => ({
        ...prev,
        mode: 'host',
        roomCode: data.code,
        isHost: true,
        gamePhase: 'waiting'
      }));
      toast({
        title: "Room Created!",
        description: `Room code: ${data.code}`
      });
    });

    socket.on("room:joined", (data: { code: string; players: string[] }) => {
      setGameState(prev => ({
        ...prev,
        mode: 'player',
        roomCode: data.code,
        players: data.players,
        isHost: false
      }));
      toast({
        title: "Joined Room!",
        description: `Connected to room ${data.code}`
      });
    });

    socket.on("room:players", (players: string[]) => {
      setGameState(prev => ({ ...prev, players }));
    });

    socket.on("game:question", (data: { question: string; questionIndex: number; totalQuestions: number }) => {
      setGameState(prev => ({
        ...prev,
        currentQuestion: data.question,
        questionIndex: data.questionIndex,
        totalQuestions: data.totalQuestions,
        gamePhase: 'question',
        answers: []
      }));
    });

    socket.on("game:answers", (answers: Array<{ name: string; answer: string }>) => {
      setGameState(prev => ({
        ...prev,
        answers,
        gamePhase: 'revealing'
      }));
    });

    socket.on("game:complete", () => {
      setGameState(prev => ({ ...prev, gamePhase: 'complete' }));
      toast({
        title: "Game Complete!",
        description: "Thanks for playing Party Qs!"
      });
    });

    socket.on("game:ended", () => {
      setGameState(prev => ({
        ...prev,
        mode: 'select',
        roomCode: null,
        gamePhase: 'waiting',
        currentQuestion: null,
        answers: [],
        players: []
      }));
      toast({
        title: "Game Ended",
        description: "The host has left the game",
        variant: "destructive"
      });
    });

    socket.on("error", (message: string) => {
      toast({
        title: "Error",
        description: message,
        variant: "destructive"
      });
    });

    return () => {
      socket.disconnect();
    };
  }, [toast]);

  const actions = {
    createRoom: (questions: string[]) => {
      socketRef.current?.emit("room:create", { questions });
    },

    joinRoom: (code: string, name: string) => {
      setGameState(prev => ({ ...prev, playerName: name }));
      socketRef.current?.emit("room:join", { code, name });
    },

    submitAnswer: (answer: string) => {
      if (gameState.roomCode) {
        socketRef.current?.emit("answer:submit", { 
          code: gameState.roomCode, 
          answer 
        });
      }
    },

    hostAction: (action: 'start' | 'reveal' | 'next') => {
      if (gameState.roomCode && gameState.isHost) {
        socketRef.current?.emit("host:action", { 
          code: gameState.roomCode, 
          action 
        });
      }
    },

    resetGame: () => {
      setGameState({
        mode: 'select',
        roomCode: null,
        playerName: null,
        isHost: false,
        currentQuestion: null,
        questionIndex: 0,
        totalQuestions: 0,
        players: [],
        answers: [],
        gamePhase: 'waiting',
        connected: socketRef.current?.connected || false
      });
    }
  };

  return { gameState, actions };
}
