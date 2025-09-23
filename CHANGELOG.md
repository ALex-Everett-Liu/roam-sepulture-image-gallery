# Changelog

All notable changes to the Roam Sepulture Image Gallery project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.2.1] - 2025-09-22

### Bug Fixes - Bidirectional Aspect Ratio Support
- **Fixed dual-direction aspect ratio preservation**
  - Resolved issue where only width-based aspect ratio was working correctly
  - Now supports both scenarios: width-only → height auto-adjusts, height-only → width auto-adjusts
  - Fixed major image containers not properly adapting when only height is specified
- **Resolved inline style conflicts**
  - Removed hardcoded `style="width: 100%; height: auto;"` from img and video elements
  - Fixed conflict between inline styles and CSS `data-sizing` rules
  - All media elements now properly respect container sizing attributes
- **Enhanced data-sizing system**
  - Added `data-sizing` attribute support for major images (.major-image-container)
  - Unified sizing behavior across major images, subsidiary images, and standalone images
  - Fixed issue where major images with height-only settings were being cropped instead of scaled

### Technical Improvements
- **Cleaner HTML generation**
  - Removed inline CSS styles from dynamically generated img/video elements
  - Moved all sizing logic to CSS classes using data-sizing attributes
  - Improved separation of concerns between JavaScript logic and visual styling
- **Enhanced CSS rule specificity**
  - Added specific CSS rules for major image containers with data-sizing attributes
  - Ensures consistent behavior across all image types and containers
  - Better handling of placeholder elements in different sizing scenarios

### User Experience Enhancements
- **More intuitive image sizing**
  - Images with only height specified now properly scale width to maintain aspect ratio
  - No more unexpected cropping when using height-only configurations
  - Consistent aspect ratio preservation regardless of which dimension is specified
- **Improved visual consistency**
  - Major images, subsidiary images, and standalone images now all follow the same sizing logic
  - Predictable behavior when switching between width-only, height-only, or both dimensions specified

### Migration Impact
- **Seamless upgrade**: No changes required to existing JSON configurations
- **Better handling**: Existing height-only configurations now work as expected
- **Performance**: Slightly improved rendering due to reduced inline style processing

### Example Usage
```json
{
  "width": null,
  "height": "900px"
  // Image will now properly scale width to maintain aspect ratio
  // instead of being cropped to fit container
}
```

```json
{
  "width": "400px", 
  "height": null
  // Image height auto-adjusts to maintain aspect ratio
  // (this was already working correctly)
}

## [0.2.0] - 2025-09-22

### Major Changes - Layout System Overhaul
- **Complete removal of gridSpan system**
  - Eliminated complex 12-column grid calculations and gridSpan-to-CSS class mappings
  - Replaced with intuitive direct `width` and `height` property control
  - Simplified codebase by removing hundreds of lines of grid-related logic
  - No more confusing gridSpan values (1, 2, 3, 4) - now just specify exact dimensions
- **Flexbox-based layout system**
  - Migrated from CSS Grid to Flexbox for main gallery (`display: flex; flex-wrap: wrap`)
  - Images now arrange naturally based on their specified dimensions
  - Eliminated dependency on complex responsive grid breakpoints
  - More predictable and intuitive layout behavior

### Enhanced Image Aspect Ratio Handling
- **Intelligent aspect ratio preservation**
  - When only `width` is specified, images automatically maintain original aspect ratios
  - Fixed CSS bug where subsidiary images were forced to 120px height regardless of settings
  - Removed hardcoded height constraints from `.subsidiary-item img` and `.placeholder` elements
  - Images now scale naturally when container dimensions change
- **Improved height handling**
  - `height: auto` applied to all media elements when height not explicitly specified
  - Added `min-height` fallbacks to prevent images from becoming too small
  - Better handling of placeholder elements with natural aspect ratios

### Simplified Configuration
- **Streamlined JSON format**
  - `gridSpan` field no longer needed - removed from all sample data
  - Direct pixel values recommended: `"width": "400px"` instead of grid calculations
  - Cleaner, more intuitive configuration: see exactly what dimensions you're setting
  - Backward compatible: existing JSON files continue to work
- **Manual precision control**
  - Every image size is explicitly controlled via `width` and `height` properties
  - No more guessing what `gridSpan: 3` will look like on different screen sizes
  - Pixel-perfect control over gallery layout and appearance

### Code Quality Improvements
- **Massive code simplification**
  - Removed complex `createStandaloneImage()` 12-column grid container logic
  - Simplified `createMajorImage()` and `createSubsidiaryImage()` functions
  - Eliminated CSS classes: `.wide`, `.extra-wide`, `.full-width`, and grid-column span rules
  - Reduced CSS file size by removing redundant responsive grid media queries
- **Enhanced maintainability**
  - Clearer code paths with direct dimension application
  - Removed conditionals for gridSpan-to-class mapping
  - Unified approach to image sizing across all image types
  - Easier debugging and modification of layout behavior

### User Experience Benefits
- **Predictable layout behavior**
  - What you set in JSON is exactly what appears on screen
  - No more calculations needed to understand how `gridSpan` translates to actual width
  - Consistent behavior across all screen sizes and device types
- **Better wide-screen utilization**
  - Images can be sized precisely for optimal display on any screen width
  - No artificial constraints from predefined grid column counts
  - Natural flexbox wrapping creates optimal layouts automatically

### Technical Implementation
- **CSS architecture overhaul**
  ```css
  /* Before: Complex grid system */
  #gallery {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(min(250px, 20vw), 1fr));
  }
  
  /* After: Simple flexbox */
  #gallery {
    display: flex;
    flex-wrap: wrap;
    gap: 20px;
    align-items: flex-start;
  }
  ```
- **JavaScript simplification**
  ```javascript
  // Before: Complex gridSpan logic
  if (img.gridSpan === 2) item.classList.add('wide');
  else if (img.gridSpan === 3) item.classList.add('extra-wide');
  
  // After: Direct dimension control
  if (img.width) item.style.width = img.width;
  if (img.height) item.style.height = img.height;
  ```

### Migration Guide
- **Existing users**: No action required - all existing JSON files work without modification
- **New configurations**: Use direct pixel values instead of gridSpan for more precise control
- **Recommended approach**: Specify exact `width` values, let `height` auto-adjust for aspect ratio

### Breaking Changes
- None for end users - full backward compatibility maintained
- Developers: `gridSpan`-related CSS classes removed, but JSON `gridSpan` fields still accepted (ignored)

## [0.1.4] - 2025-09-22

### Added
- **Ultra-wide screen optimization**
  - Removed 1200px container width limitation, now supports up to 2400px or 95% viewport width
  - Dynamic grid system that adapts to screen width with intelligent column sizing
  - Progressive responsive design with optimized breakpoints for 1440px+, 1920px+, and 2560px+
  - Enhanced grid utilization allowing more columns on wider displays
- **Improved full-width image support**
  - Unified full-width implementation using `grid-column: 1 / -1` for true edge-to-edge display
  - Enhanced `gridSpan: 4` behavior to properly utilize entire available width
  - Better coordination between `gridSpan` and `width` properties in JSON configuration
- **Enhanced user interface for wide screens**
  - Centered pagination controls with maximum width constraints to prevent over-stretching
  - Optimized control panels and tag clouds for better wide-screen layout
  - Management section with intelligent column layout for documentation
  - Proportionally scaled typography for larger displays (up to 3rem headers on 1920px+ screens)

### Technical Implementation
- **Responsive grid system enhancements**
  - Base grid: `minmax(min(250px, 20vw), 1fr)` for dynamic column sizing
  - 1440px+: `minmax(min(220px, 18vw), 1fr)` allowing 6-8 columns
  - 1920px+: `minmax(min(200px, 15vw), 1fr)` supporting 7-9 columns  
  - 2560px+: `minmax(min(180px, 12vw), 1fr)` enabling 10-13 columns
- **Container system overhaul**
  - Dynamic width calculation using `min(95vw, 2400px)` for optimal space utilization
  - Progressive padding adjustments (30px → 40px → 50px → 60px) across breakpoints
  - Intelligent maximum width constraints for different UI components
- **Grid span optimization**
  - Consistent `gridSpan` to CSS class mapping across all image types
  - Enhanced subsidiary gallery grid systems for ultra-wide displays
  - Improved gap spacing that scales with screen size (20px → 35px)

### User Experience Improvements
- **Better content organization**
  - Wide-screen layouts prevent UI elements from becoming too dispersed
  - Centered layouts for controls and pagination maintain comfortable viewing angles
  - Multi-column documentation display for enhanced readability on large screens
- **Improved visual balance**
  - Typography scaling ensures comfortable reading at all screen sizes
  - Progressive spacing adjustments maintain proper content density
  - Enhanced visual hierarchy through responsive design patterns

### Configuration Guidance
- **JSON optimization recommendations**
  - `gridSpan: 1-2` for standard images (adapts well to column increases)
  - `gridSpan: 3` recommended for important images on ultra-wide screens  
  - `gridSpan: 4` for true full-width banners and panoramic content
  - `width: "100%"` recommended over fixed pixel values for optimal adaptation

### Backward Compatibility
- **Seamless migration**
  - All existing JSON configurations continue to work without modification
  - Enhanced behavior maintains visual consistency while improving wide-screen utilization
  - No breaking changes to existing features or data formats
- **Progressive enhancement**
  - Standard screens (< 1440px) maintain existing appearance and behavior
  - Wide-screen benefits only activate on appropriate displays
  - Graceful fallbacks ensure compatibility across all device types

## [0.1.3] - 2025-09-22

### Added
- **Complete pagination system**
  - Configurable items per page (6, 12, 18, 24, 36, 48, 60 items)
  - Full pagination navigation with first/last/previous/next buttons
  - Smart page number display with ellipsis for large page counts
  - Direct page jump functionality with input validation
  - Responsive pagination controls for mobile devices
- **Enhanced user experience**
  - Automatic page reset when filters or sorting changes
  - Smooth scrolling to gallery top when changing pages
  - Real-time pagination info display (e.g., "Showing 1-12 of 24 images")
  - Visual feedback for active page and disabled navigation buttons
- **Settings persistence**
  - Pagination preferences saved to localStorage
  - Current page and items-per-page settings restored on app restart
  - Integrated with existing settings management system
- **Performance optimization**
  - Only renders images for current page, improving performance with large datasets
  - Reduced DOM overhead by limiting rendered elements
  - Efficient pagination calculations with boundary handling

### Technical Implementation
- **State management enhancements**
  - Added pagination-specific global variables (`currentPage`, `itemsPerPage`, `totalPages`, `paginatedImages`)
  - Extended user settings persistence to include pagination state
  - Smart pagination calculation with automatic boundary correction
- **UI component additions**
  - New pagination container with info display, navigation controls, and page jump
  - Dynamic page number generation with smart ellipsis handling
  - Responsive CSS styling matching application theme
  - Integration with existing gallery layout and controls
- **Function enhancements**
  - Modified `renderGallery()` to work with paginated data subset
  - Enhanced `filterAndSortImages()` to apply pagination after processing
  - Added comprehensive pagination navigation functions
  - Updated settings management to handle pagination preferences

### User Interface Updates
- **Settings panel additions**
  - Items per page selector with preset options
  - Pagination reset button for quick defaults
  - Visual integration with existing settings layout
- **Gallery enhancements**
  - Pagination controls positioned below gallery grid
  - Clean, professional styling with hover effects and transitions
  - Mobile-responsive design with flexible layout
  - Clear visual separation between gallery content and pagination

### Compatibility
- **Backward compatibility maintained**
  - All existing gallery features work seamlessly with pagination
  - Grouping, filtering, sorting, and fullscreen viewing fully compatible
  - No breaking changes to JSON data format or existing functionality
- **Performance benefits**
  - Large image collections now load and display faster
  - Reduced memory usage by limiting rendered DOM elements
  - Smoother user experience with paginated content loading

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
