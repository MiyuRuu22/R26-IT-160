function AlertsPanel({ alerts }) {

  return (

    <div>

      <h3
        style={{
          marginTop: "30px"
        }}
      >
        Risk Alerts
      </h3>

      {

        alerts.map((alert, index) => (

          <div
            key={index}

            style={{
              padding: "12px",

              marginBottom: "12px",

              background:

                alert.risk === "CRITICAL"
                  ? "#dc2626"

                : alert.risk === "HIGH"
                  ? "#fee2e2"

                : alert.risk === "MEDIUM"
                  ? "#fef3c7"

                : "#dcfce7",

              color:
                alert.risk === "CRITICAL"
                  ? "white"
                  : "black",

              borderRadius: "10px"
            }}
          >

            <strong>
              {alert.title}
            </strong>

            <p>
              {alert.description}
            </p>

            <p>

              <strong>
                Risk:
              </strong>

              {" "}
              {alert.risk}

            </p>

            <p>

              <strong>
                Risk Score:
              </strong>

              {" "}
              {alert.riskScore}

            </p>

          </div>
        ))
      }

    </div>
  );
}

export default AlertsPanel;