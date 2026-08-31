from extraction.conflict_detector import (

    detect_repeat_respondents,
    detect_shared_organizations,
    calculate_risk_scores,
    calculate_entity_centrality,
    find_shortest_connection,
    detect_hidden_connections
)

print("\nREPEAT RESPONDENTS\n")

for item in detect_repeat_respondents():

    print(item)

print("\nSHARED ORGANIZATIONS\n")

for item in detect_shared_organizations():

    print(item)

print("\nRISK SCORES\n")

for item in calculate_risk_scores():

    print(item)

print("\nGRAPH CENTRALITY\n")

for item in calculate_entity_centrality():

    print(item)

print("\nSHORTEST PATH\n")

results = find_shortest_connection(
    "People’s Leasing and Finance PLC",
    "Welikala Appuhamilage Lalith Pushpakumara"
)

for item in results:

    print(item)

print("\nHIDDEN CONNECTIONS\n")

for item in detect_hidden_connections():

    print(item)