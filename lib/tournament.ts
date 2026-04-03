import { Item, Match, Tournament, RankEntry } from "./types";

// Fisher-Yatesシャッフル
function shuffle<T>(arr: T[]): T[] {
  const result = [...arr];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

function makeMatchId(): string {
  return crypto.randomUUID();
}

// items からラウンド1の試合ペアを生成
function buildRound1(items: Item[], roundNumber: number): Match[] {
  const matches: Match[] = [];
  for (let i = 0; i < items.length; i += 2) {
    const itemA = items[i];
    const itemB = items[i + 1] ?? null;
    matches.push({
      id: makeMatchId(),
      round: roundNumber,
      itemA,
      itemB,
      winner: null,
    });
  }
  return matches;
}

// 勝者リストから次ラウンドの試合ペアを生成
function buildNextRound(winners: Item[], roundNumber: number): Match[] {
  const matches: Match[] = [];
  for (let i = 0; i < winners.length; i += 2) {
    const itemA = winners[i];
    const itemB = winners[i + 1] ?? null;
    matches.push({
      id: makeMatchId(),
      round: roundNumber,
      itemA,
      itemB,
      winner: null,
    });
  }
  return matches;
}

// シードを除いた総試合数（= 項目数 - 1）
function calcTotalMatches(itemCount: number): number {
  return itemCount - 1;
}

export function buildTournament(items: Item[]): Tournament {
  const shuffled = shuffle(items);
  const round1 = buildRound1(shuffled, 1);
  const totalMatches = calcTotalMatches(items.length);

  return {
    rounds: [round1],
    currentRound: 1,
    currentMatchIndex: 0,
    totalMatches,
    completedMatches: 0,
    isComplete: false,
  };
}

export function getCurrentMatch(tournament: Tournament): Match | null {
  const roundMatches = tournament.rounds[tournament.currentRound - 1];
  if (!roundMatches) return null;
  return roundMatches[tournament.currentMatchIndex] ?? null;
}

export function getIsComplete(tournament: Tournament): boolean {
  return tournament.isComplete;
}

export function advanceTournament(
  tournament: Tournament,
  winner: Item
): Tournament {
  const roundIndex = tournament.currentRound - 1;
  const rounds = tournament.rounds.map((r) => r.map((m) => ({ ...m })));
  const currentMatch = rounds[roundIndex][tournament.currentMatchIndex];

  // 現在の試合の勝者を更新
  currentMatch.winner = winner;

  const isSeedMatch = currentMatch.itemB === null;
  const newCompletedMatches = isSeedMatch
    ? tournament.completedMatches
    : tournament.completedMatches + 1;

  const nextMatchIndex = tournament.currentMatchIndex + 1;
  const roundMatches = rounds[roundIndex];
  const isRoundComplete = nextMatchIndex >= roundMatches.length;

  if (!isRoundComplete) {
    return {
      ...tournament,
      rounds,
      currentMatchIndex: nextMatchIndex,
      completedMatches: newCompletedMatches,
    };
  }

  // ラウンド完了 → 次ラウンドを生成
  const roundWinners: Item[] = roundMatches.map((m) => m.winner as Item);

  if (roundWinners.length === 1) {
    // 優勝者決定 → 完了
    return {
      ...tournament,
      rounds,
      currentMatchIndex: nextMatchIndex,
      completedMatches: newCompletedMatches,
      isComplete: true,
    };
  }

  const nextRoundNumber = tournament.currentRound + 1;
  const nextRound = buildNextRound(roundWinners, nextRoundNumber);

  return {
    ...tournament,
    rounds: [...rounds, nextRound],
    currentRound: nextRoundNumber,
    currentMatchIndex: 0,
    completedMatches: newCompletedMatches,
  };
}

export function revertTournament(tournament: Tournament): Tournament {
  // 直前の試合に戻す
  const rounds = tournament.rounds.map((r) => r.map((m) => ({ ...m })));
  const roundIndex = tournament.currentRound - 1;
  let currentMatchIndex = tournament.currentMatchIndex;
  let currentRound = tournament.currentRound;
  let newRounds = rounds;

  if (currentMatchIndex > 0) {
    // 同ラウンド内で1つ戻る
    currentMatchIndex -= 1;
    const prevMatch = newRounds[roundIndex][currentMatchIndex];
    const wasSeed = prevMatch.itemB === null;
    const newCompleted = wasSeed
      ? tournament.completedMatches
      : tournament.completedMatches - 1;
    newRounds[roundIndex][currentMatchIndex] = { ...prevMatch, winner: null };
    return {
      ...tournament,
      rounds: newRounds,
      currentMatchIndex,
      completedMatches: newCompleted,
      isComplete: false,
    };
  }

  if (currentRound > 1) {
    // 前ラウンドに戻る（追加されたラウンドを削除）
    newRounds = newRounds.slice(0, roundIndex);
    currentRound -= 1;
    const prevRoundMatches = newRounds[currentRound - 1];
    currentMatchIndex = prevRoundMatches.length - 1;
    const prevMatch = prevRoundMatches[currentMatchIndex];
    const wasSeed = prevMatch.itemB === null;
    const newCompleted = wasSeed
      ? tournament.completedMatches
      : tournament.completedMatches - 1;
    newRounds[currentRound - 1][currentMatchIndex] = {
      ...prevMatch,
      winner: null,
    };
    return {
      ...tournament,
      rounds: newRounds,
      currentRound,
      currentMatchIndex,
      completedMatches: newCompleted,
      isComplete: false,
    };
  }

  // 先頭試合なので何もしない
  return tournament;
}

export function buildResults(tournament: Tournament): RankEntry[] {
  const allMatches = tournament.rounds.flat();

  // 各Itemが何ラウンド勝ち残ったか（= 敗退ラウンド）を記録
  const eliminatedInRound = new Map<string, number>();

  for (const match of allMatches) {
    if (match.winner && match.itemB) {
      // 敗者を記録
      const loser =
        match.winner.id === match.itemA.id ? match.itemB : match.itemA;
      eliminatedInRound.set(loser.id, match.round);
    }
  }

  // 最終ラウンドの勝者（優勝者）
  const lastRound = tournament.rounds[tournament.rounds.length - 1];
  const champion = lastRound[lastRound.length - 1].winner as Item;

  // ラウンドごとに敗者をグルーピング
  const byRound = new Map<number, Item[]>();
  for (const [id, round] of Array.from(eliminatedInRound.entries())) {
    const allItems = allMatches.flatMap((m) =>
      m.itemB ? [m.itemA, m.itemB] : [m.itemA]
    );
    const item = allItems.find((i) => i.id === id);
    if (!item) continue;
    if (!byRound.has(round)) byRound.set(round, []);
    byRound.get(round)!.push(item);
  }

  const totalRounds = tournament.rounds.length;
  const entries: RankEntry[] = [];

  // 1位: 優勝者
  entries.push({ rank: 1, items: [champion], roundEliminated: null });

  // 2位以下: 敗退ラウンドの降順（後のラウンドで敗退 = 上位）
  const sortedRounds = Array.from(byRound.entries()).sort((a, b) => b[0] - a[0]);

  let rank = 2;
  for (const [round, items] of sortedRounds) {
    entries.push({ rank, items, roundEliminated: round });
    rank += items.length;
  }

  // ラウンド番号ではなく「何ラウンド勝ち残ったか」でsortするため再計算
  // totalRoundsを使って正規化
  entries.sort((a, b) => {
    if (a.roundEliminated === null) return -1;
    if (b.roundEliminated === null) return 1;
    return b.roundEliminated - a.roundEliminated;
  });

  // rankを再付与
  let currentRank = 1;
  for (const entry of entries) {
    if (entry.roundEliminated === null) {
      entry.rank = 1;
    } else {
      entry.rank = currentRank;
    }
    currentRank += entry.items.length;
  }

  // 重複除去（同じItemが複数のmatchに出ている場合）
  const seen = new Set<string>();
  const deduped: RankEntry[] = [];
  for (const entry of entries) {
    const uniqueItems = entry.items.filter((item) => {
      if (seen.has(item.id)) return false;
      seen.add(item.id);
      return true;
    });
    if (uniqueItems.length > 0) {
      deduped.push({ ...entry, items: uniqueItems });
    }
  }

  // rankを再度正規化
  let r = 1;
  for (const entry of deduped) {
    if (entry.roundEliminated !== null) {
      entry.rank = r;
    }
    r += entry.items.length;
  }

  return deduped;
}
