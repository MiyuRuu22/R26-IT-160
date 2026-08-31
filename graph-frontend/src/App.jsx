import { useEffect, useState } from "react";
import axios from "axios";

import { MarkerType } from "reactflow";

import jsPDF from "jspdf";

import GraphView from "./components/GraphView";
import AlertsPanel from "./components/AlertsPanel";
import RiskPropagationPanel from "./components/RiskPropagationPanel";
import StatisticsPanel from "./components/StatisticsPanel";
import AISummaryPanel from "./components/AISummaryPanel";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

function App() {

  const [entityType, setEntityType] =
    useState("Person");

  const [searchValue, setSearchValue] =
    useState("");

  const [depth, setDepth] =
    useState(2);

  const [elements, setElements] =
    useState({
      nodes: [],
      edges: []
    });

  const [selectedNode, setSelectedNode] =
    useState(null);

  const [alerts, setAlerts] =
    useState([]);

  const [riskPaths, setRiskPaths] =
    useState([]);

  const [aiSummary, setAiSummary] =
    useState("");

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState("");

  const [filters, setFilters] =
    useState({
      Person: true,
      Organization: true,
      Case: true
    });

  const [entity1, setEntity1] =
    useState("");

  const [entity2, setEntity2] =
    useState("");

  // =========================
  // EXPORT REPORT
  // =========================

  const exportReport = () => {

    const doc = new jsPDF();

    doc.setFontSize(22);

    doc.text(
      "Legal Investigation Report",
      20,
      20
    );

    doc.setFontSize(12);

    doc.text(
      `Entity: ${searchValue}`,
      20,
      40
    );

    doc.text(
      `Generated: ${new Date().toLocaleString()}`,
      20,
      50
    );

    let y = 70;

    alerts.forEach((alert, index) => {

      doc.text(
        `${index + 1}. ${alert.title}`,
        20,
        y
      );

      y += 8;

      doc.text(
        `Risk: ${alert.risk}`,
        25,
        y
      );

      y += 8;

      doc.text(
        alert.description,
        25,
        y
      );

      y += 15;
    });

    doc.save(
      `Investigation_${searchValue}.pdf`
    );
  };

  // =========================
  // FILTERS
  // =========================

  const applyFilters = (
    nodes,
    edges
  ) => {

    const filteredNodes = nodes.filter(
      (node) => filters[node.data.type]
    );

    const allowedNodeIds = new Set(
      filteredNodes.map((node) => node.id)
    );

    const filteredEdges = edges.filter(
      (edge) =>
        allowedNodeIds.has(edge.source) &&
        allowedNodeIds.has(edge.target)
    );

    return {
      nodes: filteredNodes,
      edges: filteredEdges
    };
  };

  // =========================
  // LOAD GRAPH
  // =========================

  const loadGraph = async () => {

    if (!searchValue) return;

    try {

      setLoading(true);

      setError("");

      const response =
        await axios.get(

          `${API_BASE_URL}/api/graph/${entityType}/${encodeURIComponent(searchValue)}?depth=${depth}`

        );

      const nodes =
        response.data.nodes.map(
          (node, index) => {

            let background =
              "#22c55e";

            let boxShadow =
              "0 0 12px rgba(34,197,94,0.35)";

            let riskLevel =
              node.riskLevel ||
              node.properties?.riskLevel ||
              "LOW";

            // =========================
            // RISK COLORS
            // =========================

            if (riskLevel === "CRITICAL") {

              background = "#dc2626";

              boxShadow =
                "0 0 22px rgba(220,38,38,0.8)";
            }

            else if (riskLevel === "HIGH") {

              background = "#f97316";

              boxShadow =
                "0 0 18px rgba(249,115,22,0.7)";
            }

            else if (riskLevel === "MEDIUM") {

              background = "#eab308";

              boxShadow =
                "0 0 16px rgba(234,179,8,0.6)";
            }

            else {

              // fallback by type

              if (node.type === "Person") {

                background = "#3b82f6";
              }

              else if (
                node.type === "Organization"
              ) {

                background = "#8b5cf6";
              }

              else if (
                node.type === "Case"
              ) {

                background = "#14b8a6";
              }
            }

            return {

              id: node.id,

              data: {

                label: node.label,

                type: node.type,

                properties:
                  node.properties,
                riskLevel,
                riskScore: node.riskScore,
                distance: node.distance
              },

              position: {

                x: (index % 5) * 220,
                
                y: Math.floor(index / 5) * 140
              },

              style: {

                background,

                boxShadow,

                color: "white",

                borderRadius: "16px",

                padding: 12,

                border:
                  "1px solid rgba(255,255,255,0.08)",

                fontWeight: "bold",

                width: 170,

                textAlign: "center",

                backdropFilter:
                  "blur(10px)"
              }
            };
          }
        );

      const edges =
        response.data.edges.map(
          (edge, index) => {

            let stroke = "#22c55e";
            let strokeWidth = 2;

            if (edge.riskLevel === "CRITICAL") {
              stroke = "#ef4444";
              strokeWidth = 5;
            } else if (edge.riskLevel === "HIGH") {
              stroke = "#f97316";
              strokeWidth = 4;
            } else if (edge.riskLevel === "MEDIUM") {
              stroke = "#facc15";
              strokeWidth = 3;
            }

            return {

              id: edge.id || `e${index}`,

              source: edge.source,

              target: edge.target,

              label: ["PARTNER_OF", "SPOUSE_OF", "SIBLING_OF", "ACCUSED_IN", "INDICTED_IN", "ACQUITTED_IN", "APPEAL_OF"].includes(edge.label)
                ? `${edge.label} · ${edge.hops || 1} hop${edge.hops === 1 ? "" : "s"}`
                : "",

              data: {
                relationshipLabel: `${edge.label} · ${edge.hops || 1} hop${edge.hops === 1 ? "" : "s"}`,
                important: ["PARTNER_OF", "SPOUSE_OF", "SIBLING_OF", "ACCUSED_IN", "INDICTED_IN", "ACQUITTED_IN", "APPEAL_OF"].includes(edge.label)
              },

              markerEnd: ["REPRESENTED_BY", "APPEAL_OF", "INVESTIGATED_BY", "ACCUSED_IN", "INDICTED_IN", "ACQUITTED_IN", "SPOUSE_OF", "SIBLING_OF"].includes(edge.label)
                ? { type: MarkerType.ArrowClosed, color: stroke, width: 14, height: 14 }
                : undefined,

              animated: true,

              type: "smoothstep",

              pathOptions: {
                borderRadius: 18,
                offset: 22
              },

              style: {
                stroke,
                strokeWidth
              },

              labelStyle: {

                fill: "#ffffff",

                fontWeight: 700,

                fontSize: 14
              },

              labelBgStyle: {

                fill: "#111827",

                fillOpacity: 0.9
              },

              labelBgPadding: [8, 4],

              labelBgBorderRadius: 6
            };
          }
        );

      const filtered =
        applyFilters(
          nodes,
          edges
        );

      setElements(filtered);

      if (response.data.nodes.length === 0) {
        setError("No connected entities found for that search.");
      }

      const alertsResponse =
        await axios.get(

          `${API_BASE_URL}/api/alerts?search=${encodeURIComponent(searchValue)}`

        );

      setAlerts(
        alertsResponse.data
      );

      const totalRelationships =
        response.data.edges.length;

      const totalNodes =
        response.data.nodes.length;

      const highRiskEdges =
        response.data.edges.filter(

          (edge) =>

            edge.riskLevel === "HIGH" ||

            edge.riskLevel === "CRITICAL"

        ).length;

      const organizations =
        response.data.nodes

          .filter(
            (n) =>
              n.type === "Organization"
          )

          .map((n) => n.label)

          .join(", ");

      setAiSummary(

        `The investigation identified ${highRiskEdges} high-risk relationship paths involving ${totalNodes} connected entities and ${totalRelationships} legal relationships. Lines become warmer and thicker as relationship risk increases; an indirect path receives a higher score for every additional hop. The analysis revealed organizational exposure linked to ${organizations || "the selected entity"}.`

      );

    } catch (err) {

      console.log(err);

      setError(
        "Failed to load graph"
      );

    } finally {

      setLoading(false);
    }
  };

  // =========================
  // SHORTEST PATH
  // =========================

  const findPath = async () => {

    try {

      setLoading(true);

      const res =
        await axios.get(

          `${API_BASE_URL}/api/shortest-path?entity1=${encodeURIComponent(entity1)}&entity2=${encodeURIComponent(entity2)}`

        );

      const nodes =
        res.data.nodes.map((node, index) => {

          let background = "#22c55e";

          if (node.type === "Person") {

            background = "#ef4444";
          }

          else if (node.type === "Organization") {

            background = "#3b82f6";
          }

          else if (node.type === "Case") {

            background = "#f59e0b";
          }

          return {

            id: node.id,

            data: {

              label: node.label,

              type: node.type,

              properties:
                node.properties || {}
            },

            position: {

              x: index * 220,

              y: 200
            },

            style: {

              background,

              color: "white",

              borderRadius: "16px",

              padding: 12,

              border:
                "1px solid rgba(255,255,255,0.08)",

              fontWeight: "bold",

              width: 170,

              textAlign: "center"
            }
          };
        });

      const edges =
        res.data.edges.map((edge, index) => ({

          id: `p${index}`,

          source: edge.source,

          target: edge.target,

          label: edge.label,

          animated: true,

          style: {

            stroke: "#ffffff",

            strokeWidth: 3
          },

          labelStyle: {

            fill: "#ffffff",

            fontWeight: 700,

            fontSize: 14
          },

          labelBgStyle: {

            fill: "#111827",

            fillOpacity: 0.9
          },

          labelBgPadding: [8, 4],

          labelBgBorderRadius: 6
        }));

      setElements({

        nodes,
        edges
      });

    } catch (err) {

      console.log(err);

    } finally {

      setLoading(false);
    }
  };

  // =========================
  // RISK PROPAGATION
  // =========================

  const analyzeRiskPropagation =
    async () => {

      if (!selectedNode) return;

      try {

        const response =
          await axios.get(

            `${API_BASE_URL}/api/risk-propagation/${encodeURIComponent(selectedNode.data.label)}`

          );

        setRiskPaths(
          response.data
        );

      } catch (error) {

        console.log(error);
      }
    };

  // =========================
  // INITIAL ALERT LOAD
  // =========================



  return (

    <div className="app-container">

      {/* TOPBAR */}

      <div className="topbar">

        <div className="topbar-content">

          <div className="topbar-title">
            Smart Legal Investigation System
          </div>

          <div className="topbar-subtitle">
            Relationship Detector
          </div>

        </div>

      </div>

      <div className="dashboard-controls">

        <div className="control-group">

          <div className="dashboard-title">
            Filters
          </div>

          {
            Object.keys(filters).map((type) => (

              <label
                key={type}
                className="filter-label"
              >

                <input
                  type="checkbox"
                  checked={filters[type]}
                  onChange={() => {

                    setFilters({

                      ...filters,

                      [type]:
                        !filters[type]
                    });
                  }}
                />

                {type}

              </label>
            ))
          }

        </div>

        <div className="control-group">

          <div className="dashboard-title">
            Connection Search
          </div>

          <input
            className="input"
            placeholder="Entity 1"
            value={entity1}
            onChange={(e) =>
              setEntity1(e.target.value)
            }
          />

          <input
            className="input"
            placeholder="Entity 2"
            value={entity2}
            onChange={(e) =>
              setEntity2(e.target.value)
            }
          />

          <button
            className="button secondary-btn"
            onClick={findPath}
          >

            Find Connection

          </button>

        </div>

        <div className="control-group">

          <div className="dashboard-title">
            Investigation
          </div>

          <select
            className="select"
            value={entityType}
            onChange={(e) =>
              setEntityType(
                e.target.value
              )
            }
          >

            <option value="Person">
              Person
            </option>

            <option value="Organization">
              Organization
            </option>

            <option value="Case">
              Case
            </option>

          </select>

          <input
            className="input"
            placeholder="Enter Entity Name"
            value={searchValue}
            onChange={(e) =>
              setSearchValue(
                e.target.value
              )
            }
          />

          <select
            className="select"
            value={depth}
            onChange={(e) => setDepth(Number(e.target.value))}
            aria-label="Network depth"
          >
            <option value={1}>Direct links (1 hop)</option>
            <option value={2}>Nearby network (2 hops)</option>
            <option value={3}>Investigation network (3 hops)</option>
            <option value={4}>Extended network (4 hops)</option>
          </select>

          <button
            className="button primary-btn"
            onClick={loadGraph}
          >

            Analyze Connections

          </button>

        </div>

        <div className="control-group">

          <div className="dashboard-title">
            Selected Node
          </div>

          {

            selectedNode ? (

              <div>

                <div className="selected-node-label">
                  {selectedNode.data.label}
                </div>

                <div className="selected-node-type">
                  {selectedNode.data.type}
                </div>

              </div>

            ) : (

              <div className="empty-node">
                No node selected
              </div>

            )
          }

          <button
            className="button danger-btn"
            onClick={exportReport}
            style={{
              marginTop: "18px"
            }}
          >

            Export Report

          </button>

        </div>

        <AISummaryPanel
          aiSummary={aiSummary}
        />

      </div>

      {/* MAIN */}

      <div className="main-content">

        {/* GRAPH */}

        <div className="graph-container">

          {
            loading && (
              <div
                style={{
                  color: "white",
                  padding: 20
                }}
              >
                Loading analysis...
              </div>
            )
          }

          {
            error && (
              <div
                style={{
                  color: "#ef4444",
                  padding: 20
                }}
              >
                {error}
              </div>
            )
          }

          <GraphView
            elements={elements}
            setElements={setElements}
            setSelectedNode={setSelectedNode}
          />

          <div
            style={{
              position: "absolute",
              bottom: 20,
              left: 20,
              zIndex: 20
            }}
          >

          </div>

        </div>

        {/* RIGHT PANEL */}

        <div className="right-panel">

          <StatisticsPanel
            elements={elements}
          />

          <AlertsPanel
            alerts={alerts}
          />

          <div className="risk-section">

            <div className="risk-header">

              <h3>
                Risk Propagation
              </h3>

              <button
                className="risk-btn"
                onClick={
                  analyzeRiskPropagation
                }
              >

                Analyze

              </button>

            </div>

            <RiskPropagationPanel
              riskPaths={riskPaths}
            />

          </div>

        </div>

      </div>

    </div>
  );
}

export default App;
