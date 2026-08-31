import "../styles/dashboard.css";

function MainLayout({
  sidebar,
  graph,
  rightPanel
}) {
  return (
    <div className="app-container">

      <div className="topbar">
        <div>
          <div className="topbar-title">
            Smart Lawyer Companion
          </div>

          <div className="topbar-subtitle">
            Connection & Risk Detection System
          </div>
        </div>
      </div>

      <div className="dashboard-body">

        <div className="sidebar">
          {sidebar}
        </div>

        <div className="graph-area">
          {graph}
        </div>

        <div className="right-panel">
          {rightPanel}
        </div>

      </div>
    </div>
  );
}

export default MainLayout;