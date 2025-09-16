// Renderer process for Image Gallery
const { ipcRenderer } = require('electron');

// Fallback data in case JSON file fails to load
const fallbackImages = [
    {
        id: 1,
        title: "Sunset Landscape",
        description: "Beautiful sunset over mountains",
        src: null,
        ranking: 9.25,
        tags: ["landscape", "sunset", "nature", "mountains"]
    },
    {
        id: 2,
        title: "City Skyline",
        description: "Modern city skyline at night",
        src: null,
        ranking: 8.75,
        tags: ["city", "urban", "night", "skyline"]
    },
    {
        id: 3,
        title: "Ocean Waves",
        description: "Peaceful ocean waves at dawn",
        src: null,
        ranking: 7.8,
        tags: ["ocean", "water", "dawn", "peaceful"]
    }
];

// Global variables
let images = [];
let filteredImages = [];
let currentSort = 'ranking-desc';
let selectedTags = [];
let tagSearchQuery = '';
let isLoading = false;
let currentJsonFile = 'images_data_groups.json';
let availableFiles = [];

// Video support utility functions
function isVideoFile(src) {
    if (!src) return false;
    const videoExtensions = ['.mp4', '.webm', '.mov', '.avi', '.mkv', '.ogg', '.ogv'];
    const extension = src.toLowerCase().substring(src.lastIndexOf('.'));
    return videoExtensions.includes(extension);
}

function getMediaType(src) {
    return isVideoFile(src) ? 'video' : 'image';
}

// Utility function to format dates
function formatDate(dateString) {
    if (!dateString) return 'Unknown';

    try {
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now - date;
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

        if (diffDays === 0) {
            return 'Today';
        } else if (diffDays === 1) {
            return 'Yesterday';
        } else if (diffDays < 7) {
            return `${diffDays} days ago`;
        } else if (diffDays < 30) {
            const weeks = Math.floor(diffDays / 7);
            return `${weeks} ${weeks === 1 ? 'week' : 'weeks'} ago`;
        } else if (diffDays < 365) {
            const months = Math.floor(diffDays / 30);
            return `${months} ${months === 1 ? 'month' : 'months'} ago`;
        } else {
            const years = Math.floor(diffDays / 365);
            return `${years} ${years === 1 ? 'year' : 'years'} ago`;
        }
    } catch (error) {
        console.warn('Error formatting date:', dateString, error);
        return 'Unknown';
    }
}

// Initialize the page
document.addEventListener('DOMContentLoaded', function() {
    loadUserSettings();
    loadAvailableFiles();
    loadImageData();
    setupEventListeners();
    updateSettingsDisplay();
});

// Load user settings from localStorage
function loadUserSettings() {
    const saved = localStorage.getItem('gallerySettings');
    if (saved) {
        try {
            const settings = JSON.parse(saved);
            if (settings.currentJsonFile) {
                currentJsonFile = settings.currentJsonFile;
            }
            if (settings.currentSort) {
                currentSort = settings.currentSort;
                document.getElementById('sort-select').value = currentSort;
            }
        } catch (error) {
            console.warn('Failed to load user settings:', error);
        }
    }
}

// Save user settings to localStorage
function saveUserSettings() {
    const settings = {
        currentJsonFile: currentJsonFile,
        currentSort: currentSort,
        lastUpdated: new Date().toISOString()
    };
    localStorage.setItem('gallerySettings', JSON.stringify(settings));
    updateSettingsDisplay();
}

// Update settings display
function updateSettingsDisplay() {
    document.getElementById('current-json-file').textContent = currentJsonFile;
    document.getElementById('custom-json-file').value = currentJsonFile;
    populateJsonSelector();
}

// Load available JSON files from server
async function loadAvailableFiles() {
    try {
        const response = await fetch('/api/data');
        if (response.ok) {
            const result = await response.json();
            availableFiles = result.files || [];
            populateJsonSelector();
            console.log('Available JSON files:', availableFiles);
        }
    } catch (error) {
        console.warn('Failed to load available files:', error);
    }
}

// Populate JSON file selector
function populateJsonSelector() {
    const selector = document.getElementById('json-file-selector');
    selector.innerHTML = '<option value="">Select a JSON file...</option>';
    
    availableFiles.forEach(file => {
        const option = document.createElement('option');
        option.value = file.name;
        option.textContent = `${file.name} (${file.size}) - ${file.location}`;
        if (file.name === currentJsonFile) {
            option.selected = true;
        }
        selector.appendChild(option);
    });
}

// Load image data from server API
async function loadImageData() {
    showLoadingState();
    isLoading = true;
    
    try {
        console.log(`Attempting to load JSON from API: ${currentJsonFile}`);
        
        const response = await fetch(`/api/data/${encodeURIComponent(currentJsonFile)}`);
        
        if (!response.ok) {
            throw new Error(`Failed to load image data - Status: ${response.status}`);
        }
        
        const result = await response.json();
        const data = result.data;
        
        console.log('Loaded JSON data:', data);
        console.log('JSON structure keys:', Object.keys(data));
        
        // Handle both {images: [...]} and direct array formats
        if (Array.isArray(data)) {
            images = data;
            console.log('Loaded direct array format, length:', images.length);
        } else if (data.images && Array.isArray(data.images)) {
            images = data.images;
            console.log('Loaded images property format, length:', images.length);
        } else {
            console.warn('Unexpected JSON format, using fallback');
            images = fallbackImages;
        }
        
        console.log('Final images array length:', images.length);
        
        // Apply filters after loading data
        filterAndSortImages();
        
        // Update UI with filtered data
        renderTagCloud();
        renderGallery();
        
        console.log(`Successfully loaded ${images.length} images from ${currentJsonFile}`);
        
    } catch (error) {
        console.warn(`Failed to load ${currentJsonFile}, using fallback data:`, error);
        images = fallbackImages;
        
        // Apply filters for fallback too
        filterAndSortImages();
        renderTagCloud();
        renderGallery();
        
        showToast(`Failed to load ${currentJsonFile}. Using sample data.`, 'warning');
    } finally {
        isLoading = false;
        hideLoadingState();
    }
}

// Setup event listeners
function setupEventListeners() {
    document.getElementById('sort-select').addEventListener('change', handleSort);
    document.getElementById('tag-search').addEventListener('input', handleTagSearch);
}

// Show loading state
function showLoadingState() {
    const gallery = document.getElementById('gallery');
    const loadingOverlay = document.getElementById('loading-overlay');
    
    gallery.innerHTML = `
        <div style="grid-column: 1/-1; text-align: center; padding: 60px 20px; color: var(--secondary-color);">
            <div style="font-size: 2rem; margin-bottom: 20px;">📸</div>
            <h3>Loading gallery...</h3>
            <p>Please wait while we load your images.</p>
        </div>
    `;
    
    if (loadingOverlay) {
        loadingOverlay.style.display = 'flex';
    }
}

// Hide loading state
function hideLoadingState() {
    const loadingOverlay = document.getElementById('loading-overlay');
    if (loadingOverlay) {
        loadingOverlay.style.display = 'none';
    }
}

// Render tag cloud
function renderTagCloud() {
    const tagCloud = document.getElementById('tag-cloud');
    if (!images || images.length === 0) {
        tagCloud.innerHTML = '<span style="color: var(--secondary-color);">No tags available</span>';
        return;
    }
    
    // Only use tags from major images for filtering
    const majorImages = images.filter(img => img.isMajor !== false);
    const allTags = [...new Set(majorImages.flatMap(img => img.tags || []))].sort();
    
    tagCloud.innerHTML = '';
    allTags.forEach(tag => {
        const tagElement = document.createElement('button');
        tagElement.className = 'tag';
        tagElement.textContent = tag;
        tagElement.onclick = () => toggleTag(tag, tagElement);
        tagCloud.appendChild(tagElement);
    });
}

// Toggle tag selection
function toggleTag(tag, element) {
    const index = selectedTags.indexOf(tag);
    if (index > -1) {
        selectedTags.splice(index, 1);
        element.classList.remove('active');
    } else {
        selectedTags.push(tag);
        element.classList.add('active');
    }
    filterAndRender();
}

// Handle sort change
function handleSort(event) {
    currentSort = event.target.value;
    saveUserSettings();
    filterAndRender();
}

// Handle tag search
function handleTagSearch(event) {
    tagSearchQuery = event.target.value.toLowerCase();
    const tags = document.querySelectorAll('.tag');
    
    tags.forEach(tag => {
        if (tag.textContent.toLowerCase().includes(tagSearchQuery)) {
            tag.style.display = 'inline-block';
        } else {
            tag.style.display = 'none';
        }
    });
}

// Filter and sort images
function filterAndSortImages() {
    console.log('Starting filterAndSortImages with images:', images ? images.length : 0);
    if (!images || images.length === 0) {
        filteredImages = [];
        return;
    }
    
    // Start with all images including subsidiaries
    let workingImages = [...images];
    
    // Filter by tags if any are selected
    if (selectedTags.length > 0) {
        const majorImagesByGroupId = {};
        images.forEach(img => {
            if (img.isMajor !== false && img.groupId) {
                majorImagesByGroupId[img.groupId] = img;
            }
        });
        
        workingImages = workingImages.filter(img => {
            // For major images, use their own tags
            if (img.isMajor !== false) {
                return selectedTags.every(tag => img.tags && img.tags.includes(tag));
            }
            // For subsidiary images, check their major image's tags
            if (img.groupId && majorImagesByGroupId[img.groupId]) {
                const major = majorImagesByGroupId[img.groupId];
                return selectedTags.every(tag => major.tags && major.tags.includes(tag));
            }
            return true;
        });
    }
    
    // Sort based on current sort option
    const majorImagesByGroupId = {};
    const majorImagesById = {};
    
    images.forEach(img => {
        if (img.isMajor !== false) {
            majorImagesById[img.id] = img;
            if (img.groupId) {
                majorImagesByGroupId[img.groupId] = img;
            }
        }
    });
    
    workingImages.sort((a, b) => {
        let aValue, bValue;
        
        switch (currentSort) {
            case 'ranking-asc':
                aValue = getRankingForSort(a, majorImagesById, majorImagesByGroupId);
                bValue = getRankingForSort(b, majorImagesById, majorImagesByGroupId);
                return aValue - bValue;
            
            case 'ranking-desc':
                aValue = getRankingForSort(a, majorImagesById, majorImagesByGroupId);
                bValue = getRankingForSort(b, majorImagesById, majorImagesByGroupId);
                return bValue - aValue;
            
            case 'name-asc':
                return (a.title || '').localeCompare(b.title || '');
            
            case 'name-desc':
                return (b.title || '').localeCompare(a.title || '');

            case 'date-asc':
                aValue = getDateForSort(a, majorImagesById, majorImagesByGroupId);
                bValue = getDateForSort(b, majorImagesById, majorImagesByGroupId);
                return aValue - bValue;

            case 'date-desc':
                aValue = getDateForSort(a, majorImagesById, majorImagesByGroupId);
                bValue = getDateForSort(b, majorImagesById, majorImagesByGroupId);
                return bValue - aValue;

            default:
                return 0;
        }
    });
    
    filteredImages = workingImages;
    console.log('Final filteredImages count:', filteredImages.length);
}

// Helper function to get ranking for sorting
function getRankingForSort(img, majorImagesById, majorImagesByGroupId) {
    if (img.isMajor !== false) {
        return img.ranking || 0;
    } else if (img.majorImageId) {
        return majorImagesById[img.majorImageId]?.ranking || 0;
    } else if (img.groupId && majorImagesByGroupId[img.groupId]) {
        return majorImagesByGroupId[img.groupId].ranking || 0;
    }
    return 0;
}

// Helper function to get date for sorting
function getDateForSort(img, majorImagesById, majorImagesByGroupId) {
    if (img.isMajor !== false) {
        return img.date ? new Date(img.date).getTime() : 0;
    } else if (img.majorImageId) {
        return majorImagesById[img.majorImageId]?.date ? new Date(majorImagesById[img.majorImageId].date).getTime() : 0;
    } else if (img.groupId && majorImagesByGroupId[img.groupId]) {
        return majorImagesByGroupId[img.groupId].date ? new Date(majorImagesByGroupId[img.groupId].date).getTime() : 0;
    }
    return 0;
}

// Render gallery
function renderGallery() {
    const gallery = document.getElementById('gallery');
    gallery.innerHTML = '';

    if (filteredImages.length === 0) {
        gallery.innerHTML = `
            <div style="grid-column: 1/-1; text-align: center; padding: 40px; color: var(--secondary-color);">
                <h3>No images found</h3>
                <p>Try adjusting your filters or search criteria.</p>
            </div>
        `;
        return;
    }

    // Create a map of group data for quick lookup
    const groupMap = {};
    const subsidiaryMap = {};
    
    // First pass: collect all major images and their subsidiaries
    filteredImages.forEach(img => {
        if (img.isMajor !== false) {
            if (img.groupId) {
                if (!groupMap[img.groupId]) {
                    groupMap[img.groupId] = {
                        major: img,
                        subsidiaries: []
                    };
                }
            }
        } else if (img.groupId && img.isMajor === false) {
            if (!subsidiaryMap[img.groupId]) {
                subsidiaryMap[img.groupId] = [];
            }
            subsidiaryMap[img.groupId].push(img);
        }
    });

    // Sort subsidiaries within each group
    Object.keys(subsidiaryMap).forEach(groupId => {
        subsidiaryMap[groupId].sort((a, b) => a.id - b.id);
        if (groupMap[groupId]) {
            groupMap[groupId].subsidiaries = subsidiaryMap[groupId];
        }
    });

    // Render all images in the correct sorted order
    filteredImages.forEach((img, index) => {
        if (img.isMajor !== false) {
            if (img.groupId && groupMap[img.groupId]) {
                // This is a major image with a group
                const group = groupMap[img.groupId];
                if (!group.rendered) {
                    const groupElement = createImageGroup(group.major, group.subsidiaries);
                    
                    // Add grid span classes to the group container
                    if (group.major.gridSpan) {
                        if (group.major.gridSpan === 2) groupElement.classList.add('wide');
                        else if (group.major.gridSpan === 3) groupElement.classList.add('extra-wide');
                        else if (group.major.gridSpan >= 4) groupElement.classList.add('full-width');
                    }
                    
                    gallery.appendChild(groupElement);
                    group.rendered = true;
                }
            } else {
                // This is a standalone major image
                const item = createStandaloneImage(img);
                gallery.appendChild(item);
            }
        }
    });
}

// Create image group element
function createImageGroup(majorImage, subsidiaries) {
    const groupDiv = document.createElement('div');
    groupDiv.className = 'image-group';
    groupDiv.setAttribute('data-group-id', majorImage.groupId);

    // Create group header
    const header = document.createElement('div');
    header.className = 'group-header';
    header.innerHTML = `
        <div class="group-title">${majorImage.title}</div>
        <div class="group-meta">
            <span class="group-ranking">⭐ ${majorImage.ranking}</span>
            <div class="group-tags">
                ${(majorImage.tags || []).map(tag => `<span class="group-tag">${tag}</span>`).join('')}
            </div>
            <div class="group-date" style="font-size: 0.8rem; opacity: 0.8; margin: 5px 0;">
                Added ${formatDate(majorImage.date)}
            </div>
            <button class="expand-group-btn" onclick="toggleGroup(this)">
                ${subsidiaries.length} more
            </button>
        </div>
    `;

    // Create major image display
    const majorDiv = createMajorImage(majorImage);

    // Create subsidiary gallery
    const subsidiaryGallery = document.createElement('div');
    subsidiaryGallery.className = 'subsidiary-gallery';
    
    subsidiaries.forEach(subsidiary => {
        const subItem = createSubsidiaryImage(subsidiary, majorImage);
        subsidiaryGallery.appendChild(subItem);
    });

    groupDiv.appendChild(header);
    groupDiv.appendChild(majorDiv);
    groupDiv.appendChild(subsidiaryGallery);

    return groupDiv;
}

// Create major image display
function createMajorImage(img) {
    let classes = 'gallery-item';
    
    // Add custom grid span classes
    if (img.gridSpan) {
        if (img.gridSpan === 2) classes += ' wide';
        else if (img.gridSpan === 3) classes += ' extra-wide';
        else if (img.gridSpan >= 4) classes += ' full-width';
    }

    const container = document.createElement('div');
    container.className = 'major-image-container';
    
    const item = document.createElement('div');
    item.className = classes;
    
    const mediaHtml = img.src ? 
        (isVideoFile(img.src) ? 
            `<video controls onclick="openFullscreen('${img.src}', '${img.title}', 'video')" style="width: 100%; height: ${img.height || 'auto'}; object-fit: cover;" preload="metadata">
                <source src="${img.src}" type="video/${img.src.substring(img.src.lastIndexOf('.') + 1)}">
                Your browser does not support the video tag.
            </video>` :
            `<img src="${img.src}" alt="${img.title}" onclick="openFullscreen('${img.src}', '${img.title}', 'image')" loading="lazy" style="width: 100%; height: ${img.height || 'auto'}; object-fit: cover;">`) : 
        `<div class="placeholder" onclick="openFullscreen(null, '${img.title}', 'placeholder')" style="height: ${img.height || '200px'};">${img.title}</div>`;
    
    item.innerHTML = `
        ${mediaHtml}
        <div class="caption">
            ${img.title}
            <div>${img.description || ''}</div>
            <div class="image-date" style="margin-top: 5px; font-size: 0.7rem; opacity: 0.8; color: var(--secondary-color);">
                Added ${formatDate(img.date)}
            </div>
            ${img.width || img.height ?
                `<div style="margin-top: 2px; font-size: 0.7rem; opacity: 0.6;">
                    ${img.width || 'auto'} × ${img.height || 'auto'}
                </div>` : ''
            }
        </div>
    `;
    
    container.appendChild(item);
    return container;
}

// Create subsidiary image display
function createSubsidiaryImage(img, majorImage) {
    const item = document.createElement('div');
    item.className = 'subsidiary-item';

    // Apply grid span classes
    if (img.gridSpan) {
        if (img.gridSpan === 2) item.classList.add('wide');
        else if (img.gridSpan === 3) item.classList.add('extra-wide');
        else if (img.gridSpan >= 4) item.classList.add('full-width');
    }

    const displayTitle = img.title || majorImage.title;
    
    const mediaHtml = img.src ? 
        (isVideoFile(img.src) ? 
            `<video controls onclick="openFullscreen('${img.src}', '${displayTitle}', 'video')" style="width: 100%; height: ${img.height || '120px'}; object-fit: cover;" preload="metadata">
                <source src="${img.src}" type="video/${img.src.substring(img.src.lastIndexOf('.') + 1)}">
                Your browser does not support the video tag.
            </video>` :
            `<img src="${img.src}" alt="${displayTitle}" onclick="openFullscreen('${img.src}', '${displayTitle}', 'image')" loading="lazy" style="width: 100%; height: ${img.height || '120px'}; object-fit: cover;">`) : 
        `<div class="placeholder" onclick="openFullscreen(null, '${displayTitle}', 'placeholder')" style="height: ${img.height || '120px'};">${displayTitle}</div>`;

    item.innerHTML = `
        ${mediaHtml}
        <div class="subsidiary-label">${displayTitle}</div>
    `;

    return item;
}

// Create standalone image display
function createStandaloneImage(img) {
    let classes = 'gallery-item';
    
    // Add custom grid span classes
    if (img.gridSpan) {
        if (img.gridSpan === 2) classes += ' wide';
        else if (img.gridSpan === 3) classes += ' extra-wide';
        else if (img.gridSpan >= 4) classes += ' full-width';
    }

    const item = document.createElement('div');
    item.className = classes;
    
    const mediaHtml = img.src ? 
        (isVideoFile(img.src) ? 
            `<video controls onclick="openFullscreen('${img.src}', '${img.title}', 'video')" style="width: 100%; height: ${img.height || 'auto'}; object-fit: cover;" preload="metadata">
                <source src="${img.src}" type="video/${img.src.substring(img.src.lastIndexOf('.') + 1)}">
                Your browser does not support the video tag.
            </video>` :
            `<img src="${img.src}" alt="${img.title}" onclick="openFullscreen('${img.src}', '${img.title}', 'image')" loading="lazy" style="width: 100%; height: ${img.height || 'auto'}; object-fit: cover;">`) : 
        `<div class="placeholder" onclick="openFullscreen(null, '${img.title}', 'placeholder')" style="height: ${img.height || '200px'};">${img.title}</div>`;
    
    item.innerHTML = `
        ${mediaHtml}
        <div class="ranking">⭐ ${img.ranking}</div>
        <div class="caption">
            ${img.title}
            <div>${img.description || ''}</div>
            <div class="image-tags">
                ${(img.tags || []).map(tag => `<span class="image-tag">${tag}</span>`).join('')}
            </div>
            <div class="image-date" style="margin-top: 5px; font-size: 0.7rem; opacity: 0.8; color: var(--secondary-color);">
                Added ${formatDate(img.date)}
            </div>
            ${img.width || img.height ?
                `<div style="margin-top: 2px; font-size: 0.7rem; opacity: 0.6;">
                    ${img.width || 'auto'} × ${img.height || 'auto'}
                </div>` : ''
            }
        </div>
    `;

    return item;
}

// Toggle group expansion
function toggleGroup(button) {
    const group = button.closest('.image-group');
    group.classList.toggle('group-collapsed');
    
    const isCollapsed = group.classList.contains('group-collapsed');
    button.textContent = isCollapsed ? 
        `${group.querySelectorAll('.subsidiary-item').length} more` : 
        'Hide';
}

// Settings and file management functions
function toggleSettings() {
    const panel = document.getElementById('settings-panel');
    panel.style.display = panel.style.display === 'none' ? 'block' : 'none';
    if (panel.style.display === 'block') {
        loadAvailableFiles(); // Refresh file list when opening settings
    }
}

function loadSelectedJsonFile() {
    const selector = document.getElementById('json-file-selector');
    const selectedFile = selector.value;
    if (selectedFile) {
        currentJsonFile = selectedFile;
        saveUserSettings();
        loadImageData();
    }
}

function setCustomJsonFile() {
    const input = document.getElementById('custom-json-file');
    const customFile = input.value.trim();
    if (customFile) {
        currentJsonFile = customFile;
        saveUserSettings();
        loadImageData();
    }
}

async function browseForJsonFile() {
    try {
        const result = await ipcRenderer.invoke('select-json-file');
        if (!result.canceled && result.filePaths.length > 0) {
            const filePath = result.filePaths[0];
            const fileName = filePath.split(/[/\\]/).pop();
            currentJsonFile = fileName;
            saveUserSettings();
            
            // Try to read the file directly
            try {
                const data = await ipcRenderer.invoke('read-json-file', filePath);
                if (data.images && Array.isArray(data.images)) {
                    // Add date field to new images (existing images keep their original date if present)
                    const now = new Date().toISOString();
                    images = data.images.map(img => {
                        if (!img.date) {
                            return { ...img, date: now };
                        }
                        return img;
                    });

                    selectedTags = [];
                    filterAndRender();
                    showToast(`Loaded ${images.length} images from ${fileName}`, 'success');
                } else {
                    showToast('Invalid JSON format. Expected { "images": [...] }', 'error');
                }
            } catch (error) {
                showToast(`Error reading file: ${error.message}`, 'error');
            }
        }
    } catch (error) {
        showToast('Failed to browse for file', 'error');
    }
}

function resetToFallback() {
    images = fallbackImages;
    currentJsonFile = 'sample-data';
    selectedTags = [];
    filterAndRender();
    saveUserSettings();
    showToast('Using sample data', 'info');
}

function refreshGallery() {
    loadImageData();
}

// Export gallery data to JSON file
function exportGalleryData() {
    const exportData = {
        images: images,
        metadata: {
            version: "1.0",
            exportedAt: new Date().toISOString(),
            totalImages: images.length,
            availableTags: [...new Set(images.flatMap(img => img.tags || []))].sort()
        }
    };
    
    const dataStr = JSON.stringify(exportData, null, 2);
    const dataBlob = new Blob([dataStr], {type: 'application/json'});
    const url = URL.createObjectURL(dataBlob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = 'gallery_data_export.json';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    showToast('Gallery data exported successfully', 'success');
}

// Import gallery data from JSON file
function importGalleryData() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = function(event) {
        const file = event.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = function(e) {
            try {
                const data = JSON.parse(e.target.result);
                if (data.images && Array.isArray(data.images)) {
                    // Add date field to new images (existing images keep their original date if present)
                    const now = new Date().toISOString();
                    images = data.images.map(img => {
                        if (!img.date) {
                            return { ...img, date: now };
                        }
                        return img;
                    });

                    selectedTags = [];
                    currentJsonFile = file.name;

                    // Reset sort to default
                    document.getElementById('sort-select').value = 'ranking-desc';
                    currentSort = 'ranking-desc';

                    // Update UI components
                    filterAndSortImages();
                    renderTagCloud();
                    renderGallery();
                    saveUserSettings();

                    showToast(`Successfully imported ${images.length} images`, 'success');
                } else {
                    showToast('Invalid file format. Please select a valid gallery JSON file.', 'error');
                }
            } catch (error) {
                showToast('Error reading file: ' + error.message, 'error');
            }
        };
        reader.readAsText(file);
    };
    input.click();
}

// Diagnostic function
async function diagnoseJson() {
    console.log('=== JSON DIAGNOSTIC ===');
    console.log('Current settings:', currentJsonFile);
    
    try {
        const response = await fetch(`/api/data/${encodeURIComponent(currentJsonFile)}`);
        console.log('Response status:', response.status);
        console.log('Response ok:', response.ok);
        
        if (response.ok) {
            const result = await response.json();
            console.log('API Response:', result);
            showToast(`JSON loaded successfully. ${result.data.images?.length || 0} images found.`, 'success');
        } else {
            const error = await response.text();
            console.error('API Error:', error);
            showToast(`Failed to load JSON: ${response.status}`, 'error');
        }
    } catch (error) {
        console.error('Fetch error:', error);
        showToast(`Network error: ${error.message}`, 'error');
    }
}

// List available files
async function listAvailableFiles() {
    try {
        await loadAvailableFiles();
        console.log('Available files:', availableFiles);
        
        const fileList = availableFiles.map(f => `${f.name} (${f.size}) - ${f.location}`).join('\n');
        
        if (availableFiles.length === 0) {
            showToast('No JSON files found', 'info');
        } else {
            showToast(`Found ${availableFiles.length} JSON files. Check console for details.`, 'info');
        }
    } catch (error) {
        showToast('Failed to list files: ' + error.message, 'error');
    }
}

// Clear all filters
function clearAllFilters() {
    selectedTags = [];
    tagSearchQuery = '';
    document.getElementById('tag-search').value = '';
    document.getElementById('sort-select').value = 'ranking-desc';
    currentSort = 'ranking-desc';
    
    document.querySelectorAll('.tag').forEach(tag => {
        tag.classList.remove('active');
        tag.style.display = 'inline-block';
    });
    
    saveUserSettings();
    filterAndRender();
}

// Filter and render
function filterAndRender() {
    filterAndSortImages();
    renderGallery();
}

// Fullscreen viewer functionality
let currentScale = 1;
let isDragging = false;
let startX = 0;
let startY = 0;
let translateX = 0;
let translateY = 0;

function openFullscreen(src, title, mediaType = 'image') {
    if (!src) return;
    
    const viewer = document.getElementById('fullscreen-viewer');
    const mediaContainer = document.querySelector('.fullscreen-media-container');
    
    // Clear existing content
    mediaContainer.innerHTML = '';
    
    if (mediaType === 'video' || isVideoFile(src)) {
        // Create video element
        const video = document.createElement('video');
        video.id = 'fullscreen-video';
        video.className = 'fullscreen-media';
        video.src = src;
        video.controls = true;
        video.style.cssText = `
            max-width: 100%;
            max-height: 100%;
            width: auto;
            height: auto;
            display: block;
            margin: auto;
            transform-origin: center center;
            cursor: grab;
        `;
        mediaContainer.appendChild(video);
    } else {
        // Create image element
        const image = document.createElement('img');
        image.id = 'fullscreen-image';
        image.className = 'fullscreen-media';
        image.src = src;
        image.alt = title;
        image.style.cssText = `
            max-width: 100%;
            max-height: 100%;
            width: auto;
            height: auto;
            display: block;
            margin: auto;
            transform-origin: center center;
            cursor: grab;
        `;
        mediaContainer.appendChild(image);
    }
    
    resetZoom();
    viewer.classList.add('active');
    document.body.style.overflow = 'hidden';
}

function closeFullscreen() {
    const viewer = document.getElementById('fullscreen-viewer');
    viewer.classList.remove('active');
    document.body.style.overflow = '';
}

function zoomIn() {
    currentScale = Math.min(currentScale * 1.2, 5);
    updateTransform();
    showZoomIndicator();
}

function zoomOut() {
    currentScale = Math.max(currentScale / 1.2, 0.1);
    updateTransform();
    showZoomIndicator();
}

function resetZoom() {
    currentScale = 1;
    translateX = 0;
    translateY = 0;
    updateTransform();
    showZoomIndicator();
}

function updateTransform() {
    const media = document.getElementById('fullscreen-image') || document.getElementById('fullscreen-video');
    if (media) {
        media.style.transform = `translate(${translateX}px, ${translateY}px) scale(${currentScale})`;
    }
}

function showZoomIndicator() {
    const indicator = document.getElementById('zoom-indicator');
    indicator.textContent = `${Math.round(currentScale * 100)}%`;
    indicator.classList.add('show');
    
    clearTimeout(window.zoomTimeout);
    window.zoomTimeout = setTimeout(() => {
        indicator.classList.remove('show');
    }, 1500);
}

// Fullscreen viewer event listeners
document.getElementById('fullscreen-viewer').addEventListener('wheel', (e) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    currentScale = Math.max(0.1, Math.min(currentScale * delta, 5));
    updateTransform();
    showZoomIndicator();
});

// Mouse drag functionality
const viewer = document.getElementById('fullscreen-viewer');

// Use event delegation for dynamic media elements
viewer.addEventListener('mousedown', (e) => {
    const media = e.target;
    if ((media.id === 'fullscreen-image' || media.id === 'fullscreen-video') && currentScale > 1) {
        isDragging = true;
        startX = e.clientX - translateX;
        startY = e.clientY - translateY;
        viewer.style.cursor = 'grabbing';
        e.preventDefault();
    }
});

document.addEventListener('mousemove', (e) => {
    if (isDragging) {
        translateX = e.clientX - startX;
        translateY = e.clientY - startY;
        updateTransform();
    }
});

document.addEventListener('mouseup', () => {
    isDragging = false;
    viewer.style.cursor = 'grab';
});

// Keyboard shortcuts
document.addEventListener('keydown', (e) => {
    if (!viewer.classList.contains('active')) return;
    
    switch(e.key) {
        case 'Escape':
            closeFullscreen();
            break;
        case '+':
        case '=':
            zoomIn();
            break;
        case '-':
        case '_':
            zoomOut();
            break;
        case '0':
            resetZoom();
            break;
    }
});

// Close on background click
viewer.addEventListener('click', (e) => {
    if (e.target === viewer) {
        closeFullscreen();
    }
});

// Toast notification system
function showToast(message, type = 'info', duration = 3000) {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${type === 'success' ? '#28a745' : type === 'error' ? '#dc3545' : type === 'warning' ? '#ffc107' : '#17a2b8'};
        color: white;
        padding: 12px 20px;
        border-radius: 6px;
        z-index: 10002;
        box-shadow: 0 2px 10px rgba(0,0,0,0.2);
        transform: translateX(100%);
        transition: transform 0.3s ease;
        max-width: 300px;
        font-size: 14px;
    `;
    
    toast.innerHTML = `
        <div style="display: flex; align-items: center; justify-content: space-between;">
            <span>${message}</span>
            <button onclick="this.parentElement.parentElement.remove()" style="background: none; border: none; color: white; cursor: pointer; margin-left: 10px; font-size: 16px;">×</button>
        </div>
    `;
    
    document.body.appendChild(toast);
    
    // Animate in
    setTimeout(() => {
        toast.style.transform = 'translateX(0)';
    }, 10);
    
    // Auto remove after duration
    setTimeout(() => {
        toast.style.transform = 'translateX(100%)';
        setTimeout(() => {
            if (toast.parentElement) {
                toast.remove();
            }
        }, 300);
    }, duration);
}
