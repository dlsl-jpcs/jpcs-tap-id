const express = require("express");
const cors = require("cors");
const { fetchStudentInfo } = require("./src/portalClient");
const { deriveDisplayName } = require("./src/username");

const app = express();
const PORT = process.env.PORT || 10000;

// Middleware
app.use(cors());
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

// Health check
app.get("/", (req, res) => {
  res.json({
    status: "OK",
    message: "JPCS Attendance Server (Student Info Only)",
    timestamp: new Date().toISOString(),
  });
});

// === FETCH STUDENT INFO ONLY ===
app.post("/api/student-info", async (req, res) => {
  const { studentId } = req.body;

  if (!studentId || typeof studentId !== "string") {
    return res.status(400).json({ error: "Valid studentId required" });
  }

  try {
    const studentInfo = await fetchStudentInfo(studentId.trim());

    if (!studentInfo) {
      return res.status(404).json({ error: "Student not found in portal" });
    }

    const displayName = deriveDisplayName(studentInfo.email);

    res.json({
      id: studentId.trim(),
      name: displayName,
      email: studentInfo.email,
    });
  } catch (err) {
    console.error("Student info fetch failed:", err.message);
    res.status(500).json({ error: "Failed to fetch student data" });
  }
});

// Optional: Debug endpoint (remove in production)
app.get("/api/ping", (req, res) => {
  res.json({
    message: "Server is alive",
    time: new Date().toISOString(),
  });
});

// 404 for any unknown routes
app.use("*", (req, res) => {
  res.status(404).json({ error: "Endpoint not found" });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log(`POST /api/student-info → fetch student data`);
});
