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
  onVoteAnswer: (selectedAnswer: string) => void;
  onNewGame: () => void;
}

export function PlayerInterface({ gameState, onJoinRoom, onSubmitAnswer, onVoteAnswer, onNewGame }: PlayerInterfaceProps) {
  const [roomCode, setRoomCode] = useState("");
  const [playerName, setPlayerName] = useState("");
  const [answer, setAnswer] = useState("");
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [hasVoted, setHasVoted] = useState(false);
  const [selectedVote, setSelectedVote] = useState<string | null>(null);
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

      {/* Voting Phase */}
      {gameState.gamePhase === 'voting' && gameState.votingOptions.length > 0 && !hasVoted && (
        <Card className="shadow-sm border border-gray-200">
          <CardContent className="p-6">
            <h3 className="font-semibold text-gray-900 mb-4 text-center">🗳️ Choose the Correct Answer</h3>
            <p className="text-gray-600 text-center mb-6">Pick what you think is the right answer (10 points for correct choice)</p>
            
            <div className="space-y-3">
              {gameState.votingOptions.map((option, index) => (
                <button
                  key={index}
                  data-testid={`button-vote-option-${index}`}
                  onClick={() => {
                    onVoteAnswer(option.answer);
                    setHasVoted(true);
                    setSelectedVote(option.answer);
                  }}
                  className="w-full p-4 text-left bg-gray-50 hover:bg-party-secondary hover:text-white border border-gray-200 rounded-lg transition-colors duration-200"
                >
                  <span className="font-medium">{String.fromCharCode(65 + index)}.</span> {option.answer}
                </button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Waiting State - After Answer Submission */}
      {gameState.gamePhase === 'question' && hasSubmitted && (
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

      {/* Waiting State - After Vote */}
      {gameState.gamePhase === 'voting' && hasVoted && (
        <Card className="shadow-sm border border-gray-200">
          <CardContent className="p-6 text-center">
            <div className="mb-4">
              <div className="animate-spin inline-block w-8 h-8 border-4 border-gray-200 border-t-party-secondary rounded-full"></div>
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">Vote Cast!</h3>
            <p className="text-gray-600 mb-2">You voted for: <strong>{selectedVote}</strong></p>
            <p className="text-gray-500">Waiting for host to reveal results...</p>
          </CardContent>
        </Card>
      )}

      {/* Results Display */}
      {gameState.gamePhase === 'revealing' && (gameState.correctAnswer || gameState.leaderboard.length > 0) && (
        <Card className="shadow-sm border border-gray-200">
          <CardContent className="p-6">
            <h3 className="font-semibold text-gray-900 mb-6 text-center">🎯 Round Results</h3>
            
            {gameState.correctAnswer && (
              <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                <h4 className="font-medium text-green-800 mb-2 text-center">✅ Correct Answer:</h4>
                <p data-testid="text-correct-answer" className="text-green-700 text-lg text-center font-semibold">
                  {gameState.correctAnswer}
                </p>
                {selectedVote === gameState.correctAnswer && (
                  <p className="text-center text-green-600 font-medium mt-2">🎉 You got it right! +10 points</p>
                )}
                {selectedVote && selectedVote !== gameState.correctAnswer && (
                  <p className="text-center text-red-600 mt-2">Your guess: {selectedVote}</p>
                )}
              </div>
            )}

            {gameState.leaderboard.length > 0 && (
              <div>
                <h4 className="font-medium text-gray-900 mb-4 text-center">🏆 Leaderboard</h4>
                <div className="space-y-2">
                  {gameState.leaderboard.map((player, index) => {
                    const isCurrentPlayer = player.name === gameState.playerName;
                    return (
                      <div 
                        key={index} 
                        className={`flex items-center justify-between rounded-lg px-4 py-3 border ${
                          isCurrentPlayer 
                            ? 'bg-gradient-to-r from-party-secondary/20 to-party-secondary/10 border-party-secondary/50' 
                            : 'bg-gradient-to-r from-yellow-50 to-orange-50 border-yellow-200'
                        }`}
                      >
                        <div className="flex items-center space-x-3">
                          <div className="text-2xl">
                            {index === 0 ? '🥇' : index === 1 ? '🥈' : '🥉'}
                          </div>
                          <span data-testid={`text-leaderboard-name-${index}`} className="font-medium text-gray-900">
                            {player.name}
                            {isCurrentPlayer && <span className="text-xs ml-2 text-party-secondary">(You)</span>}
                          </span>
                        </div>
                        <span data-testid={`text-leaderboard-score-${index}`} className="text-lg font-bold text-orange-600">
                          {player.score} pts
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
            
            <div className="text-center mt-6">
              <p className="text-sm text-gray-500 mb-4">Waiting for next question...</p>
              <div className="w-6 h-6 border-2 border-gray-300 border-t-party-primary rounded-full animate-spin mx-auto"></div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Reset states when new question starts */}
      {gameState.gamePhase === 'question' && (hasSubmitted || hasVoted) && (() => {
        setHasSubmitted(false);
        setHasVoted(false);
        setSelectedVote(null);
        return null;
      })()}
    </div>
  );
}
