// アプリ全体の画面ステート
export type AppScreen = "input" | "duel" | "result";

// 入力項目
export type Item = {
  id: string;      // crypto.randomUUID() で生成
  text: string;    // ユーザーが入力したテキスト
};

// トーナメントの1試合
export type Match = {
  id: string;
  round: number;   // 1始まり
  itemA: Item;
  itemB: Item | null; // null = シード（不戦勝）
  winner: Item | null; // null = 未決
};

// トーナメント全体
export type Tournament = {
  rounds: Match[][];        // rounds[0] = 1回戦の試合一覧
  currentRound: number;     // 現在のラウンド（1始まり）
  currentMatchIndex: number; // 現在のラウンド内の試合インデックス
  totalMatches: number;     // シードを除いた総試合数
  completedMatches: number;
  isComplete: boolean;
};

// 結果のランキング行
export type RankEntry = {
  rank: number;             // 1始まり（同順位あり）
  items: Item[];            // 同順位の項目リスト
  roundEliminated: number | null; // 優勝者はnull
};
