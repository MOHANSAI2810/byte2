const API_BASE = "https://ai-paper-evaluator-6nsp.onrender.com";  // ← Changed this line

const getHeaders = () => ({
  Authorization: `Bearer ${localStorage.getItem("token")}`,
  "Content-Type": "application/json",
});

const handleResponse = async (response) => {
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.detail || data.message || "Request failed");
  }
  return data;
};

export const authAPI = {
  register: (data) =>
    fetch(`${API_BASE}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    }).then(handleResponse),

  login: (data) =>
    fetch(`${API_BASE}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    }).then(handleResponse),
};

export const examsAPI = {
  getAll: () =>
    fetch(`${API_BASE}/api/exams`, { headers: getHeaders() })
      .then(handleResponse)
      .then(data => data.exams || []),

  create: (data) =>
    fetch(`${API_BASE}/api/exams`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify(data),
    }).then(handleResponse),

  getById: (id) =>
    fetch(`${API_BASE}/api/exams/${id}`, { headers: getHeaders() })
      .then(handleResponse),

  extractQuestions: (formData) =>
    fetch(`${API_BASE}/api/exams/extract-questions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
      body: formData,
    }).then(handleResponse),
};

export const submissionsAPI = {
  upload: (formData) =>
    fetch(`${API_BASE}/api/submissions/upload`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
      body: formData,
    }).then(handleResponse),

  grade: (data) =>
    fetch(`${API_BASE}/api/submissions/grade`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify(data),
    }).then(handleResponse),

  getByExam: (examId) =>
    fetch(`${API_BASE}/api/submissions/exam/${examId}`, {
      headers: getHeaders(),
    }).then(handleResponse)
      .then(data => data.submissions || []),
};

export const reportsAPI = {
  getById: (id) =>
    fetch(`${API_BASE}/api/reports/${id}`, { headers: getHeaders() })
      .then(handleResponse),

  downloadPDF: (id) =>
    fetch(`${API_BASE}/api/reports/${id}/pdf`, { headers: getHeaders() })
      .then((r) => {
        if (!r.ok) throw new Error("PDF download failed");
        return r.blob();
      }),
  
  downloadHTML: (id) =>
    fetch(`${API_BASE}/api/reports/${id}/html`, { headers: getHeaders() })
      .then((r) => {
        if (!r.ok) throw new Error("HTML download failed");
        return r.blob();
      }),
};