"use client"

import ForceGraph2D from "react-force-graph-2d"
import type { ForceGraphMethods, NodeObject, LinkObject } from "react-force-graph-2d"

import { useRef, useEffect, useState } from "react"
import { forceX, forceY, forceRadial } from "d3-force"

import { useGraphStore } from "../state/graphStore"
import type { GraphNode, GraphData } from "../types/graph"
import { useUIStore } from "../state/uiStore"
import { fetchConceptGraph } from "../api/graph"

interface GraphLink {
    source: string
    target: string
}

export default function GraphView() {
    const fgRef = useRef<ForceGraphMethods<NodeObject<GraphNode>, LinkObject<GraphNode, GraphLink>>>(null!)

    const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null)
    const [isDragging, setIsDragging] = useState(false)
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const [zoomTransition, setZoomTransition] = useState(false)
    const [animationTime, setAnimationTime] = useState(0)

    const {
        graphData,
        selectedNodeId,
        highlightNodeId,
        pendingFocusId,
        setSelectedNode,
        setHighlightNode,
        pushGraphHistory,
        setGraphData,
    } = useGraphStore()

    const openBlogModal = useUIStore((s) => s.openBlogModal)

    useEffect(() => {
        let animationId: number
        const animate = () => {
            setAnimationTime(Date.now() * 0.001)
            animationId = requestAnimationFrame(animate)
        }
        animationId = requestAnimationFrame(animate)
        return () => cancelAnimationFrame(animationId)
    }, [])

    useEffect(() => {
        if (!fgRef.current || !graphData) return

        fgRef.current.d3Force(
            "concept-x",
            forceX<NodeObject<GraphNode>>(0).strength((n) => (n.type === "concept" ? 0.4 : 0)),
        )

        fgRef.current.d3Force(
            "concept-y",
            forceY<NodeObject<GraphNode>>(0).strength((n) => (n.type === "concept" ? 0.4 : 0)),
        )

        fgRef.current.d3Force(
            "blog-orbit",
            forceRadial<NodeObject<GraphNode>>(320, 0, 0).strength((n) => (n.type === "blog" ? 0.95 : 0)),
        )

        fgRef.current.d3Force("charge")?.strength(-2000)

        fgRef.current.d3Force("link")?.distance((link: LinkObject<NodeObject<GraphNode>, GraphLink>) => {
            const sourceNode = link.source as NodeObject<GraphNode>
            return sourceNode.type === "concept" ? 180 : 130
        })
    }, [graphData])

    useEffect(() => {
        if (!graphData || !selectedNodeId || !fgRef.current) return

        const node = graphData.nodes.find((n) => n.id === selectedNodeId)
        if (!node?.x || !node?.y) return

        queueMicrotask(() => {
            setZoomTransition(true)
        })

        fgRef.current.centerAt(node.x, node.y, 800)
        fgRef.current.zoom(1.6, 800)

        setHighlightNode(node.id)

        setTimeout(() => setZoomTransition(false), 800)

        const t = setTimeout(() => setHighlightNode(null), 1500)
        return () => clearTimeout(t)
    }, [selectedNodeId, graphData, setHighlightNode])

    if (!graphData) return null

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
            backgroundColor="transparent"
            nodeRelSize={10}
            linkWidth={2}
            linkDirectionalParticles={2}
            linkDirectionalParticleSpeed={0.004}
            linkDirectionalParticleWidth={2}
            linkCurvature={0.15}
            enableNodeDrag={true}
            onNodeDrag={() => setIsDragging(true)}
            onNodeDragEnd={() => setIsDragging(false)}
            onEngineStop={() => {
                if (!pendingFocusId) return

                const node = graphData.nodes.find((n) => n.id === pendingFocusId)
                if (!node || !node.x || !node.y) return

                fgRef.current.centerAt(node.x, node.y, 800)
                fgRef.current.zoom(1.6, 800)

                setSelectedNode(pendingFocusId)
                setHighlightNode(pendingFocusId)
                setZoomTransition(true)

                setTimeout(() => {
                    setHighlightNode(null)
                    setZoomTransition(false)
                }, 1500)

                // Defer state clear to avoid synchronous update warning
                queueMicrotask(() => {
                    useGraphStore.setState({ pendingFocusId: null })
                })
            }}
            nodeCanvasObject={(node, ctx, globalScale) => {
                if (node.x == null || node.y == null) return

                const gnode = node as GraphNode
                const label = gnode.title ?? ""
                const fontSize = Math.max(12 / globalScale, 8)

                const isSelected = gnode.id === selectedNodeId
                const isHighlighted = gnode.id === highlightNodeId
                const isHovered = gnode.id === hoveredNodeId
                const isConcept = gnode.type === "concept"

                const baseRadius = isConcept ? 14 : 10
                const hoverScale = isHovered ? 1.15 : 1
                const selectScale = isSelected ? 1.2 : 1
                const pulseScale = isHighlighted ? 1 + Math.sin(animationTime * 4) * 0.08 : 1
                const finalRadius = baseRadius * hoverScale * selectScale * pulseScale

                // Subtle outer ring for selected/highlighted
                if (isSelected || isHighlighted) {
                    ctx.beginPath()
                    ctx.arc(node.x, node.y, finalRadius + 8, 0, Math.PI * 2)
                    ctx.strokeStyle = isConcept
                        ? `rgba(255, 255, 255, ${0.15 + Math.sin(animationTime * 3) * 0.1})`
                        : `rgba(232, 121, 102, ${0.2 + Math.sin(animationTime * 3) * 0.1})`
                    ctx.lineWidth = 1
                    ctx.stroke()
                }

                // Subtle glow for hovered/selected
                if (isHovered || isSelected) {
                    ctx.shadowColor = isConcept ? "rgba(255, 255, 255, 0.4)" : "rgba(232, 121, 102, 0.5)"
                    ctx.shadowBlur = 20
                } else {
                    ctx.shadowColor = isConcept ? "rgba(255, 255, 255, 0.15)" : "rgba(232, 121, 102, 0.2)"
                    ctx.shadowBlur = 10
                }

                // Main node circle
                ctx.beginPath()
                ctx.arc(node.x, node.y, finalRadius, 0, Math.PI * 2)

                if (isConcept) {
                    const nodeGradient = ctx.createRadialGradient(
                        node.x - finalRadius * 0.3,
                        node.y - finalRadius * 0.3,
                        0,
                        node.x,
                        node.y,
                        finalRadius,
                    )
                    if (isSelected || isHovered) {
                        nodeGradient.addColorStop(0, "#ffffff")
                        nodeGradient.addColorStop(1, "#d0d0d0")
                    } else {
                        nodeGradient.addColorStop(0, "#e8e8e8")
                        nodeGradient.addColorStop(1, "#a0a0a0")
                    }
                    ctx.fillStyle = nodeGradient
                } else {
                    const nodeGradient = ctx.createRadialGradient(
                        node.x - finalRadius * 0.3,
                        node.y - finalRadius * 0.3,
                        0,
                        node.x,
                        node.y,
                        finalRadius,
                    )
                    if (isSelected || isHovered) {
                        nodeGradient.addColorStop(0, "#f09080")
                        nodeGradient.addColorStop(1, "#e87966")
                    } else {
                        nodeGradient.addColorStop(0, "#e87966")
                        nodeGradient.addColorStop(1, "#c45a48")
                    }
                    ctx.fillStyle = nodeGradient
                }

                ctx.fill()
                ctx.shadowBlur = 0

                // Inner highlight for 3D effect
                ctx.beginPath()
                ctx.arc(node.x - finalRadius * 0.25, node.y - finalRadius * 0.3, finalRadius * 0.3, 0, Math.PI * 2)
                const highlightGradient = ctx.createRadialGradient(
                    node.x - finalRadius * 0.25,
                    node.y - finalRadius * 0.3,
                    0,
                    node.x - finalRadius * 0.25,
                    node.y - finalRadius * 0.3,
                    finalRadius * 0.3,
                )
                highlightGradient.addColorStop(0, "rgba(255, 255, 255, 0.6)")
                highlightGradient.addColorStop(1, "rgba(255, 255, 255, 0)")
                ctx.fillStyle = highlightGradient
                ctx.fill()

                // Label - clean and minimal
                if (!isDragging || isHovered) {
                    const padding = 10
                    ctx.font = `${isSelected || isHovered ? "500" : "400"} ${fontSize}px "Geist", -apple-system, sans-serif`
                    const textMetrics = ctx.measureText(label)
                    const textWidth = textMetrics.width
                    const textHeight = fontSize * 1.2

                    const bgX = node.x - textWidth / 2 - padding / 2
                    const bgY = node.y + finalRadius + 12
                    const bgWidth = textWidth + padding
                    const bgHeight = textHeight + padding * 0.8
                    const borderRadius = 4

                    ctx.fillStyle = isHovered || isSelected ? "rgba(0, 0, 0, 0.85)" : "rgba(0, 0, 0, 0.6)"
                    ctx.beginPath()
                    ctx.roundRect(bgX, bgY, bgWidth, bgHeight, borderRadius)
                    ctx.fill()

                    ctx.strokeStyle = isConcept
                        ? `rgba(255, 255, 255, ${isHovered || isSelected ? 0.3 : 0.1})`
                        : `rgba(232, 121, 102, ${isHovered || isSelected ? 0.4 : 0.15})`
                    ctx.lineWidth = 0.5
                    ctx.stroke()

                    ctx.fillStyle = isHovered || isSelected ? "#ffffff" : "rgba(255, 255, 255, 0.8)"
                    ctx.textAlign = "center"
                    ctx.textBaseline = "middle"
                    ctx.fillText(label, node.x, bgY + bgHeight / 2)
                }
            }}
            linkCanvasObject={(link, ctx) => {
                const sourceNode = link.source as NodeObject<GraphNode>
                const targetNode = link.target as NodeObject<GraphNode>

                if (!sourceNode.x || !sourceNode.y || !targetNode.x || !targetNode.y) return

                const isSourceSelected = (sourceNode as GraphNode).id === selectedNodeId
                const isTargetSelected = (targetNode as GraphNode).id === selectedNodeId
                const isSourceHovered = (sourceNode as GraphNode).id === hoveredNodeId
                const isTargetHovered = (targetNode as GraphNode).id === hoveredNodeId

                const isConnected = isSourceSelected || isTargetSelected || isSourceHovered || isTargetHovered

                ctx.beginPath()
                ctx.moveTo(sourceNode.x, sourceNode.y)
                ctx.lineTo(targetNode.x, targetNode.y)

                if (isConnected) {
                    ctx.strokeStyle = "rgba(255, 255, 255, 0.4)"
                    ctx.lineWidth = 1.5
                    ctx.shadowColor = "rgba(255, 255, 255, 0.3)"
                    ctx.shadowBlur = 8
                } else {
                    ctx.strokeStyle = "rgba(255, 255, 255, 0.08)"
                    ctx.lineWidth = 1
                }

                ctx.stroke()
                ctx.shadowBlur = 0
            }}
            onNodeHover={(node) => {
                setHoveredNodeId(node ? (node as GraphNode).id : null)

                const refWithRenderer = fgRef.current as ForceGraphMethods<
                    NodeObject<GraphNode>,
                    LinkObject<GraphNode, GraphLink>
                > & {
                    renderer: () => { domElement: HTMLCanvasElement }
                }
                if (refWithRenderer.renderer) {
                    const canvas = refWithRenderer.renderer().domElement as HTMLCanvasElement
                    canvas.style.cursor = node ? "pointer" : "grab"
                }
            }}
            onNodeClick={async (node) => {
                const gnode = node as GraphNode
                const id = gnode.id

                setSelectedNode(id)

                if (gnode.type === "blog") {
                    await new Promise((r) => setTimeout(r, 600))
                    openBlogModal(id)
                    return
                }

                if (gnode.type === "concept") {
                    pushGraphHistory(graphData as GraphData)

                    fgRef.current?.zoom(0.4, 500)

                    try {
                        const expanded = await fetchConceptGraph(id)
                        setGraphData(expanded)
                    } catch (err) {
                        console.error("Failed to load concept graph:", err)
                    }
                }
            }}
        />
    )
}