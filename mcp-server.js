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
      },
      {
        name: 'bulk_add_tasks',
        description: 'Add multiple tasks to a project at once',
        inputSchema: {
          type: 'object',
          properties: {
            projectId: {
              type: 'number',
              description: 'The project ID'
            },
            tasks: {
              type: 'array',
              description: 'Array of tasks to add',
              items: {
                type: 'object',
                properties: {
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
                required: ['headline']
              }
            }
          },
          required: ['projectId', 'tasks']
        }
      },
      {
        name: 'bulk_update_tasks',
        description: 'Update multiple tasks in a project at once',
        inputSchema: {
          type: 'object',
          properties: {
            projectId: {
              type: 'number',
              description: 'The project ID'
            },
            tasks: {
              type: 'array',
              description: 'Array of tasks to update',
              items: {
                type: 'object',
                properties: {
                  taskId: {
                    type: 'number',
                    description: 'The task ID to update'
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
                required: ['taskId']
              }
            }
          },
          required: ['projectId', 'tasks']
        }
      },
      {
        name: 'bulk_delete_tasks',
        description: 'Delete multiple tasks from a project at once',
        inputSchema: {
          type: 'object',
          properties: {
            projectId: {
              type: 'number',
              description: 'The project ID'
            },
            taskIds: {
              type: 'array',
              description: 'Array of task IDs to delete',
              items: {
                type: 'number'
              }
            }
          },
          required: ['projectId', 'taskIds']
        }
      },
      {
        name: 'bulk_update_task_status',
        description: 'Update the status of multiple tasks at once',
        inputSchema: {
          type: 'object',
          properties: {
            projectId: {
              type: 'number',
              description: 'The project ID'
            },
            taskIds: {
              type: 'array',
              description: 'Array of task IDs to update',
              items: {
                type: 'number'
              }
            },
            status: {
              type: 'string',
              description: 'New status for all tasks',
              enum: ['todo', 'in-progress', 'done']
            }
          },
          required: ['projectId', 'taskIds', 'status']
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

      case 'bulk_add_tasks': {
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
        const addedTasks = [];
        const ts = Date.now();
        
        for (let i = 0; i < args.tasks.length; i++) {
          const taskData = args.tasks[i];
          const task = {
            id: ts + i,
            headline: taskData.headline,
            details: taskData.details || '',
            status: 'todo',
            deadline: taskData.deadline || '',
            subtasks: [],
            createdAt: ts + i,
            updatedAt: ts + i
          };
          project.tasks.push(task);
          addedTasks.push(task);
        }
        
        project.updatedAt = Date.now();
        await writeDB(db);
        return {
          content: [
            {
              type: 'text',
              text: `Successfully added ${addedTasks.length} tasks:\n${JSON.stringify(addedTasks, null, 2)}`
            }
          ]
        };
      }

      case 'bulk_update_tasks': {
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
        const updatedTasks = [];
        const notFound = [];
        
        for (const taskUpdate of args.tasks) {
          const task = project.tasks.find(t => t.id == taskUpdate.taskId);
          if (!task) {
            notFound.push(taskUpdate.taskId);
            continue;
          }
          
          if (taskUpdate.headline) task.headline = taskUpdate.headline;
          if (taskUpdate.details !== undefined) task.details = taskUpdate.details;
          if (taskUpdate.status) task.status = taskUpdate.status;
          if (taskUpdate.deadline !== undefined) task.deadline = taskUpdate.deadline;
          task.updatedAt = Date.now();
          updatedTasks.push(task);
        }
        
        project.updatedAt = Date.now();
        await writeDB(db);
        
        let message = `Successfully updated ${updatedTasks.length} tasks`;
        if (notFound.length > 0) {
          message += `\nTasks not found: ${notFound.join(', ')}`;
        }
        message += `:\n${JSON.stringify(updatedTasks, null, 2)}`;
        
        return {
          content: [
            {
              type: 'text',
              text: message
            }
          ]
        };
      }

      case 'bulk_delete_tasks': {
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
        
        const deletedCount = project.tasks.length;
        project.tasks = project.tasks.filter(t => !args.taskIds.includes(t.id));
        const actualDeletedCount = deletedCount - project.tasks.length;
        
        project.updatedAt = Date.now();
        await writeDB(db);
        
        return {
          content: [
            {
              type: 'text',
              text: `Successfully deleted ${actualDeletedCount} tasks out of ${args.taskIds.length} requested`
            }
          ]
        };
      }

      case 'bulk_update_task_status': {
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
        
        const updatedTasks = [];
        const notFound = [];
        
        for (const taskId of args.taskIds) {
          const task = project.tasks.find(t => t.id == taskId);
          if (!task) {
            notFound.push(taskId);
            continue;
          }
          
          task.status = args.status;
          task.updatedAt = Date.now();
          updatedTasks.push(task);
        }
        
        project.updatedAt = Date.now();
        await writeDB(db);
        
        let message = `Successfully updated status of ${updatedTasks.length} tasks to '${args.status}'`;
        if (notFound.length > 0) {
          message += `\nTasks not found: ${notFound.join(', ')}`;
        }
        
        return {
          content: [
            {
              type: 'text',
              text: message
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
  const { id, method, params } = request;

  try {
    switch (method) {
      case "initialize":
        return {
          id,
          jsonrpc: "2.0",
          result: {
            protocolVersion: "2024-11-05",
            capabilities: {
              tools: {}
            },
            serverInfo: {
              name: "notebook-mcp-server",
              version: "1.0.0"
            }
          }
        };

      case "tools/list":
        return {
          id,
          jsonrpc: "2.0",
          result: {
            tools: this.tools
          }
        };

      case "tools/call": {
        console.log(`[${new Date().toISOString()}] Tool called: ${params.name}`);
        console.log(`[${new Date().toISOString()}] Arguments:`, JSON.stringify(params.arguments, null, 2));
        const result = await this.handleToolCall(params.name, params.arguments || {});
        return {
          id,
          jsonrpc: "2.0",
          result
        };
      }

      default:
        return {
          id,
          jsonrpc: "2.0",
          error: {
            code: -32601,
            message: `Unknown method: ${method}`
          }
        };
    }
  } catch (err) {
    return {
      id,
      jsonrpc: "2.0",
      error: {
        code: -32603,
        message: err.message
      }
    };
  }
}

async start() {
    const http = require('http');
    const PORT = process.env.PORT || 6969;

    const server = http.createServer(async (req, res) => {
      // Enable CORS
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
      res.setHeader('Content-Type', 'application/json');

      // Handle preflight requests
      if (req.method === 'OPTIONS') {
        res.writeHead(200);
        res.end();
        return;
      }

      // Only accept POST requests
      if (req.method !== 'POST') {
        res.writeHead(405);
        res.end(JSON.stringify({
          jsonrpc: '2.0',
          error: { code: -32600, message: 'Method not allowed. Use POST.' }
        }));
        return;
      }

      let body = '';
      req.on('data', chunk => {
        body += chunk.toString();
      });

      req.on('end', async () => {
        let request;

        try {
          request = JSON.parse(body);
        } catch (e) {
          res.writeHead(400);
          res.end(JSON.stringify({
            jsonrpc: '2.0',
            error: { code: -32700, message: 'Invalid JSON' }
          }));
          return;
        }

        const response = await this.handleRequest(request);
        res.writeHead(200);
        res.end(JSON.stringify(response));
      });
    });

    server.listen(PORT, () => {
      console.log(`MCP Server running on http://localhost:${PORT}`);
      console.log(`Send JSON-RPC requests via POST to interact with the server`);
    });
  }
}

// Start the server
const server = new MCPServer();
server.start();
