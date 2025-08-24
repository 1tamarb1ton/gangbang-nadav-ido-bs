import type { Express } from "express";
import { createServer, type Server } from "http";
import { Server as SocketIOServer } from "socket.io";
import { storage } from "./storage";
import { 
  createRoomSchema, 
  joinRoomSchema, 
  submitAnswerSchema,
  voteAnswerSchema, 
  hostActionSchema,
  type ServerToClientEvents,
  type ClientToServerEvents 
} from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  const httpServer = createServer(app);
  
  const io = new SocketIOServer<ClientToServerEvents, ServerToClientEvents>(httpServer, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"]
    },
    path: "/socket.io/"
  });

  io.on("connection", (socket) => {
    console.log(`Player connected: ${socket.id}`);

    socket.on("room:create", async (data) => {
      try {
        const { questions } = createRoomSchema.parse(data);
        const filteredQuestions = questions.filter(q => q.question.trim().length > 0 && q.correctAnswer.trim().length > 0);
        
        if (filteredQuestions.length === 0) {
          socket.emit("error", "Please provide at least one question with answer");
          return;
        }

        const code = await storage.createRoom(socket.id, filteredQuestions);
        await socket.join(code);
        
        socket.emit("room:created", { code });
        console.log(`Room created: ${code} by ${socket.id}`);
      } catch (error) {
        socket.emit("error", "Failed to create room");
        console.error("Room creation error:", error);
      }
    });

    socket.on("room:join", async (data) => {
      try {
        const { code, name } = joinRoomSchema.parse(data);
        const room = await storage.getRoom(code);
        
        if (!room) {
          socket.emit("error", "Room not found");
          return;
        }

        await storage.addPlayerToRoom(code, socket.id, name);
        await socket.join(code);
        
        const playerNames = Object.values(room.players);
        playerNames.push(name);
        
        socket.emit("room:joined", { code, players: playerNames });
        socket.to(code).emit("room:players", playerNames);
        
        // If game is in progress, send current question
        if (room.state === 'question') {
          const currentQuestion = room.questions[room.currentQuestionIndex];
          if (currentQuestion) {
            socket.emit("game:question", {
              question: currentQuestion.question,
              questionIndex: room.currentQuestionIndex + 1,
              totalQuestions: room.questions.length
            });
          }
        } else if (room.state === 'voting') {
          // Send voting options if in voting phase
          const answers = await storage.getAllAnswers(code);
          const currentQuestion = room.questions[room.currentQuestionIndex];
          const votingOptions = [
            ...answers.map(a => ({ answer: a.answer, isCorrect: false })),
            { answer: currentQuestion.correctAnswer, isCorrect: true }
          ];
          // Shuffle the options
          for (let i = votingOptions.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [votingOptions[i], votingOptions[j]] = [votingOptions[j], votingOptions[i]];
          }
          socket.emit("game:voting", { answers: votingOptions });
        }
        
        console.log(`Player ${name} joined room ${code}`);
      } catch (error) {
        socket.emit("error", "Failed to join room");
        console.error("Room join error:", error);
      }
    });

    socket.on("answer:submit", async (data) => {
      try {
        const { code, answer } = submitAnswerSchema.parse(data);
        const room = await storage.getRoom(code);
        
        if (!room || room.state !== 'question') {
          socket.emit("error", "Cannot submit answer right now");
          return;
        }

        await storage.submitAnswer(code, socket.id, answer);
        
        const answerCount = await storage.getAnswerCount(code);
        const playerCount = await storage.getPlayerCount(code);
        
        // Update player list with answer status for host
        const playerNames = Object.values(room.players);
        io.to(code).emit("room:players", playerNames);
        
        // Auto-proceed to voting if all players have answered
        if (answerCount === playerCount && playerCount > 0) {
          const answers = await storage.getAllAnswers(code);
          const currentQuestion = room.questions[room.currentQuestionIndex];
          const votingOptions = [
            ...answers.map(a => ({ answer: a.answer, isCorrect: false })),
            { answer: currentQuestion.correctAnswer, isCorrect: true }
          ];
          // Shuffle the options
          for (let i = votingOptions.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [votingOptions[i], votingOptions[j]] = [votingOptions[j], votingOptions[i]];
          }
          await storage.updateRoom(code, { state: 'voting' });
          await storage.clearAnswers(code); // Clear for voting phase
          io.to(code).emit("game:voting", { answers: votingOptions });
        }
        
        console.log(`Answer submitted in room ${code}: ${answerCount}/${playerCount}`);
      } catch (error) {
        socket.emit("error", "Failed to submit answer");
        console.error("Answer submission error:", error);
      }
    });

    socket.on("answer:vote", async (data) => {
      try {
        const { code, selectedAnswer } = voteAnswerSchema.parse(data);
        const room = await storage.getRoom(code);
        
        if (!room || room.state !== 'voting') {
          socket.emit("error", "Cannot vote right now");
          return;
        }

        const currentQuestion = room.questions[room.currentQuestionIndex];
        const isCorrect = selectedAnswer === currentQuestion.correctAnswer;
        
        if (isCorrect) {
          await storage.updatePlayerScore(code, socket.id, 10);
        }
        
        console.log(`Vote submitted in room ${code}: ${selectedAnswer} - ${isCorrect ? 'Correct' : 'Wrong'}`);
      } catch (error) {
        socket.emit("error", "Failed to submit vote");
        console.error("Vote submission error:", error);
      }
    });

    socket.on("host:action", async (data) => {
      try {
        const { code, action } = hostActionSchema.parse(data);
        const room = await storage.getRoom(code);
        
        if (!room || room.hostId !== socket.id) {
          socket.emit("error", "Not authorized to control this room");
          return;
        }

        if (action === 'start') {
          if (room.currentQuestionIndex >= room.questions.length) {
            socket.emit("error", "No more questions");
            return;
          }
          
          await storage.clearAnswers(code);
          await storage.updateRoom(code, { state: 'question' });
          
          const currentQuestion = room.questions[room.currentQuestionIndex];
          io.to(code).emit("game:question", {
            question: currentQuestion.question,
            questionIndex: room.currentQuestionIndex + 1,
            totalQuestions: room.questions.length
          });
          
        } else if (action === 'show_voting') {
          const answers = await storage.getAllAnswers(code);
          const currentQuestion = room.questions[room.currentQuestionIndex];
          const votingOptions = [
            ...answers.map(a => ({ answer: a.answer, isCorrect: false })),
            { answer: currentQuestion.correctAnswer, isCorrect: true }
          ];
          // Shuffle the options
          for (let i = votingOptions.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [votingOptions[i], votingOptions[j]] = [votingOptions[j], votingOptions[i]];
          }
          await storage.updateRoom(code, { state: 'voting' });
          await storage.clearAnswers(code);
          io.to(code).emit("game:voting", { answers: votingOptions });
          
        } else if (action === 'reveal') {
          const currentQuestion = room.questions[room.currentQuestionIndex];
          const leaderboard = await storage.getLeaderboard(code);
          await storage.updateRoom(code, { state: 'revealing' });
          
          io.to(code).emit("game:results", {
            correctAnswer: currentQuestion.correctAnswer,
            scores: [],
            leaderboard: leaderboard
          });
          
        } else if (action === 'next') {
          const newIndex = room.currentQuestionIndex + 1;
          
          if (newIndex >= room.questions.length) {
            await storage.updateRoom(code, { state: 'complete' });
            io.to(code).emit("game:complete");
          } else {
            await storage.clearAnswers(code);
            await storage.updateRoom(code, { 
              currentQuestionIndex: newIndex,
              state: 'question' 
            });
            
            const nextQuestion = room.questions[newIndex];
            io.to(code).emit("game:question", {
              question: nextQuestion.question,
              questionIndex: newIndex + 1,
              totalQuestions: room.questions.length
            });
          }
        }
        
        console.log(`Host action ${action} in room ${code}`);
      } catch (error) {
        socket.emit("error", "Failed to perform action");
        console.error("Host action error:", error);
      }
    });

    socket.on("disconnect", async () => {
      console.log(`Player disconnected: ${socket.id}`);
      
      // Find rooms where this socket was a player and clean up
      // Note: In a real app, you'd want to track socket-to-room mapping
      // For simplicity, we'll just handle host disconnection cleanup
      // when the room becomes inaccessible
    });
  });

  return httpServer;
}
