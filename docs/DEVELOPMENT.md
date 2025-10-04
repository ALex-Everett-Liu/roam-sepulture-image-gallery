# Development Guide

## Quick Start

### Prerequisites
1. **Node.js** (v16 or later) - Download from [nodejs.org](https://nodejs.org/)
2. **npm** (comes with Node.js)
3. **Git** (optional, for version control)

### Installation & Setup
```bash
# Navigate to project directory
cd Q:\Coding-2025\roam-sepulture-image-gallery

# Install dependencies
npm install

# Start the application
npm start
```

### Alternative: Windows Batch File
Double-click `start.bat` for automated setup and launch.

## Development Commands

```bash
# Start in development mode (with debugging)
npm run dev

# Start production mode
npm start

# Build distributable packages
npm run build

# Create distribution files
npm run dist
```

## Project Structure

```
roam-sepulture-image-gallery/
├── package.json              # Project configuration
├── main.js                   # Electron main process
├── server.js                 # Express backend server
├── renderer.js               # Frontend logic
├── index.html                # Main UI template
├── styles.css                # Application styling
├── start.bat                 # Windows startup script
├── data/                     # JSON data files
│   ├── images_data_groups.json
│   ├── images_data_dcim_01.json
│   └── images_data_sample_02.json
├── assets/                   # Icons and resources
├── temp/                     # Legacy files (can be removed)
└── docs/                     # Documentation
    ├── README.md
    ├── ARCHITECTURE.md
    └── DEVELOPMENT.md
```

## Making Changes

### Frontend Changes
- **UI Layout**: Modify `index.html`
- **Styling**: Edit `styles.css` 
- **Functionality**: Update `renderer.js`

### Backend Changes
- **API Endpoints**: Modify `server.js`
- **Data Processing**: Update JSON handling in `server.js`

### Electron Changes
- **Window Settings**: Modify `main.js`
- **System Integration**: Update IPC handlers in `main.js`

## Testing Your Changes

### Basic Testing
1. Start the app with `npm start`
2. Load different JSON files from the data directory
3. Test filtering, sorting, and viewing features
4. Try import/export functionality

### Data Testing
1. Use the included sample files:
   - `images_data_groups.json` - Grouping features
   - `images_data_dcim_01.json` - Real-world data
   - `images_data_sample_02.json` - Simple format

2. Test with your own JSON files following the schema

### Error Testing
1. Use "Diagnose JSON" to test file loading
2. Check browser console (F12) for JavaScript errors
3. Check terminal output for server errors

## Adding New Features

### New JSON Data Format
1. Add sample data file to `data/` directory
2. Test loading via Settings panel
3. Update documentation if schema changes

### New UI Components
1. Add HTML structure to `index.html`
2. Style components in `styles.css`
3. Add functionality in `renderer.js`
4. Update event listeners as needed

### New API Endpoints
1. Add route handlers in `server.js`
2. Update frontend API calls in `renderer.js`
3. Test with diagnostic tools
4. Document new endpoints

## Debugging

### Frontend Debugging
- Press **F12** to open Chrome DevTools
- Check Console tab for JavaScript errors
- Use Network tab to monitor API calls
- Use Elements tab to inspect DOM changes

### Backend Debugging
- Check terminal output for server logs
- Use `console.log()` statements in `server.js`
- Test API endpoints with tools like Postman
- Check file system permissions and paths

### Electron Debugging
- Set `NODE_ENV=development` for dev tools
- Check main process output in terminal
- Use Electron's built-in debugging tools
- Test IPC communication between processes

## Common Development Tasks

### Adding a New Image Property
1. Update JSON schema documentation
2. Modify image rendering in `createStandaloneImage()` and related functions
3. Add property handling in filtering/sorting logic
4. Update sample data files
5. Test with various data combinations

### Creating a New Filter Type
1. Add UI controls in `index.html`
2. Style new controls in `styles.css`
3. Add filtering logic in `filterAndSortImages()`
4. Update event listeners in `setupEventListeners()`
5. Save filter state in user settings

### Adding Keyboard Shortcuts
1. Add event listeners in `setupEventListeners()`
2. Implement handlers in `renderer.js`
3. Document shortcuts in README
4. Test on different operating systems

## Performance Optimization

### Image Loading
- Use `loading="lazy"` for images
- Implement virtual scrolling for large datasets
- Cache frequently accessed data
- Optimize image file sizes

### DOM Performance
- Minimize DOM manipulation
- Use document fragments for batch updates
- Debounce search and filter operations
- Recycle DOM elements when possible

### Memory Management
- Clean up event listeners when not needed
- Avoid memory leaks in closures
- Monitor memory usage during development
- Profile with Chrome DevTools

## Packaging & Distribution

### Development Builds
```bash
# Create development build
npm run build

# Test the built application
npm run dist
```

### Production Release
1. Update version in `package.json`
2. Test thoroughly with production data
3. Create distributable packages
4. Test installation on clean systems
5. Document release notes

### Platform-Specific Notes
- **Windows**: Requires `.ico` icon file
- **macOS**: Requires `.icns` icon file
- **Linux**: Requires `.png` icon file
- All platforms support universal builds

## Contributing Guidelines

### Code Style
- Use consistent indentation (2 spaces)
- Follow existing naming conventions
- Add comments for complex logic
- Keep functions focused and small

### Testing Checklist
- [ ] App starts without errors
- [ ] All JSON files load correctly
- [ ] Filtering and sorting work
- [ ] Fullscreen viewer functions
- [ ] Settings persist between sessions
- [ ] Import/export works
- [ ] Keyboard shortcuts respond
- [ ] Responsive design works

### Documentation Updates
- Update README.md for user-facing changes
- Update ARCHITECTURE.md for structural changes
- Add code comments for complex logic
- Update sample JSON files if schema changes

## Troubleshooting Development Issues

### Common Problems
- **Port 3018 in use**: Kill existing processes or change port
- **Node modules missing**: Run `npm install`
- **Permission errors**: Check file system permissions
- **API not responding**: Verify server.js is running

### Clean Installation
```bash
# Remove node modules and reinstall
rm -rf node_modules package-lock.json
npm install

# Or on Windows
rmdir /s node_modules
del package-lock.json
npm install
```

### Reset Application State
1. Clear localStorage in browser (F12 > Application > Local Storage)
2. Delete any cached files
3. Restart the application

## Resources

### Documentation
- [Electron Documentation](https://electronjs.org/docs)
- [Node.js Documentation](https://nodejs.org/docs/)
- [Express.js Documentation](https://expressjs.com/)

### Tools
- [Visual Studio Code](https://code.visualstudio.com/) - Recommended editor
- [Postman](https://www.postman.com/) - API testing
- [Chrome DevTools](https://developers.google.com/web/tools/chrome-devtools)

### Community
- [Electron Community](https://electronjs.org/community)
- [Node.js Community](https://nodejs.org/community/)
- [Stack Overflow](https://stackoverflow.com/questions/tagged/electron)

