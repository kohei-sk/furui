"use client";

import { useState, createContext, useContext } from "react";
import { AnimatePresence } from "framer-motion";
import { useReducedMotion } from "framer-motion";
import { AppScreen, Item, Tournament, RankEntry } from "@/lib/types";
import { buildTournament, buildResults } from "@/lib/tournament";
import InputScreen from "./InputScreen";
import DuelScreen from "./DuelScreen";
import ResultScreen from "./ResultScreen";

// reduced-motion コンテキスト
const ReducedMotionContext = createContext(false);
export const useReducedMotionContext = () => useContext(ReducedMotionContext);

export default function AppShell() {
  const [screen, setScreen] = useState<AppScreen>("input");
  const [items, setItems] = useState<Item[]>([]);
  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [results, setResults] = useState<RankEntry[] | null>(null);

  const shouldReduceMotion = useReducedMotion() ?? false;

  const handleAddItem = (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || trimmed.length > 100) return;
    setItems((prev) => [
      { id: crypto.randomUUID(), text: trimmed },
      ...prev,
    ]);
  };

  const handleRemoveItem = (id: string) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
  };

  const handleStart = () => {
    if (items.length < 3) return;
    const t = buildTournament(items);
    setTournament(t);
    setResults(null);
    setScreen("duel");
  };

  const handleTournamentComplete = (t: Tournament) => {
    const r = buildResults(t);
    setResults(r);
    setScreen("result");
  };

  const handleRestart = () => {
    setItems([]);
    setTournament(null);
    setResults(null);
    setScreen("input");
  };

  const handleEdit = () => {
    setTournament(null);
    setResults(null);
    setScreen("input");
  };

  return (
    <ReducedMotionContext.Provider value={shouldReduceMotion}>
      <div className="min-h-dvh bg-neutral-50 flex flex-col items-center justify-center">
        <AnimatePresence mode="wait">
          {screen === "input" && (
            <InputScreen
              key="input"
              items={items}
              onAddItem={handleAddItem}
              onRemoveItem={handleRemoveItem}
              onStart={handleStart}
            />
          )}
          {screen === "duel" && tournament && (
            <DuelScreen
              key="duel"
              tournament={tournament}
              onComplete={handleTournamentComplete}
              onBack={() => setScreen("input")}
            />
          )}
          {screen === "result" && results && (
            <ResultScreen
              key="result"
              results={results}
              onRestart={handleRestart}
              onEdit={handleEdit}
            />
          )}
        </AnimatePresence>
      </div>
    </ReducedMotionContext.Provider>
  );
}
