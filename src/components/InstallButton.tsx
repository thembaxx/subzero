"use client";

import { useEffect, useState } from "react";
import { Download } from "lucide-react";

interface InstallPrompt extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export function InstallButton() {
  const [prompt, setPrompt] = useState<InstallPrompt | null>(null);
  const [message, setMessage] = useState("");
  useEffect(() => {
    function onPrompt(event: Event) {
      event.preventDefault();
      setPrompt(event as InstallPrompt);
    }
    window.addEventListener("beforeinstallprompt", onPrompt);
    return () => window.removeEventListener("beforeinstallprompt", onPrompt);
  }, []);
  async function install() {
    if (window.matchMedia("(display-mode: standalone)").matches) {
      setMessage("Trace is already installed on this device.");
      return;
    }
    if (!prompt) {
      setMessage(
        "Use your browser’s menu to install Trace. On iPhone, choose Share → Add to Home Screen.",
      );
      return;
    }
    await prompt.prompt();
    await prompt.userChoice;
    setPrompt(null);
  }
  return (
    <div className="install-control">
      <button className="text-button" onClick={() => void install()}>
        <Download size={15} />
        Get the app
      </button>
      {message && <p role="status">{message}</p>}
    </div>
  );
}
