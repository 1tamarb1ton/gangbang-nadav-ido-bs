import { useSocket } from "@/hooks/useSocket";
import { ModeSelector } from "@/components/ModeSelector";
import { HostInterface } from "@/components/HostInterface";
import { PlayerInterface } from "@/components/PlayerInterface";

export default function Game() {
  const { gameState, actions } = useSocket();

  const handleModeSelect = (mode: 'host' | 'player') => {
    // Switch to the selected mode to show the appropriate interface
    actions.setMode(mode);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <h1 className="text-2xl font-bold text-gray-900 text-center">🎉 Party Qs</h1>
          <p className="text-gray-600 text-center mt-1">Custom Questions Game</p>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 py-6 space-y-8">
        {/* Mode Selector */}
        {gameState.mode === 'select' && (
          <ModeSelector onSelectMode={handleModeSelect} />
        )}

        {/* Host Interface */}
        {gameState.mode === 'host' && (
          <HostInterface 
            gameState={gameState}
            onCreateRoom={actions.createRoom}
            onHostAction={actions.hostAction}
            onNewGame={actions.resetGame}
          />
        )}

        {/* Player Interface */}
        {gameState.mode === 'player' && (
          <PlayerInterface 
            gameState={gameState}
            onJoinRoom={actions.joinRoom}
            onSubmitAnswer={actions.submitAnswer}
            onNewGame={actions.resetGame}
          />
        )}

        {/* Connection Status */}
        <div className="fixed bottom-4 right-4 z-50">
          <div className="bg-white rounded-lg shadow-lg border border-gray-200 px-3 py-2 flex items-center space-x-2">
            <div className={`w-2 h-2 rounded-full ${gameState.connected ? 'bg-party-secondary' : 'bg-red-500'}`}></div>
            <span data-testid="text-connection-status" className="text-xs text-gray-600">
              {gameState.connected ? 'Connected' : 'Disconnected'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
