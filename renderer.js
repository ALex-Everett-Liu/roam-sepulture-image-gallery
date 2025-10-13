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

// CRUD Editor variables
let currentEditingImage = null;
let isEditMode = false;

// Tag cloud pagination variables
let allTags = []; // All available tags
let displayedTags = []; // Currently displayed tags
let currentTagPage = 1;
let tagsPerPage = 50; // Number of tags to display per page
let totalTagPages = 1;

// Pagination variables
let currentPage = 1;
let itemsPerPage = 12;
let totalPages = 1;
let paginatedImages = [];

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
            if (settings.itemsPerPage) {
                itemsPerPage = settings.itemsPerPage;
            }
            if (settings.currentPage) {
                currentPage = settings.currentPage;
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
        itemsPerPage: itemsPerPage,
        currentPage: currentPage,
        lastUpdated: new Date().toISOString()
    };
    localStorage.setItem('gallerySettings', JSON.stringify(settings));
    updateSettingsDisplay();
}

// Update settings display
function updateSettingsDisplay() {
    document.getElementById('current-json-file').textContent = currentJsonFile;
    document.getElementById('custom-json-file').value = currentJsonFile;
    
    // Update pagination settings display
    const itemsPerPageSelector = document.getElementById('items-per-page-selector');
    if (itemsPerPageSelector) {
        itemsPerPageSelector.value = itemsPerPage;
    }
    
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
            console.log('Available data files:', availableFiles);
        }
    } catch (error) {
        console.warn('Failed to load available files:', error);
    }
}

// Populate file selector (supports both JSON and SQLite database files)
function populateJsonSelector() {
    const selector = document.getElementById('json-file-selector');
    selector.innerHTML = '<option value="">Select a data file...</option>';

    availableFiles.forEach(file => {
        const option = document.createElement('option');
        option.value = file.name;
        const fileType = file.type === 'sqlite' ? '🗄️' : '📄';
        option.textContent = `${fileType} ${file.name} (${file.size}) - ${file.location}`;
        if (file.name === currentJsonFile) {
            option.selected = true;
        }
        selector.appendChild(option);
    });
}

// Load image data from server API (supports both JSON and SQLite database files)
async function loadImageData() {
    console.log('🔄 loadImageData called - starting to load data');
    console.log('📁 Current data file:', currentJsonFile);

    showLoadingState();
    isLoading = true;

    try {
        console.log(`Attempting to load data from API: ${currentJsonFile}`);

        const response = await fetch(`/api/data/${encodeURIComponent(currentJsonFile)}`);

        if (!response.ok) {
            throw new Error(`Failed to load image data - Status: ${response.status}`);
        }

        const result = await response.json();
        const data = result.data;

        console.log('Loaded data:', data);
        console.log('Data source:', result.source);
        console.log('Data structure keys:', Object.keys(data));

        // Handle both {images: [...]} and direct array formats (from both JSON and SQLite)
        if (Array.isArray(data)) {
            images = data;
            console.log('Loaded direct array format, length:', images.length);
        } else if (data.images && Array.isArray(data.images)) {
            images = data.images;
            console.log('Loaded images property format, length:', images.length);
        } else {
            console.warn('Unexpected data format, using fallback');
            images = fallbackImages;
        }

        console.log('Final images array length:', images.length);

        // Apply filters after loading data
        console.log('🔄 Applying filters and sorting...');
        filterAndSortImages();

        // Update UI with filtered data
        console.log('🔄 Rendering UI components...');
        renderTagCloud();
        renderGallery();

        console.log(`Successfully loaded ${images.length} images from ${currentJsonFile} (${result.source})`);

        // Show toast notification with source info
        if (result.source === 'sqlite') {
            showToast(`Loaded ${images.length} images from SQLite database`, 'success');
        } else if (result.source === 'json') {
            showToast(`Loaded ${images.length} images from JSON file`, 'success');
        }

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
        console.log('✅ loadImageData completed');
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

// Render tag cloud with pagination and search
function renderTagCloud() {
    const tagCloud = document.getElementById('tag-cloud');
    if (!images || images.length === 0) {
        tagCloud.innerHTML = '<span style="color: var(--secondary-color);">No tags available</span>';
        return;
    }

    // Only use tags from major images for filtering
    const majorImages = images.filter(img => img.isMajor !== false);
    let filteredTags = [...new Set(majorImages.flatMap(img => img.tags || []))];

    // Apply search filter if there's a search query
    if (tagSearchQuery) {
        filteredTags = filteredTags.filter(tag =>
            tag.toLowerCase().includes(tagSearchQuery)
        );
    }

    // Sort tags alphabetically
    allTags = filteredTags.sort();

    // Calculate pagination
    totalTagPages = Math.ceil(allTags.length / tagsPerPage);
    currentTagPage = Math.min(currentTagPage, totalTagPages) || 1;

    // Get tags for current page
    const startIndex = (currentTagPage - 1) * tagsPerPage;
    const endIndex = startIndex + tagsPerPage;
    displayedTags = allTags.slice(startIndex, endIndex);

    // Clear existing tags
    tagCloud.innerHTML = '';

    // Render current page of tags
    displayedTags.forEach(tag => {
        const tagElement = document.createElement('button');
        tagElement.className = 'tag';
        tagElement.textContent = tag;
        tagElement.onclick = () => toggleTag(tag, tagElement);

        // Check if this tag is currently selected
        if (selectedTags.includes(tag)) {
            tagElement.classList.add('active');
        }

        tagCloud.appendChild(tagElement);
    });

    // Render pagination controls
    renderTagPagination();
}

// Render tag pagination controls
function renderTagPagination() {
    const paginationContainer = document.getElementById('tag-pagination-container');
    const paginationInfo = document.getElementById('tag-pagination-info-text');
    const pageNumbersContainer = document.getElementById('tag-page-numbers');

    // Hide pagination if there are no tags or only one page
    if (allTags.length === 0 || totalTagPages <= 1) {
        paginationContainer.style.display = 'none';
        return;
    }

    // Show pagination container
    paginationContainer.style.display = 'block';

    // Update pagination info
    const startTag = (currentTagPage - 1) * tagsPerPage + 1;
    const endTag = Math.min(currentTagPage * tagsPerPage, allTags.length);
    paginationInfo.textContent = `Showing ${startTag}-${endTag} of ${allTags.length} tags`;

    // Clear existing page numbers
    pageNumbersContainer.innerHTML = '';

    // Calculate page number range to display
    const maxVisiblePages = 5;
    let startPage = Math.max(1, currentTagPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalTagPages, startPage + maxVisiblePages - 1);

    // Adjust start page if we're near the end
    if (endPage - startPage + 1 < maxVisiblePages) {
        startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

    // Add page numbers
    for (let i = startPage; i <= endPage; i++) {
        const pageButton = document.createElement('button');
        pageButton.className = 'pagination-btn';
        pageButton.textContent = i;
        pageButton.onclick = () => goToTagPage(i);

        if (i === currentTagPage) {
            pageButton.classList.add('active');
        }

        pageNumbersContainer.appendChild(pageButton);
    }

    // Update navigation button states
    const firstBtn = document.getElementById('tag-first-page-btn');
    const prevBtn = document.getElementById('tag-prev-page-btn');
    const nextBtn = document.getElementById('tag-next-page-btn');
    const lastBtn = document.getElementById('tag-last-page-btn');

    firstBtn.disabled = currentTagPage === 1;
    prevBtn.disabled = currentTagPage === 1;
    nextBtn.disabled = currentTagPage === totalTagPages;
    lastBtn.disabled = currentTagPage === totalTagPages;
}

// Tag pagination navigation functions
function goToFirstTagPage() {
    currentTagPage = 1;
    renderTagCloud();
}

function goToPreviousTagPage() {
    if (currentTagPage > 1) {
        currentTagPage--;
        renderTagCloud();
    }
}

function goToNextTagPage() {
    if (currentTagPage < totalTagPages) {
        currentTagPage++;
        renderTagCloud();
    }
}

function goToLastTagPage() {
    currentTagPage = totalTagPages;
    renderTagCloud();
}

function goToTagPage(page) {
    if (page >= 1 && page <= totalTagPages) {
        currentTagPage = page;
        renderTagCloud();
    }
}

function jumpToTagPage() {
    const input = document.getElementById('tag-page-jump-input');
    const page = parseInt(input.value);
    if (page >= 1 && page <= totalTagPages) {
        goToTagPage(page);
        input.value = '';
    }
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
    
    currentPage = 1; // Reset to first page when filtering changes
    saveUserSettings();
    filterAndRender();
}

// Handle sort change
function handleSort(event) {
    currentSort = event.target.value;
    currentPage = 1; // Reset to first page when sorting changes
    saveUserSettings();
    filterAndRender();
}

// Handle tag search with pagination support
function handleTagSearch(event) {
    tagSearchQuery = event.target.value.toLowerCase();

    // Reset to first page when searching
    currentTagPage = 1;

    // Re-render the tag cloud with search applied
    renderTagCloud();
}

// Calculate pagination data
function calculatePagination() {
    const totalItems = filteredImages.length;
    totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage));
    
    // Ensure current page is within valid range
    if (currentPage > totalPages) {
        currentPage = totalPages;
    }
    if (currentPage < 1) {
        currentPage = 1;
    }
}

// Apply pagination to filtered images
function applyPagination() {
    calculatePagination();
    
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    
    paginatedImages = filteredImages.slice(startIndex, endIndex);
    
    updatePaginationDisplay();
}

// Update pagination display elements
function updatePaginationDisplay() {
    const paginationContainer = document.getElementById('pagination-container');
    const paginationInfo = document.getElementById('pagination-info-text');
    const pageNumbers = document.getElementById('page-numbers');
    const pageJumpInput = document.getElementById('page-jump-input');
    
    // Show/hide pagination container
    if (totalPages > 1) {
        paginationContainer.style.display = 'block';
    } else {
        paginationContainer.style.display = 'none';
        return;
    }
    
    // Update pagination info
    const startItem = (currentPage - 1) * itemsPerPage + 1;
    const endItem = Math.min(currentPage * itemsPerPage, filteredImages.length);
    paginationInfo.textContent = `Showing ${startItem}-${endItem} of ${filteredImages.length} images`;
    
    // Update page jump input
    pageJumpInput.max = totalPages;
    pageJumpInput.placeholder = currentPage;
    
    // Update page numbers
    generatePageNumbers();
    
    // Update navigation buttons
    updateNavigationButtons();
}

// Generate page number buttons
function generatePageNumbers() {
    const pageNumbers = document.getElementById('page-numbers');
    pageNumbers.innerHTML = '';
    
    const maxVisiblePages = 7;
    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
    
    // Adjust start page if we're near the end
    if (endPage - startPage < maxVisiblePages - 1) {
        startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }
    
    // Show first page and ellipsis if needed
    if (startPage > 1) {
        const firstBtn = createPageButton(1);
        pageNumbers.appendChild(firstBtn);
        
        if (startPage > 2) {
            const ellipsis = document.createElement('span');
            ellipsis.className = 'page-ellipsis';
            ellipsis.textContent = '...';
            pageNumbers.appendChild(ellipsis);
        }
    }
    
    // Show page numbers
    for (let i = startPage; i <= endPage; i++) {
        const pageBtn = createPageButton(i);
        pageNumbers.appendChild(pageBtn);
    }
    
    // Show last page and ellipsis if needed
    if (endPage < totalPages) {
        if (endPage < totalPages - 1) {
            const ellipsis = document.createElement('span');
            ellipsis.className = 'page-ellipsis';
            ellipsis.textContent = '...';
            pageNumbers.appendChild(ellipsis);
        }
        
        const lastBtn = createPageButton(totalPages);
        pageNumbers.appendChild(lastBtn);
    }
}

// Create a page number button
function createPageButton(pageNum) {
    const button = document.createElement('button');
    button.className = 'page-number-btn';
    button.textContent = pageNum;
    button.onclick = () => goToPage(pageNum);
    
    if (pageNum === currentPage) {
        button.classList.add('active');
    }
    
    return button;
}

// Update navigation button states
function updateNavigationButtons() {
    const firstBtn = document.getElementById('first-page-btn');
    const prevBtn = document.getElementById('prev-page-btn');
    const nextBtn = document.getElementById('next-page-btn');
    const lastBtn = document.getElementById('last-page-btn');
    
    // Disable/enable buttons based on current page
    firstBtn.disabled = currentPage === 1;
    prevBtn.disabled = currentPage === 1;
    nextBtn.disabled = currentPage === totalPages;
    lastBtn.disabled = currentPage === totalPages;
}

// Filter and sort images
function filterAndSortImages() {
    console.log('Starting filterAndSortImages with images:', images ? images.length : 0);
    if (!images || images.length === 0) {
        filteredImages = [];
        paginatedImages = [];
        updatePaginationDisplay();
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
    
    // Apply pagination after filtering and sorting
    applyPagination();
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

    if (paginatedImages.length === 0) {
        if (filteredImages.length === 0) {
            gallery.innerHTML = `
                <div style="grid-column: 1/-1; text-align: center; padding: 40px; color: var(--secondary-color);">
                    <h3>No images found</h3>
                    <p>Try adjusting your filters or search criteria.</p>
                </div>
            `;
        } else {
            gallery.innerHTML = `
                <div style="grid-column: 1/-1; text-align: center; padding: 40px; color: var(--secondary-color);">
                    <h3>No images on this page</h3>
                    <p>Go to a different page or adjust pagination settings.</p>
                </div>
            `;
        }
        return;
    }

    // Create a map of group data for quick lookup
    const groupMap = {};
    const subsidiaryMap = {};
    
    // First pass: collect all major images and their subsidiaries from paginated images
    paginatedImages.forEach(img => {
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
    paginatedImages.forEach((img, index) => {
        if (img.isMajor !== false) {
            if (img.groupId && groupMap[img.groupId]) {
                // This is a major image with a group
                const group = groupMap[img.groupId];
                if (!group.rendered) {
                    const groupElement = createImageGroup(group.major, group.subsidiaries);
                    
                    // 图片组使用主图的宽度，简单直接
                    const majorImg = group.major;
                    if (majorImg.width && majorImg.width !== '100%' && majorImg.width !== 'auto') {
                        // 组容器适应主图宽度
                        groupElement.style.width = 'fit-content';
                        groupElement.style.minWidth = '250px';
                        groupElement.style.maxWidth = '100%';
                    }
                    // 不再使用gridSpan，完全依赖width控制
                    
                    gallery.appendChild(groupElement);
                    group.rendered = true;
                }
            } else {
                // 独立图片 - 直接使用width/height控制
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
    
    const container = document.createElement('div');
    container.className = 'major-image-container';
    
    const item = document.createElement('div');
    item.className = classes;
    
    // 智能尺寸控制：支持宽高比的双向自适应
    if (img.width) {
        container.style.width = img.width;
    }
    if (img.height) {
        container.style.height = img.height;
    }

    // 根据设置的维度决定图片的填充方式
    if (img.width && img.height) {
        // 两者都设置：强制尺寸
        item.style.width = '100%';
        item.style.height = '100%';
    } else if (img.width && !img.height) {
        // 只设置宽度：高度自适应保持宽高比
        item.style.width = '100%';
        item.style.height = 'auto';
    } else if (!img.width && img.height) {
        // 只设置高度：宽度自适应保持宽高比
        item.style.width = 'auto';
        item.style.height = '100%';
    } else {
        // 都不设置：使用默认尺寸
        item.style.width = 'auto';
        item.style.height = 'auto';
    }

    // 为主图也设置data-sizing属性
    const hasWidth = img.width && img.width !== '100%' && img.width !== 'auto';
    const hasHeight = img.height && img.height !== '100%' && img.height !== 'auto';

    if (hasWidth && hasHeight) {
        item.setAttribute('data-sizing', 'both');
    } else if (hasWidth && !hasHeight) {
        item.setAttribute('data-sizing', 'width-only');
    } else if (!hasWidth && hasHeight) {
        item.setAttribute('data-sizing', 'height-only');
    } else {
        item.setAttribute('data-sizing', 'auto');
    }
        
    const mediaHtml = img.src ? 
    (isVideoFile(img.src) ? 
        `<video controls onclick="openFullscreen('${img.src}', '${img.title}', 'video')" preload="metadata">
            <source src="${img.src}" type="video/${img.src.substring(img.src.lastIndexOf('.') + 1)}">
            Your browser does not support the video tag.
        </video>` :
        `<img src="${img.src}" alt="${img.title}" onclick="openFullscreen('${img.src}', '${img.title}', 'image')" loading="lazy">`) : 
    `<div class="placeholder" onclick="openFullscreen(null, '${img.title}', 'placeholder')">${img.title}</div>`;

    item.innerHTML = `
        <div class="image-controls">
            <button class="image-control-btn edit" onclick="showEditImageModal(${JSON.stringify(img).replace(/"/g, '&quot;')})" title="Edit Image">
                <i class="fas fa-edit"></i>
            </button>
            <button class="image-control-btn delete" onclick="confirmDeleteImage(${JSON.stringify(img).replace(/"/g, '&quot;')})" title="Delete Image">
                <i class="fas fa-trash"></i>
            </button>
        </div>
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

    // 智能尺寸控制：支持宽高比的双向自适应
    if (img.width) {
        item.style.width = img.width;
    }
    if (img.height) {
        item.style.height = img.height;
    }

    // 为内部媒体元素设置合适的布局模式
    const hasWidth = img.width && img.width !== '100%' && img.width !== 'auto';
    const hasHeight = img.height && img.height !== '100%' && img.height !== 'auto';

    if (hasWidth && hasHeight) {
        item.setAttribute('data-sizing', 'both');       // 强制尺寸
    } else if (hasWidth && !hasHeight) {
        item.setAttribute('data-sizing', 'width-only'); // 宽度固定，高度自适应
    } else if (!hasWidth && hasHeight) {
        item.setAttribute('data-sizing', 'height-only'); // 高度固定，宽度自适应
    } else {
        item.setAttribute('data-sizing', 'auto');       // 自然尺寸
    }

    const displayTitle = img.title || majorImage.title;
    
    const mediaHtml = img.src ? 
        (isVideoFile(img.src) ? 
            `<video controls onclick="openFullscreen('${img.src}', '${displayTitle}', 'video')" preload="metadata">
                <source src="${img.src}" type="video/${img.src.substring(img.src.lastIndexOf('.') + 1)}">
                Your browser does not support the video tag.
            </video>` :
            `<img src="${img.src}" alt="${displayTitle}" onclick="openFullscreen('${img.src}', '${displayTitle}', 'image')" loading="lazy">`) : 
        `<div class="placeholder" onclick="openFullscreen(null, '${displayTitle}', 'placeholder')">${displayTitle}</div>`;

    item.innerHTML = `
        <div class="image-controls">
            <button class="image-control-btn edit" onclick="showEditImageModal(${JSON.stringify(img).replace(/"/g, '&quot;')})" title="Edit Image">
                <i class="fas fa-edit"></i>
            </button>
            <button class="image-control-btn delete" onclick="confirmDeleteImage(${JSON.stringify(img).replace(/"/g, '&quot;')})" title="Delete Image">
                <i class="fas fa-trash"></i>
            </button>
        </div>
        ${mediaHtml}
        <div class="subsidiary-label">${displayTitle}</div>
    `;

    return item;
}

// Create standalone image display
function createStandaloneImage(img) {
    let classes = 'gallery-item';
    
    const item = document.createElement('div');
    item.className = classes;
    
    // 智能尺寸控制：支持宽高比的双向自适应
    if (img.width) {
        item.style.width = img.width;
    }
    if (img.height) {
        item.style.height = img.height;
    }

    // 为内部媒体元素设置合适的布局模式
    const hasWidth = img.width && img.width !== '100%' && img.width !== 'auto';
    const hasHeight = img.height && img.height !== '100%' && img.height !== 'auto';

    if (hasWidth && hasHeight) {
        item.setAttribute('data-sizing', 'both');       // 强制尺寸
    } else if (hasWidth && !hasHeight) {
        item.setAttribute('data-sizing', 'width-only'); // 宽度固定，高度自适应
    } else if (!hasWidth && hasHeight) {
        item.setAttribute('data-sizing', 'height-only'); // 高度固定，宽度自适应
    } else {
        item.setAttribute('data-sizing', 'auto');       // 自然尺寸
    }
        
    const mediaHtml = img.src ? 
        (isVideoFile(img.src) ? 
            `<video controls onclick="openFullscreen('${img.src}', '${img.title}', 'video')" preload="metadata">
                <source src="${img.src}" type="video/${img.src.substring(img.src.lastIndexOf('.') + 1)}">
                Your browser does not support the video tag.
            </video>` :
            `<img src="${img.src}" alt="${img.title}" onclick="openFullscreen('${img.src}', '${img.title}', 'image')" loading="lazy">`) : 
        `<div class="placeholder" onclick="openFullscreen(null, '${img.title}', 'placeholder')">${img.title}</div>`;

    item.innerHTML = `
        <div class="image-controls">
            <button class="image-control-btn edit" onclick="showEditImageModal(${JSON.stringify(img).replace(/"/g, '&quot;')})" title="Edit Image">
                <i class="fas fa-edit"></i>
            </button>
            <button class="image-control-btn delete" onclick="confirmDeleteImage(${JSON.stringify(img).replace(/"/g, '&quot;')})" title="Delete Image">
                <i class="fas fa-trash"></i>
            </button>
        </div>
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
    currentPage = 1; // Reset to first page when clearing filters
    
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

// Pagination navigation functions
function goToPage(pageNum) {
    if (pageNum >= 1 && pageNum <= totalPages && pageNum !== currentPage) {
        currentPage = pageNum;
        applyPagination();
        renderGallery();
        saveUserSettings();
        
        // Scroll to top of gallery
        document.getElementById('gallery').scrollIntoView({ behavior: 'smooth' });
    }
}

function goToFirstPage() {
    goToPage(1);
}

function goToPreviousPage() {
    goToPage(currentPage - 1);
}

function goToNextPage() {
    goToPage(currentPage + 1);
}

function goToLastPage() {
    goToPage(totalPages);
}

function jumpToPage() {
    const input = document.getElementById('page-jump-input');
    const pageNum = parseInt(input.value);
    
    if (!isNaN(pageNum)) {
        goToPage(pageNum);
        input.value = '';
    }
}

// Settings functions for pagination
function updateItemsPerPage() {
    const selector = document.getElementById('items-per-page-selector');
    const newItemsPerPage = parseInt(selector.value);
    
    if (newItemsPerPage !== itemsPerPage) {
        itemsPerPage = newItemsPerPage;
        currentPage = 1; // Reset to first page when changing items per page
        
        filterAndSortImages(); // This will apply pagination
        renderGallery();
        saveUserSettings();
        
        showToast(`Updated to ${itemsPerPage} items per page`, 'success');
    }
}

function resetPagination() {
    currentPage = 1;
    itemsPerPage = 12;
    
    // Update UI
    document.getElementById('items-per-page-selector').value = itemsPerPage;
    
    filterAndSortImages();
    renderGallery();
    saveUserSettings();
    
    showToast('Pagination settings reset', 'info');
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

// CRUD Image Editor Functions
function showAddImageModal() {
    isEditMode = false;
    currentEditingImage = null;

    document.getElementById('modal-title').textContent = 'Add New Image';
    document.getElementById('image-editor-form').reset();

    // Set default values
    document.getElementById('image-type').value = 'image';
    document.getElementById('is-major').checked = true;
    // Don't auto-fill ranking - let users decide or leave empty for subsidiaries

    // Set form requirements for new image (title required by default)
    const titleInput = document.getElementById('image-title');
    const titleLabel = document.getElementById('image-title-label');
    titleInput.setAttribute('required', '');
    titleLabel.textContent = 'Title *:';
    titleLabel.style.color = '';

    document.getElementById('image-editor-modal').style.display = 'flex';

    // Setup form change listeners for dynamic requirement updates
    setupFormChangeListeners();
}

/**
 * Handle ranking value - NO AUTO-FILL FOR ANY IMAGE TYPE
 * Returns null for empty values, parsed float for valid numbers
 */
function handleRankingValue(rankingInput, isMajor, groupId) {
    const rankingStr = rankingInput ? rankingInput.trim() : '';

    // If ranking is empty, return null (no default for ANY image type)
    if (!rankingStr) {
        return null;
    }

    // Parse the value - NO DEFAULT FALLBACK
    const parsedRanking = parseFloat(rankingStr);

    // Return parsed value if valid, null if invalid (no auto-fill)
    return isNaN(parsedRanking) ? null : parsedRanking;
}

/**
 * Update form requirements based on image type
 * Makes title and ranking optional for subsidiary images
 */
function updateFormRequirements(image) {
    const titleInput = document.getElementById('image-title');
    const titleLabel = document.getElementById('image-title-label');
    const rankingInput = document.getElementById('image-ranking');
    const rankingLabel = document.getElementById('image-ranking-label');

    // Determine if this is a subsidiary image
    const isSubsidiary = image.isMajor === false && image.groupId && image.majorImageId;

    if (isSubsidiary) {
        // Make title and ranking optional for subsidiary images
        titleInput.removeAttribute('required');
        titleLabel.textContent = 'Title (Optional):';
        titleLabel.style.color = 'var(--secondary-color)';

        // Don't auto-fill ranking for subsidiary images
        if (!rankingLabel) {
            // Create label element if it doesn't exist
            const rankingGroup = rankingInput.closest('.form-group');
            const newLabel = document.createElement('label');
            newLabel.id = 'image-ranking-label';
            newLabel.htmlFor = 'image-ranking';
            newLabel.textContent = 'Ranking (Optional):';
            rankingGroup.insertBefore(newLabel, rankingInput);
        } else {
            rankingLabel.textContent = 'Ranking (Optional):';
            rankingLabel.style.color = 'var(--secondary-color)';
        }

        // Clear auto-filled ranking if it's the default and we're editing
        if (isEditMode && rankingInput.value === '5.0' && !image.ranking) {
            rankingInput.value = '';
        }

        console.log('📝 Title and ranking set as optional for subsidiary image');
    } else {
        // Make title and ranking required for major and standalone images
        titleInput.setAttribute('required', '');
        titleLabel.textContent = 'Title *:';
        titleLabel.style.color = '';

        if (!rankingLabel) {
            // Create label element if it doesn't exist
            const rankingGroup = rankingInput.closest('.form-group');
            const newLabel = document.createElement('label');
            newLabel.id = 'image-ranking-label';
            newLabel.htmlFor = 'image-ranking';
            newLabel.textContent = 'Ranking (0-10):';
            rankingGroup.insertBefore(newLabel, rankingInput);
        } else {
            rankingLabel.textContent = 'Ranking (0-10):';
            rankingLabel.style.color = '';
        }

        // NO auto-fill - let users input ranking themselves
        console.log('📝 Title and ranking set as required for major/standalone image (no auto-fill)');
    }
}

/**
 * Handle form field changes to update requirements dynamically
 */
function setupFormChangeListeners() {
    const isMajorCheckbox = document.getElementById('is-major');
    const groupIdInput = document.getElementById('group-id');

    function updateRequirementsFromForm() {
        const isMajor = isMajorCheckbox.checked;
        const hasGroupId = groupIdInput.value.trim() !== '';
        const isSubsidiary = !isMajor && hasGroupId;

        const titleInput = document.getElementById('image-title');
        const titleLabel = document.getElementById('image-title-label');
        const rankingInput = document.getElementById('image-ranking');
        const rankingLabel = document.getElementById('image-ranking-label');

        if (isSubsidiary) {
            titleInput.removeAttribute('required');
            titleLabel.textContent = 'Title (Optional):';
            titleLabel.style.color = 'var(--secondary-color)';

            rankingLabel.textContent = 'Ranking (Optional):';
            rankingLabel.style.color = 'var(--secondary-color)';

            // NO auto-fill clearing - let users control ranking themselves
        } else {
            titleInput.setAttribute('required', '');
            titleLabel.textContent = 'Title *:';
            titleLabel.style.color = '';

            rankingLabel.textContent = 'Ranking (0-10):';
            rankingLabel.style.color = '';

            // NO auto-fill - let users input ranking themselves
        }
    }

    // Add event listeners
    isMajorCheckbox.addEventListener('change', updateRequirementsFromForm);
    groupIdInput.addEventListener('input', updateRequirementsFromForm);

    // Initial setup
    updateRequirementsFromForm();
}

function showEditImageModal(image) {
    console.log('🖼️ showEditImageModal called with image:', image);
    isEditMode = true;
    currentEditingImage = image;

    document.getElementById('modal-title').textContent = 'Edit Image';

    // Pre-fill form with existing data
    console.log('📝 Pre-filling form with image data:', {
        id: image.id,
        title: image.title,
        ranking: image.ranking,
        src: image.src,
        width: image.width,
        height: image.height,
        isMajor: image.isMajor,
        groupId: image.groupId,
        description: image.description,
        tags: image.tags
    });

    document.getElementById('image-id').value = image.id || '';
    document.getElementById('image-title').value = image.title || '';

    // Handle ranking - NO auto-fill for ANY image type
    document.getElementById('image-ranking').value = image.ranking || '';

    document.getElementById('image-src').value = image.src || '';
    document.getElementById('image-width').value = image.width || '';
    document.getElementById('image-height').value = image.height || '';
    document.getElementById('image-type').value = isVideoFile(image.src) ? 'video' : 'image';
    document.getElementById('is-major').checked = image.isMajor !== false;
    document.getElementById('group-id').value = image.groupId || '';
    document.getElementById('image-description').value = image.description || '';
    document.getElementById('image-tags').value = (image.tags || []).join(', ');

    // Update form requirements based on image type
    updateFormRequirements(image);

    console.log('🎨 Modal opened for editing');
    document.getElementById('image-editor-modal').style.display = 'flex';

    // Setup form change listeners for dynamic requirement updates
    setupFormChangeListeners();
}

function closeImageEditor() {
    document.getElementById('image-editor-modal').style.display = 'none';
    currentEditingImage = null;
    isEditMode = false;
}

async function saveImage(event) {
    console.log('💾 saveImage called - function triggered');
    console.log('📝 isEditMode:', isEditMode, 'currentEditingImage:', currentEditingImage);

    // Handle both form submission and direct button clicks
    let formData;
    let isFormSubmission = false;

    if (event && event.target && event.target.tagName === 'FORM') {
        // This is a form submission
        console.log('📋 Form submission detected');
        event.preventDefault();
        formData = new FormData(event.target);
        isFormSubmission = true;
    } else {
        // This is a direct button click (emergency test)
        console.log('🧪 Direct button click detected (emergency test)');
        console.log('🧪 Creating form data from currentEditingImage');

        // Create form data from the current editing image
        formData = new FormData();
        if (currentEditingImage) {
            formData.append('id', currentEditingImage.id || '');
            formData.append('title', currentEditingImage.title || '');
            formData.append('description', currentEditingImage.description || '');
            formData.append('src', currentEditingImage.src || '');

            // Handle ranking - NO auto-fill for ANY image type
            formData.append('ranking', currentEditingImage.ranking || '');

            formData.append('width', currentEditingImage.width || '');
            formData.append('height', currentEditingImage.height || '');
            formData.append('isMajor', currentEditingImage.isMajor !== false ? 'on' : '');
            formData.append('groupId', currentEditingImage.groupId || '');
            formData.append('tags', (currentEditingImage.tags || []).join(', '));
        }
    }
    console.log('📋 Raw form data:');
    for (let [key, value] of formData.entries()) {
        console.log(`  ${key}: "${value}"`);
    }

    const imageData = {
        title: formData.get('title').trim(),
        description: formData.get('description').trim(),
        src: formData.get('src').trim(),
        ranking: handleRankingValue(formData.get('ranking'), formData.get('isMajor') === 'on', formData.get('groupId').trim()),
        tags: formData.get('tags').split(',').map(tag => tag.trim()).filter(tag => tag),
        width: formData.get('width').trim() || null,  // Convert empty string to null
        height: formData.get('height').trim() || null,  // Convert empty string to null
        isMajor: formData.get('isMajor') === 'on',
        groupId: formData.get('groupId').trim() || null,
        // Don't set date here - preserve original date for updates
    };

    console.log('🔄 Processed imageData:', imageData);
    console.log('📏 Width/Height details:', {
        originalWidth: currentEditingImage?.width,
        originalHeight: currentEditingImage?.height,
        newWidth: imageData.width,
        newHeight: imageData.height
    });

    // Validate required fields based on image type
    const isSubsidiary = !imageData.isMajor && imageData.groupId;
    if (!imageData.title && !isSubsidiary) {
        console.log('❌ Validation failed: Title is required for major and standalone images');
        showToast('Title is required for major and standalone images', 'error');
        return;
    }

    // For subsidiary images, title is optional but we can warn if it's empty
    if (!imageData.title && isSubsidiary) {
        console.log('⚠️ Title is empty for subsidiary image (this is allowed)');
    }

    console.log('✅ Validation passed');

    try {
        if (isEditMode && currentEditingImage) {
            // Update existing image - handle ID changes properly
            console.log('📝 Updating image - Original:', currentEditingImage);
            console.log('📝 Form data:', imageData);

            const originalId = currentEditingImage.id;
            const newId = imageData.id;
            const isIdChanged = originalId !== newId;

            const updatedImage = {
                ...currentEditingImage,
                ...imageData,
                date: currentEditingImage.date  // Ensure original date is preserved
            };

            // If ID changed, add originalId to help backend find the image
            if (isIdChanged) {
                updatedImage.originalId = originalId;
                console.log(`🔀 ID change detected: "${originalId}" → "${newId}"`);
            }

            console.log('🔀 Object merging details:', {
                originalKeys: Object.keys(currentEditingImage),
                formDataKeys: Object.keys(imageData),
                finalKeys: Object.keys(updatedImage),
                beforeMerge: currentEditingImage,
                afterMerge: updatedImage
            });

            console.log('📝 Final updated image:', updatedImage);

            await updateImage(updatedImage);
            console.log('✅ updateImage completed successfully');
            showToast('Image updated successfully', 'success');
        } else {
            // Add new image
            console.log('➕ Adding new image');
            const newImage = {
                id: Math.max(...images.map(img => img.id), 0) + 1,
                ...imageData,
                date: new Date().toISOString()  // Only set date for new images
            };

            console.log('📝 New image data:', newImage);
            await addImage(newImage);
            console.log('✅ addImage completed successfully');
            showToast('Image added successfully', 'success');
        }

        console.log('🔄 Refreshing gallery data...');
        closeImageEditor();
        await loadImageData(); // Refresh the gallery
        console.log('✅ Gallery refreshed successfully');

    } catch (error) {
        console.error('❌ Error saving image:', error);
        console.error('Error stack:', error.stack);
        showToast(`Error saving image: ${error.message}`, 'error');
    }
}

async function addImage(image) {
    try {
        const response = await fetch('/api/images', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                image: image,
                dataFile: currentJsonFile
            })
        });

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const result = await response.json();
        if (!result.success) {
            throw new Error(result.error || 'Failed to add image');
        }

    } catch (error) {
        throw new Error(`Failed to add image: ${error.message}`);
    }
}

async function updateImage(image) {
    console.log('📡 updateImage called with:', image);
    console.log('📡 currentJsonFile:', currentJsonFile);

    try {
        const requestBody = {
            image: image,
            dataFile: currentJsonFile
        };
        console.log('📡 Request body:', JSON.stringify(requestBody, null, 2));

        const response = await fetch('/api/images', {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(requestBody)
        });

        console.log('📡 Response status:', response.status, response.statusText);

        if (!response.ok) {
            const errorText = await response.text();
            console.log('📡 Error response:', errorText);
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const result = await response.json();
        console.log('📡 Response result:', result);

        if (!result.success) {
            throw new Error(result.error || 'Failed to update image');
        }

        console.log('✅ updateImage completed successfully');

    } catch (error) {
        console.error('❌ updateImage failed:', error);
        throw new Error(`Failed to update image: ${error.message}`);
    }
}

async function deleteImage(image) {
    try {
        const response = await fetch('/api/images', {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                imageId: image.id,
                dataFile: currentJsonFile
            })
        });

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const result = await response.json();
        if (!result.success) {
            throw new Error(result.error || 'Failed to delete image');
        }

    } catch (error) {
        throw new Error(`Failed to delete image: ${error.message}`);
    }
}

function confirmDeleteImage(image) {
    if (confirm(`Are you sure you want to delete "${image.title}"? This action cannot be undone.`)) {
        deleteImage(image).then(() => {
            showToast('Image deleted successfully', 'success');
            loadImageData(); // Refresh the gallery
        }).catch(error => {
            console.error('Error deleting image:', error);
            showToast(`Error deleting image: ${error.message}`, 'error');
        });
    }
}

// Close modal when clicking outside
window.addEventListener('click', function(event) {
    const modal = document.getElementById('image-editor-modal');
    if (event.target === modal) {
        closeImageEditor();
    }
});

// Close modal with Escape key
document.addEventListener('keydown', function(event) {
    if (event.key === 'Escape') {
        const modal = document.getElementById('image-editor-modal');
        if (modal.style.display === 'flex') {
            closeImageEditor();
        }
    }
});
