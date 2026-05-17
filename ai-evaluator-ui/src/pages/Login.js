import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { authAPI } from "../api";

export default function Login({ onSuccess }) {
  const [isRegister, setIsRegister] = useState(false);
  const [form, setForm] = useState({ email: "", password: "", full_name: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      if (isRegister) {
        const res = await authAPI.register({
          full_name: form.full_name,
          email: form.email,
          password: form.password,
        });
        if (res.error) throw new Error(res.error);
        setIsRegister(false);
        setError("Registered! Please log in.");
      } else {
        const res = await authAPI.login({
          email: form.email,
          password: form.password,
        });
        if (res.token) {
          login(res.token, res.user);
          onSuccess?.();
        } else {
          throw new Error(res.detail || "Login failed");
        }
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card} className="glass-card-premium">
        <div style={styles.logoRow}>
          <div style={styles.logoBadge}>
            ✦
          </div>
          <div>
            <div className="text-gradient" style={styles.logoTitle}>Welcome Back</div>
            <div style={styles.logoSub}>Secure Artificial Intelligence Evaluation</div>
          </div>
        </div>

        <h2 style={styles.heading}>
          {isRegister ? "Create Account" : "Sign In"}
        </h2>
        <p style={styles.subheading}>
          {isRegister ? "Start evaluating student papers effortlessly." : "Enter your credentials to access the dashboard."}
        </p>

        <form onSubmit={handleSubmit} style={styles.form}>
          {isRegister && (
            <div style={styles.field}>
              <label style={styles.label}>Full Name</label>
              <input
                style={styles.input}
                type="text"
                placeholder="John Doe"
                value={form.full_name}
                onChange={(e) => setForm({ ...form, full_name: e.target.value })}
                required
              />
            </div>
          )}

          <div style={styles.field}>
            <label style={styles.label}>Email Address</label>
            <input
              style={styles.input}
              type="email"
              placeholder="you@school.edu"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              required
            />
          </div>

          <div style={styles.field}>
            <label style={styles.label}>Password</label>
            <input
              style={styles.input}
              type="password"
              placeholder="••••••••"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              required
            />
          </div>

          {error && (
            <div style={{
              ...styles.error,
              color: error.includes("Registered") ? "#4ce1ff" : "#ff6b6b"
            }}>
              {error}
            </div>
          )}

          <button className="btn-premium-primary" type="submit" disabled={loading} style={{width: '100%', marginTop: '10px'}}>
            {loading ? "Processing..." : isRegister ? "Create Account" : "Sign In"}
          </button>
        </form>

        <p style={styles.toggle}>
          {isRegister ? "Already have an account? " : "Don't have an account? "}
          <span style={styles.link} onClick={() => { setIsRegister(!isRegister); setError(""); }}>
            {isRegister ? "Sign In" : "Register"}
          </span>
        </p>
      </div>
    </div>
  );
}

const styles = {
  container: {
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "24px",
    zIndex: 1,
    position: 'relative',
  },
  card: {
    padding: "48px 40px",
    width: "100%",
    maxWidth: 420,
  },
  logoRow: { display: "flex", alignItems: "center", gap: 12, marginBottom: 36 },
  logoBadge: {
    width: "40px", height: "40px",
    background: "linear-gradient(135deg, #2a6dff, #4ce1ff)",
    borderRadius: "12px",
    display: "flex", alignItems: "center", justifyContent: "center",
    fontSize: 20, boxShadow: "0 4px 15px rgba(42, 109, 255, 0.4)",
  },
  logoTitle: { fontWeight: 800, fontSize: 18, fontFamily: 'Outfit' },
  logoSub: { color: "var(--text-dim)", fontSize: 11 },
  heading: { fontSize: 28, fontWeight: 800, margin: "0 0 8px", fontFamily: 'Outfit' },
  subheading: { color: "var(--text-dim)", fontSize: 13, marginBottom: 28, lineHeight: 1.5 },
  form: { display: "flex", flexDirection: "column", gap: 20 },
  field: { display: "flex", flexDirection: "column", gap: 8 },
  label: { color: "var(--text-main)", fontSize: 13, fontWeight: 600 },
  input: {
    background: "rgba(255, 255, 255, 0.05)",
    border: "1px solid rgba(255, 255, 255, 0.15)",
    borderRadius: 8,
    padding: "14px 16px",
    color: "#fff",
    fontSize: 15,
    outline: "none",
    boxSizing: 'border-box',
    transition: 'border-color 0.3s ease',
  },
  error: { fontSize: 13, textAlign: "center", marginTop: 8, fontWeight: 500 },
  toggle: { color: "var(--text-dim)", fontSize: 13, textAlign: "center", marginTop: 24 },
  link: { cursor: "pointer", fontWeight: 700, marginLeft: 8, color: "var(--accent-cyan)", transition: 'opacity 0.2s' },
};