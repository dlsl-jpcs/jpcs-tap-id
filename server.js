const express = require('express');
const cors = require('cors');
const { fetchStudentInfo } = require('./src/portalClient');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

const tappedStudents = [];

app.post('/api/tap', async (req, res) => {
  const { studentId } = req.body;
  if (!studentId) return res.status(400).json({ error: 'studentId required' });

  try {
    const studentInfo = await fetchStudentInfo(studentId);
    if (!studentInfo) return res.status(404).json({ error: 'Student not registered' });

    const exists = tappedStudents.find(s => s.email === studentInfo.email);
    if (!exists) {
      tappedStudents.push({
        id: studentId,
        name: studentInfo.name || studentInfo.email.split('@')[0],
        email: studentInfo.email,
        timestamp: new Date()
      });
    }

    res.json(studentInfo);
  } catch (err) {
    console.error('Tap error:', err.message);
    res.status(500).json({ error: 'Failed to fetch student info' });
  }
});

app.get('/api/export', (req, res) => {
  if (!tappedStudents.length) return res.status(400).json({ error: 'No students tapped yet' });

  const csvContent = [
    ['Student ID', 'Name', 'Email', 'Timestamp'],
    ...tappedStudents.map(s => [s.id, s.name, s.email, s.timestamp.toISOString()])
  ]
    .map(row => row.join(','))
    .join('\n');

  const filePath = path.join(__dirname, 'attendance.csv');
  fs.writeFileSync(filePath, csvContent, 'utf8');

  res.download(filePath, 'attendance.csv', err => {
    if (err) console.error(err);
  });
});

app.listen(PORT, () => console.log(`Attendance server running on port ${PORT}`));