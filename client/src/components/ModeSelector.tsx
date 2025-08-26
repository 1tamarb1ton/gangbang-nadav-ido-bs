import { Card, CardContent } from "@/components/ui/card";

interface ModeSelectorProps {
  onSelectMode: (mode: "host" | "player") => void;
}

export function ModeSelector({ onSelectMode }: ModeSelectorProps) {
  return (
    <Card className="shadow-sm border">
      <CardContent className="p-6">
        <div className="flex flex-col items-center justify-center gap-4 w-full">
          <button
            data-testid="button-host-mode"
            onClick={() => onSelectMode("host")}
            className="w-full bg-party-primary hover:bg-indigo-600 text-white font-bold py-8 px-8 rounded-2xl transition-colors duration-200 flex flex-col items-center justify-center gap-3 text-xl"
          >
            <span className="text-5xl flex items-center justify-center">
              🎮
            </span>
            <span className="flex items-center justify-center">מארח</span>
          </button>
          <button
            data-testid="button-player-mode"
            onClick={() => onSelectMode("player")}
            className="w-full bg-party-secondary hover:bg-emerald-600 text-white font-bold py-8 px-8 rounded-2xl transition-colors duration-200 flex flex-col items-center justify-center gap-3 text-xl"
          >
            <span className="text-5xl flex items-center justify-center">
              📱
            </span>
            <span className="flex items-center justify-center">שחקן</span>
          </button>
        </div>
      </CardContent>
    </Card>
  );
}
