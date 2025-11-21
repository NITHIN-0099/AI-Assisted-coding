const API_BASE = "http://localhost:3000";

const selectors = {
  form: document.getElementById("recordForm"),
  placeholder: document.getElementById("resultsPlaceholder"),
  results: document.getElementById("results"),
  riskValue: document.getElementById("riskValue"),
  riskLevel: document.getElementById("riskLevel"),
  patientSummary: document.getElementById("patientSummary"),
  flagsList: document.getElementById("flagsList"),
  recommendationsList: document.getElementById("recommendationsList"),
  metricsList: document.getElementById("metricsList"),
  timestamp: document.getElementById("timestamp"),
  apiStatus: document.getElementById("apiStatus"),
  submitButton: document.querySelector("button[type='submit']"),
};

const formatList = (container, items, emptyFallback) => {
  container.innerHTML = "";
  if (!items || !items.length) {
    const li = document.createElement("li");
    li.textContent = emptyFallback;
    container.appendChild(li);
    return;
  }
  items.forEach((item) => {
    const li = document.createElement("li");
    li.textContent = item;
    container.appendChild(li);
  });
};

const renderMetrics = (metrics = {}) => {
  selectors.metricsList.innerHTML = "";
  Object.entries(metrics).forEach(([key, value]) => {
    const li = document.createElement("li");
    const label = key.replace(/([A-Z])/g, " $1").replace(/^./, (c) => c.toUpperCase());
    li.textContent = `${label}: ${value}`;
    selectors.metricsList.appendChild(li);
  });
};

const toggleLoading = (isLoading) => {
  selectors.submitButton.disabled = isLoading;
  selectors.submitButton.textContent = isLoading ? "Analyzing..." : "Generate Analysis";
};

const handleAnalysis = async (event) => {
  event.preventDefault();
  const formData = new FormData(selectors.form);

  const payload = {
    patientName: formData.get("patientName").trim(),
    age: Number(formData.get("age")),
    gender: formData.get("gender"),
    vitals: {
      heartRate: formData.get("heartRate") || null,
      systolic: formData.get("systolic") || null,
      diastolic: formData.get("diastolic") || null,
      temperature: formData.get("temperature") || null,
    },
    labs: {
      ldl: formData.get("ldl") || null,
      hdl: formData.get("hdl") || null,
      a1c: formData.get("a1c") || null,
    },
    symptoms: (formData.get("symptoms") || "")
      .split(",")
      .map((symptom) => symptom.trim())
      .filter(Boolean),
    notes: formData.get("notes") || "",
  };

  toggleLoading(true);
  selectors.apiStatus.classList.remove("error");
  selectors.apiStatus.textContent = "Backend: analyzing...";

  try {
    const response = await fetch(`${API_BASE}/analyze`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error("Failed to analyze record");
    }

    const analysis = await response.json();
    selectors.placeholder.classList.add("hidden");
    selectors.results.classList.remove("hidden");

    selectors.riskValue.textContent = analysis.riskScore;
    selectors.riskLevel.textContent = `${analysis.riskLevel} risk`;
    selectors.patientSummary.textContent = analysis.patientSummary;
    formatList(selectors.flagsList, analysis.flags, "No critical flags detected");
    formatList(selectors.recommendationsList, analysis.recommendations, "No actions at this time");
    renderMetrics(analysis.metricsReviewed);
    selectors.timestamp.textContent = new Date(analysis.timestamp).toLocaleString();

    selectors.apiStatus.textContent = "Backend: online";
  } catch (error) {
    selectors.apiStatus.classList.add("error");
    selectors.apiStatus.textContent = `Backend error: ${error.message}`;
    alert("Unable to complete analysis. Please ensure the backend is running.");
  } finally {
    toggleLoading(false);
  }
};

const checkBackendHealth = async () => {
  try {
    const response = await fetch(`${API_BASE}/analyze`, { method: "OPTIONS" });
    if (response.ok) {
      selectors.apiStatus.classList.remove("error");
      selectors.apiStatus.textContent = "Backend: online";
      return;
    }
    throw new Error();
  } catch {
    selectors.apiStatus.classList.add("error");
    selectors.apiStatus.textContent = "Backend: offline";
  }
};

checkBackendHealth();
selectors.form.addEventListener("submit", handleAnalysis);

