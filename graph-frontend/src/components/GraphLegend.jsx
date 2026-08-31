function GraphLegend() {

  const items = [

    {
      label: "PARTNER_OF",
      color: "#dc2626"
    },

    {
      label: "EMPLOYED_BY",
      color: "#2563eb"
    },

    {
      label: "PETITIONER_IN",
      color: "#f59e0b"
    },

    {
      label: "RESPONDENT_IN",
      color: "#22c55e"
    }

  ];

  return (

    <div
      style={{
        position: "absolute",
        bottom: 20,
        left: 20,
        background: "white",
        padding: "15px",
        borderRadius: "12px",
        boxShadow: "0 2px 10px rgba(0,0,0,0.15)",
        zIndex: 1000,
        minWidth: "200px"
      }}
    >

      <h3
        style={{
          marginTop: 0,
          marginBottom: "10px"
        }}
      >
        Relationship Legend
      </h3>

      {

        items.map((item, index) => (

          <div

            key={index}

            style={{
              display: "flex",
              alignItems: "center",
              marginBottom: "10px",
              gap: "10px"
            }}
          >

            <div
              style={{
                width: "30px",
                height: "5px",
                background: item.color,
                borderRadius: "4px"
              }}
            />

            <span>
              {item.label}
            </span>

          </div>
        ))
      }

    </div>
  );
}

export default GraphLegend;