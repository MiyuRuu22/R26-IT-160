const fs = require('fs');
const path = require('path');

// This is a source-grounded research dossier, not a judgment or a finding of
// guilt. Every case status in the prose is deliberately qualified.
const pages = [
  [
    'WIMAL WEERAWANSA - PUBLIC LEGAL PROCEEDINGS AND RELATIONSHIP DATASET',
    'Research-demo dossier | Source-grounded records reviewed 30 August 2026',
    '',
    'Purpose',
    'This compiled public-record dossier supports relationship extraction for a',
    'legal-research demonstration. It does not make findings beyond its sources.',
    '',
    '1. Copyright appeal: Wimal Weerawansa v Mesthri Tilvin Silva',
    'Supreme Court: SC/CHC/Appeal/15/2019. Originating: HC (CIVIL) 26/2008/IP.',
    'The Supreme Court judgment records Wimal Weerawansa as defendant-appellant',
    'and Mesthri Tilvin Silva as plaintiff-respondent. The appeal was dismissed',
    'on 09 July 2026. The High Court statutory-damages award of Rs. 1 million',
    'was not disturbed; the injunction was limited to infringing P2/P3 material.',
    'Bench: Janak De Silva J, Dr Sobhitha Rajakaruna J, and M Sampath K B Wijeratne J.',
    'Counsel for Wimal: Nishan S Premathiratne, Sidath Gajanayake, Manith Dasanayake,',
    'Kaushalya Wickramanayake and Gamindu Karunasena.',
    'Counsel for Tilvin: Saliya Pieris PC, Anjana Rathnasiri and Dinithi Jayasinghe.',
    'The judgment describes P2 and P3 as analyses presented to the JVP Central Committee.',
    'Source: public full-text copy hosted by Lanka Law; cross-indexed by Iuris.',
    '',
    '2. FCID vehicle-related appeal',
    'Court of Appeal: C.A. PHC 44/2017, also captioned PHC 0044/2017.',
    'The official Court of Appeal judgment identifies Wimal Weerawansa as',
    'petitioner-appellant and Anural Premaratne as first respondent. Withdrawal',
    'was allowed and the application was dismissed on 31 March 2021.',
    'Bench: Menaka Wijesundera J and Neill Iddawala J.',
    'Counsel: Himali Harshika Udagedarachchi for the appellant; Deputy Solicitor',
    'General Sudharshana de Silva for the sixth respondent, Attorney General.',
    'This dossier does not assert an originating B-report identifier for this appeal.',
  ],
  [
    '3. CIABOC unexplained-wealth prosecution',
    'CIABOC file BC/32/2015; High Court case 38/2017, Court No. 6.',
    'CIABOC announced an indictment under section 23A of the Bribery Act on',
    '30 November 2017. Its notice refers to alleged expenditure of Rs. 50 million',
    'beyond known income during 2009-2014. An official 2026 CIABOC cause list',
    'records Wimal Weerawansha in case 38/2017. This is prosecution-status data',
    'only and is not a finding of guilt.',
    '',
    '4. Ravi Karunanayake v Wimal Weerawansa',
    'Verified appellate identifiers: CALA/71/2004, SC/Appeal 59A/2006 and',
    'SC/SLA/115/2006. The official Supreme Court document identifies Ravi',
    'Karunanayake as plaintiff and Wimal Weerawansa as defendant. A District Court',
    'number is intentionally omitted because public sources conflict.',
    '',
    '5. Major General Wasantha Perera defamation matter',
    'Identifier: 46636/MR/2004. Sri Lanka Rupavahini Corporation records an',
    'alleged Rs. 75 million defamation claim relating to Visanvadaya broadcast',
    'on 29 April 2004. Its annual report states the case concluded in favour of',
    'the Corporation and that the plaintiff was not defamed. That outcome is',
    'provenanced as an institutional party report, not a court judgment text.',
    '',
    'Relationship index - explicit, source-qualified extraction statements',
    'RELATIONSHIP: Wimal Weerawansa | APPELLANT_IN | SC/CHC/Appeal/15/2019',
    'RELATIONSHIP: Mesthri Tilvin Silva | PLAINTIFF_IN | SC/CHC/Appeal/15/2019',
    'RELATIONSHIP: SC/CHC/Appeal/15/2019 | APPEAL_OF | HC (CIVIL) 26/2008/IP',
    'RELATIONSHIP: Wimal Weerawansa | REPRESENTED_BY | Nishan S Premathiratne',
    'RELATIONSHIP: Wimal Weerawansa | REPRESENTED_BY | Sidath Gajanayake',
    'RELATIONSHIP: Wimal Weerawansa | REPRESENTED_BY | Manith Dasanayake',
    'RELATIONSHIP: Wimal Weerawansa | REPRESENTED_BY | Kaushalya Wickramanayake',
    'RELATIONSHIP: Wimal Weerawansa | REPRESENTED_BY | Gamindu Karunasena',
    'RELATIONSHIP: Mesthri Tilvin Silva | REPRESENTED_BY | Saliya Pieris PC',
    'RELATIONSHIP: Mesthri Tilvin Silva | REPRESENTED_BY | Anjana Rathnasiri',
    'RELATIONSHIP: Mesthri Tilvin Silva | REPRESENTED_BY | Dinithi Jayasinghe',
    'RELATIONSHIP: SC/CHC/Appeal/15/2019 | JUDGED_BY | Janak De Silva',
    'RELATIONSHIP: SC/CHC/Appeal/15/2019 | JUDGED_BY | Dr Sobhitha Rajakaruna',
    'RELATIONSHIP: SC/CHC/Appeal/15/2019 | JUDGED_BY | M Sampath K B Wijeratne',
    'RELATIONSHIP: Mesthri Tilvin Silva | PRESENTED_TO | JVP Central Committee',
    'RELATIONSHIP: JVP Central Committee | PART_OF | Janatha Vimukthi Peramuna',
    'RELATIONSHIP: SC/CHC/Appeal/15/2019 | GOVERNED_BY_STATUTE | Intellectual Property Act 36 of 2003',
  ],
  [
    'Relationship index continued',
    'RELATIONSHIP: Wimal Weerawansa | PETITIONER_IN | PHC 0044/2017',
    'RELATIONSHIP: Anural Premaratne | RESPONDENT_IN | PHC 0044/2017',
    'RELATIONSHIP: Attorney General | RESPONDENT_IN | PHC 0044/2017',
    'RELATIONSHIP: Wimal Weerawansa | REPRESENTED_BY | Himali Harshika Udagedarachchi',
    'RELATIONSHIP: Attorney General | REPRESENTED_BY | Sudharshana de Silva',
    'RELATIONSHIP: PHC 0044/2017 | JUDGED_BY | Menaka Wijesundera',
    'RELATIONSHIP: PHC 0044/2017 | JUDGED_BY | Neill Iddawala',
    'RELATIONSHIP: Wimal Weerawansa | INDICTED_IN | High Court 38/2017',
    'RELATIONSHIP: High Court 38/2017 | INVESTIGATED_BY | CIABOC',
    'RELATIONSHIP: High Court 38/2017 | GOVERNED_BY_STATUTE | Bribery Act Section 23A',
    'RELATIONSHIP: Ravi Karunanayake | PLAINTIFF_IN | CALA/71/2004',
    'RELATIONSHIP: Wimal Weerawansa | DEFENDANT_IN | CALA/71/2004',
    'RELATIONSHIP: SC/Appeal 59A/2006 | APPEAL_OF | CALA/71/2004',
    'RELATIONSHIP: SC/SLA/115/2006 | RELATED_PROCEEDING | CALA/71/2004',
    'RELATIONSHIP: Major General Wasantha Perera | PLAINTIFF_IN | 46636/MR/2004',
    'RELATIONSHIP: Wimal Weerawansa | DEFENDANT_IN | 46636/MR/2004',
    'RELATIONSHIP: 46636/MR/2004 | BROADCAST_BY | Sri Lanka Rupavahini Corporation',
    'RELATIONSHIP: 46636/MR/2004 | MENTIONED_IN | Visanvadaya',
    '',
    'Source register',
    'Court of Appeal judgment: court of appeal dot lk, C.A. PHC 44-2017 PDF.',
    'CIABOC indictment notice and June 2026 official cause list: ciaboc dot gov dot lk.',
    'Supreme Court Ravi Karunanayake record: supremecourt dot lk, SC Appeal 59A 06 PDF.',
    'SLRC Annual Report 2014: rupavahini dot lk.',
    'Tilvin Silva appeal: lankalaw dot net public judgment copy and iuris dot lk index.',
    '',
    'Data-integrity note',
    'No case number has been inferred. An allegation, indictment, withdrawal,',
    'institutional report and final court decision are kept as distinct procedural states.',
  ],
];

const escapePdf = (value) => value.replace(/([\\()])/g, '\\$1');

const makePdf = (documentPages) => {
  const objects = ['<< /Type /Catalog /Pages 2 0 R >>'];
  const pageObjectNumbers = documentPages.map((_, index) => 3 + index * 2);
  objects.push(`<< /Type /Pages /Kids [${pageObjectNumbers.map((n) => `${n} 0 R`).join(' ')}] /Count ${documentPages.length} >>`);

  documentPages.forEach((lines, index) => {
    const contentNumber = 4 + index * 2;
    const stream = ['BT', '/F1 10 Tf', '54 748 Td', '14 TL', ...lines.map((line, lineIndex) => `${lineIndex ? 'T* ' : ''}(${escapePdf(line)}) Tj`), 'ET'].join('\n');
    objects.push(`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 ${3 + documentPages.length * 2} 0 R >> >> /Contents ${contentNumber} 0 R >>`);
    objects.push(`<< /Length ${Buffer.byteLength(stream, 'ascii')} >>\nstream\n${stream}\nendstream`);
  });
  objects.push('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>');

  let pdf = '%PDF-1.4\n%\xE2\xE3\xCF\xD3\n';
  const offsets = [0];
  objects.forEach((object, index) => {
    offsets.push(Buffer.byteLength(pdf, 'binary'));
    pdf += `${index + 1} 0 obj\n${object}\nendobj\n`;
  });
  const xref = Buffer.byteLength(pdf, 'binary');
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  offsets.slice(1).forEach((offset) => { pdf += `${String(offset).padStart(10, '0')} 00000 n \n`; });
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF\n`;
  return Buffer.from(pdf, 'binary');
};

if (require.main === module) {
  const output = path.join(__dirname, 'data', 'pdfs', 'Judgement_14_Wimal_Weerawansa.pdf');
  fs.writeFileSync(output, makePdf(pages));
  console.log(`Created ${output}`);
}

module.exports = { pages };
