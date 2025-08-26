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

export function PlayerInterface({
  gameState,
  onJoinRoom,
  onSubmitAnswer,
  onVoteAnswer,
  onNewGame,
}: PlayerInterfaceProps) {
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
        title: "שגיאה",
        description: "אנא הכנס קוד חדר ושם",
        variant: "destructive",
      });
      return;
    }

    if (roomCode.length !== 4) {
      toast({
        title: "שגיאה",
        description: "קוד חדר חייב להיות 4 ספרות",
        variant: "destructive",
      });
      return;
    }

    onJoinRoom(roomCode, playerName.trim());
  };

  const handleSubmitAnswer = () => {
    const trimmedAnswer = answer.trim();

    if (!trimmedAnswer) {
      toast({
        title: "שגיאה",
        description: "אנא הכנס תשובה",
        variant: "destructive",
      });
      return;
    }

    // Prevent extremely short answers that could be guesses
    if (trimmedAnswer.length < 2) {
      toast({
        title: "שגיאה",
        description: "התשובה קצרה מדי",
        variant: "destructive",
      });
      return;
    }

    // Prevent answers that are just numbers (to avoid random guessing)
    if (/^\d+$/.test(trimmedAnswer)) {
      toast({
        title: "שגיאה",
        description: "התשובה לא יכולה להיות מספר בלבד",
        variant: "destructive",
      });
      return;
    }

    // Prevent answers that are just repeated characters
    if (/^(.)\1+$/.test(trimmedAnswer)) {
      toast({
        title: "שגיאה",
        description: "התשובה לא יכולה להיות תו חוזר",
        variant: "destructive",
      });
      return;
    }

    onSubmitAnswer(trimmedAnswer);
    setHasSubmitted(true);
  };

  const handleRoomCodeChange = (value: string) => {
    const formatted = value.replace(/\D/g, "").substring(0, 4);
    setRoomCode(formatted);
  };

  // Game over state
  if (gameState.gamePhase === "complete") {
    return (
      <Card className="shadow-sm border">
        <CardContent className="p-6 text-center">
          <div className="text-5xl mb-4">🎉</div>
          <h2 className="text-2xl font-bold mb-3">המשחק הסתיים!</h2>
          <p className="text-muted-foreground mb-6 text-base">
            תודה ששיחקתם יחד!
          </p>
          <Button
            data-testid="button-new-game"
            onClick={onNewGame}
            className="bg-party-primary hover:bg-indigo-600 text-base px-8 py-4 h-auto"
          >
            משחק חדש
          </Button>
        </CardContent>
      </Card>
    );
  }

  // Show join form if not in a room
  if (!gameState.roomCode) {
    return (
      <Card className="shadow-sm border">
        <CardContent className="p-6">
          <div className="flex flex-col items-center justify-center gap-6">
            <div className="w-full">
              <Input
                id="roomCode"
                data-testid="input-room-code"
                type="tel"
                inputMode="numeric"
                pattern="[0-9]*"
                placeholder="1234"
                value={roomCode}
                onChange={(e) => handleRoomCodeChange(e.target.value)}
                className="text-center text-6xl font-mono tracking-widest h-28 flex items-center justify-center placeholder:text-gray-300 tracking-normal"
                maxLength={4}
                style={{ fontSize: "3rem" }}
              />
            </div>

            <div className="w-full">
              <Input
                id="playerName"
                data-testid="input-player-name"
                type="text"
                placeholder="השם שלך"
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
                maxLength={30}
                className="h-20 text-6xl text-center flex items-center justify-center tracking-tight placeholder:text-gray-300"
                style={{ fontSize: "3rem" }}
              />
            </div>

            <Button
              data-testid="button-join-room"
              onClick={handleJoinRoom}
              className="w-full bg-party-secondary hover:bg-emerald-600 text-xl px-12 py-6 h-auto font-bold"
            >
              הצטרף
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Player Status */}
      <Card className="shadow-sm border">
        <CardContent className="p-6 flex flex-col items-center justify-center">
          <div className="flex flex-col items-center gap-2 w-full">
            <span className="text-3xl mb-2">🎯</span>
            <h3
              data-testid="text-player-name"
              className="font-bold text-2xl text-center"
            >
              {gameState.playerName}
            </h3>
            <div className="flex items-center justify-center gap-3 mt-2">
              <span
                className="text-lg font-mono bg-muted rounded-lg px-4 py-2"
                data-testid="text-room-code"
              >
                {gameState.roomCode}
              </span>
              <div
                className={`w-4 h-4 rounded-full ${
                  gameState.connected ? "bg-party-secondary" : "bg-destructive"
                }`}
                title={gameState.connected ? "מחובר" : "מנותק"}
              ></div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Current Question */}
      {gameState.gamePhase === "question" &&
        gameState.currentQuestion &&
        !hasSubmitted && (
          <Card className="shadow-sm border">
            <CardContent className="p-6">
              <div className="flex justify-center mb-4">
                <div className="flex items-center gap-2 bg-muted rounded-lg px-6 py-3 text-2xl text-muted-foreground font-bold">
                  <span data-testid="text-question-index">
                    {gameState.questionIndex}
                  </span>
                  <span className="mx-1">/</span>
                  <span data-testid="text-total-questions">
                    {gameState.totalQuestions}
                  </span>
                </div>
              </div>

              <div className="bg-gradient-to-r from-party-primary to-party-secondary rounded-lg p-4 mb-4">
                <p
                  data-testid="text-current-question"
                  className="text-3xl text-foreground text-center font-bold"
                >
                  {gameState.currentQuestion}
                </p>
              </div>

              {/* Answer Input */}
              <div className="flex flex-col items-center justify-center gap-6">
                <div className="w-full">
                  <div className="flex items-center justify-center h-40">
                    <input
                      type="text"
                      id="answer"
                      data-testid="textarea-answer"
                      placeholder="התשובה שלך..."
                      value={answer}
                      onChange={(e) => setAnswer(e.target.value)}
                      className="h-24 w-full text-4xl text-center flex items-center justify-center placeholder:text-gray-300 rounded-lg border border-gray-300 font-bold"
                      maxLength={500}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        textAlign: "center",
                        height: "100%",
                        fontSize: "2.5rem",
                        lineHeight: "2.5rem",
                      }}
                    />
                  </div>
                  <div className="text-center mt-3">
                    <span
                      data-testid="text-char-count"
                      className="text-base text-muted-foreground font-bold"
                    >
                      {answer.length}/500
                    </span>
                  </div>
                </div>

                <Button
                  data-testid="button-submit-answer"
                  onClick={handleSubmitAnswer}
                  className="w-full bg-party-secondary hover:bg-emerald-600 text-xl px-12 py-6 h-auto font-bold"
                >
                  שלח
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

      {/* Voting Phase */}
      {gameState.gamePhase === "voting" &&
        gameState.votingOptions.length > 0 &&
        !hasVoted && (
          <Card className="shadow-sm border">
            <CardContent className="p-6">
              <div className="mb-6">
                <div className="flex justify-center mb-4">
                  <div className="flex items-center gap-2 bg-muted rounded-lg px-6 py-3 text-2xl text-muted-foreground font-bold">
                    <span>{gameState.questionIndex}</span>
                    <span className="mx-1">/</span>
                    <span>{gameState.totalQuestions}</span>
                  </div>
                </div>

                <div className="bg-gradient-to-r from-party-primary to-party-secondary rounded-lg p-4 mb-4">
                  <p className="text-3xl text-foreground text-center font-bold">
                    {gameState.currentQuestion}
                  </p>
                </div>

                <h3 className="font-bold text-center text-xl">🗳️ בחר תשובה</h3>
              </div>

              <div className="flex flex-col items-center justify-center gap-3 w-full">
                {gameState.votingOptions.map((option, index) => (
                  <button
                    key={index}
                    data-testid={`button-vote-option-${index}`}
                    onClick={() => {
                      onVoteAnswer(option.answer);
                      setHasVoted(true);
                      setSelectedVote(option.answer);
                    }}
                    className="w-full p-6 text-center bg-muted hover:bg-party-secondary hover:text-primary-foreground border rounded-xl transition-colors duration-200 text-base font-medium flex items-center justify-center"
                  >
                    {option.answer}
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

      {/* Waiting State - After Answer Submission */}
      {gameState.gamePhase === "question" && hasSubmitted && (
        <Card className="shadow-sm border">
          <CardContent className="p-6 text-center">
            <div className="mb-4">
              <div className="animate-spin inline-block w-8 h-8 border-4 border-muted border-t-party-secondary rounded-full"></div>
            </div>
            <h3 className="font-bold mb-4 text-xl">✅ נשלח!</h3>
            <p className="text-base text-muted-foreground">ממתין...</p>
          </CardContent>
        </Card>
      )}

      {/* Waiting State - After Vote */}
      {gameState.gamePhase === "voting" && hasVoted && (
        <Card className="shadow-sm border">
          <CardContent className="p-6 text-center">
            <div className="mb-4">
              <div className="animate-spin inline-block w-8 h-8 border-4 border-muted border-t-party-secondary rounded-full"></div>
            </div>
            <h3 className="font-bold mb-4 text-xl">🗳️ הצבעת!</h3>
            <p className="text-base text-muted-foreground">ממתין...</p>
          </CardContent>
        </Card>
      )}

      {/* Results Display */}
      {gameState.gamePhase === "revealing" &&
        (gameState.correctAnswer || gameState.leaderboard.length > 0) && (
          <Card className="shadow-sm border">
            <CardContent className="p-6">
              <h3 className="font-bold mb-6 text-center text-xl">🎯 תוצאות</h3>

              {gameState.correctAnswer &&
                (selectedVote === gameState.correctAnswer ? (
                  // Correct answer display
                  <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                    <h4 className="font-bold mb-3 text-center text-lg text-green-800">
                      ✅ נכון!
                    </h4>
                    <p
                      data-testid="text-correct-answer"
                      className="text-xl text-center font-bold text-green-700"
                    >
                      {gameState.correctAnswer}
                    </p>
                    <p className="text-center text-green-600 font-bold mt-3 text-lg">
                      🎉 +10 נקודות
                    </p>
                  </div>
                ) : (
                  // Wrong answer display
                  <div className="space-y-4 mb-4">
                    <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                      <h4 className="font-bold mb-3 text-center text-lg text-red-800">
                        ❌ לא נכון
                      </h4>
                      <p className="text-xl text-center font-bold text-red-700">
                        {selectedVote}
                      </p>
                    </div>
                    <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <h4 className="font-bold mb-3 text-center text-lg text-yellow-800">
                        ✨ התשובה הנכונה
                      </h4>
                      <p
                        data-testid="text-correct-answer"
                        className="text-xl text-center font-bold text-yellow-700"
                      >
                        {gameState.correctAnswer}
                      </p>
                    </div>
                  </div>
                ))}

              {gameState.leaderboard.length > 0 && (
                <div>
                  <h4 className="font-bold mb-4 text-center text-lg">🏆</h4>
                  <div className="flex flex-col items-center justify-center gap-2 w-full">
                    {gameState.leaderboard.map((player, index) => {
                      const isCurrentPlayer =
                        player.name === gameState.playerName;
                      return (
                        <div
                          key={index}
                          className={`flex items-center justify-between rounded-lg px-4 py-3 border w-full ${
                            isCurrentPlayer
                              ? "bg-gradient-to-r from-party-secondary/20 to-party-secondary/10 border-party-secondary/50"
                              : "bg-gradient-to-r from-yellow-50 to-orange-50 border-yellow-200"
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <div className="text-xl flex items-center justify-center">
                              {index === 0 ? "🥇" : index === 1 ? "🥈" : "🥉"}
                            </div>
                            <span
                              data-testid={`text-leaderboard-name-${index}`}
                              className="font-medium text-base flex items-center"
                            >
                              {player.name}
                              {isCurrentPlayer && (
                                <span className="text-base mr-2 text-party-secondary font-bold">
                                  👤
                                </span>
                              )}
                            </span>
                          </div>
                          <span
                            data-testid={`text-leaderboard-score-${index}`}
                            className="text-lg font-bold text-orange-600 flex items-center"
                          >
                            {player.score} נק'
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              <div className="text-center mt-6">
                <p className="text-base text-muted-foreground mb-4 font-bold">
                  ממתין...
                </p>
                <div className="w-6 h-6 border-2 border-muted border-t-party-primary rounded-full animate-spin mx-auto"></div>
              </div>
            </CardContent>
          </Card>
        )}

      {/* Reset states when new question starts */}
      {gameState.gamePhase === "question" &&
        (hasSubmitted || hasVoted) &&
        (() => {
          setHasSubmitted(false);
          setHasVoted(false);
          setSelectedVote(null);
          setAnswer(""); // Clear the answer input
          return null;
        })()}
    </div>
  );
}
