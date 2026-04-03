"use client";

import { useReducer } from "react";
import { Tournament, Item, Match } from "@/lib/types";
import {
  advanceTournament,
  revertTournament,
  getCurrentMatch,
  getIsComplete,
} from "@/lib/tournament";

type Action =
  | { type: "SELECT"; payload: Item }
  | { type: "BACK" };

function tournamentReducer(state: Tournament, action: Action): Tournament {
  switch (action.type) {
    case "SELECT":
      return advanceTournament(state, action.payload);
    case "BACK":
      return revertTournament(state);
    default:
      return state;
  }
}

export function useTournament(initialTournament: Tournament) {
  const [tournament, dispatch] = useReducer(
    tournamentReducer,
    initialTournament
  );

  const currentMatch: Match | null = getCurrentMatch(tournament);
  const isComplete: boolean = getIsComplete(tournament);

  const select = (winner: Item) => {
    dispatch({ type: "SELECT", payload: winner });
  };

  const back = () => {
    dispatch({ type: "BACK" });
  };

  return { tournament, currentMatch, isComplete, select, back };
}
