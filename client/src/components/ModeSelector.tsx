import { Card, CardContent } from "@/components/ui/card";

interface ModeSelectorProps {
  onSelectMode: (mode: 'host' | 'player') => void;
}

export function ModeSelector({ onSelectMode }: ModeSelectorProps) {
  return (
    <Card className="shadow-sm border border-gray-200">
      <CardContent className="p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4 text-center">
          Choose Your Role
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <button 
            data-testid="button-host-mode"
            onClick={() => onSelectMode('host')}
            className="bg-party-primary hover:bg-indigo-600 text-white font-semibold py-4 px-6 rounded-lg transition-colors duration-200 flex items-center justify-center space-x-2"
          >
            <span className="text-2xl">🎮</span>
            <span>I'm the Host</span>
          </button>
          <button 
            data-testid="button-player-mode"
            onClick={() => onSelectMode('player')}
            className="bg-party-secondary hover:bg-emerald-600 text-white font-semibold py-4 px-6 rounded-lg transition-colors duration-200 flex items-center justify-center space-x-2"
          >
            <span className="text-2xl">📱</span>
            <span>I'm a Player</span>
          </button>
        </div>
      </CardContent>
    </Card>
  );
}
