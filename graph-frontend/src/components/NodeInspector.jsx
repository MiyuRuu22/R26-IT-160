function NodeInspector({ selectedNode }) {

  if (!selectedNode) {

    return (

      <div className="card">

        <div className="card-title">
          Node Inspector
        </div>

        <p
          style={{
            color: "#94a3b8",
            lineHeight: 1.6
          }}
        >
          Click a node to inspect
        </p>

      </div>
    );
  }

  return (

    <div className="card">

      <div className="card-title">
        Selected Node
      </div>

      <div className="property">

        <strong>Name:</strong>

        <div
          style={{
            marginTop: "4px",
            wordBreak: "break-word",
            overflowWrap: "break-word"
          }}
        >
          {selectedNode.data.label}
        </div>

      </div>

      <div className="property">

        <strong>Type:</strong>

        <div
          style={{
            marginTop: "4px"
          }}
        >
          {selectedNode.data.type}
        </div>

      </div>

      <div
        className="card-title"
        style={{
          marginTop: "18px",
          fontSize: "15px"
        }}
      >
        Properties
      </div>

      {

        Object.entries(
          selectedNode.data.properties
        ).map(([key, value]) => (

          <div
            key={key}
            className="property"
            style={{
              marginBottom: "14px"
            }}
          >

            <strong>
              {key}:
            </strong>

            <div
              style={{
                marginTop: "4px",
                wordBreak: "break-word",
                overflowWrap: "break-word",
                lineHeight: 1.5
              }}
            >
              {String(value)}
            </div>

          </div>
        ))
      }

    </div>
  );
}

export default NodeInspector;