const express = require("express");
const cors = require("cors");
const { fetchStudentInfo } = require("./src/portalClient");
const { deriveDisplayName } = require("./src/username");
const fs = require("fs");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 10000;

app.use(cors());
app.use(express.json());

let tappedStudents = [];
let eventName = "Event";
let registeredStudents = [];

app.post("/api/event", (req, res) => {
  const { name } = req.body;
  if (!name) return res.status(400).json({ error: "Event name required" });

  eventName = name;
  tappedStudents = []; 
  registeredStudents = [];

  res.json({ message: `Event name set to: ${name}` });
});

app.get("/api/event", (req, res) => {
  res.json({ eventName });
});

app.get("/api/registered-students", (req, res) => {
  res.json(registeredStudents);
});

app.post("/api/import-registered", (req, res) => {
  const { students } = req.body;
  if (!students || !Array.isArray(students)) {
    return res.status(400).json({ error: "Students array required" });
  }

  registeredStudents = students;
  res.json({
    message: `Imported ${students.length} registered students`,
    count: students.length,
  });
});

app.post("/api/tap", async (req, res) => {
  const { studentId } = req.body;
  if (!studentId) return res.status(400).json({ error: "studentId required" });

  try {
    const studentInfo = await fetchStudentInfo(studentId);
    if (!studentInfo)
      return res.status(404).json({ error: "Student not registered" });

    let studentData = tappedStudents.find((s) => s.email === studentInfo.email);

    if (!studentData) {
      const displayName = deriveDisplayName(studentInfo.email);

      const isRegistered = registeredStudents.some(
        (regStudent) => regStudent.email === studentInfo.email
      );

      studentData = {
        id: studentId,
        name: displayName,
        email: studentInfo.email,
        timestamp: new Date(),
        isRegistered,
      };
      tappedStudents.push(studentData);
    }

    res.json(studentData);
  } catch (err) {
    console.error("Tap error:", err.message);
    res.status(500).json({ error: "Failed to fetch student info" });
  }
});

app.get("/api/export", (req, res) => {
  if (!tappedStudents.length)
    return res.status(400).json({ error: "No students tapped yet" });

  const csvContent = [
    ["Student ID", "Email", "Name", "Timestamp", "Status"],
    ...tappedStudents.map((s) => [
      s.id,
      s.email,
      s.name,
      s.timestamp.toISOString(),
      s.isRegistered ? "Registered" : "Walk-in",
    ]),
  ]
    .map((row) => row.join(","))
    .join("\n");

  const fileName = `${eventName.replace(/[^a-zA-Z0-9]/g, "_")}_attendance.csv`;
  const filePath = path.join(__dirname, fileName);

  fs.writeFileSync(filePath, csvContent, "utf8");

  res.download(filePath, fileName, (err) => {
    if (err) console.error(err);
    setTimeout(() => {
      try {
        fs.unlinkSync(filePath);
      } catch (e) {
        console.error("Error deleting file:", e);
      }
    }, 5000);
  });
});

app.get("/api/export-registered", (req, res) => {
  if (!registeredStudents.length)
    return res.status(400).json({ error: "No registered students" });

  const csvContent = [
    ["Student ID", "Email", "Name"],
    ...registeredStudents.map((s) => [s.id, s.email, s.name || ""]),
  ]
    .map((row) => row.join(","))
    .join("\n");

  const fileName = `${eventName.replace(
    /[^a-zA-Z0-9]/g,
    "_"
  )}_registered_students.csv`;
  const filePath = path.join(__dirname, fileName);

  fs.writeFileSync(filePath, csvContent, "utf8");

  res.download(filePath, fileName, (err) => {
    if (err) console.error(err);
    setTimeout(() => {
      try {
        fs.unlinkSync(filePath);
      } catch (e) {
        console.error("Error deleting file:", e);
      }
    }, 5000);
  });
});

app.listen(PORT, () =>
  console.log(`Attendance server running on port ${PORT}`)
);
