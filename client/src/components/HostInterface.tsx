import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import type { GameState } from "@/hooks/useSocket";

interface HostInterfaceProps {
  gameState: GameState;
  onCreateRoom: (questions: string[]) => void;
  onHostAction: (action: 'start' | 'reveal' | 'next') => void;
  onNewGame: () => void;
}

export function HostInterface({ gameState, onCreateRoom, onHostAction, onNewGame }: HostInterfaceProps) {
  const [questionsText, setQuestionsText] = useState("");
  const { toast } = useToast();

  const handleCreateRoom = () => {
    const questions = questionsText
      .split('\n')
      .map(q => q.trim())
      .filter(q => q.length > 0);

    if (questions.length === 0) {
      toast({
        title: "Error",
        description: "Please enter at least one question",
        variant: "destructive"
      });
      return;
    }

    if (questions.length > 100) {
      toast({
        title: "Error", 
        description: "Maximum 100 questions allowed",
        variant: "destructive"
      });
      return;
    }

    onCreateRoom(questions);
  };

  const copyRoomCode = () => {
    if (gameState.roomCode) {
      navigator.clipboard.writeText(gameState.roomCode);
      toast({
        title: "Copied!",
        description: "Room code copied to clipboard"
      });
    }
  };

  // Show setup form if no room created yet
  if (!gameState.roomCode) {
    return (
      <Card className="shadow-sm border border-gray-200">
        <CardContent className="p-6">
          <div className="flex items-center space-x-2 mb-4">
            <span className="text-2xl">🎮</span>
            <h2 className="text-xl font-semibold text-gray-900">Host Controls</h2>
          </div>
          
          <div className="mb-6">
            <label htmlFor="questions" className="block text-sm font-medium text-gray-700 mb-2">
              Enter your questions (one per line)
            </label>
            <Textarea
              id="questions"
              data-testid="textarea-questions"
              placeholder="What's your favorite pizza topping?&#10;If you could have dinner with anyone, who would it be?&#10;What's the weirdest thing you believed as a child?"
              value={questionsText}
              onChange={(e) => setQuestionsText(e.target.value)}
              className="h-32 resize-none"
            />
            <p className="text-sm text-gray-500 mt-2">Add 3-10 questions for the best experience</p>
          </div>

          <Button 
            data-testid="button-create-room"
            onClick={handleCreateRoom}
            className="w-full bg-party-primary hover:bg-indigo-600"
          >
            Create Room
          </Button>
        </CardContent>
      </Card>
    );
  }

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

  return (
    <div className="space-y-6">
      {/* Room Management */}
      <Card className="shadow-sm border border-gray-200">
        <CardContent className="p-6">
          <div className="text-center mb-6">
            <div className="inline-flex items-center space-x-2 bg-gray-100 rounded-lg px-4 py-2">
              <span className="text-sm font-medium text-gray-600">Room Code:</span>
              <span data-testid="text-room-code" className="text-2xl font-bold text-party-primary tracking-wider">
                {gameState.roomCode}
              </span>
              <button 
                data-testid="button-copy-code"
                onClick={copyRoomCode}
                className="text-gray-400 hover:text-gray-600 transition-colors" 
                title="Copy code"
              >
                📋
              </button>
            </div>
            <p className="text-sm text-gray-500 mt-2">Share this code with players</p>
          </div>

          {/* Game Controls */}
          <div className="flex gap-3 mb-6">
            {gameState.gamePhase === 'waiting' && (
              <Button 
                data-testid="button-start-round"
                onClick={() => onHostAction('start')}
                className="flex-1 bg-party-secondary hover:bg-emerald-600"
              >
                Start Round
              </Button>
            )}
            
            {gameState.gamePhase === 'question' && (
              <Button 
                data-testid="button-reveal-answers"
                onClick={() => onHostAction('reveal')}
                className="flex-1 bg-party-accent hover:bg-amber-500"
              >
                Reveal Answers
              </Button>
            )}
            
            {gameState.gamePhase === 'revealing' && (
              <Button 
                data-testid="button-next-question"
                onClick={() => onHostAction('next')}
                className="flex-1 bg-party-primary hover:bg-indigo-600"
              >
                Next Question
              </Button>
            )}
          </div>

          {/* Current Question Display */}
          {gameState.currentQuestion && (
            <Card className="bg-gray-50">
              <CardContent className="p-4">
                <h3 className="font-medium text-gray-700 mb-2">Current Question:</h3>
                <p data-testid="text-current-question" className="text-lg text-gray-900">
                  {gameState.currentQuestion}
                </p>
                <div className="mt-2 text-sm text-gray-500">
                  Question <span data-testid="text-question-number">{gameState.questionIndex}</span> of{" "}
                  <span data-testid="text-total-questions">{gameState.totalQuestions}</span>
                </div>
              </CardContent>
            </Card>
          )}
        </CardContent>
      </Card>

      {/* Players List */}
      {gameState.players.length > 0 && (
        <Card className="shadow-sm border border-gray-200">
          <CardContent className="p-6">
            <h3 className="font-semibold text-gray-900 mb-4">Players in Room</h3>
            <div className="space-y-2">
              {gameState.players.map((playerName, index) => (
                <div key={index} className="flex items-center justify-between bg-gray-50 rounded-lg px-4 py-3">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-party-secondary rounded-full flex items-center justify-center text-white text-sm font-semibold">
                      {playerName.charAt(0).toUpperCase()}
                    </div>
                    <span data-testid={`text-player-name-${index}`} className="font-medium text-gray-900">
                      {playerName}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-xs text-gray-500">Connected</span>
                    <div className="w-2 h-2 bg-party-secondary rounded-full"></div>
                  </div>
                </div>
              ))}
            </div>
            <p className="text-sm text-gray-500 mt-4">
              <span data-testid="text-player-count">{gameState.players.length}</span> players connected
            </p>
          </CardContent>
        </Card>
      )}

      {/* Answers Display */}
      {gameState.gamePhase === 'revealing' && gameState.answers.length > 0 && (
        <Card className="shadow-sm border border-gray-200">
          <CardContent className="p-6">
            <h3 className="font-semibold text-gray-900 mb-4">Player Answers</h3>
            <div className="space-y-3">
              {gameState.answers.map((answer, index) => (
                <Card key={index} className="bg-gray-50">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <span data-testid={`text-answer-player-${index}`} className="font-medium text-gray-900">
                        {answer.name}
                      </span>
                    </div>
                    <p data-testid={`text-answer-text-${index}`} className="text-gray-700">
                      {answer.answer}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
