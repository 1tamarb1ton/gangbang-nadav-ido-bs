import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import type { GameState } from "@/hooks/useSocket";
import { defaultQuestions } from "@/defaultQuestions";

interface HostInterfaceProps {
  gameState: GameState;
  onCreateRoom: (
    questions: Array<{
      question: string;
      correctAnswer: string;
      imageUrl?: string;
    }>
  ) => void;
  onHostAction: (action: "start" | "show_voting" | "reveal" | "next") => void;
  onNewGame: () => void;
}

export function HostInterface({
  gameState,
  onCreateRoom,
  onHostAction,
  onNewGame,
}: HostInterfaceProps) {
  const [questionsText, setQuestionsText] = useState(defaultQuestions);
  const { toast } = useToast();

  const extractImageUrl = (
    text: string
  ): { text: string; imageUrl: string | null } => {
    console.log("Extracting image URL from text:", text);
    console.log("Text type:", typeof text);
    const match = text.match(/\[(.*?)\]/);
    if (match && match[1]) {
      const imageUrl = match[1].trim();
      const cleanText = text.replace(/\[.*?\]/, "").trim();
      console.log("Found image URL:", { imageUrl, cleanText });
      return { text: cleanText, imageUrl };
    }
    console.log("No image URL found in text");
    return { text, imageUrl: null };
  };

  const handleCreateRoom = () => {
    console.log("Raw questions text:", questionsText);
    console.log("Creating room with questions text:", questionsText);
    const lines = questionsText
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line.length > 0);
    console.log("Parsed lines:", lines);
    const questions: Array<{
      question: string;
      correctAnswer: string;
      imageUrl?: string;
    }> = [];

    for (let i = 0; i < lines.length; i += 2) {
      const question = lines[i];
      const answer = lines[i + 1];
      console.log(`Processing Q&A pair ${i / 2 + 1}:`, { question, answer });

      if (question && answer) {
        const { text: cleanAnswer, imageUrl } = extractImageUrl(answer);
        console.log("Extracted image URL result:", { cleanAnswer, imageUrl });
        const questionData = {
          question,
          correctAnswer: cleanAnswer,
          ...(imageUrl && { imageUrl }),
        };
        console.log(
          "Created question data:",
          JSON.stringify(questionData, null, 2)
        );
        questions.push(questionData);
      }
    }

    if (questions.length === 0) {
      toast({
        title: "שגיאה",
        description: "אנא הכנס לפחות זוג שאלה-תשובה אחד",
        variant: "destructive",
      });
      return;
    }

    if (questions.length > 100) {
      toast({
        title: "שגיאה",
        description: "מקסימום 100 שאלות מותר",
        variant: "destructive",
      });
      return;
    }

    onCreateRoom(questions);
  };

  const copyRoomCode = () => {
    if (gameState.roomCode) {
      navigator.clipboard.writeText(gameState.roomCode);
      toast({
        title: "הועתק!",
        description: "קוד החדר הועתק ללוח",
      });
    }
  };

  // Show setup form if no room created yet
  if (!gameState.roomCode) {
    return (
      <Card className="shadow-sm border">
        <CardContent className="p-6">
          <div className="flex flex-col items-center justify-center gap-6">
            <div className="w-full">
              <Textarea
                id="questions"
                data-testid="textarea-questions"
                placeholder="שאלה 1&#10;תשובה 1&#10;שאלה 2&#10;תשובה 2 [https://example.com/image.jpg]&#10;שאלה 3&#10;תשובה 3"
                value={questionsText}
                onChange={(e) => setQuestionsText(e.target.value)}
                className="h-64 resize-none font-mono text-base text-right flex items-center justify-end"
                dir="rtl"
              />
            </div>

            <div className="w-full">
              <Button
                data-testid="button-create-room"
                onClick={handleCreateRoom}
                className="w-full bg-party-primary hover:bg-indigo-600 text-xl px-12 py-6 h-auto font-bold"
              >
                צור חדר
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Game over state
  if (gameState.gamePhase === "complete") {
    return (
      <Card className="shadow-sm border">
        <CardContent className="p-6 text-center">
          <div className="text-6xl mb-4">🎉</div>
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

  return (
    <div className="space-y-4">
      {/* Room Management */}
      <Card className="shadow-sm border">
        <CardContent className="p-6">
          <div className="flex flex-col items-center justify-center gap-6">
            <div className="flex items-center justify-center bg-muted rounded-xl px-4 py-3">
              <span
                data-testid="text-room-code"
                className="text-3xl font-bold text-party-primary tracking-wider"
              >
                {gameState.roomCode}
              </span>
              <button
                data-testid="button-copy-code"
                onClick={copyRoomCode}
                className="text-muted-foreground hover:text-foreground transition-colors text-xl mr-3"
                title="העתק קוד"
              >
                📋
              </button>
            </div>

            {/* Game Controls */}
            <div className="flex gap-4 w-full">
              {gameState.gamePhase === "waiting" && (
                <Button
                  data-testid="button-start-round"
                  onClick={() => onHostAction("start")}
                  className="flex-1 bg-party-secondary hover:bg-emerald-600 text-xl px-8 py-6 h-auto font-bold"
                >
                  התחל
                </Button>
              )}

              {gameState.gamePhase === "question" && (
                <Button
                  data-testid="button-show-voting"
                  onClick={() => onHostAction("show_voting")}
                  className="flex-1 bg-party-accent hover:bg-amber-500 text-xl px-8 py-6 h-auto font-bold"
                >
                  הצבעה
                </Button>
              )}

              {gameState.gamePhase === "voting" && (
                <div className="flex-1 flex flex-col gap-3">
                  <div className="flex items-center justify-center gap-2 bg-muted rounded-lg py-2 px-4">
                    <span className="text-lg font-bold text-muted-foreground">
                      {gameState.votingOptions.length} /{" "}
                      {gameState.players.length}
                    </span>
                    <span className="text-lg">🗳️</span>
                  </div>
                  <Button
                    data-testid="button-reveal-results"
                    onClick={() => onHostAction("reveal")}
                    className="w-full bg-orange-500 hover:bg-orange-600 text-xl px-8 py-6 h-auto font-bold"
                  >
                    תוצאות
                  </Button>
                </div>
              )}

              {gameState.gamePhase === "revealing" && (
                <Button
                  data-testid="button-next-question"
                  onClick={() => onHostAction("next")}
                  className="flex-1 bg-party-primary hover:bg-indigo-600 text-xl px-8 py-6 h-auto font-bold"
                >
                  הבא
                </Button>
              )}
            </div>

            {/* Current Question Display */}
            {gameState.currentQuestion && (
              <Card className="bg-muted">
                <CardContent className="p-8">
                  <p
                    data-testid="text-current-question"
                    className="text-5xl text-center font-bold mb-6 leading-tight"
                  >
                    {gameState.currentQuestion}
                  </p>
                  <div className="text-center text-2xl text-muted-foreground font-bold">
                    <span data-testid="text-question-number">
                      {gameState.questionIndex}
                    </span>
                    <span>/</span>
                    <span data-testid="text-total-questions">
                      {gameState.totalQuestions}
                    </span>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Players List */}
      {gameState.players.length > 0 && (
        <Card className="shadow-sm border">
          <CardContent className="p-6">
            <div className="flex flex-col items-center justify-center gap-3 w-full">
              {gameState.players.map((playerName, index) => (
                <div
                  key={index}
                  className="flex items-center justify-center bg-muted rounded-xl px-4 py-3 w-full gap-2"
                >
                  <div className="w-10 h-10 bg-party-secondary rounded-full flex items-center justify-center text-white text-base font-bold mr-3">
                    {playerName.charAt(0).toUpperCase()}
                  </div>
                  <span
                    data-testid={`text-player-name-${index}`}
                    className="font-bold text-lg flex items-center"
                  >
                    {playerName}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Results Display */}
      {gameState.gamePhase === "revealing" &&
        (gameState.correctAnswer || gameState.leaderboard.length > 0) && (
          <Card className="shadow-sm border">
            <CardContent className="p-6">
              {gameState.correctAnswer && (
                <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-xl text-center">
                  <h4 className="font-bold text-green-800 mb-3 text-lg">✅</h4>
                  <p
                    data-testid="text-correct-answer"
                    className="text-green-700 text-xl font-bold mb-3"
                  >
                    {gameState.correctAnswer}
                  </p>
                  {(() => {
                    console.log(
                      "Rendering image section with gameState:",
                      JSON.stringify(
                        {
                          imageUrl: gameState.imageUrl,
                          gamePhase: gameState.gamePhase,
                          correctAnswer: gameState.correctAnswer,
                        },
                        null,
                        2
                      )
                    );
                    return gameState.imageUrl ? (
                      <div className="mt-4 flex justify-center">
                        <img
                          src={gameState.imageUrl}
                          alt="Answer illustration"
                          className="max-w-full h-auto rounded-lg shadow-sm max-h-[1000px] object-contain"
                          data-testid="answer-image"
                          onError={(e) => {
                            console.error(
                              "Image failed to load:",
                              gameState.imageUrl
                            );
                            e.currentTarget.style.display = "none";
                          }}
                        />
                      </div>
                    ) : (
                      <div className="mt-4 text-muted-foreground">
                        {/* Debug info */}
                        {process.env.NODE_ENV === "development" && (
                          <p className="text-sm">
                            No image URL available in gameState
                            (gameState.imageUrl is{" "}
                            {JSON.stringify(gameState.imageUrl)})
                          </p>
                        )}
                      </div>
                    );
                  })()}
                </div>
              )}

              {gameState.leaderboard.length > 0 && (
                <div className="flex flex-col items-center justify-center gap-3 w-full">
                  {gameState.leaderboard.map((player, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between bg-gradient-to-r from-yellow-50 to-orange-50 rounded-xl px-4 py-3 border border-yellow-200 w-full"
                    >
                      <div className="flex items-center gap-3">
                        <div className="text-2xl flex items-center justify-center">
                          {index === 0 ? "🥇" : index === 1 ? "🥈" : "🥉"}
                        </div>
                        <span
                          data-testid={`text-leaderboard-name-${index}`}
                          className="font-bold text-lg flex items-center"
                        >
                          {player.name}
                        </span>
                      </div>
                      <span
                        data-testid={`text-leaderboard-score-${index}`}
                        className="text-xl font-bold text-orange-600 flex items-center"
                      >
                        {player.score}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}
    </div>
  );
}
