"use client";

import { useState, useRef, useEffect, KeyboardEvent } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Plus } from "lucide-react";
import { Item } from "@/lib/types";
import {
  pageVariants,
  listContainerVariants,
  listItemVariants,
  reducedMotionVariants,
  reducedMotionListContainerVariants,
  reducedMotionListItemVariants,
  springBase,
} from "@/lib/animations";
import { useReducedMotionContext } from "./AppShell";
import Image from "next/image";

type Props = {
  items: Item[];
  onAddItem: (text: string) => void;
  onRemoveItem: (id: string) => void;
  onStart: () => void;
};

const MAX_ITEMS = 16;
const MIN_ITEMS = 3;
const MAX_CHARS = 100;

export default function InputScreen({
  items,
  onAddItem,
  onRemoveItem,
  onStart,
}: Props) {
  const [inputValue, setInputValue] = useState("");
  const [startButtonPulsed, setStartButtonPulsed] = useState(false);
  const prevItemsLength = useRef(items.length);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const isComposing = useRef(false);
  const reducedMotion = useReducedMotionContext();

  // マウント時にフォーカス
  // AnimatePresence の入場アニメーション中に focus() を呼ぶとブラウザが
  // フォーカスを受け付けないケースがあるため、setTimeout で遅延させる
  useEffect(() => {
    const timer = setTimeout(() => {
      inputRef.current?.focus();
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  const isAtMax = items.length >= MAX_ITEMS;
  const canStart = items.length >= MIN_ITEMS;
  const remaining = MIN_ITEMS - items.length;

  // items.length が 2→3 になった瞬間にスタートボタンをパルス
  useEffect(() => {
    if (prevItemsLength.current === MIN_ITEMS - 1 && items.length === MIN_ITEMS) {
      setStartButtonPulsed(true);
      setTimeout(() => setStartButtonPulsed(false), 400);
    }
    prevItemsLength.current = items.length;
  }, [items.length]);

  // テキストエリアの高さを内容に合わせて自動調整
  const adjustHeight = () => {
    const el = inputRef.current;
    if (el) {
      el.style.height = "auto";
      el.style.height = el.scrollHeight + "px";
    }
  };

  const handleAdd = () => {
    const trimmed = inputValue.trim();
    if (!trimmed || isAtMax) return;
    onAddItem(trimmed);
    setInputValue("");
    // 追加後にテキストエリアの高さをリセット
    requestAnimationFrame(() => {
      const el = inputRef.current;
      if (el) {
        el.style.height = "auto";
      }
      el?.focus();
    });
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey && !isComposing.current) {
      e.preventDefault();
      handleAdd();
    }
  };

  const pv = reducedMotion ? reducedMotionVariants : pageVariants;
  const lcv = reducedMotion ? reducedMotionListContainerVariants : listContainerVariants;
  const liv = reducedMotion ? reducedMotionListItemVariants : listItemVariants;

  return (
    <>
      {/* ヘッダー */}
      < motion.div
        className="z-10 p-4 fixed top-0 left-0 w-full flex justify-center"
        variants={pv}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={reducedMotion ? { duration: 0 } : { delay: 0.3, duration: 0.2 }}
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
        className="w-full max-w-xl px-4 py-16"
        variants={pv}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={reducedMotion ? { duration: 0 } : { delay: 0.4, duration: 0.2 }}
      >

        <div className="mb-6">
          <p className="text-neutral-600 text-lg font-semibold text-center sm:text-md">
            頭の中にあるものを<br />すべて書き出してみましょう
          </p>
        </div>

        {/* 入力エリア（textarea + 追加ボタン右下） */}
        <div className="relative mb-6 flex">
          <textarea
            ref={inputRef}
            rows={2}
            value={inputValue}
            onChange={(e) => {
              if (e.target.value.length <= MAX_CHARS) {
                setInputValue(e.target.value);
                adjustHeight();
              }
            }}
            onCompositionStart={() => { isComposing.current = true; }}
            onCompositionEnd={() => { isComposing.current = false; }}
            onKeyDown={handleKeyDown}
            placeholder={`気になること、やりたいこと、買いたいもの…`}
            disabled={isAtMax}
            className="w-full rounded-xl border border-neutral-200 bg-white px-4 pt-3 pb-12 pr-4 text-sm text-neutral-800 placeholder-neutral-400 outline-none focus:ring-2 focus:ring-neutral-800 focus:border-transparent transition disabled:opacity-40 disabled:cursor-not-allowed resize-none overflow-hidden leading-relaxed"
            aria-label="項目を入力"
          />
          <motion.button
            onClick={handleAdd}
            disabled={isAtMax || !inputValue.trim()}
            whileTap={reducedMotion ? {} : { scale: 0.97 }}
            className="absolute bottom-2 right-2 flex items-center justify-center w-10 h-10 rounded-full bg-neutral-800 text-white disabled:opacity-40 disabled:cursor-not-allowed hover:bg-neutral-600 transition"
            aria-label="追加"
          >
            <Plus size={18} />
          </motion.button>
        </div>

        {/* 上限ガード */}
        {isAtMax && (
          <p className="text-xs text-amber-600 mb-4">
            最大{MAX_ITEMS}項目まで入力できます
          </p>
        )}

        {/* 項目リスト */}
        {items.length !== 0 && (
          <motion.ul
            layout
            variants={lcv}
            initial="hidden"
            animate="show"
            className="space-y-2 mb-8"
          >
            <AnimatePresence>
              {items.map((item) => (
                <motion.li
                  key={item.id}
                  layout
                  variants={liv}
                  initial="hidden"
                  animate="show"
                  exit={
                    reducedMotion
                      ? { opacity: 0 }
                      : { opacity: 0, x: 40, transition: { duration: 0.2 } }
                  }
                  transition={reducedMotion ? { duration: 0 } : springBase}
                  className="flex items-center gap-3 bg-white shadow-sm rounded-xl p-4"
                >
                  <span className="flex-1 text-base text-neutral-800 break-words min-w-0">
                    {item.text}
                  </span>
                  <motion.button
                    onClick={() => onRemoveItem(item.id)}
                    whileTap={reducedMotion ? {} : { scale: 0.9 }}
                    className="flex-shrink-0 text-neutral-400 hover:text-neutral-700 transition"
                    aria-label={`${item.text} を削除`}
                  >
                    <X size={16} />
                  </motion.button>
                </motion.li>
              ))}
            </AnimatePresence>
          </motion.ul>
        )}

        {/* 比較開始ボタン */}
        <motion.div
          className="fixed left-0 bottom-0 w-full p-4 z-10 flex justify-center"
          variants={pv}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={reducedMotion ? { duration: 0 } : { delay: 0.5, duration: 0.2 }}
        >
          {!canStart && items.length > 0 && (
            <p className="text-center text-xs text-neutral-400 mb-3">
              あと{remaining}つで進めます
            </p>
          )}
          <motion.button
            onClick={onStart}
            disabled={!canStart}
            animate={
              startButtonPulsed && !reducedMotion
                ? { scale: [1, 1.05, 1] }
                : { scale: 1 }
            }
            transition={springBase}
            whileTap={reducedMotion ? {} : { scale: 0.97 }}
            className="max-w-xl flex items-center justify-center gap-3 w-full py-4 rounded-full bg-neutral-800 text-white text-sm hover:bg-neutral-600 transition disabled:opacity-30 disabled:cursor-not-allowed"
          >
            フルイにかける
          </motion.button>
        </motion.div>
      </motion.div>
    </>
  );

}
