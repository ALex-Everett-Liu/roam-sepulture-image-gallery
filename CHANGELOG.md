# Changelog

All notable changes to the Roam Sepulture Image Gallery project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.0] - 2025-01-26

### Added
- **Initial release** of Electron-based desktop application
- **Core gallery functionality** migrated from web version
- **Advanced image grouping system**
  - Major images with full metadata (ranking, tags, description)
  - Subsidiary images that inherit from major images
  - Expandable/collapsible group containers
  - Grid-based layout with custom spanning options
- **Comprehensive filtering and sorting**
  - Tag-based filtering with real-time search
  - Multiple sorting options: ranking (asc/desc), name (asc/desc)
  - Interactive tag cloud with visual feedback
  - Clear filters functionality
- **Professional fullscreen viewer**
  - Zoom controls (0.1x to 5x magnification)
  - Pan and drag when zoomed in
  - Mouse wheel zoom support
  - Keyboard shortcuts (ESC, +/-, 0 for reset)
  - Touch gesture support for mobile devices
- **Robust data management system**
  - Multiple JSON data source support
  - Native file browser integration via Electron IPC
  - Import/export functionality
  - Settings persistence using localStorage
  - Real-time file listing and validation
- **Desktop application features**
  - Native window management and system integration
  - Express server backend (localhost:3018)
  - RESTful API for data operations
  - Native file dialogs for JSON selection
  - Toast notification system
- **User experience enhancements**
  - Loading states with visual feedback
  - Error handling with fallback data
  - Responsive design for various screen sizes
  - Professional UI with modern styling
  - Keyboard accessibility throughout
- **Developer tools and diagnostics**
  - JSON validation and diagnostic functions
  - Built-in error reporting
  - Development mode with debugging support
  - Comprehensive logging system

### Technical Implementation
- **Electron application architecture**
  - Main process (`main.js`) for window and system management
  - Renderer process (`renderer.js`) for UI logic and interactions
  - Express server (`server.js`) for API and data handling
- **Modern web technologies**
  - HTML5 with semantic markup
  - CSS3 with custom properties and modern layouts
  - ES6+ JavaScript with async/await patterns
  - Font Awesome icons for professional appearance
- **Data handling**
  - JSON schema support for flexible data formats
  - Multiple data source locations (data/, temp/, custom paths)
  - Backward compatibility with original web version formats
  - Metadata inheritance system for grouped images

### Sample Data Included
- `images_data_groups.json` - Demonstrates grouping and subsidiary features
- `images_data_dcim_01.json` - Real-world example with Chinese text and metadata
- `images_data_sample_02.json` - Simple standalone images for basic use cases

### Documentation
- **Comprehensive README.md** with installation and usage instructions
- **ARCHITECTURE.md** with detailed technical documentation
- **DEVELOPMENT.md** with developer guidelines and troubleshooting
- **Inline documentation** throughout codebase
- **JSON schema examples** and format specifications

### Build and Distribution
- **Package.json configuration** for Electron builds
- **Cross-platform support** for Windows, macOS, and Linux
- **Development scripts** for easy testing and building
- **Windows batch file** (`start.bat`) for simplified launching
- **Git configuration** with comprehensive .gitignore

### Migration Accomplishments
- **Complete feature parity** with original web version
- **Enhanced desktop capabilities** beyond web limitations
- **Improved performance** with server-side data processing
- **Better user experience** with native desktop integration
- **Maintainable codebase** with clear separation of concerns

### Known Limitations
- Requires Node.js and npm for installation
- Images must be accessible via local file paths or URLs
- Large datasets may impact performance (optimization planned)
- Icon files not included (placeholder documentation provided)

### Future Roadmap
- Plugin architecture for extensibility
- Advanced image metadata extraction
- Cloud storage integration
- Batch image processing capabilities
- Custom theme support
- Database backend options

---

## Release Notes

This initial release represents a complete migration from a web-based image gallery to a full-featured desktop application. The application maintains all original functionality while adding powerful desktop-specific features and improved user experience.

### Installation Requirements
- Node.js (version 16 or later)
- npm (comes with Node.js)
- Modern operating system (Windows 10+, macOS 10.14+, Ubuntu 18.04+)

### Getting Started
1. Clone or download the application
2. Run `npm install` to install dependencies
3. Use `npm start` or double-click `start.bat` to launch
4. Load your JSON data via the Settings panel
5. Explore the gallery with filtering, sorting, and fullscreen viewing

### Support
- Comprehensive documentation included
- Built-in diagnostic tools
- Sample data for testing and learning
- Clear error messages and troubleshooting guides
