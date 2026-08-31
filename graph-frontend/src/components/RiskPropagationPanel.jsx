function RiskPropagationPanel({ riskPaths }) {

  return (

    <div>

      <h3
        style={{
          marginTop: "30px"
        }}
      >
        Risk Propagation
      </h3>

      {

        riskPaths.map((path, index) => (

          <div

            key={index}

            style={{

              padding: "12px",

              marginBottom: "15px",

              borderRadius: "10px",

              background:

                path.level === "CRITICAL"
                  ? "#dc2626"

                : path.level === "HIGH"
                  ? "#f97316"

                : path.level === "MEDIUM"
                  ? "#fde68a"

                : "#bbf7d0",

              color:
                path.level === "MEDIUM"
                  ? "black"
                  : "white"
            }}
          >

            <strong>
              {path.level}
            </strong>

            <p>
              Total Risk:
              {" "}
              {path.totalRisk}
            </p>

            {

              path.explanation.map((step, i) => (

                <div key={i}>

                  <p>

                    {step.from}

                    {" "}
                    →

                    {" "}
                    {step.relationship}

                    {" "}
                    →

                    {" "}
                    {step.to}

                  </p>

                </div>
              ))
            }

          </div>
        ))
      }

    </div>
  );
}

export default RiskPropagationPanel;