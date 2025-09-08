const express = require("express");
const path = require("path");
const fs = require("fs");
const cors = require("cors");

const app = express();
const PORT = 3018;

// Middleware
app.use(cors());
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

// Ensure data directory exists
const DATA_DIR = path.join(__dirname, "data");
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Serve static files
app.use(express.static(__dirname));
app.use("/data", express.static(DATA_DIR));

// Utility functions
function formatFileSize(bytes) {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}

// Routes

// Health check endpoint
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// Serve the main page
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

// Load JSON data from file
app.get("/api/data/:filename", async (req, res) => {
  try {
    const filename = req.params.filename;
    
    // Security: Prevent directory traversal
    if (filename.includes("..") || filename.includes("/") || filename.includes("\\")) {
      return res.status(400).json({ error: "Invalid filename" });
    }

    let filePath;
    
    // Try different locations for the JSON file
    const possiblePaths = [
      path.join(DATA_DIR, filename),
      path.join(__dirname, filename),
      path.join(__dirname, "temp", filename),
      path.resolve(filename) // For absolute paths
    ];

    for (const tryPath of possiblePaths) {
      if (fs.existsSync(tryPath)) {
        filePath = tryPath;
        break;
      }
    }

    if (!filePath) {
      return res.status(404).json({ 
        error: `JSON file not found: ${filename}`,
        searchedPaths: possiblePaths
      });
    }

    const data = fs.readFileSync(filePath, 'utf8');
    const jsonData = JSON.parse(data);

    res.json({
      success: true,
      data: jsonData,
      filename: filename,
      path: filePath,
      size: formatFileSize(fs.statSync(filePath).size)
    });

  } catch (error) {
    console.error("Error loading JSON data:", error);
    res.status(500).json({
      error: "Failed to load JSON data",
      details: error.message,
    });
  }
});

// List available JSON files
app.get("/api/data", (req, res) => {
  try {
    const files = [];
    
    // Check data directory
    if (fs.existsSync(DATA_DIR)) {
      const dataFiles = fs.readdirSync(DATA_DIR)
        .filter(file => file.endsWith('.json'))
        .map(file => ({
          name: file,
          path: path.join(DATA_DIR, file),
          location: 'data'
        }));
      files.push(...dataFiles);
    }

    // Check temp directory (for compatibility)
    const tempDir = path.join(__dirname, "temp");
    if (fs.existsSync(tempDir)) {
      const tempFiles = fs.readdirSync(tempDir)
        .filter(file => file.endsWith('.json'))
        .map(file => ({
          name: file,
          path: path.join(tempDir, file),
          location: 'temp'
        }));
      files.push(...tempFiles);
    }

    // Check root directory
    const rootFiles = fs.readdirSync(__dirname)
      .filter(file => file.endsWith('.json'))
      .map(file => ({
        name: file,
        path: path.join(__dirname, file),
        location: 'root'
      }));
    files.push(...rootFiles);

    // Add file stats
    const filesWithStats = files.map(file => {
      const stats = fs.statSync(file.path);
      return {
        ...file,
        size: formatFileSize(stats.size),
        modified: stats.mtime.toISOString()
      };
    });

    res.json({
      success: true,
      files: filesWithStats,
      total: filesWithStats.length
    });

  } catch (error) {
    console.error("Error listing JSON files:", error);
    res.status(500).json({
      error: "Failed to list JSON files",
      details: error.message,
    });
  }
});

// Save JSON data to file
app.post("/api/data/:filename", (req, res) => {
  try {
    const filename = req.params.filename;
    const data = req.body;

    // Security: Prevent directory traversal
    if (filename.includes("..") || filename.includes("/") || filename.includes("\\")) {
      return res.status(400).json({ error: "Invalid filename" });
    }

    const filePath = path.join(DATA_DIR, filename);
    const jsonString = JSON.stringify(data, null, 2);
    
    fs.writeFileSync(filePath, jsonString, 'utf8');

    res.json({
      success: true,
      message: `Data saved to ${filename}`,
      path: filePath,
      size: formatFileSize(jsonString.length)
    });

  } catch (error) {
    console.error("Error saving JSON data:", error);
    res.status(500).json({
      error: "Failed to save JSON data",
      details: error.message,
    });
  }
});

// Get app info
app.get("/api/info", (req, res) => {
  res.json({
    name: "Roam Sepulture Image Gallery",
    version: "1.0.0",
    description: "Electron-based Image Gallery with group functionality",
    features: [
      "image-groups",
      "major-subsidiary",
      "filtering-sorting",
      "tag-management",
      "fullscreen-viewer",
      "settings-management"
    ],
    dataDir: DATA_DIR,
    supportedFormats: ["jpg", "jpeg", "png", "gif", "webp", "svg"]
  });
});

// Error handling middleware
app.use((error, req, res, next) => {
  console.error("Server error:", error);
  res.status(500).json({ error: "Internal server error" });
});

// Start server
const server = app.listen(PORT, () => {
  console.log(`Image Gallery server running on port ${PORT}`);
  console.log(`Data directory: ${DATA_DIR}`);
});

// Graceful shutdown
process.on("SIGTERM", () => {
  console.log("Received SIGTERM, shutting down gracefully");
  server.close(() => {
    process.exit(0);
  });
});

process.on("SIGINT", () => {
  console.log("Received SIGINT, shutting down gracefully");
  server.close(() => {
    process.exit(0);
  });
});

module.exports = app;
