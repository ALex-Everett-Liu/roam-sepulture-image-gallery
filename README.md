# Roam Sepulture Image Gallery

A powerful, desktop-based image gallery application built with Electron, featuring advanced image grouping, filtering, sorting, and fullscreen viewing capabilities.

## Features

### 🖼️ Core Gallery Features
- **Advanced Image Grouping**: Organize images into collections with major and subsidiary relationships
- **Smart Filtering**: Filter images by tags with real-time search
- **Flexible Sorting**: Sort by ranking, name (ascending/descending)
- **Responsive Grid Layout**: Automatic grid layouts with custom sizing options
- **Fullscreen Viewer**: High-quality fullscreen viewing with zoom and pan capabilities

### 🔧 Data Management
- **Multiple Data Sources**: Support for various JSON data formats
- **Import/Export**: Easy data import and export functionality
- **File Browser Integration**: Native file picker for JSON files
- **Settings Persistence**: User preferences saved automatically
- **Real-time Data Loading**: Dynamic JSON file loading with error handling

### 🎨 User Experience
- **Modern UI**: Clean, professional interface with responsive design
- **Keyboard Shortcuts**: Full keyboard support for navigation and controls
- **Loading States**: Visual feedback during data operations
- **Toast Notifications**: Non-intrusive status updates
- **Drag & Drop Support**: Easy file selection and management

## Installation

### Prerequisites
- Node.js (version 16 or later)
- npm (comes with Node.js)

### Setup
1. **Clone or download the application**
   ```bash
   cd roam-sepulture-image-gallery
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Run the application**
   ```bash
   npm start
   ```

### Development Mode
For development with hot-reload and debugging:
```bash
npm run dev
```

## Usage

### Getting Started
1. **Launch the application** using `npm start`
2. **Load your data** via the Settings panel or use sample data
3. **Browse images** using the grid layout
4. **Filter and sort** as needed using the controls
5. **View images** in fullscreen by clicking on them

### Data Sources
The application can load images from JSON files in several formats:

#### JSON File Locations
- `data/` directory (primary location)
- `temp/` directory (for compatibility)
- Root directory
- Custom file paths via file browser

#### Included Sample Data
- `images_data_groups.json` - Demonstrates grouping features
- `images_data_dcim_01.json` - Real-world example
- `images_data_sample_02.json` - Simple standalone images

### Controls & Navigation

#### Main Interface
- **Sort Dropdown**: Change sorting method (ranking/name, asc/desc)
- **Tag Search**: Filter available tags in real-time
- **Tag Cloud**: Click tags to filter images
- **Clear Filters**: Reset all filters and sorting

#### Settings Panel
- **JSON File Selector**: Choose from available JSON files
- **Custom File Input**: Load files by name or path
- **File Browser**: Use native file picker
- **Sample Data**: Reset to built-in examples

#### Management Functions
- **Refresh**: Reload current data source
- **Export**: Save current gallery data as JSON
- **Import**: Load new JSON data from file
- **Diagnose**: Debug JSON loading issues
- **List Files**: Show all available JSON files

#### Fullscreen Viewer
- **Mouse Wheel**: Zoom in/out
- **Click & Drag**: Pan when zoomed in
- **Keyboard Shortcuts**:
  - `+/=`: Zoom in
  - `-/_`: Zoom out
  - `0`: Reset zoom
  - `Escape`: Close fullscreen

## JSON Data Format

### Basic Structure
```json
{
  "images": [
    {
      "id": 1,
      "title": "Image Title",
      "description": "Image description",
      "src": "path/to/image.jpg",
      "ranking": 9.2,
      "tags": ["tag1", "tag2", "tag3"],
      "width": "600px",
      "height": "400px",
      "gridSpan": 2,
      "isMajor": true,
      "groupId": "group-1"
    }
  ],
  "metadata": {
    "version": "1.0",
    "description": "Gallery description",
    "totalImages": 1,
    "features": ["grouping", "tagging"]
  }
}
```

### Image Properties

#### Required Properties
- `id` (number): Unique identifier
- `title` (string): Display title
- `isMajor` (boolean): Whether image is a major/standalone image

#### Optional Properties
- `description` (string): Detailed description
- `src` (string): Image file path or URL
- `ranking` (number): Numerical ranking for sorting
- `tags` (array): Array of tag strings
- `width` (string): CSS width value
- `height` (string): CSS height value
- `gridSpan` (number): Grid columns to span (1-4)
- `groupId` (string): Group identifier for related images
- `majorImageId` (number): Reference to major image (for subsidiaries)

### Image Types

#### Major Images
- Standalone images or group headers
- Must have `isMajor: true`
- Can have `groupId` for grouping
- Include full metadata (ranking, tags, description)

#### Subsidiary Images
- Part of a group, displayed under major image
- Must have `isMajor: false`
- Require `groupId` and optionally `majorImageId`
- Inherit metadata from major image

#### Standalone Images
- Independent images not part of groups
- Have `isMajor: true` but no `groupId`
- Display individually in grid

## Architecture

The application follows a modern Electron architecture:

```
┌─────────────────────────────────────────┐
│             Electron App                       │
├─────────────────────────────────────────┤
│  Main Process (main.js)                 │
│  ├── Window Management                  │
│  ├── IPC Handlers                      │
│  └── File System Access                │
├─────────────────────────────────────────┤
│  Renderer Process (renderer.js)        │
│  ├── UI Logic                          │
│  ├── Gallery Rendering                 │
│  ├── Event Handling                    │
│  └── Settings Management               │
├─────────────────────────────────────────┤
│  Express Server (server.js)            │
│  ├── JSON Data API                     │
│  ├── File Management                   │
│  └── Static File Serving               │
└─────────────────────────────────────────┘
```

### Key Components

#### Main Process (`main.js`)
- Creates and manages the main application window
- Handles IPC communication with renderer
- Provides native file dialogs and system integration

#### Renderer Process (`renderer.js`)
- Manages the user interface and user interactions
- Handles image gallery rendering and filtering
- Implements fullscreen viewer and settings management

#### Express Server (`server.js`)
- Serves the web interface on localhost:3018
- Provides REST API for JSON data management
- Handles file operations and data validation

#### Styling (`styles.css`)
- Modern, responsive CSS with CSS custom properties
- Supports both light themes and accessibility
- Includes fullscreen viewer and animation styles

## Development

### Project Structure
```
roam-sepulture-image-gallery/
├── package.json          # Dependencies and scripts
├── main.js               # Electron main process
├── server.js             # Express backend
├── index.html            # Main UI template
├── renderer.js           # Frontend logic
├── styles.css            # Application styling
├── data/                 # JSON data files
│   ├── images_data_groups.json
│   ├── images_data_dcim_01.json
│   └── images_data_sample_02.json
├── temp/                 # Legacy/temp files
└── README.md             # This file
```

### Available Scripts
- `npm start` - Start the application
- `npm run dev` - Development mode with debugging
- `npm run build` - Build distributable packages
- `npm run dist` - Create distribution files

### API Endpoints
- `GET /` - Main application interface
- `GET /api/health` - Health check
- `GET /api/data` - List available JSON files
- `GET /api/data/:filename` - Load specific JSON file
- `POST /api/data/:filename` - Save JSON data
- `GET /api/info` - Application information

### Adding New Features

#### Adding New Data Sources
1. Place JSON files in the `data/` directory
2. Follow the documented JSON schema
3. Use the Settings panel to load new files

#### Customizing the Interface
1. Modify `styles.css` for visual changes
2. Update `renderer.js` for functionality changes
3. Modify `index.html` for structural changes

#### Extending the API
1. Add new routes in `server.js`
2. Update `renderer.js` to use new endpoints
3. Test with the diagnostic functions

## Troubleshooting

### Common Issues

#### JSON File Not Loading
- Check file path and permissions
- Verify JSON syntax with the Diagnose function
- Ensure file is in a supported location

#### Images Not Displaying
- Verify image paths in JSON data
- Check if image files exist at specified paths
- Ensure image URLs are accessible

#### Performance Issues
- Reduce image file sizes
- Limit the number of images per group
- Check system memory usage

### Debug Tools
- **Diagnose JSON**: Check JSON loading status
- **List Files**: See all available JSON files
- **Developer Tools**: Press F12 for browser debugging
- **Console Logs**: Check terminal output for errors

## Contributing

### Development Guidelines
1. Follow existing code style and patterns
2. Test changes with multiple data sources
3. Ensure responsive design works on different screen sizes
4. Add appropriate error handling and user feedback

### Testing
- Test with all included sample JSON files
- Verify import/export functionality
- Test fullscreen viewer with different image sizes
- Confirm keyboard shortcuts work correctly

## License

MIT License - see project files for details.

## Support

For issues or questions:
1. Check the troubleshooting section
2. Use the built-in diagnostic tools
3. Review console output for error messages
4. Verify JSON data format compliance
