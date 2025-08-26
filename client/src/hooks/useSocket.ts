import { useEffect, useRef, useState } from "react";
import { io, Socket } from "socket.io-client";
import {
  type ServerToClientEvents,
  type ClientToServerEvents,
} from "@shared/schema";
import { useToast } from "@/hooks/use-toast";

type SocketType = Socket<ServerToClientEvents, ClientToServerEvents>;

export interface GameState {
  mode: "select" | "host" | "player";
  roomCode: string | null;
  playerName: string | null;
  isHost: boolean;
  currentQuestion: string | null;
  questionIndex: number;
  totalQuestions: number;
  players: string[];
  votingOptions: Array<{ answer: string; isCorrect?: boolean }>;
  leaderboard: Array<{ name: string; score: number }>;
  correctAnswer: string | null;
  imageUrl: string | null;
  gamePhase: "waiting" | "question" | "voting" | "revealing" | "complete";
  connected: boolean;
}

export function useSocket() {
  const socketRef = useRef<SocketType | null>(null);
  const { toast } = useToast();

  const [gameState, setGameState] = useState<GameState>({
    mode: "select",
    roomCode: null,
    playerName: null,
    isHost: false,
    currentQuestion: null,
    questionIndex: 0,
    totalQuestions: 0,
    players: [],
    votingOptions: [],
    leaderboard: [],
    correctAnswer: null,
    imageUrl: null,
    gamePhase: "waiting",
    connected: false,
  });

  useEffect(() => {
    // Initialize socket connection
    socketRef.current = io({
      path: "/socket.io/",
    });

    const socket = socketRef.current;

    socket.on("connect", () => {
      setGameState((prev) => ({ ...prev, connected: true }));
    });

    socket.on("disconnect", () => {
      setGameState((prev) => ({ ...prev, connected: false }));
      toast({
        title: "מנותק",
        description: "איבדת חיבור לשרת",
        variant: "destructive",
      });
    });

    socket.on("room:created", (data: { code: string }) => {
      setGameState((prev) => ({
        ...prev,
        mode: "host",
        roomCode: data.code,
        isHost: true,
        gamePhase: "waiting",
      }));
      toast({
        title: "החדר נוצר!",
        description: `קוד חדר: ${data.code}`,
      });
    });

    socket.on("room:joined", (data: { code: string; players: string[] }) => {
      setGameState((prev) => ({
        ...prev,
        mode: "player",
        roomCode: data.code,
        players: data.players,
        isHost: false,
      }));
      toast({
        title: "הצטרפת לחדר!",
        description: `מחובר לחדר ${data.code}`,
      });
    });

    socket.on("room:players", (players: string[]) => {
      setGameState((prev) => ({ ...prev, players }));
    });

    socket.on(
      "game:question",
      (data: {
        question: string;
        questionIndex: number;
        totalQuestions: number;
        imageUrl?: string;
      }) => {
        console.log("Received question data:", JSON.stringify(data, null, 2));
        console.log(
          "Current gameState before update:",
          JSON.stringify(
            {
              currentQuestion: gameState.currentQuestion,
              imageUrl: gameState.imageUrl,
              gamePhase: gameState.gamePhase,
            },
            null,
            2
          )
        );
        setGameState((prev) => ({
          ...prev,
          currentQuestion: data.question,
          questionIndex: data.questionIndex,
          totalQuestions: data.totalQuestions,
          gamePhase: "question",
          votingOptions: [],
          correctAnswer: null,
          imageUrl: data.imageUrl ?? null, // Use nullish coalescing to preserve empty strings
        }));
      }
    );

    socket.on(
      "game:voting",
      (data: { answers: Array<{ answer: string; isCorrect?: boolean }> }) => {
        setGameState((prev) => ({
          ...prev,
          votingOptions: data.answers,
          gamePhase: "voting",
        }));
      }
    );

    socket.on(
      "game:results",
      (data: {
        correctAnswer: string;
        imageUrl?: string | null;
        scores: Array<{ name: string; score: number; gained: number }>;
        leaderboard: Array<{ name: string; score: number }>;
      }) => {
        console.log("Received game results:", JSON.stringify(data, null, 2));
        console.log(
          "Current gameState before results update:",
          JSON.stringify(
            {
              correctAnswer: gameState.correctAnswer,
              imageUrl: gameState.imageUrl,
              gamePhase: gameState.gamePhase,
            },
            null,
            2
          )
        );
        setGameState((prev) => {
          const newState = {
            ...prev,
            correctAnswer: data.correctAnswer,
            imageUrl: data.imageUrl ?? null,
            leaderboard: data.leaderboard,
            gamePhase: "revealing" as const,
          };
          console.log(
            "New gameState after results update:",
            JSON.stringify(
              {
                correctAnswer: newState.correctAnswer,
                imageUrl: newState.imageUrl,
                gamePhase: newState.gamePhase,
              },
              null,
              2
            )
          );
          return newState;
        });
      }
    );

    socket.on("game:complete", () => {
      setGameState((prev) => ({ ...prev, gamePhase: "complete" }));
      toast({
        title: "המשחק הסתיים!",
        description: "תודה ששיחקתם Party Qs!",
      });
    });

    socket.on("game:ended", () => {
      setGameState((prev) => ({
        ...prev,
        mode: "select",
        roomCode: null,
        gamePhase: "waiting",
        currentQuestion: null,
        votingOptions: [],
        leaderboard: [],
        correctAnswer: null,
        players: [],
      }));
      toast({
        title: "המשחק הסתיים",
        description: "המארח עזב את המשחק",
        variant: "destructive",
      });
    });

    socket.on("error", (message: string) => {
      toast({
        title: "שגיאה",
        description: message,
        variant: "destructive",
      });
    });

    return () => {
      socket.disconnect();
    };
  }, [toast]);

  const actions = {
    createRoom: (
      questions: Array<{
        question: string;
        correctAnswer: string;
        imageUrl?: string;
      }>
    ) => {
      socketRef.current?.emit("room:create", { questions });
    },

    joinRoom: (code: string, name: string) => {
      setGameState((prev) => ({ ...prev, playerName: name }));
      socketRef.current?.emit("room:join", { code, name });
    },

    submitAnswer: (answer: string) => {
      if (gameState.roomCode) {
        socketRef.current?.emit("answer:submit", {
          code: gameState.roomCode,
          answer,
        });
      }
    },

    hostAction: (action: "start" | "show_voting" | "reveal" | "next") => {
      if (gameState.roomCode && gameState.isHost) {
        socketRef.current?.emit("host:action", {
          code: gameState.roomCode,
          action,
        });
      }
    },

    voteAnswer: (selectedAnswer: string) => {
      if (gameState.roomCode) {
        socketRef.current?.emit("answer:vote", {
          code: gameState.roomCode,
          selectedAnswer,
        });
      }
    },

    resetGame: () => {
      setGameState({
        mode: "select",
        roomCode: null,
        playerName: null,
        isHost: false,
        currentQuestion: null,
        questionIndex: 0,
        totalQuestions: 0,
        players: [],
        votingOptions: [],
        leaderboard: [],
        correctAnswer: null,
        imageUrl: null,
        gamePhase: "waiting",
        connected: socketRef.current?.connected || false,
      });
    },

    setMode: (mode: "select" | "host" | "player") => {
      setGameState((prev) => ({ ...prev, mode }));
    },
  };

  return { gameState, actions };
}
