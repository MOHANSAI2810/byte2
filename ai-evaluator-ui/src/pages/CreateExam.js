import { useState, useRef } from "react";
import { examsAPI } from "../api";

// ── Multi-file Upload Drop Zone ──────────────────────────────────────────
function MultiDropZone({ label, icon, files, onFiles }) {
  const ref = useRef();
  const [drag, setDrag] = useState(false);

  const handle = (fileList) => {
    if (!fileList || fileList.length === 0) return;
    const validFiles = Array.from(fileList).filter(f => 
      ["application/pdf", "image/jpeg", "image/png", "image/webp"].includes(f.type)
    );
    if (validFiles.length > 0) {
      onFiles(prev => [...prev, ...validFiles]);
    }
  };

  const removeFile = (index) => {
    onFiles(prev => prev.filter((_, i) => i !== index));
  };

  return (
    <div>
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
        onDrop={(e) => { e.preventDefault(); setDrag(false); handle(e.dataTransfer.files); }}
        onClick={() => ref.current.click()}
      >
        <input
          ref={ref}
          type="file"
          accept=".pdf,.jpg,.jpeg,.png,.webp"
          multiple
          style={{ display: "none" }}
          onChange={(e) => handle(e.target.files)}
        />
        <div style={styles.dropIcon}>{files.length > 0 ? "✅" : icon}</div>
        <div style={styles.dropLabel}>{label}</div>
        {files.length > 0 ? (
          <div style={styles.dropFileName} className="text-gradient-blue">{files.length} file(s) selected</div>
        ) : (
          <div style={styles.dropHint}>Click or Drag & Drop (Multiple PDF/IMG allowed)</div>
        )}
      </div>
      
      {files.length > 0 && (
        <div style={styles.fileListContainer}>
          {files.map((file, idx) => (
            <div key={idx} style={styles.fileListItem}>
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
  );
}

// ── Question Editor Component with Choice Support ──────────────────────────
function QuestionEditor({ question, index, updateQuestion, removeQuestion, isLast }) {
  const [hasChoices, setHasChoices] = useState(question.has_choices || false);
  const [choices, setChoices] = useState(question.choices || [{ choice_text: "", expected_answer: "", keywords: [] }]);

  const addChoice = () => {
    const newChoices = [...choices, { choice_text: "", expected_answer: "", keywords: [] }];
    setChoices(newChoices);
    updateQuestion(index, "choices", newChoices);
    updateQuestion(index, "has_choices", true);
  };

  const updateChoice = (choiceIdx, field, value) => {
    const updatedChoices = [...choices];
    updatedChoices[choiceIdx][field] = value;
    setChoices(updatedChoices);
    updateQuestion(index, "choices", updatedChoices);
  };

  const removeChoice = (choiceIdx) => {
    const updatedChoices = choices.filter((_, i) => i !== choiceIdx);
    setChoices(updatedChoices);
    updateQuestion(index, "choices", updatedChoices);
    if (updatedChoices.length === 0) {
      setHasChoices(false);
      updateQuestion(index, "has_choices", false);
    }
  };

  const toggleHasChoices = (value) => {
    setHasChoices(value);
    updateQuestion(index, "has_choices", value);
    if (!value) {
      setChoices([]);
      updateQuestion(index, "choices", []);
    } else if (choices.length === 0) {
      const defaultChoices = [{ choice_text: "", expected_answer: "", keywords: [] }];
      setChoices(defaultChoices);
      updateQuestion(index, "choices", defaultChoices);
    }
  };

  return (
    <div style={styles.questionCard} className="glass-card-inner">
      <div style={styles.qCardHead}>
        <span style={styles.qBadge}>Q{index + 1}</span>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <label style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <input
              type="checkbox"
              checked={hasChoices}
              onChange={(e) => toggleHasChoices(e.target.checked)}
            />
            <span style={styles.labelSm}>Has Internal Choices (OR)</span>
          </label>
          <span style={styles.label}>Marks:</span>
          <input
            style={{ ...styles.input, width: 80, padding: "8px", textAlign: "center" }}
            type="number"
            value={question.marks}
            onChange={(e) => updateQuestion(index, "marks", e.target.value)}
            placeholder="Pts"
          />
          {!isLast && (
            <button className="btn-premium-secondary" style={{ padding: '8px 14px' }} onClick={() => removeQuestion(index)}>
              Remove
            </button>
          )}
        </div>
      </div>

      {!hasChoices ? (
        <>
          <div style={styles.field}>
            <label style={styles.labelSm}>Question Text</label>
            <textarea
              style={styles.textarea}
              placeholder="Enter the question text..."
              value={question.question}
              onChange={(e) => updateQuestion(index, "question", e.target.value)}
            />
          </div>
          <div style={styles.answerBox}>
            <label style={styles.answerLabel}>Expected Answer</label>
            <textarea
              style={{ ...styles.textarea, background: "rgba(255,255,255,0.02)", minHeight: 60 }}
              placeholder="Describe what the student must include..."
              value={question.expected_answer}
              onChange={(e) => updateQuestion(index, "expected_answer", e.target.value)}
            />
          </div>
        </>
      ) : (
        <>
          <div style={styles.field}>
            <label style={styles.labelSm}>Question Text (with choices)</label>
            <textarea
              style={styles.textarea}
              placeholder="e.g., Section C (Attempt any one): (a) Explain Newton's laws OR (b) Describe thermodynamics..."
              value={question.question}
              onChange={(e) => updateQuestion(index, "question", e.target.value)}
            />
          </div>
          
          <div style={styles.choicesContainer}>
            <label style={styles.labelSm}>Available Choices (Student can answer any one)</label>
            {choices.map((choice, choiceIdx) => (
              <div key={choiceIdx} style={styles.choiceCard} className="glass-card-inner">
                <div style={styles.choiceHeader}>
                  <span style={styles.choiceLabel}>Choice {String.fromCharCode(97 + choiceIdx)}</span>
                  {choices.length > 1 && (
                    <button
                      type="button"
                      style={styles.removeChoiceBtn}
                      onClick={() => removeChoice(choiceIdx)}
                    >
                      ✕
                    </button>
                  )}
                </div>
                <div style={styles.field}>
                  <label style={styles.labelSm}>Choice Text</label>
                  <textarea
                    style={{ ...styles.textarea, minHeight: 50 }}
                    placeholder="Enter the choice question..."
                    value={choice.choice_text}
                    onChange={(e) => updateChoice(choiceIdx, "choice_text", e.target.value)}
                  />
                </div>
                <div style={styles.answerBox}>
                  <label style={styles.answerLabel}>Expected Answer for this Choice</label>
                  <textarea
                    style={{ ...styles.textarea, background: "rgba(255,255,255,0.02)", minHeight: 60 }}
                    placeholder="Describe what the student must include for this choice..."
                    value={choice.expected_answer}
                    onChange={(e) => updateChoice(choiceIdx, "expected_answer", e.target.value)}
                  />
                </div>
              </div>
            ))}
            <button type="button" className="btn-premium-secondary" style={styles.addChoiceBtn} onClick={addChoice}>
              + Add Another Choice
            </button>
          </div>
        </>
      )}
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────

export default function CreateExam({ onBack, onCreated }) {
  const [form, setForm] = useState({
    title: "",
    subject: "",
    class_name: "",
    total_marks: "",
    passing_marks: "",
    strictness: "medium",
  });

  const [qFiles, setQFiles] = useState([]);
  const [aFiles, setAFiles] = useState([]);
  const [extracting, setExtracting] = useState(false);
  const [extractError, setExtractError] = useState("");
  const [extracted, setExtracted] = useState(false);

  const [questions, setQuestions] = useState([
    { question: "", expected_answer: "", marks: "", has_choices: false, choices: [] },
  ]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const extractQuestions = async () => {
    if (qFiles.length === 0 || aFiles.length === 0) {
      setExtractError("Please upload both Question Paper and Answer Key files.");
      return;
    }
    setExtracting(true);
    setExtractError("");

    try {
      const formData = new FormData();
      
      qFiles.forEach((file) => {
        formData.append("question_papers", file);
      });
      
      aFiles.forEach((file) => {
        formData.append("answer_keys", file);
      });

      const res = await examsAPI.extractQuestions(formData);

      if (res.detail) {
        throw new Error(res.detail);
      }

      if (!res.questions || res.questions.length === 0)
        throw new Error("No questions were extracted. Please check the documents.");

      setQuestions(res.questions.map((q) => ({
        question: q.question || "",
        expected_answer: q.expected_answer || "",
        marks: String(q.max_marks || 4),
        has_choices: q.has_choices || false,
        choices: q.choices || []
      })));
      setExtracted(true);
    } catch (err) {
      setExtractError("Extraction failed: " + (err.message || "Unknown error"));
    } finally {
      setExtracting(false);
    }
  };

  const addQuestion = () =>
    setQuestions([...questions, { question: "", expected_answer: "", marks: "", has_choices: false, choices: [] }]);

  const removeQuestion = (i) =>
    setQuestions(questions.filter((_, idx) => idx !== i));

  const updateQuestion = (i, field, value) => {
    const updated = [...questions];
    updated[i][field] = value;
    setQuestions(updated);
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError("");
    try {
      const payload = {
        title: form.title,
        subject: form.subject,
        class_name: form.class_name,
        total_marks: Number(form.total_marks),
        questions: questions.map((q, i) => {
          const { marks, ...rest } = q;
          return {
            ...rest,
            q_no: i + 1,
            max_marks: Number(marks),
          };
        }),
      };
      const res = await examsAPI.create(payload);
      if (res.id) {
        onCreated?.(res.id);
      } else {
        throw new Error(res.detail || JSON.stringify(res));
      }
    } catch (err) {
      setError(err.message);
    } finally {
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
              <h1 className="text-gradient" style={styles.logoTitle}>Create Session</h1>
              <p style={styles.logoSub}>Configure evaluation parameters</p>
            </div>
          </div>
          <div style={{ display: "flex", gap: 12 }}>
            <button className="btn-premium-secondary" onClick={onBack}>Cancel Form</button>
            <button className="btn-premium-primary" onClick={handleSubmit} disabled={loading}>
              {loading ? "Saving Session..." : "Confirm & Save"}
            </button>
          </div>
        </div>
      </header>

      <main style={styles.main}>
        <section style={styles.card} className="glass-card-premium">
          <div style={styles.sectionHead}>
            <span style={{ fontSize: 24 }}>📋</span>
            <h2 style={styles.sectionTitle}>General Details</h2>
          </div>
          <div style={styles.grid2col}>
            <div style={{ gridColumn: "1 / -1" }}>
              <label style={styles.label}>Evaluation Title</label>
              <input
                style={styles.input}
                placeholder="e.g., Midterm Biology Exam"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
              />
            </div>
            <div>
              <label style={styles.label}>Subject</label>
              <input
                style={styles.input}
                placeholder="e.g., Biology 101"
                value={form.subject}
                onChange={(e) => setForm({ ...form, subject: e.target.value })}
              />
            </div>
            <div>
              <label style={styles.label}>Target Class</label>
              <input
                style={styles.input}
                placeholder="e.g., Grade 10"
                value={form.class_name}
                onChange={(e) => setForm({ ...form, class_name: e.target.value })}
              />
            </div>
            <div>
              <label style={styles.label}>Total Marks</label>
              <input
                style={styles.input}
                type="number"
                placeholder="100"
                value={form.total_marks}
                onChange={(e) => setForm({ ...form, total_marks: e.target.value })}
              />
            </div>
          </div>
        </section>

        <section style={styles.card} className="glass-card-premium">
          <div style={styles.grid2col}>
            <div>
              <label style={styles.label}>Passing Marks</label>
              <input
                style={{ ...styles.input, maxWidth: 200 }}
                type="number"
                placeholder="35"
                value={form.passing_marks}
                onChange={(e) => setForm({ ...form, passing_marks: e.target.value })}
              />
            </div>
            <div>
              <label style={styles.label}>Grading Strictness</label>
              <div style={styles.strictnessRow}>
                {["easy", "medium", "hard"].map((s) => (
                  <button
                    key={s}
                    style={{
                      ...styles.strictBtn,
                      ...(form.strictness === s ? styles.strictBtnActive : {}),
                    }}
                    onClick={() => setForm({ ...form, strictness: s })}
                  >
                    {s.charAt(0).toUpperCase() + s.slice(1)}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section style={styles.card} className="glass-card-premium">
          <div style={styles.sectionHead}>
            <span style={{ fontSize: 24 }}>🤖</span>
            <h2 className="text-gradient-blue" style={{...styles.sectionTitle, color: 'transparent'}}>AI Neural Extraction</h2>
          </div>

          <div style={styles.aiBanner}>
            <span style={{ fontSize: 20 }}>✨</span>
            <div>
              <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 4, color: '#b8c1ec' }}>
                Auto-Scan and Prepare Prompts
              </div>
              <div style={{ color: "var(--text-dim)", fontSize: 13, lineHeight: 1.5 }}>
                Upload the Question Paper(s) and corresponding Answer Key(s). Our intelligence engine will parse context and extract individual questions for the form below.
              </div>
            </div>
          </div>

          <div style={styles.grid2col}>
            <MultiDropZone label="Question Papers (PDF/IMG)" icon="📄" files={qFiles} onFiles={setQFiles} />
            <MultiDropZone label="Answer Keys (PDF/IMG)" icon="🔑" files={aFiles} onFiles={setAFiles} />
          </div>

          {extractError && <div style={{ ...styles.errorBox, marginTop: 16 }}>{extractError}</div>}
          {extracted && <div style={styles.successBox}>✓ Success: Extracted {questions.length} questions dynamically.</div>}

          <button
            className="btn-premium-primary"
            style={{ ...styles.extractBtn, opacity: extracting || (qFiles.length === 0 || aFiles.length === 0) ? 0.6 : 1 }}
            onClick={extractQuestions}
            disabled={extracting || qFiles.length === 0 || aFiles.length === 0}
          >
            {extracting ? "Scanning Documents..." : "Extract Context via AI ✨"}
          </button>
        </section>

        <section>
          <div style={styles.qHeader}>
            <div style={styles.sectionHead}>
              <span style={{ fontSize: 24 }}>📝</span>
              <h2 style={styles.sectionTitle}>Question Repository</h2>
            </div>
            <span style={styles.qCount}>{questions.length} Item(s)</span>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {questions.map((q, i) => (
              <QuestionEditor
                key={i}
                index={i}
                question={q}
                updateQuestion={updateQuestion}
                removeQuestion={removeQuestion}
                isLast={i === questions.length - 1}
              />
            ))}
          </div>

          <button className="btn-premium-secondary" style={styles.addBtn} onClick={addQuestion}>
            + Add Empty Question Row
          </button>
        </section>

        {error && <div style={styles.errorBox}>Error: {error}</div>}

        <button className="btn-premium-primary" style={styles.submitBtn} onClick={handleSubmit} disabled={loading}>
          {loading ? "Generating Session..." : "Finalize Evaluation Criteria 🚀"}
        </button>
      </main>
    </div>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = {
  container: { position: 'relative', zIndex: 1, paddingBottom: '60px' },
  header: {
    maxWidth: 1000,
    position: "sticky", top: 20, zIndex: 50,
  },
  headerInner: {
    display: "flex", alignItems: "center", justifyContent: "space-between",
    height: 72, padding: "0 24px",
  },
  logoRow: { display: "flex", alignItems: "center", gap: 14 },
  logoBadge: { 
    width: "40px", height: "40px",
    background: "linear-gradient(135deg, #2a6dff, #4ce1ff)",
    borderRadius: "12px",
    display: "flex", alignItems: "center", justifyContent: "center",
    fontSize: 20, boxShadow: "0 4px 15px rgba(42, 109, 255, 0.4)",
  },
  logoTitle: { fontWeight: 800, fontSize: 18, margin: 0, fontFamily: 'Outfit' },
  logoSub: { color: "var(--text-dim)", fontSize: 13, margin: 0 },
  main: { maxWidth: 1000, margin: "0 auto", padding: "40px 0", display: "flex", flexDirection: "column", gap: 30 },
  card: { padding: "40px", marginBottom: 10 },
  sectionHead: { display: "flex", alignItems: "center", gap: 12, marginBottom: 30 },
  sectionTitle: { fontWeight: 800, fontSize: 22, margin: 0, fontFamily: 'Outfit' },
  grid2col: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 },
  label: { display: "block", color: "#fff", fontSize: 14, fontWeight: 600, marginBottom: 8 },
  labelSm: { display: "block", color: "var(--text-dim)", fontSize: 13, marginBottom: 8, fontWeight: 500 },
  input: {
    width: "100%",
    background: "rgba(255,255,255,0.05)",
    border: "1px solid rgba(255,255,255,0.15)",
    borderRadius: 8, padding: "14px 16px",
    color: "#fff", fontSize: 15, outline: "none",
    boxSizing: "border-box", transition: "border-color 0.3s ease",
  },
  strictnessRow: {
    display: "flex",
    background: "rgba(255,255,255,0.05)",
    border: "1px solid rgba(255,255,255,0.15)",
    borderRadius: 8, padding: 6, gap: 6,
  },
  strictBtn: {
    flex: 1, padding: "10px", borderRadius: 6,
    border: "none", background: "transparent",
    color: "var(--text-dim)", fontWeight: 600, fontSize: 14,
    cursor: "pointer", transition: "all 0.3s"
  },
  strictBtnActive: {
    background: "rgba(255,255,255,0.15)", color: "#fff",
    boxShadow: "0 4px 10px rgba(0,0,0,0.1)", border: "1px solid rgba(255,255,255,0.2)"
  },
  aiBanner: {
    display: "flex", alignItems: "flex-start", gap: 14,
    background: "rgba(76, 225, 255, 0.05)",
    border: "1px solid rgba(76, 225, 255, 0.2)",
    borderRadius: 12, padding: "20px",
    marginBottom: 24,
  },
  dropZone: {
    padding: "40px 20px",
    display: "flex", flexDirection: "column", alignItems: "center", gap: 10,
    cursor: "pointer", borderRadius: 12, border: '2px dashed',
    transition: 'all 0.3s ease',
  },
  dropIcon: { fontSize: 36, marginBottom: 6 },
  dropLabel: { color: "#fff", fontWeight: 700, fontSize: 15 },
  dropFileName: { fontSize: 13, fontWeight: 700 },
  dropHint: { color: "var(--text-dim)", fontSize: 12 },
  fileListContainer: {
    marginTop: 12,
    padding: "8px",
    background: "rgba(255,255,255,0.03)",
    borderRadius: 8,
    maxHeight: 150,
    overflowY: "auto",
  },
  fileListItem: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "6px 8px",
    fontSize: 12,
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
    fontSize: 11,
  },
  extractBtn: {
    width: "100%", marginTop: 24, padding: "16px",
  },
  successBox: {
    background: "rgba(74, 222, 128, 0.1)",
    border: "1px solid rgba(74, 222, 128, 0.2)",
    borderRadius: 8, padding: "12px 16px",
    color: "#4ade80", fontSize: 14, marginTop: 16, fontWeight: 500
  },
  qHeader: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 },
  qCount: {
    background: "rgba(255,255,255,0.1)", padding: "4px 12px", borderRadius: 20,
    color: "#fff", fontSize: 13, fontWeight: 600
  },
  questionCard: {
    padding: "30px",
    display: "flex", flexDirection: "column", gap: 20,
  },
  qCardHead: { display: "flex", justifyContent: "space-between", alignItems: "center" },
  qBadge: {
    fontSize: 16, fontWeight: 800, fontFamily: 'Outfit', color: '#4ce1ff'
  },
  field: { display: "flex", flexDirection: "column" },
  textarea: {
    width: "100%",
    background: "rgba(255,255,255,0.05)",
    border: "1px solid rgba(255,255,255,0.15)",
    borderRadius: 8, padding: "14px 16px",
    color: "#fff", fontSize: 15, outline: "none",
    minHeight: 80, resize: "vertical", boxSizing: "border-box", margin: 0,
    fontFamily: 'Inter',
  },
  answerBox: {
    background: "rgba(255,255,255,0.02)",
    border: "1px solid rgba(255,255,255,0.05)",
    borderRadius: 8, padding: "20px", display: "flex", flexDirection: "column", gap: 12,
  },
  answerLabel: {
    color: "#d866ff", fontSize: 13, fontWeight: 600,
  },
  choicesContainer: {
    display: "flex",
    flexDirection: "column",
    gap: 16,
    marginTop: 8,
  },
  choiceCard: {
    padding: "20px",
    background: "rgba(255,255,255,0.02)",
    borderRadius: 12,
  },
  choiceHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  choiceLabel: {
    color: "#4ce1ff",
    fontWeight: 700,
    fontSize: 14,
  },
  removeChoiceBtn: {
    background: "rgba(255,107,107,0.2)",
    border: "none",
    borderRadius: 4,
    color: "#ff6b6b",
    cursor: "pointer",
    padding: "4px 10px",
    fontSize: 12,
  },
  addChoiceBtn: {
    width: "100%",
    marginTop: 8,
    padding: "10px",
    fontSize: 13,
  },
  addBtn: {
    width: "100%", marginTop: 12, padding: "16px"
  },
  errorBox: {
    background: "rgba(255, 107, 107, 0.1)",
    border: "1px solid rgba(255, 107, 107, 0.2)",
    borderRadius: 8, padding: "12px 16px",
    color: "#ff6b6b", fontSize: 14, fontWeight: 500
  },
  submitBtn: {
    width: "100%", marginTop: 10, padding: "18px", fontSize: 18
  },
};