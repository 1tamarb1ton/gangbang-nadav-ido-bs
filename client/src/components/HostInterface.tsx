import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import type { GameState } from "@/hooks/useSocket";

interface HostInterfaceProps {
  gameState: GameState;
  onCreateRoom: (questions: Array<{question: string, correctAnswer: string}>) => void;
  onHostAction: (action: 'start' | 'show_voting' | 'reveal' | 'next') => void;
  onNewGame: () => void;
}

export function HostInterface({ gameState, onCreateRoom, onHostAction, onNewGame }: HostInterfaceProps) {
  const [questionsText, setQuestionsText] = useState("");
  const { toast } = useToast();

  const handleCreateRoom = () => {
    const lines = questionsText.split('\n').map(line => line.trim()).filter(line => line.length > 0);
    const questions: Array<{question: string, correctAnswer: string}> = [];
    
    for (let i = 0; i < lines.length; i += 2) {
      const question = lines[i];
      const answer = lines[i + 1];
      
      if (question && answer) {
        questions.push({ question, correctAnswer: answer });
      }
    }

    if (questions.length === 0) {
      toast({
        title: "Error",
        description: "Please enter at least one question-answer pair",
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
              Enter questions and answers (question on one line, correct answer on the next)
            </label>
            <Textarea
              id="questions"
              data-testid="textarea-questions"
              placeholder="What's the capital of France?&#10;Paris&#10;What color do you get when mixing red and blue?&#10;Purple&#10;What's 2+2?&#10;4"
              value={questionsText}
              onChange={(e) => setQuestionsText(e.target.value)}
              className="h-40 resize-none font-mono text-sm"
            />
            <p className="text-sm text-gray-500 mt-2">Format: Question, then correct answer on next line. Add 3-10 question pairs.</p>
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
                data-testid="button-show-voting"
                onClick={() => onHostAction('show_voting')}
                className="flex-1 bg-party-accent hover:bg-amber-500"
              >
                Start Voting
              </Button>
            )}
            
            {gameState.gamePhase === 'voting' && (
              <Button 
                data-testid="button-reveal-results"
                onClick={() => onHostAction('reveal')}
                className="flex-1 bg-orange-500 hover:bg-orange-600"
              >
                Show Results
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

      {/* Results Display */}
      {gameState.gamePhase === 'revealing' && (gameState.correctAnswer || gameState.leaderboard.length > 0) && (
        <Card className="shadow-sm border border-gray-200">
          <CardContent className="p-6">
            <h3 className="font-semibold text-gray-900 mb-4">Round Results</h3>
            
            {gameState.correctAnswer && (
              <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                <h4 className="font-medium text-green-800 mb-2">Correct Answer:</h4>
                <p data-testid="text-correct-answer" className="text-green-700 text-lg">
                  {gameState.correctAnswer}
                </p>
              </div>
            )}

            {gameState.leaderboard.length > 0 && (
              <div>
                <h4 className="font-medium text-gray-900 mb-3">🏆 Top Players</h4>
                <div className="space-y-2">
                  {gameState.leaderboard.map((player, index) => (
                    <div key={index} className="flex items-center justify-between bg-gradient-to-r from-yellow-50 to-orange-50 rounded-lg px-4 py-3 border border-yellow-200">
                      <div className="flex items-center space-x-3">
                        <div className="text-2xl">
                          {index === 0 ? '🥇' : index === 1 ? '🥈' : '🥉'}
                        </div>
                        <span data-testid={`text-leaderboard-name-${index}`} className="font-medium text-gray-900">
                          {player.name}
                        </span>
                      </div>
                      <span data-testid={`text-leaderboard-score-${index}`} className="text-lg font-bold text-orange-600">
                        {player.score} pts
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
