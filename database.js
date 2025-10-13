const fs = require('fs');
const path = require('path');
const initSqlJs = require('sql.js');

/**
 * Database module for handling SQLite database operations
 * Supports loading data from .db files and converting to JSON format
 */

class DatabaseManager {
    constructor() {
        this.SQL = null;
        this.db = null;
        this.dbFilePath = null;
    }

    /**
     * Initialize SQL.js
     */
    async initialize() {
        if (!this.SQL) {
            this.SQL = await initSqlJs({
                locateFile: file => path.join(__dirname, 'node_modules', 'sql.js', 'dist', file)
            });
        }
    }

    /**
     * Load database from file
     */
    async loadDatabase(dbFilePath) {
        try {
            await this.initialize();

            if (!fs.existsSync(dbFilePath)) {
                throw new Error(`Database file not found: ${dbFilePath}`);
            }

            const fileBuffer = fs.readFileSync(dbFilePath);
            this.db = new this.SQL.Database(fileBuffer);
            this.dbFilePath = dbFilePath;

            // Enable foreign keys
            this.db.run('PRAGMA foreign_keys = ON');

            return true;
        } catch (error) {
            console.error('Error loading database:', error);
            throw error;
        }
    }

    /**
     * Get all images with their tags
     */
    getAllImages() {
        if (!this.db) {
            throw new Error('Database not loaded');
        }

        try {
            // Get all images
            const imagesQuery = `
                SELECT
                    i.id,
                    i.title,
                    i.description,
                    i.src,
                    i.ranking,
                    i.width,
                    i.height,
                    i.is_major,
                    i.group_id,
                    i.major_image_id,
                    i.date_added
                FROM images i
                ORDER BY i.pk_id
            `;

            const imagesResult = this.db.exec(imagesQuery);

            if (!imagesResult || imagesResult.length === 0) {
                return { images: [], metadata: {} };
            }

            const imageRows = imagesResult[0].values;
            const imageColumns = imagesResult[0].columns;

            // Convert to objects
            const images = imageRows.map(row => {
                const image = {};
                imageColumns.forEach((col, index) => {
                    let value = row[index];

                    // Convert SQLite types to appropriate JavaScript types
                    if (col === 'is_major') {
                        value = value === 1;
                    } else if (col === 'ranking' && value !== null) {
                        value = parseFloat(value);
                    } else if (col === 'pk_id' || col === 'major_image_id') {
                        value = value !== null ? parseInt(value) : null;
                    }

                    // Convert column names from snake_case to camelCase
                    const camelCaseKey = col.replace(/_([a-z])/g, (match, letter) => letter.toUpperCase());
                    image[camelCaseKey] = value;
                });
                return image;
            });

            // Get tags for each image
            const tagsQuery = `
                SELECT
                    i.id as image_id,
                    t.name as tag_name
                FROM image_tags it
                JOIN images i ON it.image_pk_id = i.pk_id
                JOIN tags t ON it.tag_id = t.id
                ORDER BY i.pk_id, t.name
            `;

            const tagsResult = this.db.exec(tagsQuery);
            const imageTags = {};

            if (tagsResult && tagsResult.length > 0) {
                tagsResult[0].values.forEach(row => {
                    const imageId = row[0];
                    const tagName = row[1];

                    if (!imageTags[imageId]) {
                        imageTags[imageId] = [];
                    }
                    imageTags[imageId].push(tagName);
                });
            }

            // Add tags to images
            images.forEach(image => {
                image.tags = imageTags[image.id] || [];
            });

            // Get metadata
            const metadataQuery = 'SELECT key, value FROM metadata';
            const metadataResult = this.db.exec(metadataQuery);
            const metadata = {};

            if (metadataResult && metadataResult.length > 0) {
                metadataResult[0].values.forEach(row => {
                    const key = row[0];
                    let value = row[1];

                    // Try to parse JSON values
                    try {
                        value = JSON.parse(value);
                    } catch (e) {
                        // Keep as string if not valid JSON
                    }

                    metadata[key] = value;
                });
            }

            return {
                images,
                metadata: {
                    ...metadata,
                    version: metadata.version || '1.0',
                    lastUpdated: metadata.lastUpdated || new Date().toISOString(),
                    totalImages: images.length,
                    availableTags: this.getAvailableTags(images)
                }
            };

        } catch (error) {
            console.error('Error getting all images:', error);
            throw error;
        }
    }

    /**
     * Get available tags from images
     */
    getAvailableTags(images) {
        const tagSet = new Set();
        images.forEach(image => {
            if (image.tags && Array.isArray(image.tags)) {
                image.tags.forEach(tag => tagSet.add(tag));
            }
        });
        return Array.from(tagSet).sort();
    }

    /**
     * Get images by tag
     */
    getImagesByTag(tagName) {
        if (!this.db) {
            throw new Error('Database not loaded');
        }

        try {
            const query = `
                SELECT
                    i.id,
                    i.title,
                    i.description,
                    i.src,
                    i.ranking,
                    i.width,
                    i.height,
                    i.is_major,
                    i.group_id,
                    i.major_image_id,
                    i.date_added
                FROM images i
                JOIN image_tags it ON i.pk_id = it.image_pk_id
                JOIN tags t ON it.tag_id = t.id
                WHERE t.name = ?
                ORDER BY i.pk_id
            `;

            const stmt = this.db.prepare(query);
            stmt.bind([tagName]);

            const images = [];
            while (stmt.step()) {
                const row = stmt.getAsObject();
                images.push({
                    id: row.id,
                    title: row.title,
                    description: row.description,
                    src: row.src,
                    ranking: row.ranking,
                    width: row.width,
                    height: row.height,
                    isMajor: row.is_major === 1,
                    groupId: row.group_id,
                    majorImageId: row.major_image_id,
                    dateAdded: row.date_added
                });
            }

            stmt.free();
            return images;

        } catch (error) {
            console.error('Error getting images by tag:', error);
            throw error;
        }
    }

    /**
     * Get database statistics
     */
    getDatabaseStats() {
        if (!this.db) {
            throw new Error('Database not loaded');
        }

        try {
            const stats = {};

            // Total images
            const imagesResult = this.db.exec('SELECT COUNT(*) as count FROM images');
            stats.totalImages = imagesResult[0]?.values[0][0] || 0;

            // Total tags
            const tagsResult = this.db.exec('SELECT COUNT(*) as count FROM tags');
            stats.totalTags = tagsResult[0]?.values[0][0] || 0;

            // Major images
            const majorResult = this.db.exec('SELECT COUNT(*) as count FROM images WHERE is_major = 1');
            stats.majorImages = majorResult[0]?.values[0][0] || 0;

            // Image groups
            const groupsResult = this.db.exec('SELECT COUNT(DISTINCT group_id) as count FROM images WHERE group_id IS NOT NULL');
            stats.totalGroups = groupsResult[0]?.values[0][0] || 0;

            // Database file info
            if (this.dbFilePath && fs.existsSync(this.dbFilePath)) {
                const fileStats = fs.statSync(this.dbFilePath);
                stats.fileSize = fileStats.size;
                stats.lastModified = fileStats.mtime;
            }

            return stats;

        } catch (error) {
            console.error('Error getting database stats:', error);
            throw error;
        }
    }

    /**
     * Add new image to database
     */
    async addImage(image) {
        if (!this.db) {
            throw new Error('Database not loaded');
        }

        try {
            // Start transaction
            this.db.run('BEGIN TRANSACTION');

            // Insert image
            const stmt = this.db.prepare(`
                INSERT INTO images (id, title, description, src, ranking, width, height, is_major, group_id, major_image_id, date_added)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `);

            // Validate parameters to prevent undefined values
            const params = [
                image.id,
                image.title || '',
                image.description || '',
                image.src || '',
                image.ranking || 0,
                image.width || '',
                image.height || '',
                image.isMajor !== false ? 1 : 0,
                image.groupId || null,
                image.majorImageId || null,
                image.date || new Date().toISOString()
            ];

            // Check for any undefined values
            for (let i = 0; i < params.length; i++) {
                if (params[i] === undefined) {
                    throw new Error(`Parameter at position ${i} is undefined. Image data: ${JSON.stringify(image)}`);
                }
            }

            stmt.run(params);
            stmt.free();

            // Handle tags
            if (image.tags && Array.isArray(image.tags) && image.tags.length > 0) {
                // Get the pk_id for the newly inserted image
                const pkStmt = this.db.prepare('SELECT pk_id FROM images WHERE id = ?');
                pkStmt.bind([image.id]);
                let imagePkId = null;

                if (pkStmt.step()) {
                    const result = pkStmt.getAsObject();
                    imagePkId = result.pk_id;
                }
                pkStmt.free();

                if (!imagePkId) {
                    throw new Error(`Failed to get pk_id for image with id ${image.id}`);
                }

                for (const tagName of image.tags) {
                    // Get or create tag
                    const tagId = this.getOrCreateTag(tagName);

                    // Create image-tag relationship
                    const relStmt = this.db.prepare(`
                        INSERT INTO image_tags (image_pk_id, tag_id)
                        VALUES (?, ?)
                    `);
                    relStmt.run([imagePkId, tagId]);
                    relStmt.free();
                }
            }

            // Commit transaction
            this.db.run('COMMIT');

        } catch (error) {
            // Rollback transaction on error
            this.db.run('ROLLBACK');
            console.error('Error adding image to database:', error);
            throw new Error(`Failed to add image: ${error.message}`);
        }
    }

    /**
     * Update existing image in database
     */
    async updateImage(image) {
        console.log('🗄️ DatabaseManager.updateImage called with:', image);
        console.log('🗄️ DATABASE UPDATE FUNCTION TRIGGERED - This should appear if SQLite is being used!');

        if (!this.db) {
            throw new Error('Database not loaded');
        }

        try {
            // Start transaction
            console.log('🔄 Starting database transaction...');
            this.db.run('BEGIN TRANSACTION');

            // Handle ID change - if the ID has changed, we need to find the image by its original ID
            let originalId = image.id;
            let targetId = image.id;

            // Check if this is an ID change by looking for the original image
            const checkStmt = this.db.prepare('SELECT pk_id FROM images WHERE id = ?');
            checkStmt.bind([image.id]);
            let imagePkId = null;

            if (checkStmt.step()) {
                const result = checkStmt.getAsObject();
                imagePkId = result.pk_id;
            }
            checkStmt.free();

            // If image not found by current ID, it might be an ID change
            // In this case, we need the original ID to find the image
            if (!imagePkId && image.originalId) {
                originalId = image.originalId;
                targetId = image.id;

                const originalStmt = this.db.prepare('SELECT pk_id FROM images WHERE id = ?');
                originalStmt.bind([originalId]);
                if (originalStmt.step()) {
                    const result = originalStmt.getAsObject();
                    imagePkId = result.pk_id;
                }
                originalStmt.free();

                console.log(`🔀 ID change detected: "${originalId}" → "${targetId}"`);
            }

            if (!imagePkId) {
                throw new Error(`Image with ID ${image.id} not found`);
            }

            // Update image - use original ID for WHERE clause, but new ID for SET if changed
            console.log('📝 Updating image in database...');
            const stmt = this.db.prepare(`
                UPDATE images
                SET id = ?, title = ?, description = ?, src = ?, ranking = ?, width = ?, height = ?,
                    is_major = ?, group_id = ?, major_image_id = ?, date_added = ?
                WHERE pk_id = ?
            `);

            const updateParams = [
                targetId,  // New ID (might be same as original)
                image.title,
                image.description || '',
                image.src || '',
                image.ranking || 0,
                image.width || '',
                image.height || '',
                image.isMajor !== false ? 1 : 0,
                image.groupId || null,
                image.majorImageId || null,
                image.date || new Date().toISOString(),
                imagePkId  // Use pk_id for WHERE clause
            ];
            console.log('📝 Update parameters:', updateParams);

            const result = stmt.run(updateParams);
            stmt.free();
            console.log('📝 SQL Update Result:', {
                changes: result.changes,
                lastInsertRowid: result.lastInsertRowid
            });

            if (result.changes === 0) {
                console.log('❌ No rows were updated - image not found');
                throw new Error(`Image with ID ${image.id} not found`);
            }

            console.log('✅ Image updated successfully');

            // Delete existing tag relationships
            console.log('🗑️ Deleting existing tag relationships...');
            const deleteRelStmt = this.db.prepare('DELETE FROM image_tags WHERE image_pk_id = ?');
            const deleteResult = deleteRelStmt.run([imagePkId]);
            deleteRelStmt.free();
            console.log('🗑️ Deleted', deleteResult.changes, 'tag relationships');

            // Add new tag relationships
            if (image.tags && Array.isArray(image.tags) && image.tags.length > 0) {
                console.log('🏷️ Processing tags:', image.tags);
                for (const tagName of image.tags) {
                    console.log('🏷️ Processing tag:', tagName);
                    // Get or create tag
                    const tagId = this.getOrCreateTag(tagName);
                    console.log('🏷️ Got tag ID:', tagId);

                    // Create image-tag relationship
                    const relStmt = this.db.prepare(`
                        INSERT INTO image_tags (image_pk_id, tag_id)
                        VALUES (?, ?)
                    `);
                    relStmt.run([imagePkId, tagId]);
                    relStmt.free();
                    console.log('🏷️ Created tag relationship for:', tagName);
                }
            } else {
                console.log('🏷️ No tags to process');
            }

            // Commit transaction
            console.log('✅ Committing transaction...');
            this.db.run('COMMIT');
            console.log('✅ Transaction committed successfully');

        } catch (error) {
            // Rollback transaction on error
            console.log('❌ Error occurred, rolling back transaction...');
            this.db.run('ROLLBACK');
            console.error('Error updating image in database:', error);
            throw new Error(`Failed to update image: ${error.message}`);
        }
    }

    /**
     * Delete image from database
     */
    async deleteImage(imageId) {
        if (!this.db) {
            throw new Error('Database not loaded');
        }

        try {
            // Start transaction
            this.db.run('BEGIN TRANSACTION');

            // Delete tag relationships first (due to foreign key constraints)
            // Get the pk_id for the image
            const pkStmt = this.db.prepare('SELECT pk_id FROM images WHERE id = ?');
            pkStmt.bind([imageId]);
            let imagePkId = null;

            if (pkStmt.step()) {
                const result = pkStmt.getAsObject();
                imagePkId = result.pk_id;
            }
            pkStmt.free();

            if (!imagePkId) {
                throw new Error(`Image with ID ${imageId} not found`);
            }

            const deleteRelStmt = this.db.prepare('DELETE FROM image_tags WHERE image_pk_id = ?');
            deleteRelStmt.run([imagePkId]);
            deleteRelStmt.free();

            // Delete image
            const deleteImageStmt = this.db.prepare('DELETE FROM images WHERE id = ?');
            const result = deleteImageStmt.run([imageId]);
            deleteImageStmt.free();

            if (result.changes === 0) {
                throw new Error(`Image with ID ${imageId} not found`);
            }

            // Commit transaction
            this.db.run('COMMIT');

        } catch (error) {
            // Rollback transaction on error
            this.db.run('ROLLBACK');
            console.error('Error deleting image from database:', error);
            throw new Error(`Failed to delete image: ${error.message}`);
        }
    }

    /**
     * Get or create a tag
     */
    getOrCreateTag(tagName) {
        if (!this.db) {
            throw new Error('Database not loaded');
        }

        if (!tagName || typeof tagName !== 'string') {
            throw new Error('Invalid tag name provided');
        }

        try {
            // Check if tag already exists
            const checkStmt = this.db.prepare('SELECT id FROM tags WHERE name = ?');
            checkStmt.bind([tagName]);

            if (checkStmt.step()) {
                const result = checkStmt.getAsObject();
                checkStmt.free();
                return result.id;
            }
            checkStmt.free();

            // Create new tag
            const insertStmt = this.db.prepare('INSERT INTO tags (name) VALUES (?)');
            const result = insertStmt.run([tagName]);
            insertStmt.free();

            // Get the last inserted rowid
            const rowidResult = this.db.exec('SELECT last_insert_rowid() as id');
            if (rowidResult && rowidResult.length > 0 && rowidResult[0].values.length > 0) {
                return rowidResult[0].values[0][0];
            } else {
                throw new Error('Failed to get last insert rowid');
            }

        } catch (error) {
            console.error('Error getting or creating tag:', error);
            throw new Error(`Failed to get or create tag: ${error.message}`);
        }
    }

    /**
     * Save database to file
     */
    save() {
        if (!this.db || !this.dbFilePath) {
            throw new Error('Database not loaded or file path not set');
        }

        try {
            // Export the database as a binary buffer
            const data = this.db.export();
            // Write the buffer to the file
            fs.writeFileSync(this.dbFilePath, data);
            return true;
        } catch (error) {
            console.error('Error saving database:', error);
            throw new Error(`Failed to save database: ${error.message}`);
        }
    }

    /**
     * Close database connection
     */
    close(save = false) {
        if (this.db) {
            // Save before closing if requested
            if (save && this.dbFilePath) {
                try {
                    this.save();
                } catch (error) {
                    console.error('Failed to save database before closing:', error);
                    // Continue with closing even if save fails
                }
            }
            this.db.close();
            this.db = null;
            this.dbFilePath = null;
        }
    }

    /**
     * Check if a file is a valid SQLite database
     */
    static async isValidDatabase(dbFilePath) {
        try {
            if (!fs.existsSync(dbFilePath)) {
                return false;
            }

            const fileBuffer = fs.readFileSync(dbFilePath);

            // Check SQLite magic number
            const sqliteMagic = fileBuffer.slice(0, 16).toString('ascii');
            if (!sqliteMagic.startsWith('SQLite format 3')) {
                return false;
            }

            // Try to load the database
            const dbManager = new DatabaseManager();
            await dbManager.loadDatabase(dbFilePath);

            // Check if required tables exist
            const result = dbManager.db.exec("SELECT name FROM sqlite_master WHERE type='table' AND name IN ('images', 'tags', 'metadata')");
            const hasRequiredTables = result && result.length > 0 && result[0].values.length >= 2;

            dbManager.close();

            return hasRequiredTables;

        } catch (error) {
            console.error('Error validating database:', error);
            return false;
        }
    }
}

module.exports = DatabaseManager;