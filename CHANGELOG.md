# Changelog

All notable changes to the Roam Sepulture Image Gallery project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.2] - 2025-01-26

### Added
- **Complete video format support**
  - Auto-detection of video files (.mp4, .webm, .mov, .avi, .mkv, .ogg, .ogv)
  - Native HTML5 video elements with full controls (play/pause, volume, timeline)
  - Mixed media gallery support (videos and images in same collection)
  - Video compatibility with all existing features (grouping, filtering, sorting)
- **Enhanced media rendering system**
  - `isVideoFile()` utility function for automatic format detection
  - Updated `createMajorImage()`, `createSubsidiaryImage()`, and `createStandaloneImage()` functions
  - Dynamic media element creation based on file extension
  - Proper video MIME type handling and fallback support
- **Fullscreen video viewer**
  - Videos maintain native controls in fullscreen mode
  - Zoom and pan functionality works for both videos and images
  - Mouse drag support unified for all media types
  - Dynamic media container system for flexible content display
- **Documentation and examples**
  - Updated JSON format examples to include video entries
  - Added video support information to user instructions
  - Created test data file (`test_video_data.json`) with video examples
  - Enhanced format notes to clarify mixed media capabilities

### Technical Implementation
- **Media type detection system**
  - File extension-based video format recognition
  - `getMediaType()` utility for determining content type
  - Support for all major video formats and codecs
- **Rendering engine updates**
  - Unified media rendering pipeline for images and videos
  - Dynamic HTML element creation (`<img>` vs `<video>`)
  - Preserved all existing styling and layout capabilities
- **Fullscreen viewer enhancements**
  - Dynamic media container with automatic content switching
  - Event delegation for dynamically created video elements
  - Maintained zoom/pan controls for video content
  - Cross-media-type cursor and interaction handling

### Sample Data
- Added `test_video_data.json` with comprehensive video examples
- Demonstrates major videos, subsidiary videos, and mixed media groups
- Includes various video formats and grid spanning configurations

## [0.1.1] - 2025-01-26

### Added
- **Automatic timestamp functionality**
  - "date" field automatically added to new images using OS system time
  - ISO 8601 format timestamps (e.g., "2025-01-26T16:45:00.000Z")
  - Backward compatibility with existing images (no date field required)
  - Human-readable date display (Today, Yesterday, X days ago, etc.)
  - Date-based sorting for both major and subsidiary images
- **Enhanced sorting options**
  - Added "Date Added (Oldest First)" and "Date Added (Newest First)" sort options
  - Date display integration in image captions and group headers
  - Consistent date formatting across all image types
- **Improved data handling**
  - Automatic date assignment during JSON import operations
  - Non-destructive date handling (preserves existing dates)
  - Real-time date formatting for user display
- **User interface updates**
  - Added date information to image metadata display
  - Updated documentation to reflect new date functionality
  - Enhanced JSON format examples with date field examples

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
  - Multiple sorting options: ranking (asc/desc), name (asc/desc), date added (oldest/newest first)
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
  - Express server (`server.js`) for backend API and static file serving
  - IPC communication for native file dialogs and system integration
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
- **Data management system**
  - JSON-based image storage with flexible schema
  - Support for both grouped and standalone image formats
  - Metadata inheritance system for subsidiary images
  - Real-time validation and error handling
- **User interface design**
  - Responsive grid layout with custom sizing
  - Interactive controls with visual feedback
  - Professional styling with CSS variables
  - Accessibility features and keyboard navigation
- **Development environment**
  - Hot reload development server
  - Comprehensive logging and debugging
  - Cross-platform compatibility (Windows, macOS, Linux)
  - Production-ready build configuration

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
