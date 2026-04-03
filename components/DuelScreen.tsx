"use client";

import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft } from "lucide-react";
import { Tournament, Item } from "@/lib/types";
import { useTournament } from "@/hooks/useTournament";
import { pageVariants, springBase, reducedMotionVariants } from "@/lib/animations";
import { useReducedMotionContext } from "./AppShell";

type Props = {
  tournament: Tournament;
  onComplete: (tournament: Tournament) => void;
  onBack: () => void;
};

export default function DuelScreen({ tournament: initialTournament, onComplete, onBack }: Props) {
  const { tournament, currentMatch, isComplete, select, back } = useTournament(initialTournament);
  const [selecting, setSelecting] = useState(false);
  const reducedMotion = useReducedMotionContext();

  // シード（itemB === null）を自動進出
  useEffect(() => {
    if (currentMatch && currentMatch.itemB === null && !isComplete) {
      const timer = setTimeout(() => select(currentMatch.itemA), 50);
      return () => clearTimeout(timer);
    }
  }, [currentMatch, isComplete, select]);

  // 完了検知
  useEffect(() => {
    if (isComplete) {
      const timer = setTimeout(() => onComplete(tournament), 300);
      return () => clearTimeout(timer);
    }
  }, [isComplete, tournament, onComplete]);

  const handleSelect = useCallback(
    (winner: Item) => {
      if (selecting) return;
      setSelecting(true);
      setTimeout(() => {
        select(winner);
        setSelecting(false);
      }, 300);
    },
    [selecting, select]
  );

  // キーボード操作
  useEffect(() => {
    const handleKeyDown = (e: globalThis.KeyboardEvent) => {
      if (!currentMatch || selecting) return;
      if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
        e.preventDefault();
        handleSelect(currentMatch.itemA);
      } else if (
        (e.key === "ArrowRight" || e.key === "ArrowDown") &&
        currentMatch.itemB
      ) {
        e.preventDefault();
        handleSelect(currentMatch.itemB);
      } else if (e.key === "Backspace") {
        e.preventDefault();
        back();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [currentMatch, selecting, handleSelect, back]);

  const isFirstMatch =
    tournament.currentRound === 1 && tournament.currentMatchIndex === 0;

  const pv = reducedMotion ? reducedMotionVariants : pageVariants;

  if (!currentMatch || currentMatch.itemB === null) {
    return null;
  }

  const progress = Math.min(
    ((tournament.completedMatches) / tournament.totalMatches) * 100 + 10,
    100
  );
  const remaining = tournament.totalMatches - tournament.completedMatches;

  return (
    <motion.div
      className="w-full max-w-2xl px-4 py-8 flex flex-col min-h-screen justify-between"
      variants={pv}
      initial="initial"
      animate="animate"
      exit="exit"
    >

      {/* ガイドコピー */}
      <p className="text-neutral-900 text-xl font-semibold text-center mb-4">直感で選びましょう</p>

      {/* ヘッダー */}
      <div className="mb-6">
        <div className="flex items-center mb-2 justify-between">
          {!isFirstMatch && (
            <motion.button
              onClick={back}
              whileTap={reducedMotion ? {} : { scale: 0.95 }}
              className="flex items-center gap-1 text-neutral-500 hover:text-neutral-900 transition text-sm"
              aria-label="前の比較に戻る"
            >
              <ChevronLeft size={16} />
              戻る
            </motion.button>
          )}
          <div className="text-right mt-1 text-xs text-neutral-400 ml-auto">
            あと{remaining}回
          </div>
        </div>

        {/* プログレスバー */}
        <div
          className="w-full bg-neutral-200 rounded-full h-1.5 overflow-hidden"
          aria-live="polite"
          aria-label={`あと ${remaining} 回`}
        >
          <motion.div
            className="h-full bg-neutral-900 rounded-full"
            animate={{ width: `${progress}%` }}
            transition={reducedMotion ? { duration: 0 } : springBase}
          />
        </div>
      </div>

      {/* 対戦カード */}
      <div className="flex flex-col md:flex-row gap-2 flex-1 items-stretch">
        <AnimatePresence mode="wait">
          <DuelCard
            key={`${currentMatch.id}-a`}
            item={currentMatch.itemA}
            side="left"
            onSelect={handleSelect}
            reducedMotion={reducedMotion}
            matchId={currentMatch.id}
          />
        </AnimatePresence>

        <div className="hidden md:flex items-center justify-center text-neutral-300 font-bold text-xl select-none">
          or
        </div>
        <div className="flex md:hidden items-center justify-center text-neutral-300 font-bold text-xl select-none">
          or
        </div>

        <AnimatePresence mode="wait">
          {currentMatch.itemB && (
            <DuelCard
              key={`${currentMatch.id}-b`}
              item={currentMatch.itemB}
              side="right"
              onSelect={handleSelect}
              reducedMotion={reducedMotion}
              matchId={currentMatch.id}
            />
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

type DuelCardProps = {
  item: Item;
  side: "left" | "right";
  onSelect: (item: Item) => void;
  reducedMotion: boolean;
  matchId: string;
};

function DuelCard({ item, side, onSelect, reducedMotion, matchId }: DuelCardProps) {
  const initialX = side === "left" ? -60 : 60;
  const exitX = side === "left" ? -80 : 80;

  return (
    <motion.button
      key={`${matchId}-${item.id}-${side}`}
      layoutId={reducedMotion ? undefined : `card-${item.id}`}
      initial={reducedMotion ? { opacity: 0 } : { x: initialX, opacity: 0 }}
      animate={reducedMotion ? { opacity: 1 } : { x: 0, opacity: 1 }}
      exit={reducedMotion ? { opacity: 0 } : { x: exitX, opacity: 0 }}
      transition={reducedMotion ? { duration: 0 } : { type: "spring", stiffness: 400, damping: 28 }}
      whileHover={reducedMotion ? {} : { y: -4, boxShadow: "0 12px 40px rgba(0,0,0,0.12)" }}
      whileTap={reducedMotion ? {} : { scale: 0.97 }}
      onClick={() => onSelect(item)}
      aria-label={`${item.text} を選ぶ`}
      className="flex-1 min-h-[180px] md:min-h-[280px] bg-white border-2 border-neutral-400 border-dashed rounded-2xl p-6 flex items-center justify-center text-center cursor-pointer hover:border-neutral-400 transition-colors focus:outline-none focus:border-solid focus:border-neutral-800"
    >
      <span className="text-lg md:text-xl font-semibold text-neutral-800 leading-relaxed break-words">
        {item.text}
      </span>
    </motion.button>
  );
}
