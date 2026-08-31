function StatisticsPanel({

  elements

}) {

  const relationshipCounts = {};

  elements.edges.forEach((edge) => {

    if (!relationshipCounts[edge.label]) {

      relationshipCounts[edge.label] = 0;
    }

    relationshipCounts[edge.label]++;
  });

  return (

    <div
      style={{

        background: "white",

        padding: "15px",

        borderRadius: "10px",

        marginBottom: "20px",

        border: "1px solid #ddd"
      }}
    >

      <h3
        style={{
          marginTop: 0
        }}
      >
        Graph Statistics
      </h3>

      <p>

        <strong>Total Nodes:</strong>

        {" "}

        {elements.nodes.length}

      </p>

      <p>

        <strong>Total Relationships:</strong>

        {" "}

        {elements.edges.length}

      </p>

      <hr />

      {

        Object.entries(relationshipCounts)

        .map(([relationship, count]) => (

          <p key={relationship}>

            <strong>
              {relationship}
            </strong>

            {" : "}

            {count}

          </p>
        ))
      }

    </div>
  );
}

export default StatisticsPanel;