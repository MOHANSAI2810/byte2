import { useEffect, useState } from "react";
import { examsAPI, submissionsAPI } from "../api";

export default function ExamDetail({ examId, onBack, onUpload, onViewReport }) {
  const [exam, setExam] = useState(null);
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [examData, submissionsData] = await Promise.all([
          examsAPI.getById(examId),
          submissionsAPI.getByExam(examId)
        ]);
        setExam(examData);
        setSubmissions(Array.isArray(submissionsData) ? submissionsData : []);
      } catch (err) {
        console.error("Error fetching data:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [examId]);

  const fetchReportBySubmission = async (submissionId) => {
    try {
      const response = await fetch(`http://localhost:8000/api/reports/submission/${submissionId}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });
      const data = await response.json();
      if (data.id) {
        onViewReport(data.id);
      } else {
        alert("Report not found. Please try grading again.");
      }
    } catch (err) {
      console.error("Error fetching report:", err);
      alert("Error loading report: " + err.message);
    }
  };

  if (loading) return <div style={styles.center}>Synchronizing Dashboard Data...</div>;
  if (error) return <div style={styles.center} className="text-gradient-blue">Error: {error}</div>;
  if (!exam) return <div style={styles.center} className="text-gradient-blue">Error: Evaluation Module Not Found.</div>;

  return (
    <div style={styles.container}>
      <header style={{...styles.header, margin: '20px auto'}} className="glass-card-inner">
        <div style={styles.headerInner}>
          <div>
            <h1 className="text-gradient" style={styles.title}>{exam.title}</h1>
            <div style={styles.subtitleWrapper}>
              <span style={styles.badgeLabel}>Subject: {exam.subject}</span>
              <span style={styles.badgeLabel}>Class: {exam.class}</span>
              <span style={styles.badgeLabel}>Max Score: {exam.total_marks}</span>
            </div>
          </div>
          <div style={{ display: "flex", gap: 12 }}>
            <button className="btn-premium-secondary" onClick={onBack}>Module Select</button>
            <button className="btn-premium-primary" onClick={() => onUpload(examId)}>
              + Upload Paper
            </button>
          </div>
        </div>
      </header>

      <main style={styles.main}>
        {/* Submissions Section */}
        <section style={styles.card} className="glass-card-premium">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
            <div style={{display: 'flex', alignItems: 'center', gap: '12px'}}>
               <span style={{fontSize: 24}}>👥</span>
               <h2 style={styles.sectionTitle}>Evaluated Submissions</h2>
            </div>
            <span style={styles.countBadge}>{submissions.length} Total</span>
          </div>

          {submissions.length === 0 ? (
            <div style={styles.emptyBox}>
              <div style={{fontSize: 40, marginBottom: 12}}>📭</div>
              <div style={{fontWeight: 700, fontSize: 16, marginBottom: 6}}>No Submissions Yet</div>
              <div>Upload student papers to begin the AI grading process.</div>
            </div>
          ) : (
            <div style={{overflowX: 'auto'}}>
              <table style={styles.table}>
                <thead>
                  <tr style={styles.thead}>
                    {["Student Name", "Roll No.", "Status", "Action"].map((h) => (
                      <th key={h} style={styles.th}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {submissions.map((s, i) => (
                    <tr key={i} style={styles.tr}>
                      <td style={styles.td} className="text-gradient-blue">{s.student_name}</td>
                      <td style={styles.td}>{s.student_roll || "N/A"}</td>
                      <td style={styles.td}>
                        <span style={{
                          padding: '4px 12px',
                          borderRadius: '20px',
                          fontSize: '12px',
                          background: s.status === 'done' ? 'rgba(74,222,128,0.2)' : s.status === 'processing' ? 'rgba(76,225,255,0.2)' : 'rgba(251,191,36,0.2)',
                          color: s.status === 'done' ? '#4ade80' : s.status === 'processing' ? '#4ce1ff' : '#fbbf24'
                        }}>
                          {s.status || "pending"}
                        </span>
                      </td>
                      <td style={styles.td}>
                        <button
                          className="btn-premium-secondary"
                          style={{padding: '8px 16px', fontSize: '13px'}}
                          onClick={() => fetchReportBySubmission(s.id)}
                          disabled={s.status !== 'done'}
                        >
                          View Report
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* Questions Section */}
        <section style={styles.card} className="glass-card-premium">
          <div style={{display: 'flex', alignItems: 'center', gap: '12px', marginBottom: 24}}>
             <span style={{fontSize: 24}}>📝</span>
             <h2 style={styles.sectionTitle}>Logic Core Questions</h2>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {(exam.questions || []).map((q, i) => (
              <div key={i} style={styles.qRow} className="glass-card-inner">
                <div style={styles.qHeaderGroup}>
                  <span style={styles.qNo}>Q{q.q_no || i + 1}</span>
                  <span style={styles.marksBadge}>{q.max_marks} Pts</span>
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ color: "#fff", fontSize: 15, fontWeight: 500, marginBottom: 8 }}>{q.question}</div>
                  <div style={{ color: "var(--text-dim)", fontSize: 13, background: 'rgba(0,0,0,0.2)', padding: '12px', borderRadius: '8px' }}>
                    <strong>Expected Logic:</strong> {q.expected_answer}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}

const styles = {
  container: { position: 'relative', zIndex: 1, paddingBottom: '60px' },
  center: { display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh", fontSize: 18, color: 'var(--text-dim)', fontWeight: 500 },
  header: {
    maxWidth: 1100,
    position: "sticky", top: 20, zIndex: 50,
  },
  headerInner: {
    display: "flex", alignItems: "center", justifyContent: "space-between",
    padding: "20px 30px", flexWrap: "wrap", gap: 20,
  },
  title: { fontSize: 28, fontWeight: 800, margin: '0 0 12px', fontFamily: 'Outfit' },
  subtitleWrapper: { display: "flex", gap: 10, flexWrap: 'wrap' },
  badgeLabel: {
    background: 'rgba(255,255,255,0.08)',
    border: '1px solid rgba(255,255,255,0.15)',
    padding: '4px 12px',
    borderRadius: '20px',
    fontSize: 12,
    fontWeight: 600,
    color: '#b8c1ec'
  },
  countBadge: {
    background: 'linear-gradient(135deg, #2a6dff, #4ce1ff)',
    color: '#fff', padding: '6px 16px', borderRadius: '30px', fontWeight: 700, fontSize: 14,
    boxShadow: '0 4px 15px rgba(42, 109, 255, 0.4)'
  },
  main: { maxWidth: 1100, margin: "0 auto", padding: "40px 0", display: "flex", flexDirection: "column", gap: 30 },
  card: { padding: "40px" },
  sectionTitle: { fontWeight: 800, fontSize: 22, margin: 0, fontFamily: 'Outfit' },
  qRow: {
    display: "flex", alignItems: "flex-start", gap: 24,
    padding: "24px",
    background: "rgba(255, 255, 255, 0.03)",
  },
  qHeaderGroup: {
    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', minWidth: '60px'
  },
  qNo: {
    fontSize: 20, fontWeight: 800, fontFamily: 'Outfit', color: '#4ce1ff'
  },
  marksBadge: {
    color: "var(--text-dim)", fontSize: 12, fontWeight: 600, background: 'rgba(255,255,255,0.1)', padding: '2px 8px', borderRadius: '10px'
  },
  emptyBox: {
    color: "var(--text-dim)", textAlign: "center",
    padding: "60px 24px", fontSize: 14,
    border: "2px dashed rgba(255,255,255,0.1)", borderRadius: '16px'
  },
  table: { width: "100%", borderCollapse: "collapse" },
  thead: { borderBottom: "1px solid rgba(255,255,255,0.1)" },
  th: { padding: "16px", color: "var(--text-dim)", fontSize: 12, fontWeight: 600, textAlign: "left", textTransform: 'uppercase', letterSpacing: '0.05em' },
  tr: { borderBottom: "1px solid rgba(255,255,255,0.05)", transition: 'background 0.2s ease' },
  td: { padding: "20px 16px", color: "#b8c1ec", fontSize: 14, verticalAlign: "middle" },
};