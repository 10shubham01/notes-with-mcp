#!/usr/bin/env node

/**
 * MCP Server for Shubham's Notebook Application
 * Exposes project and task management capabilities through the Model Context Protocol
 */

const fs = require('fs').promises;
const path = require('path');

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

// MCP Protocol Implementation
class MCPServer {
  constructor() {
    this.tools = [
      {
        name: 'list_projects',
        description: 'List all projects in the notebook',
        inputSchema: {
          type: 'object',
          properties: {},
          required: []
        }
      },
      {
        name: 'create_project',
        description: 'Create a new project in the notebook',
        inputSchema: {
          type: 'object',
          properties: {
            name: {
              type: 'string',
              description: 'The name of the project'
            }
          },
          required: ['name']
        }
      },
      {
        name: 'get_project',
        description: 'Get details of a specific project by ID',
        inputSchema: {
          type: 'object',
          properties: {
            id: {
              type: 'number',
              description: 'The project ID'
            }
          },
          required: ['id']
        }
      },
      {
        name: 'update_project',
        description: 'Update a project (name or pinned status)',
        inputSchema: {
          type: 'object',
          properties: {
            id: {
              type: 'number',
              description: 'The project ID'
            },
            name: {
              type: 'string',
              description: 'The new name for the project'
            },
            pinned: {
              type: 'boolean',
              description: 'Whether the project is pinned'
            }
          },
          required: ['id']
        }
      },
      {
        name: 'delete_project',
        description: 'Delete a project by ID',
        inputSchema: {
          type: 'object',
          properties: {
            id: {
              type: 'number',
              description: 'The project ID to delete'
            }
          },
          required: ['id']
        }
      },
      {
        name: 'add_task',
        description: 'Add a task to a project',
        inputSchema: {
          type: 'object',
          properties: {
            projectId: {
              type: 'number',
              description: 'The project ID'
            },
            headline: {
              type: 'string',
              description: 'The task headline'
            },
            details: {
              type: 'string',
              description: 'Additional details for the task'
            },
            deadline: {
              type: 'string',
              description: 'Deadline for the task'
            }
          },
          required: ['projectId', 'headline']
        }
      },
      {
        name: 'update_task',
        description: 'Update a task in a project',
        inputSchema: {
          type: 'object',
          properties: {
            projectId: {
              type: 'number',
              description: 'The project ID'
            },
            taskId: {
              type: 'number',
              description: 'The task ID'
            },
            headline: {
              type: 'string',
              description: 'The task headline'
            },
            details: {
              type: 'string',
              description: 'Additional details for the task'
            },
            status: {
              type: 'string',
              description: 'Task status (todo, in-progress, done)',
              enum: ['todo', 'in-progress', 'done']
            },
            deadline: {
              type: 'string',
              description: 'Deadline for the task'
            }
          },
          required: ['projectId', 'taskId']
        }
      },
      {
        name: 'delete_task',
        description: 'Delete a task from a project',
        inputSchema: {
          type: 'object',
          properties: {
            projectId: {
              type: 'number',
              description: 'The project ID'
            },
            taskId: {
              type: 'number',
              description: 'The task ID to delete'
            }
          },
          required: ['projectId', 'taskId']
        }
      },
      {
        name: 'add_subtask',
        description: 'Add a subtask to a task',
        inputSchema: {
          type: 'object',
          properties: {
            projectId: {
              type: 'number',
              description: 'The project ID'
            },
            taskId: {
              type: 'number',
              description: 'The task ID'
            },
            text: {
              type: 'string',
              description: 'The subtask text'
            }
          },
          required: ['projectId', 'taskId', 'text']
        }
      },
      {
        name: 'update_subtask',
        description: 'Update a subtask (text or done status)',
        inputSchema: {
          type: 'object',
          properties: {
            projectId: {
              type: 'number',
              description: 'The project ID'
            },
            taskId: {
              type: 'number',
              description: 'The task ID'
            },
            subtaskId: {
              type: 'number',
              description: 'The subtask ID'
            },
            text: {
              type: 'string',
              description: 'The subtask text'
            },
            done: {
              type: 'boolean',
              description: 'Whether the subtask is done'
            }
          },
          required: ['projectId', 'taskId', 'subtaskId']
        }
      },
      {
        name: 'delete_subtask',
        description: 'Delete a subtask from a task',
        inputSchema: {
          type: 'object',
          properties: {
            projectId: {
              type: 'number',
              description: 'The project ID'
            },
            taskId: {
              type: 'number',
              description: 'The task ID'
            },
            subtaskId: {
              type: 'number',
              description: 'The subtask ID to delete'
            }
          },
          required: ['projectId', 'taskId', 'subtaskId']
        }
      }
    ];
  }

  async handleToolCall(name, args) {
    const db = await readDB();

    switch (name) {
      case 'list_projects':
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(db.projects, null, 2)
            }
          ]
        };

      case 'create_project': {
        const ts = Date.now();
        const project = {
          id: ts,
          name: args.name,
          createdAt: ts,
          updatedAt: ts,
          pinned: false,
          tasks: []
        };
        db.projects.push(project);
        await writeDB(db);
        return {
          content: [
            {
              type: 'text',
              text: `Project created successfully:\n${JSON.stringify(project, null, 2)}`
            }
          ]
        };
      }

      case 'get_project': {
        const project = db.projects.find(p => p.id == args.id);
        if (!project) {
          return {
            content: [
              {
                type: 'text',
                text: 'Project not found'
              }
            ],
            isError: true
          };
        }
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(project, null, 2)
            }
          ]
        };
      }

      case 'update_project': {
        const project = db.projects.find(p => p.id == args.id);
        if (!project) {
          return {
            content: [
              {
                type: 'text',
                text: 'Project not found'
              }
            ],
            isError: true
          };
        }
        if (args.name) project.name = args.name;
        if (typeof args.pinned === 'boolean') project.pinned = args.pinned;
        project.updatedAt = Date.now();
        await writeDB(db);
        return {
          content: [
            {
              type: 'text',
              text: `Project updated successfully:\n${JSON.stringify(project, null, 2)}`
            }
          ]
        };
      }

      case 'delete_project': {
        const index = db.projects.findIndex(p => p.id == args.id);
        if (index === -1) {
          return {
            content: [
              {
                type: 'text',
                text: 'Project not found'
              }
            ],
            isError: true
          };
        }
        db.projects.splice(index, 1);
        await writeDB(db);
        return {
          content: [
            {
              type: 'text',
              text: 'Project deleted successfully'
            }
          ]
        };
      }

      case 'add_task': {
        const project = db.projects.find(p => p.id == args.projectId);
        if (!project) {
          return {
            content: [
              {
                type: 'text',
                text: 'Project not found'
              }
            ],
            isError: true
          };
        }
        const ts = Date.now();
        const task = {
          id: ts,
          headline: args.headline,
          details: args.details || '',
          status: 'todo',
          done: false,
          createdAt: ts,
          updatedAt: ts,
          deadline: args.deadline || '',
          subtasks: []
        };
        project.tasks.push(task);
        project.updatedAt = ts;
        await writeDB(db);
        return {
          content: [
            {
              type: 'text',
              text: `Task added successfully:\n${JSON.stringify(task, null, 2)}`
            }
          ]
        };
      }

      case 'update_task': {
        const project = db.projects.find(p => p.id == args.projectId);
        if (!project) {
          return {
            content: [
              {
                type: 'text',
                text: 'Project not found'
              }
            ],
            isError: true
          };
        }
        const task = project.tasks.find(t => t.id == args.taskId);
        if (!task) {
          return {
            content: [
              {
                type: 'text',
                text: 'Task not found'
              }
            ],
            isError: true
          };
        }
        if (args.headline) task.headline = args.headline;
        if (args.details !== undefined) task.details = args.details;
        if (args.status) {
          task.status = args.status;
          task.done = args.status === 'done';
        }
        if (args.deadline !== undefined) task.deadline = args.deadline;
        task.updatedAt = Date.now();
        project.updatedAt = task.updatedAt;
        await writeDB(db);
        return {
          content: [
            {
              type: 'text',
              text: `Task updated successfully:\n${JSON.stringify(task, null, 2)}`
            }
          ]
        };
      }

      case 'delete_task': {
        const project = db.projects.find(p => p.id == args.projectId);
        if (!project) {
          return {
            content: [
              {
                type: 'text',
                text: 'Project not found'
              }
            ],
            isError: true
          };
        }
        const index = project.tasks.findIndex(t => t.id == args.taskId);
        if (index === -1) {
          return {
            content: [
              {
                type: 'text',
                text: 'Task not found'
              }
            ],
            isError: true
          };
        }
        project.tasks.splice(index, 1);
        project.updatedAt = Date.now();
        await writeDB(db);
        return {
          content: [
            {
              type: 'text',
              text: 'Task deleted successfully'
            }
          ]
        };
      }

      case 'add_subtask': {
        const project = db.projects.find(p => p.id == args.projectId);
        if (!project) {
          return {
            content: [
              {
                type: 'text',
                text: 'Project not found'
              }
            ],
            isError: true
          };
        }
        const task = project.tasks.find(t => t.id == args.taskId);
        if (!task) {
          return {
            content: [
              {
                type: 'text',
                text: 'Task not found'
              }
            ],
            isError: true
          };
        }
        const ts = Date.now();
        const subtask = {
          id: ts,
          text: args.text,
          done: false,
          createdAt: ts
        };
        if (!task.subtasks) task.subtasks = [];
        task.subtasks.push(subtask);
        task.updatedAt = ts;
        project.updatedAt = ts;
        await writeDB(db);
        return {
          content: [
            {
              type: 'text',
              text: `Subtask added successfully:\n${JSON.stringify(subtask, null, 2)}`
            }
          ]
        };
      }

      case 'update_subtask': {
        const project = db.projects.find(p => p.id == args.projectId);
        if (!project) {
          return {
            content: [
              {
                type: 'text',
                text: 'Project not found'
              }
            ],
            isError: true
          };
        }
        const task = project.tasks.find(t => t.id == args.taskId);
        if (!task) {
          return {
            content: [
              {
                type: 'text',
                text: 'Task not found'
              }
            ],
            isError: true
          };
        }
        const subtask = task.subtasks?.find(s => s.id == args.subtaskId);
        if (!subtask) {
          return {
            content: [
              {
                type: 'text',
                text: 'Subtask not found'
              }
            ],
            isError: true
          };
        }
        if (args.text) subtask.text = args.text;
        if (typeof args.done === 'boolean') subtask.done = args.done;
        task.updatedAt = Date.now();
        project.updatedAt = task.updatedAt;
        await writeDB(db);
        return {
          content: [
            {
              type: 'text',
              text: `Subtask updated successfully:\n${JSON.stringify(subtask, null, 2)}`
            }
          ]
        };
      }

      case 'delete_subtask': {
        const project = db.projects.find(p => p.id == args.projectId);
        if (!project) {
          return {
            content: [
              {
                type: 'text',
                text: 'Project not found'
              }
            ],
            isError: true
          };
        }
        const task = project.tasks.find(t => t.id == args.taskId);
        if (!task) {
          return {
            content: [
              {
                type: 'text',
                text: 'Task not found'
              }
            ],
            isError: true
          };
        }
        const index = task.subtasks?.findIndex(s => s.id == args.subtaskId);
        if (index === -1 || index === undefined) {
          return {
            content: [
              {
                type: 'text',
                text: 'Subtask not found'
              }
            ],
            isError: true
          };
        }
        task.subtasks.splice(index, 1);
        task.updatedAt = Date.now();
        project.updatedAt = task.updatedAt;
        await writeDB(db);
        return {
          content: [
            {
              type: 'text',
              text: 'Subtask deleted successfully'
            }
          ]
        };
      }

      default:
        return {
          content: [
            {
              type: 'text',
              text: `Unknown tool: ${name}`
            }
          ],
          isError: true
        };
    }
  }

  async handleRequest(request) {
    const { method, params } = request;

    switch (method) {
      case 'initialize':
        return {
          protocolVersion: '2024-11-05',
          capabilities: {
            tools: {}
          },
          serverInfo: {
            name: 'notebook-mcp-server',
            version: '1.0.0'
          }
        };

      case 'tools/list':
        return {
          tools: this.tools
        };

      case 'tools/call':
        return await this.handleToolCall(params.name, params.arguments || {});

      default:
        throw new Error(`Unknown method: ${method}`);
    }
  }

  async start() {
    const readline = require('readline');
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
      terminal: false
    });

    rl.on('line', async (line) => {
      try {
        const request = JSON.parse(line);
        const response = await this.handleRequest(request);
        console.log(JSON.stringify(response));
      } catch (error) {
        console.error(JSON.stringify({
          error: {
            code: -32603,
            message: error.message
          }
        }));
      }
    });
  }
}

// Start the server
const server = new MCPServer();
server.start();
