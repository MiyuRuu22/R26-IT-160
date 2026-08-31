const { driver, createSession } = require('./neo4jConnection');
const { pages } = require('./create_wimal_dossier');

const sourceFile = 'Judgement_14_Wimal_Weerawansa.pdf';
const relationshipPattern = /^RELATIONSHIP:\s*(.+?)\s*\|\s*([A-Z_]+)\s*\|\s*(.+)$/;
const relationships = pages
  .flat()
  .map((line) => line.match(relationshipPattern))
  .filter(Boolean)
  .map(([, source, relationship, target]) => ({ source, relationship, target }));

const caseNames = new Set([
  'SC/CHC/Appeal/15/2019', 'HC (CIVIL) 26/2008/IP', 'PHC 0044/2017',
  'High Court 38/2017', 'CALA/71/2004', 'SC/Appeal 59A/2006',
  'SC/SLA/115/2006', '46636/MR/2004',
]);

const organizationNames = new Set([
  'JVP Central Committee', 'Janatha Vimukthi Peramuna', 'Intellectual Property Act 36 of 2003',
  'Attorney General', 'CIABOC', 'Bribery Act Section 23A',
  'Sri Lanka Rupavahini Corporation', 'Visanvadaya',
]);

const labelFor = (name) => {
  if (caseNames.has(name)) return 'Case';
  if (organizationNames.has(name)) return 'Organization';
  return 'Person';
};

const mergeEntity = async (tx, name) => {
  const label = labelFor(name);
  if (label === 'Case') {
    await tx.run(
      'MERGE (node:Case {name: $name}) SET node.case_number = $name, node.sourceFile = $sourceFile, node.dataSource = $dataSource',
      { name, sourceFile, dataSource: 'Source-grounded Wimal public-record dossier' }
    );
    return;
  }
  await tx.run(
    `MERGE (node:${label} {name: $name}) SET node.sourceFile = $sourceFile, node.dataSource = $dataSource`,
    { name, sourceFile, dataSource: 'Source-grounded Wimal public-record dossier' }
  );
};

const load = async () => {
  const session = createSession();
  try {
    await session.executeWrite(async (tx) => {
      for (const { source, target } of relationships) {
        await mergeEntity(tx, source);
        await mergeEntity(tx, target);
      }
      for (const { source, relationship, target } of relationships) {
        const sourceLabel = labelFor(source);
        const targetLabel = labelFor(target);
        await tx.run(
          `MATCH (source:${sourceLabel} {name: $source})
           MATCH (target:${targetLabel} {name: $target})
           MERGE (source)-[edge:${relationship}]->(target)
           SET edge.sourceFile = $sourceFile,
               edge.sourceType = 'PUBLIC_RECORD_DOSSIER',
               edge.confidence = 'HIGH'`,
          { source, target, sourceFile }
        );
      }
    });
    console.log(`Loaded ${relationships.length} source-grounded relationships from ${sourceFile}`);
  } finally {
    await session.close();
    await driver.close();
  }
};

load().catch((error) => {
  console.error(error);
  process.exit(1);
});
