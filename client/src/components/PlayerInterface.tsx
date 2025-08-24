import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import type { GameState } from "@/hooks/useSocket";

interface PlayerInterfaceProps {
  gameState: GameState;
  onJoinRoom: (code: string, name: string) => void;
  onSubmitAnswer: (answer: string) => void;
  onNewGame: () => void;
}

export function PlayerInterface({ gameState, onJoinRoom, onSubmitAnswer, onNewGame }: PlayerInterfaceProps) {
  const [roomCode, setRoomCode] = useState("");
  const [playerName, setPlayerName] = useState("");
  const [answer, setAnswer] = useState("");
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const { toast } = useToast();

  const handleJoinRoom = () => {
    if (!roomCode.trim() || !playerName.trim()) {
      toast({
        title: "Error",
        description: "Please enter both room code and your name",
        variant: "destructive"
      });
      return;
    }

    if (roomCode.length !== 4) {
      toast({
        title: "Error",
        description: "Room code must be 4 digits",
        variant: "destructive"
      });
      return;
    }

    onJoinRoom(roomCode, playerName.trim());
  };

  const handleSubmitAnswer = () => {
    if (!answer.trim()) {
      toast({
        title: "Error",
        description: "Please enter an answer",
        variant: "destructive"
      });
      return;
    }

    onSubmitAnswer(answer.trim());
    setHasSubmitted(true);
  };

  const handleRoomCodeChange = (value: string) => {
    const formatted = value.replace(/\D/g, '').substring(0, 4);
    setRoomCode(formatted);
  };

  // Game over state
  if (gameState.gamePhase === 'complete') {
    return (
      <Card className="shadow-sm border border-gray-200">
        <CardContent className="p-8 text-center">
          <div className="text-6xl mb-4">🎉</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Game Complete!</h2>
          <p className="text-gray-600 mb-6">Thanks for playing Party Qs together!</p>
          <Button 
            data-testid="button-new-game"
            onClick={onNewGame}
            className="bg-party-primary hover:bg-indigo-600"
          >
            Start New Game
          </Button>
        </CardContent>
      </Card>
    );
  }

  // Show join form if not in a room
  if (!gameState.roomCode) {
    return (
      <Card className="shadow-sm border border-gray-200">
        <CardContent className="p-6">
          <div className="flex items-center space-x-2 mb-4">
            <span className="text-2xl">📱</span>
            <h2 className="text-xl font-semibold text-gray-900">Join Game</h2>
          </div>
          
          <div className="space-y-4">
            <div>
              <label htmlFor="roomCode" className="block text-sm font-medium text-gray-700 mb-2">
                Room Code
              </label>
              <Input
                id="roomCode"
                data-testid="input-room-code"
                type="text"
                placeholder="Enter 4-digit code"
                value={roomCode}
                onChange={(e) => handleRoomCodeChange(e.target.value)}
                className="text-center text-2xl font-mono tracking-wider"
                maxLength={4}
              />
            </div>
            
            <div>
              <label htmlFor="playerName" className="block text-sm font-medium text-gray-700 mb-2">
                Your Name
              </label>
              <Input
                id="playerName"
                data-testid="input-player-name"
                type="text"
                placeholder="Enter your name"
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
                maxLength={30}
              />
            </div>
            
            <Button 
              data-testid="button-join-room"
              onClick={handleJoinRoom}
              className="w-full bg-party-secondary hover:bg-emerald-600"
            >
              Join Room
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Player Status */}
      <Card className="shadow-sm border border-gray-200">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <span className="text-2xl">🎯</span>
              <div>
                <h3 data-testid="text-player-name" className="font-semibold text-gray-900">
                  {gameState.playerName}
                </h3>
                <p className="text-sm text-gray-500">
                  Room: <span data-testid="text-room-code">{gameState.roomCode}</span>
                </p>
              </div>
            </div>
            <div className="text-right">
              <div className={`w-3 h-3 rounded-full ${gameState.connected ? 'bg-party-secondary' : 'bg-red-500'}`}></div>
              <p className="text-xs text-gray-500 mt-1">
                {gameState.connected ? 'Connected' : 'Disconnected'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Current Question */}
      {gameState.gamePhase === 'question' && gameState.currentQuestion && !hasSubmitted && (
        <Card className="shadow-sm border border-gray-200">
          <CardContent className="p-6">
            <div className="text-center mb-4">
              <div className="inline-flex items-center space-x-2 bg-gray-100 rounded-lg px-3 py-1 text-sm text-gray-600">
                <span>Question</span>
                <span data-testid="text-question-index">{gameState.questionIndex}</span>
                <span>of</span>
                <span data-testid="text-total-questions">{gameState.totalQuestions}</span>
              </div>
            </div>
            
            <div className="bg-gradient-to-r from-party-primary to-party-secondary rounded-lg p-6 mb-6">
              <p data-testid="text-current-question" className="text-lg text-white text-center font-medium">
                {gameState.currentQuestion}
              </p>
            </div>

            {/* Answer Input */}
            <div className="space-y-4">
              <div>
                <label htmlFor="answer" className="block text-sm font-medium text-gray-700 mb-2">
                  Your Answer
                </label>
                <Textarea
                  id="answer"
                  data-testid="textarea-answer"
                  placeholder="Type your answer here..."
                  value={answer}
                  onChange={(e) => setAnswer(e.target.value)}
                  className="h-24 resize-none"
                  maxLength={500}
                />
                <div className="flex justify-between items-center mt-2">
                  <span className="text-xs text-gray-500">Be creative! Others will see this.</span>
                  <span data-testid="text-char-count" className="text-xs text-gray-400">
                    {answer.length}/500
                  </span>
                </div>
              </div>
              
              <Button 
                data-testid="button-submit-answer"
                onClick={handleSubmitAnswer}
                className="w-full bg-party-secondary hover:bg-emerald-600"
              >
                Submit Answer
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Waiting State */}
      {(hasSubmitted || gameState.gamePhase === 'question') && hasSubmitted && (
        <Card className="shadow-sm border border-gray-200">
          <CardContent className="p-6 text-center">
            <div className="mb-4">
              <div className="animate-spin inline-block w-8 h-8 border-4 border-gray-200 border-t-party-secondary rounded-full"></div>
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">Answer Submitted!</h3>
            <p className="text-gray-600">Waiting for other players to finish...</p>
          </CardContent>
        </Card>
      )}

      {/* Results Display */}
      {gameState.gamePhase === 'revealing' && gameState.answers.length > 0 && (
        <Card className="shadow-sm border border-gray-200">
          <CardContent className="p-6">
            <h3 className="font-semibold text-gray-900 mb-4 text-center">Everyone's Answers</h3>
            <div className="space-y-3 mb-6">
              {gameState.answers.map((answer, index) => {
                const isCurrentPlayer = answer.name === gameState.playerName;
                return (
                  <Card 
                    key={index} 
                    className={isCurrentPlayer 
                      ? "bg-gradient-to-r from-party-secondary/10 to-party-secondary/20 border border-party-secondary/30"
                      : "bg-gradient-to-r from-gray-50 to-gray-100"
                    }
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center space-x-2 mb-2">
                        <div data-testid={`text-answer-player-${index}`} className="font-medium text-gray-900">
                          {answer.name}
                        </div>
                        {isCurrentPlayer && (
                          <span className="text-xs bg-party-secondary text-white px-2 py-1 rounded-full">
                            Your answer
                          </span>
                        )}
                      </div>
                      <p data-testid={`text-answer-text-${index}`} className="text-gray-700">
                        {answer.answer}
                      </p>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
            
            <div className="text-center">
              <p className="text-sm text-gray-500 mb-4">Waiting for host to continue...</p>
              <div className="w-6 h-6 border-2 border-gray-300 border-t-party-primary rounded-full animate-spin mx-auto"></div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Reset answer submission state when new question starts */}
      {gameState.gamePhase === 'question' && hasSubmitted && (() => {
        setHasSubmitted(false);
        return null;
      })()}
    </div>
  );
}
