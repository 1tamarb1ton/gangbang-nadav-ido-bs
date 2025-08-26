import { useSocket } from "@/hooks/useSocket";
import { ModeSelector } from "@/components/ModeSelector";
import { HostInterface } from "@/components/HostInterface";
import { PlayerInterface } from "@/components/PlayerInterface";

export default function Game() {
  const { gameState, actions } = useSocket();

  const handleModeSelect = (mode: "host" | "player") => {
    // Switch to the selected mode to show the appropriate interface
    actions.setMode(mode);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-4 space-y-4">
        {/* Mode Selector */}
        {gameState.mode === "select" && (
          <ModeSelector onSelectMode={handleModeSelect} />
        )}

        {/* Host Interface */}
        {gameState.mode === "host" && (
          <HostInterface
            gameState={gameState}
            onCreateRoom={actions.createRoom}
            onHostAction={actions.hostAction}
            onNewGame={actions.resetGame}
          />
        )}

        {/* Player Interface */}
        {gameState.mode === "player" && (
          <PlayerInterface
            gameState={gameState}
            onJoinRoom={actions.joinRoom}
            onSubmitAnswer={actions.submitAnswer}
            onVoteAnswer={actions.voteAnswer}
            onNewGame={actions.resetGame}
          />
        )}

        {/* Connection Status */}
        <div className="fixed bottom-4 right-4 z-50">
          <div className="bg-white rounded-lg shadow-lg border px-4 py-3 flex items-center gap-2">
            <div
              className={`w-3 h-3 rounded-full ${
                gameState.connected ? "bg-party-secondary" : "bg-red-500"
              }`}
            ></div>
            <span
              data-testid="text-connection-status"
              className="text-base font-medium"
            >
              {gameState.connected ? "מחובר" : "מנותק"}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
