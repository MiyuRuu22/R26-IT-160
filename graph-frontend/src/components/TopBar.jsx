function TopBar({

  filters,
  setFilters,

  entity1,
  setEntity1,

  entity2,
  setEntity2,

  findPath,

  entityType,
  setEntityType,

  searchValue,
  setSearchValue,

  loadGraph,

  exportReport

}) {

  return (

    <div
      style={{
        padding: "10px",
        display: "flex",
        gap: "10px",
        background: "white",
        borderBottom: "1px solid #ccc",
        zIndex: 10,
        flexWrap: "wrap"
      }}
    >

      {

        Object.keys(filters).map((type) => (

          <label
            key={type}

            style={{
              display: "flex",
              alignItems: "center",
              gap: "5px"
            }}
          >

            <input

              type="checkbox"

              checked={filters[type]}

              onChange={() => {

                setFilters({

                  ...filters,

                  [type]: !filters[type]

                });
              }}
            />

            {type}

          </label>
        ))
      }

      <input

        placeholder="Entity 1"

        value={entity1}

        onChange={(e) =>
          setEntity1(e.target.value)
        }

        style={{
          padding: "10px"
        }}
      />

      <input

        placeholder="Entity 2"

        value={entity2}

        onChange={(e) =>
          setEntity2(e.target.value)
        }

        style={{
          padding: "10px"
        }}
      />

      <button

        onClick={findPath}

        style={{
          padding: "10px 20px"
        }}
      >

        Find Connection

      </button>

      <select

        value={entityType}

        onChange={(e) =>
          setEntityType(e.target.value)
        }

        style={{
          padding: "10px",
          borderRadius: "6px"
        }}
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

        value={searchValue}

        onChange={(e) =>
          setSearchValue(e.target.value)
        }

        placeholder="Enter Entity Name"

        style={{
          padding: "10px",
          width: "250px"
        }}
      />

      <button

        onClick={loadGraph}

        style={{
          padding: "10px 20px",
          cursor: "pointer"
        }}
      >

        Analyze Connections

      </button>

      <button

        onClick={exportReport}

        style={{
          padding: "10px 20px",
          cursor: "pointer",
          background: "#111827",
          color: "white",
          border: "none",
          borderRadius: "6px"
        }}
      >

        Export Report

      </button>

    </div>
  );
}

export default TopBar;