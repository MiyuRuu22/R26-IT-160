const fs = require('fs');
const path = require('path');

// Creates deliberately simple, text-based PDF judgements. Their wording is
// aligned to the existing regex extractor so they can be safely used in the
// presentation demo without changing extraction logic.
const cases = [
  {
    file: 'Judgement_11_Miyuru_Senanayake.pdf',
    lines: [
      'IN THE COMMERCIAL HIGH COURT OF SRI LANKA',
      'Case No.: CHC111/2026',
      'Before: Justice S. Amarasinghe',
      '',
      'Miyuru Senanayake Petitioner',
      'Vs. Serendib Legal Holdings Respondents',
      '',
      'Miyuru Senanayake was employed by Hatton National Bank.',
      'Miyuru Senanayake is a partner of Serendib Legal Holdings.',
    ],
  },
  {
    file: 'Judgement_12_Nethuni_Perera.pdf',
    lines: [
      'IN THE COMMERCIAL HIGH COURT OF SRI LANKA',
      'Case No.: CHC112/2026',
      'Before: Justice M. Ranasinghe',
      '',
      'Nethuni Perera Petitioner',
      'Vs. Ceylon Property Holdings Respondents',
      '',
      'Nethuni Perera was employed by National Development Bank.',
      'Nethuni Perera is a partner of Ceylon Property Holdings.',
    ],
  },
  {
    file: 'Judgement_13_Tharindu_Jayasuriya.pdf',
    lines: [
      'IN THE COMMERCIAL HIGH COURT OF SRI LANKA',
      'Case No.: CHC113/2026',
      'Before: Justice R. Wickramasinghe',
      '',
      'Tharindu Jayasuriya Petitioner',
      'Vs. Serendib Legal Holdings Respondents',
      '',
      'Tharindu Jayasuriya was employed by Ceylon Property Holdings.',
      'Tharindu Jayasuriya is a partner of Serendib Legal Holdings.',
    ],
  },
];

const escapePdf = (value) => value.replace(/([\\()])/g, '\\$1');

const makePdf = (lines) => {
  const stream = [
    'BT',
    '/F1 12 Tf',
    '72 760 Td',
    '16 TL',
    ...lines.flatMap((line, index) => [
      `${index === 0 ? '' : 'T* ' }(${escapePdf(line)}) Tj`,
    ]),
    'ET',
  ].join('\n');

  const objects = [
    '<< /Type /Catalog /Pages 2 0 R >>',
    '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
    '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>',
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>',
    `<< /Length ${Buffer.byteLength(stream, 'ascii')} >>\nstream\n${stream}\nendstream`,
  ];

  let pdf = '%PDF-1.4\n%\xE2\xE3\xCF\xD3\n';
  const offsets = [0];
  objects.forEach((object, index) => {
    offsets.push(Buffer.byteLength(pdf, 'binary'));
    pdf += `${index + 1} 0 obj\n${object}\nendobj\n`;
  });
  const xref = Buffer.byteLength(pdf, 'binary');
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  offsets.slice(1).forEach((offset) => {
    pdf += `${String(offset).padStart(10, '0')} 00000 n \n`;
  });
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF\n`;
  return Buffer.from(pdf, 'binary');
};

const outputDirectory = path.join(__dirname, 'data', 'pdfs');
cases.forEach((judgement) => {
  fs.writeFileSync(path.join(outputDirectory, judgement.file), makePdf(judgement.lines));
  console.log(`Created ${judgement.file}`);
});
