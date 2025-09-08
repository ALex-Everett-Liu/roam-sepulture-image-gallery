# Roam Sepulture Image Gallery - Architecture Documentation

## Overview

This Electron-based image gallery application provides a desktop interface for browsing, organizing, and viewing images with advanced grouping and filtering capabilities. The application is migrated from a web-based gallery to a full desktop application.

## System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Electron Runtime                        │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────────┐  ┌──────────────────┐  ┌─────────────┐ │
│  │   Main Process  │  │ Renderer Process │  │   Express   │ │
│  │                 │  │                  │  │   Server    │ │
│  │ • Window Mgmt   │  │ • UI Logic       │  │ • Data API  │ │
│  │ • IPC Handlers  │  │ • Gallery Render │  │ • File Ops  │ │
│  │ • File Dialogs  │  │ • Event Handling │  │ • JSON API  │ │
│  │ • System Integ  │  │ • Settings Mgmt  │  │ • Serving   │ │
│  └─────────────────┘  └──────────────────┘  └─────────────┘ │
└─────────────────────────────────────────────────────────────┘
                              │
┌─────────────────────────────────────────────────────────────┐
│                    Data Layer                               │
├─────────────────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌─────────────┐  ┌─────────────────┐     │
│  │ JSON Files   │  │ Settings    │  │ Image Assets    │     │
│  │ • Groups     │  │ • User Prefs│  │ • Local Files   │     │
│  │ • DCIM Data  │  │ • App State │  │ • Remote URLs   │     │
│  │ • Samples    │  │ • Storage   │  │ • Placeholders  │     │
│  └──────────────┘  └─────────────┘  └─────────────────┘     │
└─────────────────────────────────────────────────────────────┘
```

## Core Components

### Main Process (`main.js`)
**Responsibilities:**
- Creates and manages the main application window
- Handles system-level operations and native dialogs
- Provides IPC communication bridge
- Manages application lifecycle

**Key Functions:**
- `createWindow()` - Initializes the main browser window
- `select-json-file` IPC handler - Opens file picker for JSON files
- `read-json-file` IPC handler - Reads JSON files from filesystem
- `write-json-file` IPC handler - Writes JSON data to filesystem

### Renderer Process (`renderer.js`)
**Responsibilities:**
- Manages the user interface and interactions
- Handles image gallery rendering and filtering
- Implements settings and data management
- Controls fullscreen viewer functionality

**Key Modules:**
- **Data Management**: Loading, filtering, and sorting image data
- **Gallery Rendering**: Dynamic HTML generation for image display
- **Settings Management**: User preferences and data source configuration
- **Fullscreen Viewer**: Zoom, pan, and navigation controls
- **Event Handling**: User interactions and keyboard shortcuts

### Express Server (`server.js`)
**Responsibilities:**
- Serves the web interface on localhost:3018
- Provides REST API for data management
- Handles JSON file operations
- Serves static assets

**API Endpoints:**
- `GET /` - Main application interface
- `GET /api/data` - Lists available JSON files
- `GET /api/data/:filename` - Loads specific JSON file
- `POST /api/data/:filename` - Saves JSON data
- `GET /api/info` - Application information

## Data Flow

### Image Loading Process
```
User Action (Load JSON) 
    ↓
Renderer Process (loadImageData)
    ↓
HTTP Request (/api/data/:filename)
    ↓
Express Server (file reading)
    ↓
JSON Response
    ↓
Renderer Process (data processing)
    ↓
Gallery Rendering (DOM updates)
```

### Settings Management
```
User Changes Settings
    ↓
Renderer Process (saveUserSettings)
    ↓
localStorage (browser storage)
    ↓
Settings Applied (immediate)
    ↓
Data Reload (if needed)
```

## Image Data Model

### Schema Structure
```json
{
  "images": [
    {
      "id": "unique_identifier",
      "title": "display_title",
      "description": "detailed_description",
      "src": "image_path_or_url",
      "ranking": "numeric_score",
      "tags": ["array", "of", "strings"],
      "width": "css_width_value",
      "height": "css_height_value",
      "gridSpan": "grid_columns_to_span",
      "isMajor": "boolean_major_or_subsidiary",
      "groupId": "group_identifier",
      "majorImageId": "reference_to_major_image"
    }
  ],
  "metadata": {
    "version": "schema_version",
    "totalImages": "image_count",
    "features": ["supported_features"]
  }
}
```

### Image Types
- **Major Images**: Standalone or group headers with full metadata
- **Subsidiary Images**: Part of groups, inherit metadata from major images
- **Standalone Images**: Independent images not part of any group

## User Interface Architecture

### Component Hierarchy
```
Container
├── App Header
│   ├── Title & Icon
│   └── Subtitle
├── Controls Panel
│   ├── Sort Controls
│   └── Filter Controls
├── Tag Cloud (Dynamic)
├── Gallery Grid (Dynamic)
│   ├── Image Groups
│   │   ├── Group Header
│   │   ├── Major Image
│   │   └── Subsidiary Gallery
│   └── Standalone Images
├── Settings Panel (Modal)
│   ├── File Selection
│   ├── Data Management
│   └── Preferences
├── Management Section
│   ├── Action Buttons
│   └── Documentation
└── Fullscreen Viewer (Overlay)
    ├── Image Display
    ├── Zoom Controls
    └── Navigation
```

### State Management
The application uses a simple state management pattern:

```javascript
// Global State Variables
let images = [];           // All loaded images
let filteredImages = [];   // Currently filtered/sorted images
let selectedTags = [];     // Active tag filters
let currentSort = '';      // Current sorting method
let currentJsonFile = '';  // Active data source
```

## Key Features Implementation

### Image Grouping System
- **Groups**: Collections of related images with shared metadata
- **Major Images**: Primary images that define group properties
- **Subsidiaries**: Additional images that inherit group metadata
- **Rendering**: Groups render as expandable containers with grid layouts

### Filtering & Sorting
- **Tag Filtering**: Real-time filtering based on selected tags
- **Text Search**: Dynamic tag cloud filtering
- **Sorting Options**: By ranking or name, ascending/descending
- **Inheritance**: Subsidiary images use their major image's metadata

### Fullscreen Viewer
- **Zoom**: Mouse wheel and button controls (0.1x to 5x)
- **Pan**: Click and drag when zoomed in
- **Keyboard**: Full keyboard shortcut support
- **Touch**: Basic touch gesture support for mobile/tablet

## Performance Considerations

### Optimization Strategies
- **Lazy Loading**: Images load as needed with `loading="lazy"`
- **Virtual DOM**: Efficient DOM updates during filtering/sorting
- **Event Delegation**: Efficient event handling for dynamic content
- **Debounced Operations**: Search and filter operations are debounced

### Memory Management
- **Image Cleanup**: Unused image objects are garbage collected
- **DOM Recycling**: Gallery items are reused when possible
- **Data Caching**: JSON data is cached in memory after loading

## Security Considerations

### Input Validation
- **File Paths**: Directory traversal prevention
- **JSON Data**: Schema validation and sanitization
- **File Extensions**: Whitelist-based file type checking

### Electron Security
- **Context Isolation**: Disabled for compatibility (consider enabling)
- **Node Integration**: Enabled for file system access
- **CSP**: Content Security Policy for web content

## Development Workflow

### File Structure
```
roam-sepulture-image-gallery/
├── package.json          # Dependencies and build config
├── main.js               # Electron main process
├── server.js             # Express backend
├── renderer.js           # Frontend application logic
├── index.html            # Main UI template
├── styles.css            # Application styling
├── data/                 # JSON data files
├── assets/               # Application icons and resources
├── temp/                 # Legacy files (can be removed)
└── docs/                 # Documentation
```

### Build Process
1. **Development**: `npm run dev` - Runs with debugging enabled
2. **Production**: `npm start` - Runs optimized version
3. **Distribution**: `npm run build` - Creates distributable packages

### Testing Strategy
- **Manual Testing**: Use included sample data files
- **Data Validation**: Test with various JSON formats
- **Performance Testing**: Large datasets and many images
- **Cross-Platform**: Windows, macOS, Linux compatibility

## Extension Points

### Adding New Features
1. **New Data Sources**: Extend API endpoints in `server.js`
2. **UI Components**: Add new elements in `renderer.js`
3. **Styling**: Extend CSS variables and classes in `styles.css`
4. **Settings**: Add new preferences to settings management

### Plugin Architecture (Future)
The application could be extended with a plugin system:
- **Data Connectors**: Support for databases, cloud storage
- **Image Processors**: Filters, transformations, metadata extraction
- **Export Formats**: PDF, HTML, slideshow generation
- **UI Themes**: Custom styling and layout options

## Troubleshooting

### Common Issues
- **Port Conflicts**: Express server uses port 3018
- **File Permissions**: JSON files must be readable
- **Image Loading**: Check paths and network connectivity
- **Memory Usage**: Large datasets may require optimization

### Debug Tools
- **Console Logging**: Extensive logging for debugging
- **Diagnostic Functions**: Built-in JSON validation and testing
- **Developer Tools**: F12 opens Chrome DevTools
- **Error Handling**: Comprehensive error reporting

## Migration Notes

### Changes from Web Version
- **File System Access**: Now uses native file dialogs
- **Data Loading**: Server-side JSON loading instead of client-side
- **Settings Persistence**: Uses localStorage instead of URL parameters
- **Window Management**: Native window controls and sizing
- **Keyboard Shortcuts**: Enhanced with Electron-specific bindings

### Compatibility
- **JSON Format**: Fully compatible with original web version
- **Image Sources**: Supports both local files and remote URLs
- **Browser Features**: Uses modern web standards with Electron runtime
