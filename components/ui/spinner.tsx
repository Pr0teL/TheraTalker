// components/ui/spinner.tsx
import { Loader2 } from "lucide-react";

export default function Spinner({ size = 24 }: { size?: number }) {
  return (
    <div className="flex items-center justify-center w-full py-20">
      <Loader2
        className="animate-spin text-muted-foreground"
        style={{ width: size, height: size }}
      />
    </div>
  );
}
