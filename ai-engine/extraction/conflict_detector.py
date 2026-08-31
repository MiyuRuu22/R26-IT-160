from extraction.neo4j_config import DATABASE, driver


def detect_repeat_respondents():

    with driver.session(database=DATABASE) as session:

        result = session.run("""

        MATCH (p:Person)-[:RESPONDENT_IN]->(c:Case)

        WITH p, count(c) AS case_count

        WHERE case_count > 1

        RETURN
        p.name AS person,
        case_count

        ORDER BY case_count DESC

        """)

        findings = []

        for record in result:

            findings.append({

                "person":
                    record["person"],

                "case_count":
                    record["case_count"],

                "risk":
                    "HIGH"
            })

        return findings


def detect_shared_organizations():

    with driver.session(database=DATABASE) as session:

        result = session.run("""

        MATCH (o:Organization)-[:PETITIONER_IN]->(c:Case)

        WITH o, count(c) AS total_cases

        WHERE total_cases > 1

        RETURN
        o.name AS organization,
        total_cases

        ORDER BY total_cases DESC

        """)

        findings = []

        for record in result:

            findings.append({

                "organization":
                    record["organization"],

                "total_cases":
                    record["total_cases"],

                "risk":
                    "MEDIUM"
            })

        return findings

def calculate_risk_scores():

    with driver.session(database=DATABASE) as session:

        result = session.run("""

        MATCH (p:Person)

        OPTIONAL MATCH (p)-[:RESPONDENT_IN]->(c:Case)

        WITH p, count(c) AS case_count

        RETURN
        p.name AS person,
        case_count

        ORDER BY case_count DESC

        """)

        findings = []

        for record in result:

            score = 0

            case_count = record["case_count"]

            if case_count >= 5:
                score += 70

            elif case_count >= 3:
                score += 50

            elif case_count >= 2:
                score += 30

            if score >= 70:
                risk = "HIGH"

            elif score >= 40:
                risk = "MEDIUM"

            else:
                risk = "LOW"

            findings.append({

                "person":
                    record["person"],

                "case_count":
                    case_count,

                "score":
                    score,

                "risk":
                    risk
            })

        return findings

def calculate_entity_centrality():

    with driver.session(database=DATABASE) as session:

        result = session.run("""

        MATCH (n)

        OPTIONAL MATCH (n)-[r]-()

        WITH n, count(r) AS connections

        RETURN
        labels(n)[0] AS type,
        n.name AS name,
        n.case_number AS case_number,
        connections

        ORDER BY connections DESC

        LIMIT 20

        """)

        findings = []

        for record in result:

            entity_name = (
                record["name"]
                if record["name"]
                else record["case_number"]
            )

            findings.append({

                "entity":
                    entity_name,

                "type":
                    record["type"],

                "connections":
                    record["connections"]
            })

        return findings

def find_shortest_connection(entity1, entity2):

    with driver.session(database=DATABASE) as session:

        result = session.run("""

        MATCH (start {name:$entity1}),
              (end {name:$entity2})

        MATCH path =
        shortestPath((start)-[*]-(end))

        RETURN path

        """,
        entity1=entity1,
        entity2=entity2
        )

        findings = []

        for record in result:

            path = record["path"]

            nodes = []

            for node in path.nodes:

                node_name = (
                    node.get("name")
                    if node.get("name")
                    else node.get("case_number")
                )

                nodes.append(node_name)

            findings.append(nodes)

        return findings

def detect_hidden_connections():

    with driver.session(database=DATABASE) as session:

        result = session.run("""

        MATCH
        (p1:Person)-[]->(o:Organization)<-[]-(p2:Person)

        WHERE p1.name <> p2.name

        RETURN

        p1.name AS person1,
        p2.name AS person2,
        o.name AS organization

        LIMIT 50

        """)

        findings = []

        for record in result:

            findings.append({

                "person1":
                    record["person1"],

                "person2":
                    record["person2"],

                "shared_organization":
                    record["organization"],

                "risk":
                    "MEDIUM"
            })

        return findings
