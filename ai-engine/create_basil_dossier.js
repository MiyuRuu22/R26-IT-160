const fs = require('fs');
const path = require('path');

const pages = [
  [
    'BASIL RAJAPAKSA - PUBLIC LEGAL PROCEEDINGS AND RELATIONSHIP DATASET',
    'Research-demo dossier | sources reviewed 30 August 2026',
    '',
    'This dossier distinguishes official findings from reported proceedings.',
    'No identifier is inferred where public sources do not publish one.',
    '',
    '1. Economic-crisis fundamental-rights proceedings',
    'Supreme Court: SC/FR/195/2022 and SC/FR/212/2022.',
    'The official consolidated Supreme Court judgment identifies Basil Rajapaksa',
    'as respondent 2A. The Court delivered its judgment on 14 November 2023.',
    'It found that identified actions, omissions, decisions and conduct of several',
    'respondents, including Basil Rajapaksa, demonstrably contributed to the',
    'economic crisis and breached public trust. This is an official judicial finding.',
    'The public-interest petitioners included Transparency International Sri Lanka,',
    'Chandra Jayaratne, Jehan CanagaRetna and Julian Bolling.',
    'Other named respondents include Gotabaya Rajapaksa, Mahinda Rajapaksa,',
    'Ajith Nivard Cabraal, W D Lakshman, S R Attygalle, Samantha Kumarasinghe,',
    'P B Jayasundera and the Monetary Board of the Central Bank of Sri Lanka.',
    'Source: official Supreme Court consolidated judgment.',
    '',
    '2. Malwana property prosecution',
    'Case number: NOT PUBLICLY VERIFIED. Reputable news reports say the Attorney',
    'General filed three indictments against Basil Rajapaksa and Thirukumar Nadesan.',
    'They report Gampaha High Court Judge Nimal Ranaweera acquitted both on',
    '03 June 2022. This outcome is recorded as reputable-news sourced, not an',
    'official judgment copy in this dossier.',
  ],
  [
    '3. Divi Neguma almanac prosecution',
    'Case number: NOT PUBLICLY VERIFIED. Daily FT reports that Colombo High Court',
    'Judge Damith Thotawatte acquitted Basil Rajapaksa and former Director General',
    'Kithsiri Ranawaka on 01 February 2022. The report concerns allegations about',
    'five million almanacs and Divi Neguma Department funds. This is news-sourced.',
    '',
    '4. Sri Lanka Tourism Promotion Bureau T-shirt matter',
    'Case number: NOT PUBLICLY VERIFIED. A 17 June 2026 Newsfirst report says',
    'Fort Magistrate Pasan Amarasena ordered CID to arrest and produce Basil',
    'Rajapaksa concerning an alleged Rs. 7.8 million misuse of Bureau funds.',
    'The report names Rumy Jauffer and refers to 12,000 T-shirts. This is an',
    'active reported allegation, not a judicial finding or final outcome.',
    '',
    'Relationship index - explicit, source-qualified extraction statements',
    'RELATIONSHIP: Basil Rajapaksa | RESPONDENT_IN | SC/FR/195/2022',
    'RELATIONSHIP: Basil Rajapaksa | RESPONDENT_IN | SC/FR/212/2022',
    'RELATIONSHIP: Transparency International Sri Lanka | PETITIONER_IN | SC/FR/212/2022',
    'RELATIONSHIP: Chandra Jayaratne | PETITIONER_IN | SC/FR/212/2022',
    'RELATIONSHIP: Jehan CanagaRetna | PETITIONER_IN | SC/FR/212/2022',
    'RELATIONSHIP: Julian Bolling | PETITIONER_IN | SC/FR/212/2022',
    'RELATIONSHIP: Gotabaya Rajapaksa | RESPONDENT_IN | SC/FR/195/2022',
    'RELATIONSHIP: Mahinda Rajapaksa | RESPONDENT_IN | SC/FR/195/2022',
    'RELATIONSHIP: Ajith Nivard Cabraal | RESPONDENT_IN | SC/FR/195/2022',
    'RELATIONSHIP: W D Lakshman | RESPONDENT_IN | SC/FR/195/2022',
    'RELATIONSHIP: S R Attygalle | RESPONDENT_IN | SC/FR/195/2022',
    'RELATIONSHIP: Samantha Kumarasinghe | RESPONDENT_IN | SC/FR/195/2022',
    'RELATIONSHIP: P B Jayasundera | RESPONDENT_IN | SC/FR/195/2022',
    'RELATIONSHIP: Monetary Board Central Bank Sri Lanka | RESPONDENT_IN | SC/FR/195/2022',
    'RELATIONSHIP: SC/FR/195/2022 | RELATED_PROCEEDING | SC/FR/212/2022',
    'RELATIONSHIP: SC/FR/195/2022 | HEARD_BY | Supreme Court of Sri Lanka',
  ],
  [
    'Relationship index continued',
    'RELATIONSHIP: Basil Rajapaksa | DEFENDANT_IN | Malwana property prosecution',
    'RELATIONSHIP: Thirukumar Nadesan | DEFENDANT_IN | Malwana property prosecution',
    'RELATIONSHIP: Malwana property prosecution | PROSECUTED_BY | Attorney General',
    'RELATIONSHIP: Malwana property prosecution | HEARD_BY | Gampaha High Court',
    'RELATIONSHIP: Malwana property prosecution | JUDGED_BY | Nimal Ranaweera',
    'RELATIONSHIP: Basil Rajapaksa | DEFENDANT_IN | Divi Neguma almanac prosecution',
    'RELATIONSHIP: Kithsiri Ranawaka | DEFENDANT_IN | Divi Neguma almanac prosecution',
    'RELATIONSHIP: Divi Neguma almanac prosecution | HEARD_BY | Colombo High Court',
    'RELATIONSHIP: Divi Neguma almanac prosecution | JUDGED_BY | Damith Thotawatte',
    'RELATIONSHIP: Divi Neguma almanac prosecution | RELATED_PROCEEDING | Divi Neguma Department',
    'RELATIONSHIP: Basil Rajapaksa | MENTIONED_IN | Tourism Promotion Bureau T-shirt matter',
    'RELATIONSHIP: Rumy Jauffer | MENTIONED_IN | Tourism Promotion Bureau T-shirt matter',
    'RELATIONSHIP: Tourism Promotion Bureau T-shirt matter | INVESTIGATED_BY | Criminal Investigation Department',
    'RELATIONSHIP: Tourism Promotion Bureau T-shirt matter | HEARD_BY | Fort Magistrate Court',
    'RELATIONSHIP: Tourism Promotion Bureau T-shirt matter | JUDGED_BY | Pasan Amarasena',
    'RELATIONSHIP: Tourism Promotion Bureau T-shirt matter | RELATED_PROCEEDING | Sri Lanka Tourism Promotion Bureau',
    '',
    'Source register',
    'Official Supreme Court judgment: SC FR 195 and 212 2022 PDF, supremecourt dot lk.',
    'Malwana: Sunday Times and Newsfirst reports, 03 June 2022.',
    'Divi Neguma: Daily FT report, 02 February 2022.',
    'Tourism Promotion Bureau: Newsfirst report, 17 June 2026.',
    '',
    'Integrity note: the three unnumbered matters retain their source-qualified',
    'procedural labels and are never represented as official case identifiers.',
  ],
];

const escapePdf = (value) => value.replace(/([\\()])/g, '\\$1');
const makePdf = (documentPages) => {
  const objects = ['<< /Type /Catalog /Pages 2 0 R >>'];
  const pageNumbers = documentPages.map((_, index) => 3 + index * 2);
  objects.push(`<< /Type /Pages /Kids [${pageNumbers.map((n) => `${n} 0 R`).join(' ')}] /Count ${documentPages.length} >>`);
  documentPages.forEach((lines, index) => {
    const content = 4 + index * 2;
    const stream = ['BT', '/F1 10 Tf', '54 748 Td', '14 TL', ...lines.map((line, i) => `${i ? 'T* ' : ''}(${escapePdf(line)}) Tj`), 'ET'].join('\n');
    objects.push(`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 ${3 + documentPages.length * 2} 0 R >> >> /Contents ${content} 0 R >>`);
    objects.push(`<< /Length ${Buffer.byteLength(stream, 'ascii')} >>\nstream\n${stream}\nendstream`);
  });
  objects.push('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>');
  let pdf = '%PDF-1.4\n%\xE2\xE3\xCF\xD3\n'; const offsets = [0];
  objects.forEach((object, index) => { offsets.push(Buffer.byteLength(pdf, 'binary')); pdf += `${index + 1} 0 obj\n${object}\nendobj\n`; });
  const xref = Buffer.byteLength(pdf, 'binary');
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  offsets.slice(1).forEach((offset) => { pdf += `${String(offset).padStart(10, '0')} 00000 n \n`; });
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF\n`;
  return Buffer.from(pdf, 'binary');
};

if (require.main === module) {
  const output = path.join(__dirname, 'data', 'pdfs', 'Judgement_15_Basil_Rajapaksa.pdf');
  fs.writeFileSync(output, makePdf(pages));
  console.log(`Created ${output}`);
}
module.exports = { pages };
