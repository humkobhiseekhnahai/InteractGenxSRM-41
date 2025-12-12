// src/components/GraphView.tsx

import ForceGraph2D from "react-force-graph-2d";
import type {
    ForceGraphMethods,
    NodeObject,
    LinkObject,
} from "react-force-graph-2d";

import { useRef, useEffect, useState } from "react";
import { forceX, forceY, forceRadial } from "d3-force";

import { useGraphStore } from "../state/graphStore";
import type { GraphNode, GraphData } from "../types/graph";
import { useUIStore } from "../state/uiStore";
import { fetchConceptGraph } from "../api/graph";

interface GraphLink {
    source: string;
    target: string;
}

export default function GraphView() {
    const fgRef = useRef<
        ForceGraphMethods<NodeObject<GraphNode>, LinkObject<GraphNode, GraphLink>>
    >(null!);

    const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);
    const [isDragging, setIsDragging] = useState(false);
    const [zoomTransition, setZoomTransition] = useState(false);

    const {
        graphData,
        selectedNodeId,
        highlightNodeId,
        pendingFocusId,  // ← NEW: from store for delayed focus after graph load
        setSelectedNode,
        setHighlightNode,
        pushGraphHistory,
        setGraphData,
    } = useGraphStore();

    const openBlogModal = useUIStore((s) => s.openBlogModal);

    /* --------------------------------------------------------
       SEMANTIC FORCE LAYOUT
    -------------------------------------------------------- */
    useEffect(() => {
        if (!fgRef.current || !graphData) return;

        fgRef.current.d3Force(
            "concept-x",
            forceX<NodeObject<GraphNode>>(0).strength((n) => (n.type === "concept" ? 0.4 : 0))
        );

        fgRef.current.d3Force(
            "concept-y",
            forceY<NodeObject<GraphNode>>(0).strength((n) => (n.type === "concept" ? 0.4 : 0))
        );

        fgRef.current.d3Force(
            "blog-orbit",
            forceRadial<NodeObject<GraphNode>>(320, 0, 0).strength((n) =>
                n.type === "blog" ? 0.95 : 0
            )
        );

        fgRef.current.d3Force("charge")?.strength(-2000);

        fgRef.current.d3Force("link")?.distance((link: LinkObject<NodeObject<GraphNode>, GraphLink>) => {
            const sourceNode = link.source as NodeObject<GraphNode>;
            return sourceNode.type === "concept" ? 180 : 130;
        });
    }, [graphData]);

    /* --------------------------------------------------------
       IMMEDIATE Zoom + highlight on selection (for nodes already in graph)
    -------------------------------------------------------- */
    useEffect(() => {
        if (!graphData || !selectedNodeId || !fgRef.current) return;

        const node = graphData.nodes.find((n) => n.id === selectedNodeId);
        if (!node?.x || !node?.y) return;

        setZoomTransition(true);
        
        fgRef.current.centerAt(node.x, node.y, 1000);
        fgRef.current.zoom(2.2, 1000);

        setHighlightNode(node.id);
        
        setTimeout(() => setZoomTransition(false), 1000);
        
        const t = setTimeout(() => setHighlightNode(null), 2000);
        return () => clearTimeout(t);
    }, [selectedNodeId, graphData.nodes, setHighlightNode]);

    if (!graphData) return null;

    return (
        <ForceGraph2D<GraphNode, GraphLink>
            ref={fgRef}
            graphData={graphData}
            nodeId="id"
            nodeLabel="title"
            linkSource="source"
            linkTarget="target"
            minZoom={0.2}
            maxZoom={8}
            cooldownTicks={180}
            d3VelocityDecay={0.35}
            backgroundColor="#000000"
            nodeRelSize={10}
            linkWidth={3}
            linkDirectionalParticles={4}
            linkDirectionalParticleSpeed={0.008}
            linkDirectionalParticleWidth={3.5}
            linkCurvature={0.3}
            enableNodeDrag={true}
            onNodeDragStart={() => setIsDragging(true)}
            onNodeDragEnd={() => setIsDragging(false)}

            /* --------------------------------------------------------
               NEW: Handle delayed focus after graph load/simulation settles
            -------------------------------------------------------- */
            onEngineStop={() => {
                if (!pendingFocusId) return;

                const node = graphData.nodes.find((n) => n.id === pendingFocusId);
                if (!node || !node.x || !node.y) return;

                // Zoom to focused node once positions are settled
                fgRef.current.centerAt(node.x, node.y, 1000);
                fgRef.current.zoom(2.2, 1000);

                setSelectedNode(pendingFocusId);
                setHighlightNode(pendingFocusId);
                setZoomTransition(true);

                setTimeout(() => {
                    setHighlightNode(null);
                    setZoomTransition(false);
                }, 2000);

                // Clear pending
                useGraphStore.setState({ pendingFocusId: null });
            }}

            nodeCanvasObject={(node, ctx, globalScale) => {
                if (node.x == null || node.y == null) return;
                
                const gnode = node as GraphNode;
                const label = gnode.title ?? "";
                const fontSize = Math.max(15 / globalScale, 10);
                
                const isSelected = gnode.id === selectedNodeId;
                const isHighlighted = gnode.id === highlightNodeId;
                const isHovered = gnode.id === hoveredNodeId;
                const isConcept = gnode.type === "concept";
                
                const baseRadius = 11;
                const hoverScale = isHovered ? 1.15 : 1;
                const selectScale = isSelected ? 1.25 : 1;
                const finalRadius = baseRadius * hoverScale * selectScale;

                // Diving animation - expanding circle effect
                if (isHighlighted && zoomTransition) {
                    const pulseRadius = finalRadius + 40;
                    ctx.beginPath();
                    ctx.arc(node.x, node.y, pulseRadius, 0, Math.PI * 2);
                    const expandGradient = ctx.createRadialGradient(
                        node.x, node.y, 0,
                        node.x, node.y, pulseRadius
                    );
                    expandGradient.addColorStop(0, isConcept ? "rgba(255, 215, 0, 0.4)" : "rgba(255, 107, 107, 0.4)");
                    expandGradient.addColorStop(0.6, isConcept ? "rgba(255, 215, 0, 0.15)" : "rgba(255, 107, 107, 0.15)");
                    expandGradient.addColorStop(1, "rgba(0, 0, 0, 0)");
                    ctx.fillStyle = expandGradient;
                    ctx.fill();
                }

                // Soft outer glow for selected/hovered nodes
                if (isHighlighted || isHovered || isSelected) {
                    ctx.beginPath();
                    ctx.arc(node.x, node.y, finalRadius + 20, 0, Math.PI * 2);
                    const outerGlow = ctx.createRadialGradient(
                        node.x, node.y, 0,
                        node.x, node.y, finalRadius + 20
                    );
                    if (isConcept) {
                        outerGlow.addColorStop(0, "rgba(255, 223, 0, 0.3)");
                        outerGlow.addColorStop(0.5, "rgba(255, 215, 0, 0.15)");
                        outerGlow.addColorStop(1, "rgba(255, 200, 0, 0)");
                    } else {
                        outerGlow.addColorStop(0, "rgba(255, 107, 107, 0.3)");
                        outerGlow.addColorStop(0.5, "rgba(255, 99, 99, 0.15)");
                        outerGlow.addColorStop(1, "rgba(255, 80, 80, 0)");
                    }
                    ctx.fillStyle = outerGlow;
                    ctx.fill();
                }

                // Elegant outer ring for selected nodes
                if (isSelected) {
                    ctx.beginPath();
                    ctx.arc(node.x, node.y, finalRadius + 5, 0, Math.PI * 2);
                    ctx.strokeStyle = isConcept ? "rgba(255, 215, 0, 0.7)" : "rgba(255, 107, 107, 0.7)";
                    ctx.lineWidth = 2;
                    ctx.stroke();
                }

                // Subtle shadow
                ctx.shadowColor = isConcept ? "rgba(255, 215, 0, 0.5)" : "rgba(255, 107, 107, 0.5)";
                ctx.shadowBlur = isSelected || isHovered ? 20 : 12;

                // Main node circle - clean and professional
                ctx.beginPath();
                ctx.arc(node.x, node.y, finalRadius, 0, Math.PI * 2);

                if (isConcept) {
                    if (isSelected || isHovered) {
                        ctx.fillStyle = "#e5e5e5"; // Light gray
                    } else {
                        ctx.fillStyle = "#d4d4d4"; // Gray
                    }
                } else {
                    if (isSelected || isHovered) {
                        ctx.fillStyle = "#a3a3a3"; // Medium gray
                    } else {
                        ctx.fillStyle = "#8b8b8b"; // Dark gray
                    }
                }

                ctx.fill();

                // Inner subtle highlight
                ctx.beginPath();
                ctx.arc(
                    node.x - finalRadius * 0.3,
                    node.y - finalRadius * 0.3,
                    finalRadius * 0.4,
                    0,
                    Math.PI * 2
                );
                ctx.fillStyle = "rgba(255, 255, 255, 0.3)";
                ctx.fill();

                ctx.shadowBlur = 0;

                // Clean label with proper centering
                if (!isDragging || isHovered) {
                    const padding = 12;
                    const textMetrics = ctx.measureText(label);
                    const textWidth = textMetrics.width;
                    const textHeight = fontSize * 1.4;

                    const bgX = node.x - textWidth / 2 - padding / 2;
                    const bgY = node.y + finalRadius + 18;
                    const bgWidth = textWidth + padding;
                    const bgHeight = textHeight + padding;

                    // Modern card-style background
                    ctx.fillStyle = "rgba(20, 20, 20, 0.9)";
                    ctx.beginPath();
                    ctx.roundRect(bgX, bgY, bgWidth, bgHeight, 8);
                    ctx.fill();

                    // Subtle border
                    const borderColor = isConcept 
                        ? (isSelected || isHovered ? "rgba(255, 215, 0, 0.6)" : "rgba(255, 215, 0, 0.4)")
                        : (isSelected || isHovered ? "rgba(255, 107, 107, 0.6)" : "rgba(255, 107, 107, 0.4)");
                    
                    ctx.strokeStyle = borderColor;
                    ctx.lineWidth = 1;
                    ctx.stroke();

                    // Centered text
                    ctx.fillStyle = "#ffffff";
                    ctx.font = `${isSelected || isHovered ? '600' : '500'} ${fontSize}px -apple-system, BlinkMacSystemFont, 'SF Pro Display', Inter, sans-serif`;
                    ctx.textAlign = "center";
                    ctx.textBaseline = "middle";
                    
                    ctx.fillText(label, node.x, bgY + bgHeight / 2);
                }
            }}
            linkCanvasObject={(link, ctx) => {
                const sourceNode = link.source as NodeObject<GraphNode>;
                const targetNode = link.target as NodeObject<GraphNode>;
               
                if (!sourceNode.x || !sourceNode.y || !targetNode.x || !targetNode.y) return;

                const isSourceSelected = (sourceNode as GraphNode).id === selectedNodeId;
                const isTargetSelected = (targetNode as GraphNode).id === selectedNodeId;
                const isSourceHovered = (sourceNode as GraphNode).id === hoveredNodeId;
                const isTargetHovered = (targetNode as GraphNode).id === hoveredNodeId;
                
                const isConnected = isSourceSelected || isTargetSelected || isSourceHovered || isTargetHovered;

                ctx.beginPath();
                ctx.moveTo(sourceNode.x, sourceNode.y);
                ctx.lineTo(targetNode.x, targetNode.y);

                if (isConnected) {
                    const gradient = ctx.createLinearGradient(
                        sourceNode.x, sourceNode.y,
                        targetNode.x, targetNode.y
                    );
                    gradient.addColorStop(0, "rgba(255, 215, 0, 0.7)");
                    gradient.addColorStop(0.5, "rgba(255, 165, 0, 0.7)");
                    gradient.addColorStop(1, "rgba(255, 107, 107, 0.7)");
                    
                    ctx.strokeStyle = gradient;
                    ctx.lineWidth = 3.5;
                    ctx.shadowColor = "rgba(255, 165, 0, 0.5)";
                    ctx.shadowBlur = 12;
                    ctx.stroke();
                } else {
                    const gradient = ctx.createLinearGradient(
                        sourceNode.x, sourceNode.y,
                        targetNode.x, targetNode.y
                    );
                    gradient.addColorStop(0, "rgba(255, 215, 0, 0.15)");
                    gradient.addColorStop(0.5, "rgba(255, 165, 0, 0.1)");
                    gradient.addColorStop(1, "rgba(255, 107, 107, 0.15)");
                    
                    ctx.strokeStyle = gradient;
                    ctx.lineWidth = 2;
                    ctx.shadowColor = "rgba(255, 165, 0, 0.2)";
                    ctx.shadowBlur = 6;
                }

                ctx.stroke();
                ctx.shadowBlur = 0;
            }}
            onNodeHover={(node) => {
                setHoveredNodeId(node ? (node as GraphNode).id : null);
                
                const refWithRenderer = fgRef.current as ForceGraphMethods<NodeObject<GraphNode>, LinkObject<GraphNode, GraphLink>> & {
                    renderer: () => { domElement: HTMLCanvasElement };
                };
                if (refWithRenderer.renderer) {
                    const canvas = refWithRenderer.renderer().domElement as HTMLCanvasElement;
                    canvas.style.cursor = node ? "pointer" : "grab";
                }
            }}
            onNodeClick={async (node) => {
                const gnode = node as GraphNode;
                const id = gnode.id;
                
                setSelectedNode(id);

                if (gnode.type === "blog") {
                    await new Promise((r) => setTimeout(r, 900));
                    openBlogModal(id);
                    return;
                }

                if (gnode.type === "concept") {
                    pushGraphHistory(graphData as GraphData);
                    
                    // "Diving in" animation
                    fgRef.current?.zoom(0.3, 400);

                    try {
                        const expanded = await fetchConceptGraph(id);
                        setGraphData(expanded);
                        // ← pendingFocusId will be set externally (from palette or click), onEngineStop handles zoom
                    } catch (err) {
                        console.error("Failed to load concept graph:", err);
                    }
                }
            }}
        />
    );
}