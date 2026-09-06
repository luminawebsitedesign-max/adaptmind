import { useState } from "react";
import { X } from "lucide-react";
import { DEMO_MODE, DEMO_REPO_URL } from "@/lib/demo";

const DISMISS_KEY = "adaptmind-demo-banner-dismissed";

export function DemoBanner() {
  const [dismissed, setDismissed] = useState(
    () => typeof window !== "undefined" && localStorage.getItem(DISMISS_KEY) === "1"
  );

  if (!DEMO_MODE || dismissed) return null;

  return (
    <div className="relative z-50 w-full bg-primary/10 border-b border-primary/30 px-4 py-2 text-center text-xs sm:text-sm text-foreground">
      <span className="pr-6 inline-block">
        Live demo — your data is stored in your browser only, nothing is saved to a server.{" "}
        <a
          href={DEMO_REPO_URL}
          target="_blank"
          rel="noreferrer noopener"
          className="underline underline-offset-2 text-primary"
        >
          View the repo
        </a>
      </span>
      <button
        type="button"
        aria-label="Dismiss demo notice"
        onClick={() => {
          localStorage.setItem(DISMISS_KEY, "1");
          setDismissed(true);
        }}
        className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded-md text-muted-foreground hover:text-foreground"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}
