from neo4j import GraphDatabase


class RelationshipBuilder:

    def __init__(self, uri, user, password):

        self.driver = GraphDatabase.driver(
            uri,
            auth=(user, password)
        )

    def close(self):

        self.driver.close()

    def build_relationships(self, relationships):

        with self.driver.session() as session:

            for rel in relationships:

                source = rel["source"]
                relationship = rel["relationship"]
                target = rel["target"]

                # Decide target label

                target_label = "Organization"

                query = f"""

                MERGE (a:Person {{name: $source}})

                MERGE (b:{target_label} {{name: $target}})

                MERGE (a)-[:{relationship}]->(b)

                """

                session.run(

                    query,

                    {
                        "source": source,
                        "target": target
                    }
                )

                print(
                    f"Created: {source} -[{relationship}]-> {target}"
                )