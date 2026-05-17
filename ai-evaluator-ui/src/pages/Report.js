import { useEffect, useState } from "react";
import { reportsAPI } from "../api";

export default function Report({ reportId, onBack }) {
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    reportsAPI.getById(reportId)
      .then(setReport)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [reportId]);

  const downloadPDF = async () => {
    try {
      const blob = await reportsAPI.downloadPDF(reportId);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `report-${reportId}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Error downloading PDF:", err);
      alert("Failed to download PDF report: " + err.message);
    }
  };

  const downloadHTML = async () => {
    try {
      const blob = await reportsAPI.downloadHTML(reportId);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `report-${reportId}.html`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Error downloading HTML:", err);
      alert("Failed to download HTML report: " + err.message);
    }
  };

  const getVerdict = (pct) => {
    if (pct >= 90) return { label: "Exceptional", color: "#4de89d", bg: "rgba(77, 232, 157, 0.1)", border: "rgba(77, 232, 157, 0.2)" };
    if (pct >= 75) return { label: "High Proficiency", color: "#60a5fa", bg: "rgba(96, 165, 250, 0.1)", border: "rgba(96, 165, 250, 0.2)" };
    if (pct >= 60) return { label: "Standard", color: "#a78bfa", bg: "rgba(167, 139, 250, 0.1)", border: "rgba(167, 139, 250, 0.2)" };
    if (pct >= 40) return { label: "Needs Practice", color: "#fbbf24", bg: "rgba(251, 191, 36, 0.1)", border: "rgba(251, 191, 36, 0.2)" };
    return { label: "Critical Support", color: "#ff6b6b", bg: "rgba(255, 107, 107, 0.1)", border: "rgba(255, 107, 107, 0.2)" };
  };

  if (loading) return <div style={styles.center} className="text-gradient">Generating Analytics...</div>;
  if (error) return <div style={styles.center} style={{color: '#ff6b6b'}}>Error loading report: {error}</div>;
  if (!report) return null;

  const pct = report.percentage || 0;
  const verdict = getVerdict(pct);
  const breakdown = report.score_breakdown || [];

  return (
    <div style={styles.container}>
      {/* Header */}
      <header style={{...styles.header, margin: '20px auto'}} className="glass-card-inner">
        <div style={styles.headerInner}>
          <div>
            <h1 className="text-gradient" style={styles.title}>Student Evaluation Report</h1>
            <p style={styles.subtitle}>
              Student: <span style={{color: '#fff', fontWeight: 600}}>{report.student_name || "Unknown"}</span> · Module: {report.subject || "Assessment Target"}
            </p>
          </div>
          <div style={{ display: "flex", gap: 12 }}>
            <button className="btn-premium-secondary" onClick={onBack}>Go Back</button>
            <button className="btn-premium-secondary" onClick={downloadHTML}>
              <svg className="h-4 w-4 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ display: 'inline', verticalAlign: 'middle' }}>
                <path d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}/>
              </svg>
              Export HTML
            </button>
            <button className="btn-premium-primary" onClick={downloadPDF}>
              <svg className="h-4 w-4 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ display: 'inline', verticalAlign: 'middle' }}>
                <path d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}/>
              </svg>
              Export PDF
            </button>
          </div>
        </div>
      </header>

      <main style={styles.main}>
        {/* Score cards */}
        <div style={styles.statsGrid}>
          <div style={styles.statCard} className="glass-card-premium">
            <div style={styles.statLabel}>Total Marks Awarded</div>
            <div style={{...styles.statVal, color: '#fff'}}>
              {report.total_score}
              <span style={{ color: "var(--text-dim)", fontSize: 24, fontWeight: 600 }}>
                {" "}/ {report.max_score}
              </span>
            </div>
          </div>
          <div style={styles.statCard} className="glass-card-premium">
            <div style={styles.statLabel}>Accuracy Percentage</div>
            <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
              <span style={styles.statVal} className={pct >= 60 ? "text-gradient-blue" : ""}>{pct}%</span>
              <div style={styles.progressBg}>
                <div style={{ ...styles.progressFill, width: `${pct}%`, background: verdict.color }} />
              </div>
            </div>
          </div>
          <div style={styles.statCard} className="glass-card-premium">
            <div style={styles.statLabel}>Overall Verdict</div>
            <div style={{ ...styles.statVal, color: verdict.color, fontSize: 28 }}>
              {verdict.label}
            </div>
          </div>
        </div>

        {/* Score breakdown table */}
        <section style={styles.card} className="glass-card-premium">
          <div style={styles.tableHead}>
            <h2 style={styles.sectionTitle}>Question Breakdown</h2>
            <span style={styles.badge}>{breakdown.length} Evaluated Items</span>
          </div>
          <div style={{ overflowX: "auto", borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)' }}>
            <table style={styles.table}>
              <thead>
                <tr style={styles.thead}>
                  {["Q#", "Marks Awarded", "Total Marks", "Rating", "AI Feedback Logic"].map((h) => (
                    <th key={h} style={styles.th}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {breakdown.map((q, i) => {
                  const qPct = q.max_marks ? (q.score / q.max_marks) * 100 : 0;
                  const qv = getVerdict(qPct);
                  return (
                    <tr key={i} style={styles.tr}>
                      <td style={{...styles.td, fontWeight: 700, color: '#fff'}}>Q{String(q.q_no || i + 1)}</td>
                      <td style={{ ...styles.td, fontWeight: 800, color: "#fff" }}>{q.score}</td>
                      <td style={{ ...styles.td, color: "var(--text-dim)" }}>{q.max_marks}</td>
                      <td style={styles.td}>
                        <span style={{
                          background: qv.bg, color: qv.color,
                          border: `1px solid ${qv.border}`,
                          borderRadius: 6, padding: "4px 10px",
                          fontSize: 12, fontWeight: 600,
                        }}>
                          {qv.label}
                        </span>
                      </td>
                      <td style={{ ...styles.td, color: "var(--text-dim)", maxWidth: 350, fontSize: 13, lineHeight: 1.5 }}>
                        {q.feedback || q.remarks || "No feedback generated."}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>

        {/* Analytics grid */}
        <div style={styles.grid2}>
          {/* Performance analytics */}
          <section style={styles.card} className="glass-card-premium">
            <h2 className="text-gradient" style={styles.sectionTitle}>Cognitive Analysis</h2>
            <div style={{ display: "flex", flexDirection: "column", gap: 24, marginTop: 24 }}>
              <div>
                <h3 style={styles.analyticsLabel}>Concept Gaps</h3>
                <p style={styles.analyticsText}>{report.concept_gaps || "No specific gaps were flagged in this assessment."}</p>
              </div>
              <div>
                <h3 style={styles.analyticsLabel}>Performance Optimization</h3>
                <p style={styles.analyticsText}>{report.improvement_tips || "Maintain current level of detail."}</p>
              </div>
            </div>
          </section>

          {/* Performance trend */}
          <section style={styles.card} className="glass-card-premium">
            <h2 className="text-gradient" style={styles.sectionTitle}>Temporal Performance</h2>
            <p style={{ ...styles.analyticsText, marginTop: 16 }}>
              {report.performance_trend || "Insufficient historical data points to chart an accurate ongoing trend."}
            </p>
            <div style={styles.mockChart}>
              {[40, 55, 65, 80, pct].map((h, i) => (
                <div
                  key={i}
                  style={{
                    flex: 1,
                    height: `${h}%`,
                    background: i === 4 ? "linear-gradient(0deg, #d866ff, #4ce1ff)" : "rgba(255,255,255,0.05)",
                    borderTopLeftRadius: '6px',
                    borderTopRightRadius: '6px',
                  }}
                />
              ))}
            </div>
            <p style={{ color: "var(--text-dim)", fontSize: 11, textAlign: "center", textTransform: "uppercase", letterSpacing: "1px", marginTop: 16, fontWeight: 600 }}>
              Recent Score History
            </p>
          </section>
        </div>

        {/* Writing quality */}
        <section style={styles.card} className="glass-card-premium">
          <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 20 }}>
            <div style={styles.iconBox} className="text-gradient-blue">✏️</div>
            <h2 style={{ ...styles.sectionTitle, margin: 0 }}>Linguistic & Graphology Metrics</h2>
          </div>
          <p style={styles.analyticsText}>{report.writing_quality || "Writing quality data is unavailable for this format."}</p>
        </section>

        {/* Parent summary */}
        <section style={styles.parentCard} className="glass-card-inner">
          <h2 style={{ fontWeight: 800, fontSize: 20, marginBottom: 16, color: '#d866ff', fontFamily: 'Outfit' }}>
            Parent Take-Home Summary
          </h2>
          <p style={{ color: "#fff", lineHeight: 1.8, fontStyle: "italic", fontSize: 15 }}>
            "{report.parent_summary || "Student demonstrates a solid baseline understanding. Continue with normal pedagogy."}"
          </p>
        </section>

        <footer style={styles.footer}>
          &copy; 2026 AI Paper Evaluator // High-Fidelity Analytics Generation
        </footer>
      </main>
    </div>
  );
}

const styles = {
  container: { position: 'relative', zIndex: 1, paddingBottom: '40px' },
  center: { display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh", fontSize: 20, fontWeight: 700 },
  header: {
    maxWidth: 1200,
    position: "sticky", top: 20, zIndex: 50,
  },
  headerInner: {
    display: "flex", alignItems: "center", justifyContent: "space-between",
    padding: "20px 24px",
    flexWrap: "wrap", gap: 16,
  },
  title: { fontSize: 26, fontWeight: 800, margin: 0, fontFamily: 'Outfit' },
  subtitle: { color: "var(--text-dim)", fontSize: 14, marginTop: 4 },
  main: { maxWidth: 1200, margin: "0 auto", padding: "40px 0", display: "flex", flexDirection: "column", gap: 30 },
  statsGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 24 },
  statCard: { padding: "30px" },
  statLabel: { color: "var(--text-dim)", fontSize: 13, fontWeight: 700, marginBottom: 16, textTransform: 'uppercase', letterSpacing: '0.05em' },
  statVal: { color: "#fff", fontSize: 44, fontWeight: 800, fontFamily: 'Outfit' },
  progressBg: { height: 8, flex: 1, background: "rgba(255,255,255,0.05)", borderRadius: 4, overflow: "hidden" },
  progressFill: { height: "100%", borderRadius: 4, transition: 'width 0.5s ease' },
  card: { padding: "40px" },
  tableHead: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 },
  sectionTitle: { fontWeight: 800, fontSize: 22, margin: 0, fontFamily: 'Outfit' },
  badge: {
    background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.15)",
    padding: "6px 14px", fontSize: 13, fontWeight: 600, borderRadius: '20px'
  },
  table: { width: "100%", borderCollapse: "collapse" },
  thead: { background: "rgba(255, 255, 255, 0.05)", borderBottom: "1px solid rgba(255,255,255,0.1)" },
  th: { padding: "16px 20px", color: "#b8c1ec", fontSize: 12, fontWeight: 700, textAlign: "left", textTransform: 'uppercase', letterSpacing: '0.05em' },
  tr: { borderBottom: "1px solid rgba(255,255,255,0.05)" },
  td: { padding: "20px", color: "var(--text-dim)", fontSize: 14, verticalAlign: "middle" },
  grid2: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(400px, 1fr))", gap: 30 },
  analyticsLabel: { color: "#fff", fontSize: 14, fontWeight: 700, marginBottom: 10 },
  analyticsText: { color: "var(--text-dim)", fontSize: 15, lineHeight: 1.6, margin: 0 },
  mockChart: { display: "flex", alignItems: "flex-end", gap: 10, height: 120, marginTop: 30, background: 'rgba(255,255,255,0.02)', padding: '20px 20px 0', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '12px' },
  iconBox: {
    borderRadius: 12, width: 48, height: 48,
    display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24,
    background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)'
  },
  parentCard: {
    background: "rgba(216, 102, 255, 0.05)",
    border: "1px solid rgba(216, 102, 255, 0.2)",
    padding: "40px",
  },
  footer: {
    textAlign: "center", color: "rgba(255,255,255,0.3)",
    fontSize: 13, paddingBottom: 30, paddingTop: 30, borderTop: '1px solid rgba(255,255,255,0.05)'
  },
};