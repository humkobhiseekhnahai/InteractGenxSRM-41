import { create } from "zustand";

interface UIState {
  // Spotlight search / command palette
  commandOpen: boolean;
  setCommandOpen: (open: boolean) => void;
  toggleCommand: () => void;

  // Blog modal state
  blogModalOpen: boolean;
  currentBlogId: string | null;
  openBlogModal: (id: string) => void;
  closeBlogModal: () => void;

  // Navigation history for blog modal back button
  history: string[];
  pushHistory: (id: string) => void;
  popHistory: () => string | null;

  // NEW: For graph search → focus after load
  pendingFocusId: string | null;
  setPendingFocusId: (id: string | null) => void;
}

export const useUIStore = create<UIState>((set, get) => ({
  // Spotlight Search
  commandOpen: false,
  setCommandOpen: (open) => set({ commandOpen: open }),
  toggleCommand: () => set((state) => ({ commandOpen: !state.commandOpen })),

  // Modal state
  blogModalOpen: false,
  currentBlogId: null,

  openBlogModal: (id: string) =>
    set({
      blogModalOpen: true,
      currentBlogId: id,
    }),

  closeBlogModal: () =>
    set({
      blogModalOpen: false,
      currentBlogId: null,
    }),

  // Navigation stack (only blog IDs)
  history: [],

  pushHistory: (id: string) =>
    set((state) => ({
      history: [...state.history, id],
    })),

  popHistory: () => {
    const { history } = get();
    if (history.length === 0) return null;

    const prev = history[history.length - 1];
    set({ history: history.slice(0, -1) });
    return prev;
  },

  // NEW: Pending node to focus after graph load
  pendingFocusId: null,
  setPendingFocusId: (id: string | null) =>
    set({ pendingFocusId: id }),
}));