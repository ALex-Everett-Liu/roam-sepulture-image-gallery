# Assets Directory

This directory contains application assets like icons and images.

## Icon Requirements

For a complete Electron application, you should add the following icon files:

### Windows
- `icon.ico` - Windows icon file (256x256 recommended)

### macOS  
- `icon.icns` - macOS icon file (512x512 recommended)

### Linux
- `icon.png` - PNG icon file (512x512 recommended)

## Creating Icons

You can create these icons from a high-resolution PNG source image using tools like:

- **Online**: https://icoconvert.com/
- **Command Line**: ImageMagick, electron-icon-maker
- **GUI**: GIMP, Photoshop

## Icon Guidelines

- Use a **512x512 pixel** source image
- Keep the design simple and recognizable at small sizes
- Use transparent backgrounds where appropriate
- Test the icon at different sizes (16x16, 32x32, 48x48, etc.)

## Placeholder Icons

Currently, the application references placeholder icon files:
- `assets/icon.png` (Linux)
- `assets/icon.ico` (Windows)  
- `assets/icon.icns` (macOS)

Add your actual icon files to this directory to replace the placeholders.
