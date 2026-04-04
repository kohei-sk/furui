"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Copy, Check, RotateCcw, Edit3 } from "lucide-react";
import { RankEntry } from "@/lib/types";
import {
  pageVariants,
  springBase,
  reducedMotionVariants,
} from "@/lib/animations";
import { useReducedMotionContext } from "./AppShell";
import Image from "next/image";

type Props = {
  results: RankEntry[];
  onRestart: () => void;
  onEdit: () => void;
};

const containerVariants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.07, delayChildren: 0.9 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 16 },
  show: {
    opacity: 1,
    y: 0,
    transition: { type: "spring", stiffness: 400, damping: 30 },
  },
};

const reducedContainerVariants = {
  hidden: {},
  show: { transition: { staggerChildren: 0, delayChildren: 0 } },
};

const reducedItemVariants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { duration: 0 } },
};

export default function ResultScreen({ results, onRestart, onEdit }: Props) {
  const [copied, setCopied] = useState(false);
  const reducedMotion = useReducedMotionContext();

  const champion = results[0]?.items[0];
  const rankList = results.slice(1);

  const pv = reducedMotion ? reducedMotionVariants : pageVariants;
  const cv = reducedMotion ? reducedContainerVariants : containerVariants;
  const iv = reducedMotion ? reducedItemVariants : itemVariants;

  const handleCopy = async () => {
    if (!champion) return;
    const lines: string[] = ["【Furui 結果】"];
    for (const entry of results) {
      const label =
        entry.items.length > 1
          ? entry.items.map((i) => `${i.text}（同率）`).join("、")
          : entry.items[0].text;
      lines.push(`${entry.rank}位: ${label}`);
    }
    lines.push("---");
    lines.push("Furui で作成");
    const text = lines.join("\n");
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // clipboard API unavailable
    }
  };

  return (
    <>
      {/* ヘッダー */}
      < motion.div
        className="z-10 p-4 fixed top-0 left-0 w-full flex justify-center"
        variants={pv}
        initial={{ opacity: 0 }
        }
        animate={{ opacity: 1 }}
        transition={reducedMotion ? { duration: 0 } : { delay: 0.1, duration: 0.2 }}
      >
        <h1>
          <Image
            className="w-[80px] h-auto"
            src="/img/logo.svg"
            alt="Pitasuke"
            width={100}
            height={40}
          />
        </h1>
      </motion.div >

      <motion.div
        className="w-full max-w-xl px-4 py-12 flex flex-col"
        variants={pv}
        initial="initial"
        animate="animate"
        exit="exit"
      >
        {/* リード文 */}
        <motion.p
          className="text-base text-neutral-500 text-center mb-2"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={reducedMotion ? { duration: 0 } : { delay: 0.2, duration: 0.4 }}
        >
          あなたにとって、最も重要なのは
        </motion.p>

        {/* The One */}
        {champion && (
          <motion.div
            className="text-center mb-10"
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={
              reducedMotion
                ? { duration: 0 }
                : { delay: 0.4, type: "spring", stiffness: 300, damping: 20 }
            }
          >
            <span className="text-4xl sm:text-5xl font-bold text-neutral-800 leading-tight break-words tracking-[1px]">
              {champion.text}
            </span>
          </motion.div>
        )}

        {/* ランキングリスト */}
        {rankList.length > 0 && (
          <motion.ol
            className="space-y-2 mb-10"
            variants={cv}
            initial="hidden"
            animate="show"
          >
            {rankList.map((entry) => (
              <motion.li
                key={entry.rank}
                variants={iv}
                className="flex items-center gap-3 bg-white shadow-sm rounded-xl p-4"
              >
                <span className="text-sm font-semibold text-neutral-500 w-8 flex-shrink-0 pt-0.5">
                  {entry.rank}位
                </span>
                <span className="text-base text-neutral-800 break-words">
                  {entry.items.length > 1
                    ? entry.items.map((i) => i.text).join(" / ")
                    : entry.items[0].text}
                </span>
              </motion.li>
            ))}
          </motion.ol>
        )}

        {/* ボタン類 */}
        <motion.div
          className="flex flex-col gap-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={reducedMotion ? { duration: 0 } : { delay: 1.2, duration: 0.3 }}
        >

          <motion.button
            onClick={handleCopy}
            whileTap={reducedMotion ? {} : { scale: 0.97 }}
            className="btn-primary"
          >
            {copied ? (
              <>
                <Check size={14} />
                コピーしました
              </>
            ) : (
              <>
                <Copy size={14} />
                結果をコピー
              </>
            )}
          </motion.button>
          <motion.button className="flex gap-4">
            <motion.button
              onClick={onEdit}
              whileTap={reducedMotion ? {} : { scale: 0.97 }}
              className="btn-secondary"
            >
              <Edit3 size={14} />
              項目を編集
            </motion.button>


            <motion.button
              onClick={onRestart}
              whileTap={reducedMotion ? {} : { scale: 0.97 }}
              className="btn-secondary"
            >
              <RotateCcw size={14} />
              もう一度
            </motion.button>
          </motion.button>
        </motion.div>
      </motion.div>
    </>
  );
}
