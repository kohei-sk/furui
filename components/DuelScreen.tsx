"use client";

import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft } from "lucide-react";
import { Tournament, Item } from "@/lib/types";
import { useTournament } from "@/hooks/useTournament";
import { pageVariants, springBase, reducedMotionVariants } from "@/lib/animations";
import { useReducedMotionContext } from "./AppShell";
import Image from "next/image";

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
  const total = tournament.totalMatches;
  const current = tournament.completedMatches + 1;

  return (
    <motion.div
      className="w-full max-w-2xl px-4 py-8 flex flex-col min-h-dvh justify-between"
      variants={pv}
      initial="initial"
      animate="animate"
      exit="exit"
    >

      {/* ガイドコピー */}
      <p className="text-neutral-600 text-lg font-semibold text-center mb-6 sm:text-md">直感で選びましょう</p>

      {/* ヘッダー */}
      <div className="mb-8">
        <div className="relative flex items-center justify-center">
          {!isFirstMatch && (
            <motion.button
              onClick={back}
              whileTap={reducedMotion ? {} : { scale: 0.95 }}
              className="w-[44px] h-[40px] absolute left-0 flex items-center justify-center gap-1 text-neutral-400 hover:text-neutral-700 transition"
              aria-label="前の比較に戻る"
            >
              <ChevronLeft size={22} />
            </motion.button>
          )}
          <div className="text-sm text-neutral-800 rounded-lg bg-neutral-100 p-3">
            {current}<span className="text-neutral-400"> / {total}</span>
          </div>
        </div>
      </div>

      {/* 対戦カード */}
      <div className="flex flex-col gap-3 flex-1 items-stretch">
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

        <div className="flex items-center justify-center text-neutral-300 text-xl select-none">
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
      className="overflow-hidden relative bg-[#42B38D] min-h-[150px] rounded-2xl p-6 flex items-center justify-center text-center cursor-pointer hover:border-neutral-400 transition-colors focus:outline-none focus:border-solid focus:border-neutral-800"
    >
      <Image
        className="absolute w-full h-auto"
        src="/img/card-bg.png"
        alt="Pitasuke"
        width={800}
        height={40}
      />
      <span className="relative z-2 text-xl md:text-xl font-semibold text-white leading-relaxed break-words">
        {item.text}
      </span>
    </motion.button>
  );
}
