import { create } from "zustand";
import type { GraphData } from "../types/graph";

interface GraphState {
  // === Graph Data ===
  graphData: GraphData | null;
  setGraphData: (g: GraphData) => void;

  // === Graph Navigation History ===
  history: GraphData[];

  // old names (kept for backward compatibility)
  pushHistory: (g: GraphData) => void;
  popHistory: () => GraphData | null;

  // new explicit names (used by GraphView / BackButton)
  pushGraphHistory: (g: GraphData) => void;
  popGraphHistory: () => GraphData | null;

  // === Node selection ===
  selectedNodeId: string | null;
  highlightNodeId: string | null;

  setSelectedNode: (id: string | null) => void;
  setHighlightNode: (id: string | null) => void;

  // === Spotlight / Search focus ===
  focusNode: (id: string) => void;

  // ← ADD THESE TWO LINES HERE
  pendingFocusId: string | null;
  setPendingFocusId: (id: string | null) => void;
}

export const useGraphStore = create<GraphState>((set, get) => ({
  // === Graph data ===
  graphData: null,
  setGraphData: (g) => set({ graphData: g }),

  // === History stack ===
  history: [],

  // OLD API (kept for safety)
  pushHistory: (g) =>
    set((state) => ({
      history: [...state.history, g],
    })),

  popHistory: () => {
    const h = get().history;
    if (h.length === 0) return null;

    const newH = [...h];
    const last = newH.pop();
    set({ history: newH });
    return last ?? null;
  },

  // NEW API (used by graph navigation)
  pushGraphHistory: (g) =>
    set((state) => ({
      history: [...state.history, g],
    })),

  popGraphHistory: () => {
    const h = get().history;
    if (h.length === 0) return null;

    const newH = [...h];
    const last = newH.pop();
    set({ history: newH });
    return last ?? null;
  },

  // === Node selection ===
  selectedNodeId: null,
  highlightNodeId: null,

  setSelectedNode: (id) => set({ selectedNodeId: id }),
  setHighlightNode: (id) => set({ highlightNodeId: id }),

  // === Spotlight focus (immediate) ===
  focusNode: (id) =>
    set({
      selectedNodeId: id,
      highlightNodeId: id,
    }),

  // ← ADD THESE TWO HERE (inside the store object)
  pendingFocusId: null,
  setPendingFocusId: (id: string | null) =>
    set({ pendingFocusId: id }),
}));