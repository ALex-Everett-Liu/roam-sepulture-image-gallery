const express = require("express");
const path = require("path");
const fs = require("fs");
const cors = require("cors");
const DatabaseManager = require("./database");

const app = express();
const PORT = process.env.PORT || 3019;

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

// Load data from file (JSON or SQLite database)
app.get("/api/data/:filename", async (req, res) => {
  try {
    const filename = req.params.filename;

    // Security: Prevent directory traversal
    if (filename.includes("..") || filename.includes("/") || filename.includes("\\")) {
      return res.status(400).json({ error: "Invalid filename" });
    }

    let filePath;
    const isDatabaseFile = filename.toLowerCase().endsWith('.db');

    // Try different locations for the file
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
        error: `File not found: ${filename}`,
        searchedPaths: possiblePaths
      });
    }

    // Handle SQLite database files
    if (isDatabaseFile) {
      try {
        // Validate that it's a proper SQLite database
        const isValid = await DatabaseManager.isValidDatabase(filePath);
        if (!isValid) {
          return res.status(400).json({
            error: "Invalid SQLite database file",
            details: "The file does not appear to be a valid SQLite database with required tables"
          });
        }

        const dbManager = new DatabaseManager();
        await dbManager.loadDatabase(filePath);

        const data = dbManager.getAllImages();
        const stats = dbManager.getDatabaseStats();
        dbManager.close();

        res.json({
          success: true,
          data: data,
          filename: filename,
          path: filePath,
          size: formatFileSize(fs.statSync(filePath).size),
          source: 'sqlite',
          stats: stats
        });

      } catch (dbError) {
        console.error("Error loading SQLite database:", dbError);
        return res.status(500).json({
          error: "Failed to load SQLite database",
          details: dbError.message,
        });
      }
    } else {
      // Handle JSON files
      try {
        const data = fs.readFileSync(filePath, 'utf8');
        const jsonData = JSON.parse(data);

        res.json({
          success: true,
          data: jsonData,
          filename: filename,
          path: filePath,
          size: formatFileSize(fs.statSync(filePath).size),
          source: 'json'
        });

      } catch (jsonError) {
        console.error("Error loading JSON data:", jsonError);
        return res.status(500).json({
          error: "Failed to load JSON data",
          details: jsonError.message,
        });
      }
    }

  } catch (error) {
    console.error("Error loading data file:", error);
    res.status(500).json({
      error: "Failed to load data file",
      details: error.message,
    });
  }
});

// List available data files (JSON and SQLite databases)
app.get("/api/data", (req, res) => {
  try {
    const files = [];

    // Check data directory
    if (fs.existsSync(DATA_DIR)) {
      const dataFiles = fs.readdirSync(DATA_DIR)
        .filter(file => file.endsWith('.json') || file.endsWith('.db'))
        .map(file => ({
          name: file,
          path: path.join(DATA_DIR, file),
          location: 'data',
          type: file.endsWith('.db') ? 'sqlite' : 'json'
        }));
      files.push(...dataFiles);
    }

    // Check temp directory (for compatibility)
    const tempDir = path.join(__dirname, "temp");
    if (fs.existsSync(tempDir)) {
      const tempFiles = fs.readdirSync(tempDir)
        .filter(file => file.endsWith('.json') || file.endsWith('.db'))
        .map(file => ({
          name: file,
          path: path.join(tempDir, file),
          location: 'temp',
          type: file.endsWith('.db') ? 'sqlite' : 'json'
        }));
      files.push(...tempFiles);
    }

    // Check root directory
    const rootFiles = fs.readdirSync(__dirname)
      .filter(file => file.endsWith('.json') || file.endsWith('.db'))
      .map(file => ({
        name: file,
        path: path.join(__dirname, file),
        location: 'root',
        type: file.endsWith('.db') ? 'sqlite' : 'json'
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
    description: "Electron-based Image Gallery with group functionality and SQLite support",
    features: [
      "image-groups",
      "major-subsidiary",
      "filtering-sorting",
      "tag-management",
      "fullscreen-viewer",
      "settings-management",
      "sqlite-database-support",
      "json-database-support",
      "crud-operations"
    ],
    dataDir: DATA_DIR,
    supportedFormats: ["jpg", "jpeg", "png", "gif", "webp", "svg"],
    supportedDataFormats: ["json", "sqlite"]
  });
});

// CRUD Operations for Images

// Add new image
app.post("/api/images", async (req, res) => {
  try {
    const { image, dataFile } = req.body;

    if (!image || !dataFile) {
      return res.status(400).json({
        success: false,
        error: "Missing required parameters: image and dataFile"
      });
    }

    // Validate required fields
    if (!image.id || !image.title) {
      return res.status(400).json({
        success: false,
        error: "Missing required image fields: id and title"
      });
    }

    let filePath;
    const isDatabaseFile = dataFile.toLowerCase().endsWith('.db');

    // Find the data file
    const possiblePaths = [
      path.join(DATA_DIR, dataFile),
      path.join(__dirname, dataFile),
      path.resolve(dataFile)
    ];

    for (const tryPath of possiblePaths) {
      if (fs.existsSync(tryPath)) {
        filePath = tryPath;
        break;
      }
    }

    if (!filePath) {
      return res.status(404).json({
        success: false,
        error: `Data file not found: ${dataFile}`
      });
    }

    if (isDatabaseFile) {
      // Handle SQLite database
      const dbManager = new DatabaseManager();
      await dbManager.loadDatabase(filePath);
      await dbManager.addImage(image);
      dbManager.close();
    } else {
      // Handle JSON file
      const data = fs.readFileSync(filePath, 'utf8');
      const jsonData = JSON.parse(data);

      if (!jsonData.images || !Array.isArray(jsonData.images)) {
        throw new Error("Invalid JSON format: missing images array");
      }

      jsonData.images.push(image);
      fs.writeFileSync(filePath, JSON.stringify(jsonData, null, 2));
    }

    res.json({
      success: true,
      message: "Image added successfully",
      imageId: image.id
    });

  } catch (error) {
    console.error("Error adding image:", error);
    res.status(500).json({
      success: false,
      error: "Failed to add image",
      details: error.message
    });
  }
});

// Update existing image
app.put("/api/images", async (req, res) => {
  try {
    const { image, dataFile } = req.body;

    if (!image || !dataFile || !image.id) {
      return res.status(400).json({
        success: false,
        error: "Missing required parameters: image, dataFile, and image.id"
      });
    }

    let filePath;
    const isDatabaseFile = dataFile.toLowerCase().endsWith('.db');

    // Find the data file
    const possiblePaths = [
      path.join(DATA_DIR, dataFile),
      path.join(__dirname, dataFile),
      path.resolve(dataFile)
    ];

    for (const tryPath of possiblePaths) {
      if (fs.existsSync(tryPath)) {
        filePath = tryPath;
        break;
      }
    }

    if (!filePath) {
      return res.status(404).json({
        success: false,
        error: `Data file not found: ${dataFile}`
      });
    }

    if (isDatabaseFile) {
      // Handle SQLite database
      const dbManager = new DatabaseManager();
      await dbManager.loadDatabase(filePath);
      await dbManager.updateImage(image);
      dbManager.close();
    } else {
      // Handle JSON file
      const data = fs.readFileSync(filePath, 'utf8');
      const jsonData = JSON.parse(data);

      if (!jsonData.images || !Array.isArray(jsonData.images)) {
        throw new Error("Invalid JSON format: missing images array");
      }

      const imageIndex = jsonData.images.findIndex(img => img.id === image.id);
      if (imageIndex === -1) {
        throw new Error(`Image with ID ${image.id} not found`);
      }

      jsonData.images[imageIndex] = image;
      fs.writeFileSync(filePath, JSON.stringify(jsonData, null, 2));
    }

    res.json({
      success: true,
      message: "Image updated successfully",
      imageId: image.id
    });

  } catch (error) {
    console.error("Error updating image:", error);
    res.status(500).json({
      success: false,
      error: "Failed to update image",
      details: error.message
    });
  }
});

// Delete image
app.delete("/api/images", async (req, res) => {
  try {
    const { imageId, dataFile } = req.body;

    if (!imageId || !dataFile) {
      return res.status(400).json({
        success: false,
        error: "Missing required parameters: imageId and dataFile"
      });
    }

    let filePath;
    const isDatabaseFile = dataFile.toLowerCase().endsWith('.db');

    // Find the data file
    const possiblePaths = [
      path.join(DATA_DIR, dataFile),
      path.join(__dirname, dataFile),
      path.resolve(dataFile)
    ];

    for (const tryPath of possiblePaths) {
      if (fs.existsSync(tryPath)) {
        filePath = tryPath;
        break;
      }
    }

    if (!filePath) {
      return res.status(404).json({
        success: false,
        error: `Data file not found: ${dataFile}`
      });
    }

    if (isDatabaseFile) {
      // Handle SQLite database
      const dbManager = new DatabaseManager();
      await dbManager.loadDatabase(filePath);
      await dbManager.deleteImage(imageId);
      dbManager.close();
    } else {
      // Handle JSON file
      const data = fs.readFileSync(filePath, 'utf8');
      const jsonData = JSON.parse(data);

      if (!jsonData.images || !Array.isArray(jsonData.images)) {
        throw new Error("Invalid JSON format: missing images array");
      }

      const imageIndex = jsonData.images.findIndex(img => img.id === imageId);
      if (imageIndex === -1) {
        throw new Error(`Image with ID ${imageId} not found`);
      }

      jsonData.images.splice(imageIndex, 1);
      fs.writeFileSync(filePath, JSON.stringify(jsonData, null, 2));
    }

    res.json({
      success: true,
      message: "Image deleted successfully",
      imageId: imageId
    });

  } catch (error) {
    console.error("Error deleting image:", error);
    res.status(500).json({
      success: false,
      error: "Failed to delete image",
      details: error.message
    });
  }
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
