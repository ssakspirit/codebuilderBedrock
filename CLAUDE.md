# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Version Control
* Whenever code changes are made, you must record a one-line description with emoji in korean of the change in `.commit_message.txt` with Edit Tool.
   - Read `.commit_message.txt` first, and then Edit.
   - Overwrite regardless of existing content.
   - If it was a git revert related operation, make the .commit_message.txt file empty.

## Project Overview

This is a Minecraft Bedrock Edition agent control system that uses visual block programming (Blockly) to control in-game agents. The system consists of a Node.js WebSocket server that communicates with Minecraft via the Code Connection interface and a web-based Blockly editor for creating agent commands.

## Development Commands

### Running the Application
```bash
npm start         # Start the production server
npm run dev       # Start with nodemon for development
```

### Package Building
The project supports packaging into an executable:
- Use `pkg` configuration in package.json
- Assets are bundled from client/, public/, blocks/, shared/, and figlet fonts

### No Testing Framework
Currently no test framework is configured (`npm test` returns an error).

## Architecture Overview

### Server Architecture (server/index.js)
- **WebSocket Server**: Communicates with Minecraft Bedrock via Code Connection protocol
- **Express Server**: Serves the web interface and handles HTTP requests  
- **Socket.IO**: Manages real-time communication between web client and server
- **Event System**: Handles Minecraft events (PlayerMessage, ItemAcquired, BlockPlaced, BlockBroken)
- **Command Registry**: Maps chat commands to executable block sequences

Key server components:
- Dynamic port allocation (WebSocket: 3000-3010, Express: 4000-4010)
- Command execution queue with stop/start controls
- Event subscription system for Minecraft events
- Agent command translation (movement, building, interaction)

### Client Architecture (client/)
- **Blockly Integration**: Custom blocks for Minecraft agent commands
- **Real-time Communication**: Socket.IO client for server communication
- **Code Generation**: Converts visual blocks to executable JavaScript
- **Event Handling**: Processes Minecraft events and executes corresponding block sequences

Key client files:
- `main.js`: Core application logic, Socket.IO communication, execution control
- `blockly/blocks.js`: Custom Blockly block definitions (agent commands, coordinates, blocks)
- `blockly/generators.js`: JavaScript code generators for custom blocks
- `index.html`: Web interface with Blockly workspace

### Shared Architecture (shared/)
- `constants.js`: Socket event definitions and port configurations
- `types.js`: TypeScript-style data structures for commands and positions
- `utils/`: Utility functions (currently empty)

## Block System

### Custom Block Categories
1. **Hat Blocks**: Event triggers (chat commands, game events)
2. **Agent Blocks**: Movement and action commands (forward, back, turn, place, break)
3. **Coordinate Blocks**: Position system with absolute/relative/facing modes
4. **Block Type Blocks**: Extensive Minecraft block library
5. **Variable/Logic/Math Blocks**: Standard programming constructs

### Event System
- **Chat Commands**: Trigger block execution via in-game chat
- **Game Events**: Respond to item acquisition, block placement/breaking
- **Execution Control**: Start/stop mechanisms with real-time feedback

## Minecraft Integration

### Connection Setup
Requires running this command in Windows Command Prompt as Administrator:
```bash
CheckNetIsolation LoopbackExempt -a -n="Microsoft.MinecraftUWP_8wekyb3d8bbwe"
```

### In-Game Connection
Connect using: `/connect localhost:3000` (or auto-detected port)

### Supported Commands
- Agent movement (forward, back, up, down, left, right)
- Agent rotation (left, right)
- Block operations (place, break, detect, fill)
- Chat/communication commands
- Inventory and item operations
- Mob summoning

## Development Notes

### Code Style
- Korean comments and console messages throughout codebase
- Console logging with emoji indicators for different command types
- Async/await pattern for command execution
- Event-driven architecture with comprehensive error handling

### Port Management
The application automatically finds available ports to avoid conflicts. Default ranges:
- WebSocket: 3000-3010
- Express: 4000-4010

### File Structure Pattern
```
client/          # Frontend Blockly interface
server/          # Backend Node.js server
shared/          # Common constants and types
dist/            # Build output directory
```