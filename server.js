const express = require('express');
const cors = require('cors');
const fs = require('fs').promises;
const path = require('path');

const app = express();
const port = 3000;

const dbPath = path.join(__dirname, 'db.json');

// Helper to read DB
async function readDB() {
  try {
    const data = await fs.readFile(dbPath, 'utf8');
    return JSON.parse(data);
  } catch (e) {
    return { projects: [] };
  }
}

// Helper to write DB
async function writeDB(data) {
  await fs.writeFile(dbPath, JSON.stringify(data, null, 2));
}

app.use(cors());
app.use(express.json());

// Serve static files (HTML, CSS, JS)
app.use(express.static(__dirname));

// API Routes

// Get all projects
app.get('/api/projects', async (req, res) => {
  try {
    console.log('GET /api/projects');
    const db = await readDB();
    console.log('DB:', db);
    res.json(db.projects);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Internal error' });
  }
});

// Create new project
app.post('/api/projects', async (req, res) => {
  const db = await readDB();
  const { name } = req.body;
  if (!name) return res.status(400).json({ error: 'Name is required' });
  const ts = Date.now();
  const project = {
    id: ts,
    name,
    createdAt: ts,
    updatedAt: ts,
    pinned: false,
    tasks: []
  };
  db.projects.push(project);
  await writeDB(db);
  res.json(project);
});

// Get specific project
app.get('/api/projects/:id', async (req, res) => {
  const db = await readDB();
  const project = db.projects.find(p => p.id == req.params.id);
  if (!project) return res.status(404).json({ error: 'Project not found' });
  res.json(project);
});

// Update project
app.put('/api/projects/:id', async (req, res) => {
  const db = await readDB();
  const project = db.projects.find(p => p.id == req.params.id);
  if (!project) return res.status(404).json({ error: 'Project not found' });
  const { name, pinned } = req.body;
  if (name) project.name = name;
  if (typeof pinned === 'boolean') project.pinned = pinned;
  project.updatedAt = Date.now();
  await writeDB(db);
  res.json(project);
});

// Delete project
app.delete('/api/projects/:id', async (req, res) => {
  const db = await readDB();
  const index = db.projects.findIndex(p => p.id == req.params.id);
  if (index === -1) return res.status(404).json({ error: 'Project not found' });
  db.projects.splice(index, 1);
  await writeDB(db);
  res.json({ message: 'Project deleted' });
});

// Add task to project
app.post('/api/projects/:id/tasks', async (req, res) => {
  const db = await readDB();
  const project = db.projects.find(p => p.id == req.params.id);
  if (!project) return res.status(404).json({ error: 'Project not found' });
  const { headline, details, deadline } = req.body;
  if (!headline) return res.status(400).json({ error: 'Headline is required' });
  const ts = Date.now();
  const task = {
    id: ts,
    headline,
    details: details || '',
    status: 'todo',
    done: false,
    createdAt: ts,
    updatedAt: ts,
    deadline: deadline || '',
    subtasks: []
  };
  project.tasks.push(task);
  project.updatedAt = ts;
  await writeDB(db);
  res.json(task);
});

// Update task
app.put('/api/projects/:id/tasks/:taskId', async (req, res) => {
  const db = await readDB();
  const project = db.projects.find(p => p.id == req.params.id);
  if (!project) return res.status(404).json({ error: 'Project not found' });
  const task = project.tasks.find(t => t.id == req.params.taskId);
  if (!task) return res.status(404).json({ error: 'Task not found' });
  const { headline, details, status, deadline } = req.body;
  if (headline) task.headline = headline;
  if (details !== undefined) task.details = details;
  if (status) task.status = status;
  task.done = status === 'done';
  if (deadline !== undefined) task.deadline = deadline;
  task.updatedAt = Date.now();
  project.updatedAt = task.updatedAt;
  await writeDB(db);
  res.json(task);
});

// Delete task
app.delete('/api/projects/:id/tasks/:taskId', async (req, res) => {
  const db = await readDB();
  const project = db.projects.find(p => p.id == req.params.id);
  if (!project) return res.status(404).json({ error: 'Project not found' });
  const index = project.tasks.findIndex(t => t.id == req.params.taskId);
  if (index === -1) return res.status(404).json({ error: 'Task not found' });
  project.tasks.splice(index, 1);
  project.updatedAt = Date.now();
  await writeDB(db);
  res.json({ message: 'Task deleted' });
});

// Add subtask
app.post('/api/projects/:id/tasks/:taskId/subtasks', async (req, res) => {
  const db = await readDB();
  const project = db.projects.find(p => p.id == req.params.id);
  if (!project) return res.status(404).json({ error: 'Project not found' });
  const task = project.tasks.find(t => t.id == req.params.taskId);
  if (!task) return res.status(404).json({ error: 'Task not found' });
  const { text } = req.body;
  if (!text) return res.status(400).json({ error: 'Text is required' });
  const ts = Date.now();
  const subtask = {
    id: ts,
    text,
    done: false,
    createdAt: ts
  };
  if (!task.subtasks) task.subtasks = [];
  task.subtasks.push(subtask);
  task.updatedAt = ts;
  project.updatedAt = ts;
  await writeDB(db);
  res.json(subtask);
});

// Update subtask
app.put('/api/projects/:id/tasks/:taskId/subtasks/:subId', async (req, res) => {
  const db = await readDB();
  const project = db.projects.find(p => p.id == req.params.id);
  if (!project) return res.status(404).json({ error: 'Project not found' });
  const task = project.tasks.find(t => t.id == req.params.taskId);
  if (!task) return res.status(404).json({ error: 'Task not found' });
  const subtask = task.subtasks.find(s => s.id == req.params.subId);
  if (!subtask) return res.status(404).json({ error: 'Subtask not found' });
  const { text, done } = req.body;
  if (text) subtask.text = text;
  if (typeof done === 'boolean') subtask.done = done;
  task.updatedAt = Date.now();
  project.updatedAt = task.updatedAt;
  await writeDB(db);
  res.json(subtask);
});

// Delete subtask
app.delete('/api/projects/:id/tasks/:taskId/subtasks/:subId', async (req, res) => {
  const db = await readDB();
  const project = db.projects.find(p => p.id == req.params.id);
  if (!project) return res.status(404).json({ error: 'Project not found' });
  const task = project.tasks.find(t => t.id == req.params.taskId);
  if (!task) return res.status(404).json({ error: 'Task not found' });
  const index = task.subtasks.findIndex(s => s.id == req.params.subId);
  if (index === -1) return res.status(404).json({ error: 'Subtask not found' });
  task.subtasks.splice(index, 1);
  task.updatedAt = Date.now();
  project.updatedAt = task.updatedAt;
  await writeDB(db);
  res.json({ message: 'Subtask deleted' });
});

// Bulk import
app.post('/api/import', async (req, res) => {
  const { projects } = req.body;
  if (!Array.isArray(projects)) return res.status(400).json({ error: 'Projects must be an array' });
  const db = { projects };
  await writeDB(db);
  res.json({ message: 'Imported successfully' });
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});