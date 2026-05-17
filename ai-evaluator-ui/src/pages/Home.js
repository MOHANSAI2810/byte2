import { useEffect, useState } from "react";
import { examsAPI } from "../api";
import { useAuth } from "../context/AuthContext";

export default function Home({ onCreateExam, onViewExam }) {
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);
  const { logout } = useAuth();

  useEffect(() => {
    examsAPI.getAll()
      .then((data) => setExams(Array.isArray(data) ? data : []))
      .catch(() => setExams([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div style={styles.container}>
      {/* Premium Glass Header */}
      <header style={{...styles.header, margin: '20px auto'}} className="glass-card-inner">
        <div style={styles.headerInner}>
          <div style={styles.logoRow}>
            <div style={styles.logoBadge}>✦</div>
            <div>
              <div className="text-gradient" style={styles.logoTitle}>Teacher Dashboard</div>
              <div style={styles.logoSub}>Ready to evaluate incoming papers</div>
            </div>
          </div>
          <div style={{ display: "flex", gap: 12 }}>
            <button className="btn-premium-primary" onClick={onCreateExam}>
              + New Evaluation
            </button>
            <button className="btn-premium-secondary" onClick={logout}>
              Sign Out
            </button>
          </div>
        </div>
      </header>

      <main style={styles.main}>
        {/* Stats Grid */}
        <div style={styles.statsGrid}>
          {[
            { label: "Active Sessions", value: exams.length, color: 'text-gradient-blue' },
            { label: "Data Points Processed", value: "842", color: 'text-gradient' },
            { label: "System Latency", value: "0.02ms", color: 'text-gradient' },
          ].map((s) => (
            <div key={s.label} className="glass-card-premium" style={styles.statCard}>
              <div style={styles.statLabel}>{s.label}</div>
              <div className={s.color} style={styles.statValue}>
                {s.value}
              </div>
            </div>
          ))}
        </div>

        {/* Exams Section */}
        <div style={styles.section}>
          <div style={styles.sectionHeader}>
            <h2 className="text-gradient" style={styles.sectionTitle}>Recent Evaluations</h2>
            <span style={styles.badge}>{exams.length} Items</span>
          </div>

          {loading ? (
            <div style={styles.empty}>Synchronizing secure data...</div>
          ) : exams.length === 0 ? (
            <div className="glass-card-premium" style={styles.emptyCard}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>📂</div>
              <div style={{ fontWeight: 700, fontSize: 18, marginBottom: 6 }}>No Active Sessions Found</div>
              <div style={{ color: "var(--text-dim)", fontSize: 14, marginBottom: 20 }}>
                Please initialize a new evaluation sequence to begin processing papers.
              </div>
              <button className="btn-premium-primary" onClick={onCreateExam}>
                Initialize Session
              </button>
            </div>
          ) : (
            <div style={styles.examGrid}>
              {exams.map((exam) => (
                <div
                  key={exam.id}
                  className="glass-card-premium"
                  style={styles.examCard}
                  onClick={() => onViewExam(exam.id)}
                >
                  <div style={styles.examCardTop}>
                    <div style={styles.subjectBadge}>{exam.subject || "No Subject"}</div>
                    <span style={styles.examDate}>
                      {exam.created_at
                        ? new Date(exam.created_at).toLocaleDateString()
                        : "Unknown Date"}
                    </span>
                  </div>
                  <div style={styles.examTitle}>{exam.title || "Untitled Module"}</div>
                  <div style={styles.examMeta}>Target Class: {exam.student_class || "N/A"}</div>
                  <div style={styles.examFooter}>
                    <span style={styles.marksTag}>
                      <span style={{color: '#4ce1ff', marginRight: '4px'}}>📑</span> {exam.questions?.length || 0} Built-in Questions
                    </span>
                    <span style={styles.viewLink}>Access Report <span>›</span></span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

const styles = {
  container: { position: 'relative', zIndex: 1, minHeight: '100vh', padding: '0 24px' },
  header: {
    maxWidth: 1100,
    position: "sticky", top: 20, zIndex: 50,
  },
  headerInner: {
    display: "flex", alignItems: "center", justifyContent: "space-between",
    padding: "16px 24px",
  },
  logoRow: { display: "flex", alignItems: "center", gap: 14 },
  logoBadge: {
    width: "40px", height: "40px",
    background: "linear-gradient(135deg, #2a6dff, #4ce1ff)",
    borderRadius: "12px",
    display: "flex", alignItems: "center", justifyContent: "center",
    fontSize: 20, boxShadow: "0 4px 15px rgba(42, 109, 255, 0.4)",
  },
  logoTitle: { fontWeight: 800, fontSize: 18, fontFamily: 'Outfit' },
  logoSub: { color: "var(--text-dim)", fontSize: 12, marginTop: 2 },
  main: { maxWidth: 1100, margin: "0 auto", padding: "40px 0" },
  statsGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 20, marginBottom: 50 },
  statCard: {
    padding: "24px 30px", display: 'flex', flexDirection: 'column', gap: 12
  },
  statLabel: { color: "var(--text-dim)", fontSize: 13, fontWeight: 600 },
  statValue: { fontSize: 36, fontWeight: 800, fontFamily: 'Outfit' },
  sectionHeader: { display: "flex", alignItems: "center", gap: 16, marginBottom: 30 },
  sectionTitle: { fontSize: 24, fontWeight: 800, margin: 0, fontFamily: 'Outfit' },
  badge: {
    color: "#fff", background: "rgba(255,255,255,0.1)", backdropFilter: 'blur(10px)',
    borderRadius: "100px", border: "1px solid rgba(255,255,255,0.2)",
    padding: "4px 12px", fontSize: 12, fontWeight: 600
  },
  empty: { textAlign: "center", padding: 60, color: "var(--text-dim)", fontSize: 15 },
  emptyCard: {
    padding: "80px 24px",
    textAlign: "center",
  },
  examGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(340px,1fr))", gap: 24 },
  examCard: {
    cursor: "pointer", display: 'flex', flexDirection: 'column', gap: 16, padding: '24px', transition: 'all 0.3s ease'
  },
  examCardTop: { display: "flex", justifyContent: "space-between", alignItems: "center" },
  subjectBadge: {
    color: '#fff', background: 'linear-gradient(135deg, rgba(42,109,255,0.2), rgba(76,225,255,0.2))',
    border: '1px solid rgba(76,225,255,0.3)',
    borderRadius: '6px',
    padding: '4px 10px',
    fontSize: 11, fontWeight: 600
  },
  examDate: { color: "var(--text-dim)", fontSize: 12 },
  examTitle: { color: "#fff", fontWeight: 800, fontSize: 20, fontFamily: 'Outfit' },
  examMeta: { color: "var(--text-dim)", fontSize: 13 },
  examFooter: { display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: 16, marginTop: 'auto' },
  marksTag: { color: "var(--text-dim)", fontSize: 13, fontWeight: 500, display: 'flex', alignItems: 'center' },
  viewLink: { fontSize: 13, fontWeight: 700, color: '#4ce1ff', display: 'flex', alignItems: 'center', gap: '4px' },
};
