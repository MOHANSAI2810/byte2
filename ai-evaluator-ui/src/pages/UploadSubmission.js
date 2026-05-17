import { useState, useRef } from "react";
import { submissionsAPI } from "../api";

export default function UploadSubmission({ examId, onBack, onGraded }) {
  const [studentName, setStudentName] = useState("");
  const [roll, setRoll] = useState("");
  const [files, setFiles] = useState([]);  // Changed to array
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState("");
  const [drag, setDrag] = useState(false);
  const fileRef = useRef();

  const handleDrop = (e) => {
    e.preventDefault();
    setDrag(false);
    const droppedFiles = Array.from(e.dataTransfer.files);
    if (droppedFiles.length > 0) {
      setFiles(prev => [...prev, ...droppedFiles]);
    }
  };

  const handleFileSelect = (e) => {
    const selectedFiles = Array.from(e.target.files);
    if (selectedFiles.length > 0) {
      setFiles(prev => [...prev, ...selectedFiles]);
    }
  };

  const removeFile = (index) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (files.length === 0) {
      setError("Please select at least one student answer sheet to upload.");
      return;
    }
    setLoading(true);
    setError("");
    setProgress(10);

    const interval = setInterval(() => {
      setProgress((p) => (p < 90 ? p + Math.random() * 10 : p));
    }, 500);

    try {
      const formData = new FormData();
      formData.append("exam_id", examId);
      formData.append("student_name", studentName);
      formData.append("student_roll", roll);
      
      // Append all files with the same field name "files"
      files.forEach((file) => {
        formData.append("files", file);
      });

      console.log(`Uploading ${files.length} file(s) for exam:`, examId);
      files.forEach((f, i) => console.log(`  File ${i + 1}: ${f.name}`));

      const uploadRes = await submissionsAPI.upload(formData);
      console.log("Upload response:", uploadRes);
      
      if (!uploadRes.submission_id) {
        throw new Error(uploadRes.detail || "Upload failed");
      }

      setProgress(50);

      const gradeRes = await submissionsAPI.grade({ submission_id: uploadRes.submission_id });
      console.log("Grade response:", gradeRes);
      
      clearInterval(interval);
      setProgress(100);

      if (gradeRes.report_id) {
        setTimeout(() => {
          onGraded(gradeRes.report_id);
        }, 500);
      } else {
        throw new Error(gradeRes.detail || "Grading failed - no report ID returned");
      }
    } catch (err) {
      clearInterval(interval);
      console.error("Upload/Grade error:", err);
      setError(err.message || "An error occurred during upload/grading");
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <header style={{...styles.header, margin: '20px auto'}} className="glass-card-inner">
        <div style={styles.headerInner}>
          <div style={styles.logoRow}>
            <div style={styles.logoBadge}>✦</div>
            <div>
              <h1 className="text-gradient" style={styles.title}>Submit Paper</h1>
              <p style={styles.subtitle}>Upload student answers for AI grading</p>
            </div>
          </div>
          <button className="btn-premium-secondary" onClick={onBack}>Cancel Upload</button>
        </div>
      </header>

      <main style={styles.main}>
        <div style={styles.card} className="glass-card-premium">
          <form onSubmit={handleSubmit} style={styles.form}>
            <div style={styles.grid2col}>
              <div style={styles.field}>
                <label style={styles.label}>Student Name</label>
                <input
                  style={styles.input}
                  placeholder="e.g., Alice Watson"
                  value={studentName}
                  onChange={(e) => setStudentName(e.target.value)}
                  required
                />
              </div>
              <div style={styles.field}>
                <label style={styles.label}>Roll No. / ID</label>
                <input
                  style={styles.input}
                  placeholder="e.g., 2026-X"
                  value={roll}
                  onChange={(e) => setRoll(e.target.value)}
                />
              </div>
            </div>

            <div style={styles.uploadBox}>
              <label style={styles.label}>Target Documents (PDF/IMG - Multiple files allowed)</label>
              <div
                className={drag ? "glass-card-inner" : ""}
                style={{
                  ...styles.dropZone,
                  borderColor: drag ? "#4ce1ff" : files.length > 0 ? "#4ade80" : "rgba(255,255,255,0.2)",
                  background: files.length > 0
                    ? "rgba(74,222,128,0.05)"
                    : drag
                    ? "rgba(76, 225, 255, 0.1)"
                    : "rgba(255,255,255,0.02)",
                }}
                onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
                onDragLeave={() => setDrag(false)}
                onDrop={handleDrop}
                onClick={() => fileRef.current.click()}
              >
                <input
                  type="file"
                  ref={fileRef}
                  style={{ display: "none" }}
                  onChange={handleFileSelect}
                  accept=".pdf,.jpg,.jpeg,.png,.webp"
                  multiple  // ✅ Added multiple attribute
                />
                <div style={styles.dropIcon}>
                  {files.length > 0 ? "✅" : "📁"}
                </div>
                <div style={styles.dropText} className={files.length > 0 ? "text-gradient-blue" : ""}>
                  {files.length > 0 ? `${files.length} file(s) selected` : "Click or Drag & Drop Files"}
                </div>
                <div style={styles.dropHint}>Handwritten or digital forms accepted. Select multiple files for multiple pages.</div>
              </div>
              
              {/* File list preview */}
              {files.length > 0 && (
                <div style={styles.fileList}>
                  <div style={styles.fileListTitle}>Selected Files:</div>
                  {files.map((file, idx) => (
                    <div key={idx} style={styles.fileItem}>
                      <span>📄 {file.name}</span>
                      <button
                        type="button"
                        style={styles.removeFileBtn}
                        onClick={() => removeFile(idx)}
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {loading && (
              <div style={styles.progressContainer}>
                <div style={styles.progressHeader}>
                  <span className="text-gradient" style={styles.progressLabel}>
                    Evaluating Student Logic...
                  </span>
                  <span style={styles.progressPct}>{Math.round(progress)}%</span>
                </div>
                <div style={styles.progressBar}>
                  <div
                    style={{
                      ...styles.progressFill,
                      width: `${progress}%`,
                    }}
                  />
                </div>
                <div style={styles.statusLog}>
                  {progress < 40 && "Extracting vectors and logic graphs..."}
                  {progress >= 40 && progress < 80 && "Running evaluation logic vs rubric..."}
                  {progress >= 80 && "Synthesizing full 6-section report..."}
                </div>
              </div>
            )}

            {error && <div style={styles.error}>Error: {error}</div>}

            <button
              className="btn-premium-primary"
              type="submit"
              disabled={loading || files.length === 0}
              style={{ ...styles.submitBtn, opacity: loading || files.length === 0 ? 0.6 : 1 }}
            >
              {loading ? "Processing Paper..." : `Grade ${files.length} Paper(s)`}
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}

const styles = {
  container: { position: 'relative', zIndex: 1, paddingBottom: '40px' },
  header: {
    maxWidth: 700,
    position: "sticky", top: 20, zIndex: 50,
  },
  headerInner: {
    display: "flex", alignItems: "center", justifyContent: "space-between",
    padding: "16px 20px",
  },
  logoRow: { display: "flex", alignItems: "center", gap: 14 },
  logoBadge: { 
    width: "40px", height: "40px",
    background: "linear-gradient(135deg, #2a6dff, #4ce1ff)",
    borderRadius: "12px",
    display: "flex", alignItems: "center", justifyContent: "center",
    fontSize: 20, boxShadow: "0 4px 15px rgba(42, 109, 255, 0.4)",
  },
  title: { fontSize: 20, fontWeight: 800, margin: 0, fontFamily: 'Outfit' },
  subtitle: { color: "var(--text-dim)", fontSize: 13, marginTop: 2 },
  main: { maxWidth: 700, margin: "0 auto", padding: "40px 0" },
  card: { padding: "40px", borderRadius: "24px" },
  form: { display: "flex", flexDirection: "column", gap: 32 },
  grid2col: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 },
  field: { display: "flex", flexDirection: "column", gap: 8 },
  label: { color: "#fff", fontSize: 13, fontWeight: 600 },
  input: {
    background: "rgba(255,255,255,0.05)",
    border: "1px solid rgba(255,255,255,0.15)",
    borderRadius: 8, padding: "14px 16px",
    color: "#fff", fontSize: 15, outline: "none",
    width: '100%', boxSizing: 'border-box', transition: 'border-color 0.3s ease'
  },
  uploadBox: { display: "flex", flexDirection: "column", gap: 12 },
  dropZone: {
    padding: "48px 20px", borderRadius: 12, border: '2px dashed',
    display: "flex", flexDirection: "column", alignItems: "center", gap: 14,
    cursor: "pointer", transition: 'all 0.3s ease',
  },
  dropIcon: { fontSize: 40 },
  dropText: { color: "#fff", fontWeight: 700, fontSize: 15 },
  dropHint: { color: "var(--text-dim)", fontSize: 13 },
  fileList: {
    marginTop: 12,
    padding: "12px",
    background: "rgba(255,255,255,0.03)",
    borderRadius: 8,
    border: "1px solid rgba(255,255,255,0.1)",
  },
  fileListTitle: {
    fontSize: 12,
    fontWeight: 600,
    color: "var(--text-dim)",
    marginBottom: 8,
  },
  fileItem: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "6px 8px",
    fontSize: 13,
    color: "#fff",
    borderBottom: "1px solid rgba(255,255,255,0.05)",
  },
  removeFileBtn: {
    background: "rgba(255,107,107,0.2)",
    border: "none",
    borderRadius: 4,
    color: "#ff6b6b",
    cursor: "pointer",
    padding: "2px 8px",
    fontSize: 12,
  },
  progressContainer: { marginTop: 16 },
  progressHeader: { display: "flex", justifyContent: "space-between", marginBottom: 10 },
  progressLabel: { fontSize: 14, fontWeight: 600 },
  progressPct: { color: "#4ce1ff", fontSize: 14, fontWeight: 800, fontFamily: 'Outfit' },
  progressBar: { height: 6, background: "rgba(255,255,255,0.05)", borderRadius: 3, overflow: "hidden" },
  progressFill: { height: "100%", background: "linear-gradient(90deg, #2a6dff, #4ce1ff)", transition: "width 0.3s ease" },
  statusLog: { color: "var(--text-dim)", fontSize: 13, marginTop: 12, fontStyle: 'italic' },
  error: { color: "#ff6b6b", background: "rgba(255, 107, 107, 0.1)", border: "1px solid rgba(255,107,107,0.2)", padding: "12px 16px", fontSize: 14, borderRadius: 8 },
  submitBtn: { padding: "16px", width: "100%", fontSize: 16 },
};