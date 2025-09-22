# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Project Overview

This is an Electron-based desktop image gallery application with advanced grouping, filtering, and fullscreen viewing capabilities. The application migrated from a web-based gallery to provide native desktop integration with file system access and improved performance.

## Essential Commands

### Development Commands
```bash
# Install dependencies (run once or after package.json changes)
npm install

# Start the application in production mode
npm start

# Start in development mode (enables developer tools)
npm run dev

# Build distributable packages for all platforms
npm run build

# Create distribution files without publishing
npm run dist
```

### Windows Quick Start
```bash
# Use the included batch file for automated setup and launch
.\start.bat
```

### Testing and Debugging
```bash
# Check available JSON files via API
curl http://localhost:3018/api/data

# Check application health
curl http://localhost:3018/api/health

# Load specific JSON file
curl http://localhost:3018/api/data/images_data_groups.json
```

## Architecture Overview

### Three-Process Architecture

**Main Process (`main.js`)**
- Creates and manages the Electron application window
- Handles native file dialogs and system integration via IPC
- Manages application lifecycle and security policies
- Provides bridge between renderer and file system

**Renderer Process (`renderer.js`)**
- Manages the user interface and interactions
- Handles image gallery rendering, filtering, and fullscreen viewer
- Implements settings management and data persistence
- Communicates with Express server for data operations

**Express Server (`server.js`)**
- Serves the web interface on localhost:3018
- Provides REST API for JSON data management (`/api/data/*`)
- Handles file operations with security validation
- Serves static assets and image files

### Key Data Flow
1. User selects JSON file → Settings panel
2. Renderer requests data → Express API (`/api/data/:filename`)
3. Express reads file → JSON response
4. Renderer processes data → Gallery rendering
5. User interactions → Real-time filtering/sorting

## JSON Data Schema

### Image Object Structure
```json
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
```

### Image Types
- **Major Images**: `isMajor: true` - Standalone or group headers with full metadata
- **Subsidiary Images**: `isMajor: false` - Part of groups, inherit metadata from major images
- **Standalone Images**: `isMajor: true` with no `groupId` - Independent images

### Data File Locations (in priority order)
1. `data/` directory (primary)
2. `temp/` directory (legacy compatibility)
3. Root directory
4. Absolute paths via file browser

## Key Features Implementation

### Image Grouping System
- Groups are collections defined by `groupId` 
- Major images define group properties (title, description, tags, ranking)
- Subsidiary images inherit metadata from their major image
- Groups render as expandable containers with nested galleries

### Filtering & Tagging
- Only major images' tags are used for filtering (subsidiaries inherit)
- Real-time tag cloud filtering with search functionality
- Multiple tag selection with AND logic
- Tag search filters the available tag cloud

### Fullscreen Viewer
- Zoom controls: 0.1x to 5x scale
- Mouse wheel zoom, click-and-drag pan
- Keyboard shortcuts: `+/-` zoom, `0` reset, `Escape` close
- Touch gesture support for mobile/tablet interfaces

## Development Guidelines

### File Structure Organization
```
main.js               # Electron main process
server.js             # Express backend
renderer.js           # Frontend application logic  
index.html            # Main UI template
styles.css            # Application styling
data/                 # JSON data files (primary location)
├── images_data_groups.json      # Grouping features demo
├── images_data_dcim_01.json     # Real-world example
└── images_data_sample_02.json   # Simple format
```

### State Management Pattern
The application uses a simple global state approach:
```javascript
let images = [];           // All loaded images
let filteredImages = [];   // Currently filtered/sorted images
let selectedTags = [];     // Active tag filters
let currentSort = '';      // Current sorting method
let currentJsonFile = '';  // Active data source
```

### Adding New Features

**New Image Properties:**
1. Update JSON schema in sample data files
2. Modify rendering functions (`createStandaloneImage()`, `createImageGroup()`)
3. Add property handling in filtering/sorting logic (`filterAndSortImages()`)
4. Update API validation if needed

**New Filtering Options:**
1. Add UI controls in `index.html`
2. Style in `styles.css` using CSS custom properties
3. Implement logic in `filterAndSortImages()`
4. Add event listeners in `setupEventListeners()`
5. Include in user settings persistence

**New API Endpoints:**
1. Add route handlers in `server.js`
2. Update frontend API calls in `renderer.js`
3. Add proper error handling and security validation
4. Test with diagnostic functions

### Performance Considerations
- Images use `loading="lazy"` for optimal performance
- DOM updates are batched to prevent layout thrashing
- Search and filter operations are debounced
- Large datasets should be paginated (pagination system exists but is not currently active)

### Security Implementation
- Directory traversal prevention in file path handling
- JSON schema validation and sanitization  
- File extension whitelisting for security
- IPC communication uses structured handlers

## Testing Data

### Included Sample Files
- `images_data_groups.json` - Demonstrates grouping with major/subsidiary relationships
- `images_data_dcim_01.json` - Real-world camera data format
- `images_data_sample_02.json` - Simple standalone images format

### Testing Different Scenarios
- Load each sample file to test different data structures
- Test with missing image sources (`src: null`)
- Test grouping with various `gridSpan` values
- Test filtering with different tag combinations
- Test sorting by ranking vs. name (ascending/descending)

## Common Issues & Solutions

### Port 3018 Already in Use
- Kill existing processes: `taskkill /f /im node.exe` (Windows)
- Or change port in `server.js` (line 7)

### JSON File Not Loading
- Check file exists in `data/` directory
- Verify JSON syntax with built-in "Diagnose JSON" function
- Check console output for detailed error messages
- Use "List Files" function to see available files

### Images Not Displaying
- Verify image paths in JSON are correct
- Check if image URLs are accessible (for remote images)
- Ensure local image files exist at specified paths
- Check browser console for 404 errors

### Performance Issues with Large Datasets
- Reduce image file sizes or use thumbnails
- Enable pagination (uncomment pagination code in renderer.js)
- Limit subsidiary images per group
- Consider lazy loading implementation

## API Reference

### Core Endpoints
- `GET /api/data` - List all available JSON files
- `GET /api/data/:filename` - Load specific JSON file
- `POST /api/data/:filename` - Save JSON data to file
- `GET /api/health` - Application health check
- `GET /api/info` - Application information

### IPC Handlers (Main Process)
- `select-json-file` - Open native file picker
- `read-json-file` - Read JSON from file system
- `write-json-file` - Write JSON to file system
- `restart-app` - Restart the application
