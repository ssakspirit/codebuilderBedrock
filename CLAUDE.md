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
```bash
npm run build           # Build Windows executable
npm run build:all       # Build for all platforms (Windows/macOS/Linux)
npm run build:test      # Debug build with verbose output
build.bat              # Automated build script (Windows)
```

The project uses `pkg` to create standalone executables. Assets are bundled from `client/`, `public/`, `shared/`, and `node_modules/figlet/fonts/`.

### No Testing Framework
Currently no test framework is configured (`npm test` returns an error).

## Architecture Overview

### Monolithic Server Architecture (server/index.js - 3069 lines)
The server is a single large file containing all server logic:

**Core Components:**
- **WebSocket Server (ws)**: Handles Minecraft Bedrock Code Connection protocol on dynamic ports (3000-3050)
- **Express Server**: Serves web interface and admin page on dynamic ports (4000-4050)
- **Socket.IO Server**: Real-time bidirectional communication with web clients
- **Command Registry**: In-memory Maps storing command → block mappings
  - `commandBlocks` (Map): Chat commands → {blockId, socket}
  - `itemBlocks` (Map): Item acquisition events → {blockId, socket}
  - `itemUsedBlocks` (Map): Item usage events → {blockId, socket}
  - `blockPlacedBlocks` (Map): Block placement events → {blockId, socket}
  - `blockBrokenBlocks` (Map): Block destruction events → {blockId, socket}

**Event Flow:**
1. Minecraft sends events via WebSocket (PlayerMessage, ItemAcquired, BlockPlaced, etc.)
2. Server parses events and looks up registered blocks in the Maps
3. Server emits Socket.IO event to web client with blockId
4. Client executes corresponding Blockly blocks and sends agent commands back
5. Server translates commands and sends to Minecraft via WebSocket

**Key Functions:**
- `findAvailablePort(startPort, endPort)`: Dynamic port allocation
- `executeAsPlayer(player, command)`: Wraps commands in player context for multiplayer
- `sendPlayerCommand(player, command, commandType)`: Validates and logs command execution
- Event handlers for all Minecraft events (inline within Socket.IO connection handler)

### Client Architecture (client/)

**Files:**
- `index.html`: Main interface with Blockly workspace, toolbox, and execution controls
- `main.js`: Application logic, Socket.IO client, block execution engine
- `blockly/blocks.js`: Custom block definitions (~1400 lines)
- `blockly/generators.js`: JavaScript code generators for custom blocks (~1000 lines)

**Execution Model:**
- Blocks are converted to JavaScript code using Blockly generators
- Code is executed via `eval()` in async context
- Commands are sent to server via Socket.IO events
- Execution state managed with `isExecuting` and `shouldStop` flags

### Shared Architecture (shared/)
- `constants.js`: Socket.IO event names and default port configurations
- `types.js`: Data structure definitions (CommandData, Position)
- `utils/`: Empty directory for future utilities

## Block System

### Custom Block Categories
1. **Hat Blocks** (Event Triggers):
   - `on_chat_command`: Triggered by chat messages
   - `on_item_use`: Triggered when player acquires items
   - `on_item_used`: Triggered when player uses items
   - `on_block_placed`: Triggered when blocks are placed
   - `on_block_broken`: Triggered when blocks are broken

2. **Agent Blocks** (Actions):
   - Movement: forward, back, up, down, left, right
   - Rotation: turn left/right
   - Actions: place, destroy, attack, collect, till, drop

3. **Coordinate Blocks**:
   - `coordinate_pos`: Relative coordinates (~x ~y ~z)
   - `world_pos`: Absolute coordinates (x y z)
   - `facing_pos`: Local/facing coordinates (^x ^y ^z)

4. **Block Type Blocks**:
   - Extensive dropdown with 100+ Minecraft block types
   - Categories: Basic, Wood, Glass, Wool, Ore, Stone variants, etc.

5. **Standard Blocks**: Variables, Logic, Math, Loops (from Blockly library)

### Event Registration System
- Hat blocks automatically register with server when workspace changes
- Each block type sends different Socket.IO events:
  - `updateExecutionCommand` for chat commands
  - `updateItemUseCommand` for item acquisition
  - `updateItemUsedCommand` for item usage
  - `updateBlockPlacedCommand` for block placement
  - `updateBlockBrokenCommand` for block destruction
- Duplicate registrations are rejected by server with error events
- Old registrations are removed when block is deleted

## Minecraft Integration

### Connection Setup
**Required:** Run this command in Windows Command Prompt as Administrator (only needed once):
```bash
CheckNetIsolation LoopbackExempt -a -n="Microsoft.MinecraftUWP_8wekyb3d8bbwe"
```
This allows Minecraft UWP app to connect to localhost. The admin page includes a button to execute this automatically via PowerShell.

### Connection Process
1. Run the application (auto-opens admin page at `http://localhost:4000/admin`)
2. Launch Minecraft Bedrock Edition
3. Copy connection command from admin page (e.g., `/connect localhost:3000`)
4. Paste in Minecraft chat
5. Blockly interface auto-opens at `http://localhost:4000`

### Supported Agent Commands
The system translates Socket.IO events to Minecraft agent commands:
- Movement: `agent move [forward|back|up|down|left|right]`
- Rotation: `agent turn [left|right]`
- Actions: `agent [place|destroy|attack] [direction]`
- Teleport: `agent tp [~x ~y ~z | x y z | ^x ^y ^z]`
- Inventory: `agent [collect|drop|dropall|select] [slot]`
- Utility: `agent till [direction]`, `agent detect [direction] block`

### Coordinate System
- **Relative (~)**: Offset from current position
- **Absolute**: Fixed world coordinates
- **Local (^)**: Offset in facing direction

## Development Notes

### Code Style
- **Language**: Korean comments and console messages throughout
- **Logging**: Heavy use of emoji indicators (✅ 🔥 ➡️ 💥 🏗️ etc.)
- **Patterns**: Async/await for command execution, event-driven architecture
- **Error Handling**: Try-catch blocks with user-friendly notifications

### Port Management
The application automatically finds available ports to avoid conflicts:
- WebSocket: Searches 3000-3050
- Express: Searches 4000-4050
- Admin page displays actual ports in use

### Static File Serving
For `pkg` builds, static files are extracted from snapshot to temp directory:
```javascript
const staticDir = path.join(os.tmpdir(), 'bedrock-agent-static');
```
Regular execution serves files directly from project directories.

### Multiplayer Support
- Guest players can execute code created by host
- Commands run regardless of player permissions
- Agent-related commands are limited for guests
- Chat window behavior differs between host and guests

### File Structure
```
client/               # Frontend Blockly interface
  blockly/           # Custom block definitions and generators
  index.html         # Main interface
  main.js            # Core client logic
server/              # Backend Node.js server
  index.js           # Monolithic server file (3069 lines)
  handlers/          # (Legacy) Previously used for event handlers
  websocket/         # (Legacy) Previously used for WebSocket logic
shared/              # Common constants and types
  constants.js       # Socket.IO events and port configs
  types.js           # Data structures
public/              # Admin interface
  admin.html         # Server status and connection info
dist/                # Build output directory
```

### Known Patterns
- All server logic is in single `server/index.js` file
- Socket.IO events are handled inline within connection callback
- Command registry uses JavaScript Maps for O(1) lookups
- Block execution uses `eval()` for generated JavaScript code
- Each block type has separate registration and execution flow

### Important Considerations
- The codebase uses a monolithic architecture - most logic is in one large file
- Refactoring should maintain the event-driven architecture
- Any changes to Socket.IO events must be synchronized between client and server
- Block registration happens automatically on workspace changes via Blockly listeners
