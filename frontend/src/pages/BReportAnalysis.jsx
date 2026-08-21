import React, { useState, useRef, useCallback } from 'react';
import axios from 'axios';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// ── helpers ────────────────────────────────────────────────────────────────────
const riskColor = (r) => ({
  LOW:       'text-green-600 bg-green-50 border-green-200',
  MEDIUM:    'text-yellow-600 bg-yellow-50 border-yellow-200',
  HIGH:      'text-orange-600 bg-orange-50 border-orange-200',
  'VERY HIGH':'text-red-600 bg-red-50 border-red-200',
}[r] || 'text-gray-600 bg-gray-50 border-gray-200');

const riskLabel = (r) => ({
  LOW:       '✅ Low Prosecution Risk',
  MEDIUM:    '⚠️ Medium Risk',
  HIGH:      '🔴 High Risk',
  'VERY HIGH':'🚨 Very High Risk',
}[r] || r);

// ── sub-components ─────────────────────────────────────────────────────────────
function SectionCard({ title, icon, children, accent = 'blue' }) {
  const border = {
    blue:   'border-blue-500',
    red:    'border-red-500',
    yellow: 'border-yellow-500',
    green:  'border-green-500',
    purple: 'border-purple-500',
    gray:   'border-gray-400',
  }[accent] || 'border-blue-500';

  return (
    <div className={`bg-white rounded-xl shadow-sm border border-gray-100 border-l-4 ${border} mb-6`}>
      <div className="px-6 py-4 border-b border-gray-50">
        <h3 className="text-sm font-bold text-gray-700 uppercase tracking-widest flex items-center gap-2">
          <span>{icon}</span>{title}
        </h3>
      </div>
      <div className="px-6 py-4">{children}</div>
    </div>
  );
}

function ArgumentCard({ item, index }) {
  const [open, setOpen] = useState(false);
  const typeColor = {
    'Weak Legal Wording': 'bg-yellow-100 text-yellow-800',
    'Missing Evidence':   'bg-red-100 text-red-800',
    'Timeline Reference': 'bg-orange-100 text-orange-800',
  }[item.issue] || 'bg-gray-100 text-gray-700';

  return (
    <div className="border border-gray-200 rounded-lg mb-3 overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 hover:bg-gray-100 transition-colors text-left"
      >
        <div className="flex items-center gap-3">
          <span className="text-gray-400 font-mono text-xs">#{String(index + 1).padStart(2, '0')}</span>
          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${typeColor}`}>{item.issue}</span>
          <span className="text-sm font-medium text-gray-800">
            "{item.detected_word}"
          </span>
        </div>
        <span className="text-gray-400 text-sm">{open ? '▲' : '▼'}</span>
      </button>
      {open && (
        <div className="px-4 py-4 space-y-3">
          {item.original_sentence && (
            <div className="bg-amber-50 border-l-4 border-amber-400 p-3 rounded">
              <p className="text-xs font-bold text-amber-700 mb-1">📄 Original Sentence from B-Report:</p>
              <p className="text-sm text-amber-900 italic">"{item.original_sentence}"</p>
            </div>
          )}
          <div className="bg-blue-50 border-l-4 border-blue-400 p-3 rounded">
            <p className="text-xs font-bold text-blue-700 mb-1">⚖️ Defense Argument:</p>
            <p className="text-sm text-blue-900">{item.defense_argument}</p>
          </div>
        </div>
      )}
    </div>
  );
}

function EvidenceChip({ item }) {
  return (
    <div className="inline-flex flex-col gap-1 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 mr-2 mb-2">
      <span className="text-xs font-bold text-gray-600">{item.type}</span>
      <div className="flex flex-wrap gap-1">
        {item.mentions.map((m, i) => (
          <span key={i} className="text-xs bg-white border border-gray-200 rounded px-1.5 py-0.5 text-gray-700">{m}</span>
        ))}
      </div>
    </div>
  );
}

// ── main component ─────────────────────────────────────────────────────────────
export default function BReportAnalysis() {
  const [file, setFile]         = useState(null);
  const [dragging, setDragging] = useState(false);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');
  const [data, setData]         = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  const reportRef = useRef(null);
  const inputRef  = useRef(null);

  // ── drag & drop ────────────────────────────────────────────────────────────
  const onDrop = useCallback((e) => {
    e.preventDefault();
    setDragging(false);
    const dropped = e.dataTransfer.files[0];
    if (dropped?.type === 'application/pdf') { setFile(dropped); setError(''); }
    else setError('Please drop a PDF file.');
  }, []);

  const onDragOver = (e) => { e.preventDefault(); setDragging(true); };
  const onDragLeave = () => setDragging(false);

  const onFileChange = (e) => {
    const f = e.target.files[0];
    if (f) { setFile(f); setError(''); }
  };

  // ── analyze ────────────────────────────────────────────────────────────────
  const handleAnalyze = async () => {
    if (!file) { setError('Please select a PDF file first.'); return; }
    setLoading(true); setError(''); setData(null);

    const form = new FormData();
    form.append('pdf', file);

    try {
      const res = await axios.post(`${API_BASE}/b-report/analyze`, form, {
        headers: { 'Content-Type': 'multipart/form-data' },
        timeout: 180000,
      });
      setData(res.data.data);
      setActiveTab('overview');
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Analysis failed.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  // ── PDF export ─────────────────────────────────────────────────────────────
  const exportPDF = async () => {
    if (!reportRef.current) return;
    const canvas = await html2canvas(reportRef.current, { scale: 2, useCORS: true });
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF('p', 'mm', 'a4');
    const pdfW = pdf.internal.pageSize.getWidth();
    const pdfH = (canvas.height * pdfW) / canvas.width;
    let yPos = 0;
    const pageH = pdf.internal.pageSize.getHeight();
    while (yPos < pdfH) {
      pdf.addImage(imgData, 'PNG', 0, -yPos, pdfW, pdfH);
      yPos += pageH;
      if (yPos < pdfH) pdf.addPage();
    }
    pdf.save(`B-Report-Analysis-${Date.now()}.pdf`);
  };

  const tabs = [
    { id: 'overview',   label: 'Overview' },
    { id: 'arguments',  label: `Defense (${data?.defense_arguments?.length || 0})` },
    { id: 'evidence',   label: 'Evidence' },
    { id: 'sinhala',    label: 'සිංහල' },
    { id: 'text',       label: 'Extracted Text' },
  ];

  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-900">⚖️ B-Report Defense Analyzer</h1>
            <p className="text-xs text-gray-500 mt-0.5">Smart Lawyer Companion · Sri Lankan Legal AI System</p>
          </div>
          {data && (
            <button
              onClick={exportPDF}
              className="flex items-center gap-2 bg-gray-900 text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors"
            >
              📄 Export PDF
            </button>
          )}
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-8">
        {/* Upload Zone */}
        <div
          onDrop={onDrop}
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
          onClick={() => inputRef.current?.click()}
          className={`border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-all mb-6 ${
            dragging ? 'border-blue-500 bg-blue-50' : file ? 'border-green-400 bg-green-50' : 'border-gray-300 bg-white hover:border-blue-400 hover:bg-blue-50'
          }`}
        >
          <input ref={inputRef} type="file" accept=".pdf" className="hidden" onChange={onFileChange} />
          <div className="text-4xl mb-3">{file ? '📑' : '📂'}</div>
          {file ? (
            <>
              <p className="font-semibold text-green-700">{file.name}</p>
              <p className="text-sm text-green-600 mt-1">{(file.size / 1024).toFixed(1)} KB · Ready to analyze</p>
            </>
          ) : (
            <>
              <p className="font-semibold text-gray-700">Drop your B-Report PDF here</p>
              <p className="text-sm text-gray-500 mt-1">or click to browse · Max 50MB</p>
            </>
          )}
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 mb-4 text-sm flex items-center gap-2">
            ⚠️ {error}
          </div>
        )}

        <button
          onClick={handleAnalyze}
          disabled={loading || !file}
          className={`w-full py-4 rounded-xl font-bold text-lg transition-all mb-8 ${
            loading || !file
              ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
              : 'bg-gray-900 text-white hover:bg-gray-700 shadow-lg hover:shadow-xl'
          }`}
        >
          {loading ? (
            <span className="flex items-center justify-center gap-3">
              <svg className="animate-spin h-5 w-5 text-white" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
              </svg>
              Analyzing B-Report — This may take 30–60 seconds...
            </span>
          ) : '🔍 Analyze B-Report'}
        </button>

        {/* Results */}
        {data && (
          <div ref={reportRef}>
            {/* Risk Banner */}
            <div className={`border rounded-xl p-5 mb-6 flex items-center justify-between ${riskColor(data.risk_level)}`}>
              <div>
                <p className="text-xs font-bold uppercase tracking-widest opacity-70">Prosecution Risk Level</p>
                <p className="text-2xl font-black mt-1">{riskLabel(data.risk_level)}</p>
                <p className="text-xs mt-1 opacity-70">
                  {data.weak_words?.length} weak words · {data.missing_evidence?.length} missing evidence · {data.contradictions?.length} contradictions
                </p>
              </div>
              <div className="text-right text-xs opacity-60">
                <p>{data.page_count} pages</p>
                <p className="mt-1">via {data.extraction_method}</p>
              </div>
            </div>

            {/* Tab bar */}
            <div className="flex gap-1 border-b border-gray-200 mb-6 overflow-x-auto">
              {tabs.map((t) => (
                <button
                  key={t.id}
                  onClick={() => setActiveTab(t.id)}
                  className={`px-4 py-2.5 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                    activeTab === t.id
                      ? 'border-gray-900 text-gray-900'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>

            {/* Tab: Overview */}
            {activeTab === 'overview' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <SectionCard title="Case Summary" icon="📋" accent="blue">
                  <p className="text-sm text-gray-700 leading-relaxed">{data.case_summary}</p>
                </SectionCard>

                <SectionCard title="Police Allegations" icon="🚔" accent="red">
                  {data.allegations?.length > 0 ? (
                    <ul className="space-y-2">
                      {data.allegations.map((a, i) => (
                        <li key={i} className="text-sm text-gray-700 bg-red-50 border-l-2 border-red-300 pl-3 py-1 rounded-r">{a}</li>
                      ))}
                    </ul>
                  ) : <p className="text-sm text-gray-400 italic">No specific allegations detected.</p>}
                </SectionCard>

                <SectionCard title="Missing Evidence" icon="🔎" accent="yellow">
                  {data.missing_evidence?.length > 0 ? (
                    data.missing_evidence.map((m, i) => (
                      <div key={i} className="mb-3 last:mb-0">
                        <p className="text-sm font-semibold text-yellow-800">{m.detected_word}</p>
                        <p className="text-xs text-gray-600 mt-0.5">{m.defense_argument}</p>
                      </div>
                    ))
                  ) : <p className="text-sm text-gray-400 italic">No missing evidence patterns found.</p>}
                </SectionCard>

                <SectionCard title="Recommendations" icon="📌" accent="purple">
                  <ul className="space-y-2">
                    {data.recommendations?.map((r, i) => (
                      <li key={i} className="text-sm text-gray-700 flex gap-2">
                        <span className="text-purple-500 font-bold mt-0.5">{i + 1}.</span>
                        <span>{r}</span>
                      </li>
                    ))}
                  </ul>
                </SectionCard>

                <SectionCard title="Entities Detected" icon="🔗" accent="gray">
                  {Object.entries(data.entities || {}).map(([type, items]) =>
                    items.length > 0 ? (
                      <div key={type} className="mb-3">
                        <p className="text-xs font-bold text-gray-500 uppercase mb-1">{type}</p>
                        <div className="flex flex-wrap gap-1">
                          {items.map((item, i) => (
                            <span key={i} className="text-xs bg-gray-100 text-gray-700 px-2 py-0.5 rounded-full">{item}</span>
                          ))}
                        </div>
                      </div>
                    ) : null
                  )}
                </SectionCard>
              </div>
            )}

            {/* Tab: Defense Arguments */}
            {activeTab === 'arguments' && (
              <SectionCard title="Defense Arguments with Citations" icon="⚖️" accent="blue">
                {data.defense_arguments?.length > 0 ? (
                  data.defense_arguments.map((item, i) => (
                    <ArgumentCard key={i} item={item} index={i} />
                  ))
                ) : <p className="text-sm text-gray-400 italic">No defense arguments generated.</p>}
              </SectionCard>
            )}

            {/* Tab: Evidence */}
            {activeTab === 'evidence' && (
              <>
                <SectionCard title="Evidence Found in B-Report" icon="📦" accent="green">
                  {data.evidence_found?.length > 0 ? (
                    <div className="flex flex-wrap">
                      {data.evidence_found.map((e, i) => <EvidenceChip key={i} item={e} />)}
                    </div>
                  ) : <p className="text-sm text-gray-400 italic">No specific evidence types detected.</p>}
                </SectionCard>
                <SectionCard title="Missing Evidence Analysis" icon="🔎" accent="red">
                  {data.missing_evidence?.map((m, i) => (
                    <div key={i} className="mb-4 last:mb-0 border-b border-gray-100 pb-4">
                      <p className="font-semibold text-sm text-red-700">{m.detected_word}</p>
                      {m.original_sentence && <p className="text-xs italic text-gray-500 mt-1 bg-gray-50 p-2 rounded">"{m.original_sentence}"</p>}
                      <p className="text-sm text-gray-700 mt-2">{m.defense_argument}</p>
                    </div>
                  ))}
                </SectionCard>
              </>
            )}

            {/* Tab: Sinhala */}
            {activeTab === 'sinhala' && (
              <SectionCard title="සිංහල නීතිමය විශ්ලේෂණය" icon="🇱🇰" accent="purple">
                <div className="prose prose-sm max-w-none">
                  {data.sinhala_analysis?.split('\n').map((line, i) => (
                    line.trim() ? (
                      <p key={i} className={`text-sm leading-relaxed mb-2 ${line.startsWith('**') ? 'font-bold text-gray-900' : 'text-gray-700'}`}>
                        {line.replace(/\*\*/g, '')}
                      </p>
                    ) : <br key={i} />
                  ))}
                </div>
              </SectionCard>
            )}

            {/* Tab: Extracted Text */}
            {activeTab === 'text' && (
              <SectionCard title="Extracted B-Report Text" icon="📄" accent="gray">
                <pre className="text-xs text-gray-700 bg-gray-50 rounded p-4 overflow-auto max-h-[500px] whitespace-pre-wrap font-mono leading-relaxed">
                  {data.extracted_text}
                </pre>
              </SectionCard>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
