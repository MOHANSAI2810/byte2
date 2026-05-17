import { useState } from "react";
import { AuthProvider, useAuth } from "./context/AuthContext";
import LandingPage from "./pages/LandingPage";
import Login from "./pages/Login";
import Home from "./pages/Home";
import CreateExam from "./pages/CreateExam";
import ExamDetail from "./pages/ExamDetail";
import UploadSubmission from "./pages/UploadSubmission";
import Report from "./pages/Report";

function AppRoutes() {
  const { isLoggedIn } = useAuth();
  const [page, setPage] = useState("home");
  const [showLogin, setShowLogin] = useState(false);
  const [examId, setExamId] = useState(null);
  const [reportId, setReportId] = useState(null);

  if (!isLoggedIn) {
    if (showLogin) {
      return <Login onSuccess={() => setPage("home")} />;
    }
    return (
      <LandingPage 
        onGetStarted={() => setShowLogin(true)} 
        onLogin={() => setShowLogin(true)} 
      />
    );
  }

  if (page === "home") {
    return (
      <Home
        onCreateExam={() => setPage("create")}
        onViewExam={(id) => { setExamId(id); setPage("exam"); }}
      />
    );
  }

  if (page === "create") {
    return (
      <CreateExam
        onBack={() => setPage("home")}
        onCreated={(id) => { setExamId(id); setPage("exam"); }}
      />
    );
  }

  if (page === "exam") {
    return (
      <ExamDetail
        examId={examId}
        onBack={() => setPage("home")}
        onUpload={(id) => { setExamId(id); setPage("upload"); }}
        onViewReport={(id) => { setReportId(id); setPage("report"); }}
      />
    );
  }

  if (page === "upload") {
    return (
      <UploadSubmission
        examId={examId}
        onBack={() => setPage("exam")}
        onGraded={(id) => { setReportId(id); setPage("report"); }}
      />
    );
  }

  if (page === "report") {
    return (
      <Report
        reportId={reportId}
        onBack={() => setPage("exam")}
      />
    );
  }

  return null;
}

export default function App() {
  return (
    <AuthProvider>
      <div style={{ minHeight: '100vh', position: 'relative' }}>
        <div className="glass-bg-base"></div>
        <div className="glass-bg-glow"></div>
        <AppRoutes />
      </div>
    </AuthProvider>
  );
}
