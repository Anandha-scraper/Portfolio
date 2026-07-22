import { cn } from "@/lib/utils";

export default function Loading() {
  return (
    <div className="loading">
      <div className="loading__group">
        <div className="loading__spinner">
          <div className="loading__spinner-track" />
          <div className="loading__spinner-arc" />
        </div>
        <span className={cn("loading__label", "font-mono")}>Drawing blueprint…</span>
      </div>
    </div>
  );
}
