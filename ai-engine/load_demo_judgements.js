const { driver, createSession } = require('./neo4jConnection');

// Mirrors the entity/relationship shape produced by the PDF extractor.
// MERGE makes this safe to run repeatedly and never clears existing data.
const cases = [
  {
    caseNumber: 'CHC1112026',
    judge: 'Justice S. Amarasinghe',
    petitioner: 'Miyuru Senanayake',
    respondent: 'Serendib Legal Holdings',
    sourceFile: 'Judgement_11_Miyuru_Senanayake.pdf',
    relationships: [
      ['Miyuru Senanayake', 'EMPLOYED_BY', 'Hatton National Bank'],
      ['Miyuru Senanayake', 'PARTNER_OF', 'Serendib Legal Holdings'],
    ],
  },
  {
    caseNumber: 'CHC1122026',
    judge: 'Justice M. Ranasinghe',
    petitioner: 'Nethuni Perera',
    respondent: 'Ceylon Property Holdings',
    sourceFile: 'Judgement_12_Nethuni_Perera.pdf',
    relationships: [
      ['Nethuni Perera', 'EMPLOYED_BY', 'National Development Bank'],
      ['Nethuni Perera', 'PARTNER_OF', 'Ceylon Property Holdings'],
    ],
  },
  {
    caseNumber: 'CHC1132026',
    judge: 'Justice R. Wickramasinghe',
    petitioner: 'Tharindu Jayasuriya',
    respondent: 'Serendib Legal Holdings',
    sourceFile: 'Judgement_13_Tharindu_Jayasuriya.pdf',
    relationships: [
      ['Tharindu Jayasuriya', 'EMPLOYED_BY', 'Ceylon Property Holdings'],
      ['Tharindu Jayasuriya', 'PARTNER_OF', 'Serendib Legal Holdings'],
    ],
  },
];

const load = async () => {
  const session = createSession();
  try {
    for (const item of cases) {
      await session.executeWrite(async (tx) => {
        await tx.run(
          `MERGE (c:Case {case_number: $caseNumber})
           SET c.judge = $judge, c.sourceFile = $sourceFile, c.dataSource = 'PDF extraction demo'`,
          item
        );
        await tx.run(
          `MERGE (p:Person {name: $petitioner})
           WITH p
           MATCH (c:Case {case_number: $caseNumber})
           MERGE (p)-[:PETITIONER_IN]->(c)`,
          item
        );
        await tx.run(
          `MERGE (o:Organization {name: $respondent})
           WITH o
           MATCH (c:Case {case_number: $caseNumber})
           MERGE (o)-[:RESPONDENT_IN]->(c)`,
          item
        );
        for (const [person, type, organization] of item.relationships) {
          await tx.run(
            `MERGE (p:Person {name: $person})
             MERGE (o:Organization {name: $organization})
             MERGE (p)-[r:${type}]->(o)
             SET r.sourceFile = $sourceFile`,
            { person, organization, sourceFile: item.sourceFile }
          );
        }
      });
      console.log(`Loaded ${item.caseNumber}`);
    }
  } finally {
    await session.close();
    await driver.close();
  }
};

load().catch((error) => {
  console.error(error);
  process.exit(1);
});
