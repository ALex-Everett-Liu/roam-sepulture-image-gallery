# CRUD Image Management Guide

This guide explains how to use the new CRUD (Create, Read, Update, Delete) functionality in the Roam Sepulture Image Gallery, allowing you to add, edit, and delete images directly within the application.

## Overview

The application now includes a complete CRUD interface for managing your image gallery directly, eliminating the need to manually edit JSON or SQLite database files. The system supports both JSON and SQLite database formats seamlessly.

## New Features

### 🆕 Add New Images
- **Add Image Button**: Click the green "Add Image" button in the management section
- **Comprehensive Form**: Fill out all image properties including title, description, ranking, dimensions, tags, and grouping
- **Smart Defaults**: Automatic ID assignment and default values for common fields
- **Real-time Validation**: Form validation ensures data integrity

### ✏️ Edit Existing Images
- **Hover Controls**: Move your mouse over any image to reveal edit/delete buttons
- **Pre-filled Forms**: Edit modal opens with all current image data pre-populated
- **Full Property Editing**: Modify any aspect of an image including metadata, dimensions, and relationships
- **Safe Updates**: Changes are validated and applied atomically

### 🗑️ Delete Images
- **Confirmation Dialog**: Safety confirmation prevents accidental deletions
- **Cascading Updates**: Automatic cleanup of tag relationships and group associations
- **Undo Protection**: Deleted images cannot be recovered (intentionally)

## User Interface

### Image Editor Modal
The modal provides a comprehensive form for managing image properties:

```
┌─────────────────────────────────────────────────────────────┐
│ 🖼️ Add/Edit Image                                      [X] │
├─────────────────────────────────────────────────────────────┤
│ Title *: [________________________]  Ranking: [5.0____]    │
│                                                             │
│ Image Source: [assets/your-image.jpg]  Width: [600px_]    │
│                                          Height: [400px_] │
│                                                             │
│ Image Type: [Image ▼]                  Is Major Image ☑   │
│                                                             │
│ Group ID: [group-1________________]                        │
│                                                             │
│ Description:                                                │
│ [_______________________________________________________]  │
│                                                             │
│ Tags (comma-separated): [nature, sunset, landscape]        │
│                                                             │
│                                    [Cancel]  [Save Image]  │
└─────────────────────────────────────────────────────────────┘
```

### Image Controls
- **Edit Button** (Blue): Opens the edit modal for the selected image
- **Delete Button** (Red): Shows confirmation dialog before deletion
- **Hover Effects**: Controls appear smoothly when hovering over images

## Form Fields Explained

| Field | Required | Description |
|-------|----------|-------------|
| **Title** | ✅ | Image title (max 200 characters) |
| **Ranking** | ❌ | Rating from 0-10 (default: 5.0) |
| **Image Source** | ❌ | File path or URL (leave empty for placeholder) |
| **Width/Height** | ❌ | Dimensions in pixels or "auto" |
| **Image Type** | ❌ | Auto-detects based on file extension |
| **Is Major Image** | ❌ | Major images can be filtered and sorted |
| **Group ID** | ❌ | Groups images together (leave empty for standalone) |
| **Description** | ❌ | Detailed description (max 500 characters) |
| **Tags** | ❌ | Comma-separated list of tags |

## Technical Implementation

### Server API Endpoints

- **POST** `/api/images` - Add new image
- **PUT** `/api/images` - Update existing image
- **DELETE** `/api/images` - Delete image

All endpoints support both JSON and SQLite database formats automatically.

### Database Operations

The system handles CRUD operations seamlessly for both formats:

**JSON Files:**
- Direct file reading/writing with JSON parsing
- Atomic updates with proper error handling
- Automatic backup and validation

**SQLite Databases:**
- Transaction-based operations for data integrity
- Proper foreign key constraint handling
- Optimized queries with prepared statements

### Error Handling

- **Validation Errors**: Clear error messages for invalid data
- **Database Errors**: Graceful handling of connection issues
- **File System Errors**: Proper permissions and file access handling
- **Network Errors**: Retry logic and timeout handling

## Usage Examples

### Adding a New Image

1. Click the **"Add Image"** button in the management section
2. Fill in the required fields (title is mandatory)
3. Set optional properties like ranking, dimensions, and tags
4. Choose whether it's a major image and assign to a group if desired
5. Click **"Save Image"** to add it to your gallery

### Editing an Existing Image

1. **Hover** over any image in the gallery
2. Click the **blue edit button** that appears
3. Modify any properties in the form
4. Click **"Save Image"** to apply changes

### Deleting an Image

1. **Hover** over the image you want to delete
2. Click the **red delete button** that appears
3. Confirm deletion in the dialog box
4. The image will be permanently removed

## Best Practices

### Data Organization
- **Consistent Naming**: Use descriptive titles for easy identification
- **Proper Grouping**: Group related images together for better organization
- **Tag Management**: Use consistent tags for effective filtering
- **Ranking System**: Use the 0-10 scale consistently across images

### Performance Tips
- **Batch Operations**: For bulk changes, consider using the import/export feature
- **Image Optimization**: Use appropriately sized images for better loading
- **Database Choice**: Use SQLite for large galleries (50+ images) for better performance

### Safety Features
- **Confirmation Dialogs**: Always confirm before deleting images
- **Data Validation**: All inputs are validated before processing
- **Error Recovery**: Failed operations show clear error messages
- **Backup Recommendations**: Regularly export your gallery data

## Troubleshooting

### Common Issues

**"Failed to add image" Error**
- Check that the data file exists and is writable
- Verify all required fields are filled
- Ensure the image ID doesn't already exist

**"Image not found" Error**
- Verify the image ID exists in your gallery
- Check that the data file is properly loaded
- Try refreshing the gallery

**Controls Not Appearing**
- Ensure JavaScript is enabled in your browser
- Check browser console for JavaScript errors
- Verify CSS files are loading correctly

**Modal Not Opening**
- Check for JavaScript errors in browser console
- Ensure all required files are loaded
- Try refreshing the page

### Browser Compatibility
- **Chrome**: Full support with all features
- **Firefox**: Full support with all features
- **Safari**: Full support with all features
- **Edge**: Full support with all features

## Advanced Features

### Keyboard Shortcuts
- **Escape**: Close image editor modal
- **Enter**: Save image (when form is focused)

### Mobile Support
- **Touch-friendly**: All buttons are sized for touch interaction
- **Responsive Design**: Modal adapts to mobile screen sizes
- **Swipe Gestures**: Natural touch interactions

### Integration with Existing Features
- **Tag Cloud Updates**: Tags are automatically updated when images are added/modified
- **Pagination**: Gallery pagination adjusts automatically
- **Filtering**: New images appear in filtered results immediately
- **Sorting**: Images respect current sorting preferences

## Future Enhancements

Planned improvements for the CRUD system:

- **Bulk Operations**: Select multiple images for batch editing/deletion
- **Image Upload**: Direct file upload from local system
- **Drag & Drop**: Drag images to reorder or change groups
- **Advanced Validation**: More sophisticated data validation rules
- **Undo/Redo**: Ability to revert recent changes
- **Version History**: Track changes to images over time

---

The CRUD functionality transforms the Roam Sepulture Image Gallery from a read-only viewer into a complete image management system. You can now build and maintain your entire gallery directly within the application, with the flexibility to work with either JSON files or SQLite databases depending on your needs.