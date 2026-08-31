const { driver, createSession } = require('./neo4jConnection');
const { pages } = require('./create_basil_dossier');

const sourceFile = 'Judgement_15_Basil_Rajapaksa.pdf';
const relationships = pages.flat()
  .map((line) => line.match(/^RELATIONSHIP:\s*(.+?)\s*\|\s*([A-Z_]+)\s*\|\s*(.+)$/))
  .filter(Boolean)
  .map(([, source, relationship, target]) => ({ source, relationship, target }));

const caseNames = new Set([
  'SC/FR/195/2022', 'SC/FR/212/2022', 'Malwana property prosecution',
  'Divi Neguma almanac prosecution', 'Tourism Promotion Bureau T-shirt matter',
]);
const organizationNames = new Set([
  'Transparency International Sri Lanka', 'Monetary Board Central Bank Sri Lanka',
  'Supreme Court of Sri Lanka', 'Attorney General', 'Gampaha High Court',
  'Colombo High Court', 'Divi Neguma Department', 'Criminal Investigation Department',
  'Fort Magistrate Court', 'Sri Lanka Tourism Promotion Bureau',
]);
const labelFor = (name) => caseNames.has(name) ? 'Case' : organizationNames.has(name) ? 'Organization' : 'Person';

const mergeEntity = async (tx, name) => {
  const label = labelFor(name);
  const props = {
    name,
    sourceFile,
    dataSource: 'Source-grounded Basil public-record dossier',
    caseNumber: /^SC\/FR\/\d+\/\d+$/.test(name) ? name : null,
  };
  const setClause = label === 'Case'
    ? `SET node.title = $name, node.sourceFile = $sourceFile, node.dataSource = $dataSource
       FOREACH (_ IN CASE WHEN $caseNumber IS NULL THEN [] ELSE [1] END | SET node.case_number = $caseNumber)`
    : 'SET node.sourceFile = $sourceFile, node.dataSource = $dataSource';
  await tx.run(`MERGE (node:${label} {name: $name}) ${setClause}`, props);
};

const load = async () => {
  const session = createSession();
  try {
    await session.executeWrite(async (tx) => {
      for (const edge of relationships) {
        await mergeEntity(tx, edge.source);
        await mergeEntity(tx, edge.target);
      }
      for (const edge of relationships) {
        await tx.run(
          `MATCH (source:${labelFor(edge.source)} {name: $source})
           MATCH (target:${labelFor(edge.target)} {name: $target})
           MERGE (source)-[relationship:${edge.relationship}]->(target)
           SET relationship.sourceFile = $sourceFile,
               relationship.sourceType = 'PUBLIC_RECORD_DOSSIER',
               relationship.confidence = 'HIGH'`,
          { source: edge.source, target: edge.target, sourceFile }
        );
      }
    });
    console.log(`Loaded ${relationships.length} source-grounded relationships from ${sourceFile}`);
  } finally {
    await session.close();
    await driver.close();
  }
};
load().catch((error) => { console.error(error); process.exit(1); });
