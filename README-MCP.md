# Notebook MCP Server

This is a Model Context Protocol (MCP) server that exposes the notebook application's functionality to AI assistants and other MCP-compatible clients.

## Features

The MCP server provides the following tools:

### Project Management
- `list_projects` - List all projects
- `create_project` - Create a new project
- `get_project` - Get details of a specific project
- `update_project` - Update project name or pinned status
- `delete_project` - Delete a project

### Task Management
- `add_task` - Add a task to a project
- `update_task` - Update task details, status, or deadline
- `delete_task` - Delete a task from a project

### Subtask Management
- `add_subtask` - Add a subtask to a task
- `update_subtask` - Update subtask text or completion status
- `delete_subtask` - Delete a subtask

## Installation

1. Make sure you have Node.js installed
2. The MCP server uses the same `db.json` file as your main application

## Usage

### Running the MCP Server

```bash
node mcp-server.js
```

### Configuring with Claude Desktop

Add this to your Claude Desktop configuration file:

**macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`

```json
{
  "mcpServers": {
    "notebook": {
      "command": "node",
      "args": ["/Users/shubham-gupta/notes/mcp-server.js"]
    }
  }
}
```

After adding the configuration, restart Claude Desktop.

### Testing the MCP Server

You can test the server using stdio by piping JSON-RPC requests:

```bash
# Initialize
echo '{"method":"initialize","params":{}}' | node mcp-server.js

# List tools
echo '{"method":"tools/list","params":{}}' | node mcp-server.js

# Create a project
echo '{"method":"tools/call","params":{"name":"create_project","arguments":{"name":"Test Project"}}}' | node mcp-server.js

# List all projects
echo '{"method":"tools/call","params":{"name":"list_projects","arguments":{}}}' | node mcp-server.js
```

## Available Tools

### list_projects
Lists all projects in the notebook.

**Parameters**: None

**Example**:
```json
{
  "method": "tools/call",
  "params": {
    "name": "list_projects",
    "arguments": {}
  }
}
```

### create_project
Creates a new project.

**Parameters**:
- `name` (string, required): The name of the project

**Example**:
```json
{
  "method": "tools/call",
  "params": {
    "name": "create_project",
    "arguments": {
      "name": "My New Project"
    }
  }
}
```

### get_project
Gets details of a specific project by ID.

**Parameters**:
- `id` (number, required): The project ID

### update_project
Updates a project's name or pinned status.

**Parameters**:
- `id` (number, required): The project ID
- `name` (string, optional): New name for the project
- `pinned` (boolean, optional): Whether the project is pinned

### delete_project
Deletes a project.

**Parameters**:
- `id` (number, required): The project ID to delete

### add_task
Adds a task to a project.

**Parameters**:
- `projectId` (number, required): The project ID
- `headline` (string, required): The task headline
- `details` (string, optional): Additional details
- `deadline` (string, optional): Task deadline

### update_task
Updates a task in a project.

**Parameters**:
- `projectId` (number, required): The project ID
- `taskId` (number, required): The task ID
- `headline` (string, optional): New headline
- `details` (string, optional): New details
- `status` (string, optional): New status (todo, in-progress, done)
- `deadline` (string, optional): New deadline

### delete_task
Deletes a task from a project.

**Parameters**:
- `projectId` (number, required): The project ID
- `taskId` (number, required): The task ID

### add_subtask
Adds a subtask to a task.

**Parameters**:
- `projectId` (number, required): The project ID
- `taskId` (number, required): The task ID
- `text` (string, required): The subtask text

### update_subtask
Updates a subtask.

**Parameters**:
- `projectId` (number, required): The project ID
- `taskId` (number, required): The task ID
- `subtaskId` (number, required): The subtask ID
- `text` (string, optional): New text
- `done` (boolean, optional): Completion status

### delete_subtask
Deletes a subtask.

**Parameters**:
- `projectId` (number, required): The project ID
- `taskId` (number, required): The task ID
- `subtaskId` (number, required): The subtask ID

## Data Structure

### Project
```json
{
  "id": 1234567890,
  "name": "Project Name",
  "createdAt": 1234567890,
  "updatedAt": 1234567890,
  "pinned": false,
  "tasks": []
}
```

### Task
```json
{
  "id": 1234567890,
  "headline": "Task Headline",
  "details": "Task details",
  "status": "todo",
  "done": false,
  "createdAt": 1234567890,
  "updatedAt": 1234567890,
  "deadline": "2025-12-31",
  "subtasks": []
}
```

### Subtask
```json
{
  "id": 1234567890,
  "text": "Subtask text",
  "done": false,
  "createdAt": 1234567890
}
```

## Notes

- The MCP server reads and writes to the same `db.json` file as the Express server
- All IDs are generated using timestamps
- Projects, tasks, and subtasks are automatically timestamped
- The server implements MCP protocol version 2024-11-05
