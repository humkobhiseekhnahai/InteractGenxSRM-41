// src/components/CommandPalette.tsx (updated)

import { motion, AnimatePresence } from "framer-motion";
import { useUIStore } from "../state/uiStore";
import { useState, useEffect } from "react";
import { searchQuery } from "../api/search";
import type { SearchResult } from "../api/search";
import { useGraphStore } from "../state/graphStore";
import { fetchGraphExpand } from "../api/graph";  // ← Use this for both types (assumes backend supports centering on blog too)

export default function CommandPalette() {
  const open = useUIStore((s) => s.commandOpen);
  const setOpen = useUIStore((s) => s.setCommandOpen);

  const {
    graphData,
    setGraphData,
    pushGraphHistory,
    setPendingFocusId,  // ← NEW: set pending focus for delayed zoom after load
  } = useGraphStore();

  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);

  const cleanedQuery = query.trim();

  /* ------------------------------
     Reset results when query clears
  ------------------------------ */
  useEffect(() => {
    if (cleanedQuery === "") {
      queueMicrotask(() => {
        setResults([]);
        setLoading(false);
      });
    }
  }, [cleanedQuery]);

  /* ------------------------------
     Debounced semantic search
  ------------------------------ */
  useEffect(() => {
    if (cleanedQuery === "") return;

    const timer = window.setTimeout(async () => {
      try {
        setLoading(true);
        const r = await searchQuery(cleanedQuery);
        setResults(r);
      } catch (e) {
        console.error("Search error:", e);
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => window.clearTimeout(timer);
  }, [cleanedQuery]);

  function close() {
    setOpen(false);
    setQuery("");
    setResults([]);
  }

  /* ------------------------------
     FIXED: Robust navigation with graph load check + pending focus
  ------------------------------ */
  async function handleSelect(item: SearchResult) {
    // Close palette immediately
    queueMicrotask(() => {
      setOpen(false);
      setQuery("");
      setResults([]);
    });

    // Check if node already in current graph
    const currentNode = graphData?.nodes.find((n) => n.id === item.id);
    if (currentNode) {
      // Already loaded → immediate select (useEffect in GraphView handles zoom)
      useGraphStore.getState().setSelectedNode(item.id);
      return;
    }

    // Not in current → load centered graph (works for both blog/concept)
    try {
      if (graphData) {
        pushGraphHistory(graphData);
      }

      const centeredGraph = await fetchGraphExpand(item.id);  // ← Backend centers on node (or parent for blogs)
      setGraphData(centeredGraph);

      // Set pending focus → onEngineStop in GraphView will zoom once simulation settles
      setPendingFocusId(item.id);
    } catch (err) {
      console.error("Navigation failed:", err);
    }
  }

  return (
    <AnimatePresence>
      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
          onClick={close}
        >
          <motion.div
            onClick={(e) => e.stopPropagation()}
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="w-[520px] bg-neutral-900 text-white rounded-xl shadow-xl p-4 border border-white/10"
          >
            {/* Search input */}
            <input
              autoFocus
              placeholder="Search concepts or blogs…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full p-3 rounded-lg bg-neutral-800 outline-none"
            />

            {/* Results */}
            <div className="mt-3 max-h-80 overflow-y-auto">
              {loading && (
                <div className="text-neutral-400 text-sm p-2">
                  Searching…
                </div>
              )}

              {!loading && results.length === 0 && cleanedQuery && (
                <div className="text-neutral-500 text-sm p-2">
                  No results found
                </div>
              )}

              {results.map((item) => (
                <button
                  key={item.id}
                  className="w-full text-left px-3 py-2 hover:bg-neutral-800 rounded-lg transition"
                  onClick={() => handleSelect(item)}
                >
                  <div className="text-white font-semibold">
                    {item.type === "concept" ? item.name : item.title}
                  </div>

                  {item.snippet && (
                    <div className="text-neutral-400 text-sm">
                      {item.snippet}
                    </div>
                  )}

                  <div className="text-xs text-neutral-500 mt-1">
                    {item.type.toUpperCase()}
                  </div>
                </button>
              ))}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}