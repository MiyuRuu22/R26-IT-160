function AISummaryPanel({

  aiSummary

}) {

  return (

    <div className="card">

      <div className="card-title">

        🧠 AI Investigation Summary

      </div>

      {

        aiSummary ? (

          <div className="ai-summary-text">

            “{aiSummary}”

          </div>

        ) : (

          <div className="empty-node">

            Run an investigation to generate
            AI intelligence summary.

          </div>

        )
      }

    </div>
  );
}

export default AISummaryPanel;