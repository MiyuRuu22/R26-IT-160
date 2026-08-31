from extraction.neo4j_config import DATABASE, driver


def create_case(tx, case):

    if not case.get("case_number"):
        print("Skipped case with missing case_number")
        return

    tx.run("""
    
    MERGE (c:Case {case_number:$case_number})
    
    SET c.judge = $judge
    
    """,
    case_number=case["case_number"],
    judge=case["judge"]
    )


def create_person(tx, name):

    tx.run("""
    
    MERGE (p:Person {name:$name})
    
    """, name=name)


def link_person_case(tx, name, case_number):

    tx.run("""
    
    MATCH (p:Person {name:$name})
    MATCH (c:Case {case_number:$case_number})
    
    MERGE (p)-[:MENTIONED_IN]->(c)
    
    """,
    name=name,
    case_number=case_number
    )

def create_petitioner(tx, petitioner, case_number):

    tx.run("""
    
    MERGE (p:Person {name:$petitioner})
    
    WITH p
    
    MATCH (c:Case {case_number:$case_number})
    
    MERGE (p)-[:PETITIONER_IN]->(c)
    
    """,
    petitioner=petitioner,
    case_number=case_number
    )

def create_respondent(tx, respondent, case_number):

    tx.run("""
    
    MERGE (r:Organization {name:$respondent})
    
    WITH r
    
    MATCH (c:Case {case_number:$case_number})
    
    MERGE (r)-[:RESPONDENT_IN]->(c)
    
    """,
    respondent=respondent,
    case_number=case_number
    )

def load_case(case):

    with driver.session(database=DATABASE) as session:

        session.execute_write(create_case, case)

        if case["petitioner"]:

            session.execute_write(
                create_petitioner,
                case["petitioner"],
                case["case_number"]
            )


        for respondent in case["respondents"]:

            session.execute_write(
                create_respondent,
                respondent,
                case["case_number"]
            )
        
        if "entities" in case:

            for person in case["entities"]["persons"]:

                session.execute_write(
                    create_person,
                    person
                )

                session.execute_write(
                    link_person_case,
                    person,
                    case["case_number"]
                )
        
        for rel in case["relationships"]:

            session.execute_write(
                create_relationship,
                rel
            )

def create_relationship(tx, rel):

    query = f"""

    MERGE (a:Person {{
        name:$source
    }})

    MERGE (b:Organization {{
        name:$target
    }})

    MERGE (a)-[:{rel['relationship']}]->(b)

    """

    tx.run(

        query,

        source=rel["source"],

        target=rel["target"]
    )
