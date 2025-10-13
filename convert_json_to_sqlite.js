const fs = require('fs');
const path = require('path');
const initSqlJs = require('sql.js');

/**
 * Convert JSON image data to SQLite database using sql.js
 * This script converts the images_data_*.json files to a SQLite database format
 * for faster loading and better data management
 */

class JsonToSqliteConverter {
    constructor() {
        this.SQL = null;
        this.db = null;
    }

    /**
     * Initialize SQL.js
     */
    async initialize() {
        this.SQL = await initSqlJs({
            locateFile: file => path.join(__dirname, 'node_modules', 'sql.js', 'dist', file)
        });
    }

    /**
     * Create database schema
     */
    createSchema() {
        // Create images table
        this.db.run(`
            CREATE TABLE IF NOT EXISTS images (
                pk_id INTEGER PRIMARY KEY AUTOINCREMENT,
                id TEXT UNIQUE NOT NULL,
                title TEXT,
                description TEXT,
                src TEXT,
                ranking REAL,
                width TEXT,
                height TEXT,
                is_major BOOLEAN DEFAULT 0,
                group_id TEXT,
                major_image_id INTEGER,
                date_added TEXT DEFAULT CURRENT_TIMESTAMP,
                created_at TEXT DEFAULT CURRENT_TIMESTAMP,
                updated_at TEXT DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // Create tags table
        this.db.run(`
            CREATE TABLE IF NOT EXISTS tags (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT UNIQUE NOT NULL,
                created_at TEXT DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // Create image_tags junction table
        this.db.run(`
            CREATE TABLE IF NOT EXISTS image_tags (
                image_pk_id INTEGER,
                tag_id INTEGER,
                PRIMARY KEY (image_pk_id, tag_id),
                FOREIGN KEY (image_pk_id) REFERENCES images (pk_id) ON DELETE CASCADE,
                FOREIGN KEY (tag_id) REFERENCES tags (id) ON DELETE CASCADE
            )
        `);

        // Create metadata table
        this.db.run(`
            CREATE TABLE IF NOT EXISTS metadata (
                key TEXT PRIMARY KEY,
                value TEXT,
                created_at TEXT DEFAULT CURRENT_TIMESTAMP,
                updated_at TEXT DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // Create indexes for better performance
        this.db.run(`CREATE INDEX IF NOT EXISTS idx_images_group_id ON images (group_id)`);
        this.db.run(`CREATE INDEX IF NOT EXISTS idx_images_major ON images (is_major)`);
        this.db.run(`CREATE INDEX IF NOT EXISTS idx_images_ranking ON images (ranking)`);
        this.db.run(`CREATE INDEX IF NOT EXISTS idx_tags_name ON tags (name)`);
        this.db.run(`CREATE INDEX IF NOT EXISTS idx_image_tags_image_pk_id ON image_tags (image_pk_id)`);
        this.db.run(`CREATE INDEX IF NOT EXISTS idx_image_tags_tag_id ON image_tags (tag_id)`);
    }

    /**
     * Insert or get tag ID
     */
    getOrCreateTag(tagName) {
        if (!tagName || typeof tagName !== 'string') {
            return null;
        }

        // First try to get existing tag using exec for reliable results
        const result = this.db.exec('SELECT id FROM tags WHERE name = ?', [tagName]);
        if (result.length > 0 && result[0].values.length > 0) {
            const tagId = result[0].values[0][0];
            return tagId;
        }

        // Create new tag
        try {
            const insertStmt = this.db.prepare('INSERT INTO tags (name) VALUES (?)');
            insertStmt.run([tagName]);
            const tagId = this.db.exec('SELECT last_insert_rowid() as id')[0].values[0][0];
            insertStmt.free();
            return tagId;
        } catch (error) {
            // If insert fails (e.g., unique constraint), try to get the ID again
            console.log(`Retrying tag lookup for "${tagName}" after unique constraint error`);
            const retryResult = this.db.exec('SELECT id FROM tags WHERE name = ?', [tagName]);
            if (retryResult.length > 0 && retryResult[0].values.length > 0) {
                const tagId = retryResult[0].values[0][0];
                console.log(`Retry successful for "${tagName}": ID ${tagId}`);
                return tagId;
            }
            console.log(`Retry failed for "${tagName}"`);
            return null;
        }
    }

    /**
     * Insert image data
     */
    insertImage(imageData) {
        const {
            id,
            title = null,
            description = null,
            src = null,
            ranking = null,
            width = null,
            height = null,
            isMajor = false,
            groupId = null,
            majorImageId = null,
            date = null
        } = imageData;

        const is_major = isMajor ? 1 : 0;
        const date_added = date || new Date().toISOString();

        const stmt = this.db.prepare(`
            INSERT OR REPLACE INTO images (
                id, title, description, src, ranking, width, height,
                is_major, group_id, major_image_id, date_added
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);

        stmt.run([
            id, title, description, src, ranking, width, height,
            is_major, groupId, majorImageId, date_added
        ]);

        stmt.free();
        return id;
    }

    /**
     * Insert image-tag relationships
     */
    insertImageTags(imageId, tags) {
        if (!tags || !Array.isArray(tags) || tags.length === 0) {
            return;
        }

        // Get the pk_id for the given image id
        const pkResult = this.db.exec('SELECT pk_id FROM images WHERE id = ?', [imageId]);
        if (!pkResult.length || !pkResult[0].values.length) {
            console.error(`Image with id ${imageId} not found`);
            return;
        }
        const imagePkId = pkResult[0].values[0][0];

        for (const tagName of tags) {
            try {
                const tagId = this.getOrCreateTag(tagName);

                const stmt = this.db.prepare(
                    'INSERT OR IGNORE INTO image_tags (image_pk_id, tag_id) VALUES (?, ?)'
                );
                stmt.run([imagePkId, tagId]);
                stmt.free();
            } catch (error) {
                console.error(`Error inserting tag relationship for image ${imageId}:`, error);
            }
        }
    }

    /**
     * Insert metadata
     */
    insertMetadata(metadata) {
        if (!metadata) return;

        const entries = Object.entries(metadata);
        for (const [key, value] of entries) {
            const stmt = this.db.prepare(
                'INSERT OR REPLACE INTO metadata (key, value, updated_at) VALUES (?, ?, ?)'
            );
            stmt.run([key, JSON.stringify(value), new Date().toISOString()]);
            stmt.free();
        }
    }

    /**
     * Convert JSON file to SQLite database
     */
    async convertJsonFile(jsonFilePath, dbFilePath) {
        try {
            console.log(`Reading JSON file: ${jsonFilePath}`);
            const jsonData = JSON.parse(fs.readFileSync(jsonFilePath, 'utf8'));

            console.log(`Creating SQLite database: ${dbFilePath}`);

            // Remove existing database file if it exists
            if (fs.existsSync(dbFilePath)) {
                fs.unlinkSync(dbFilePath);
            }

            // Initialize SQL.js
            await this.initialize();

            // Create new database
            this.db = new this.SQL.Database();

            // Create schema
            console.log('Creating database schema...');
            this.createSchema();

            // Process images
            const images = jsonData.images || [];
            console.log(`Processing ${images.length} images...`);

            for (const image of images) {
                try {
                    const imageId = this.insertImage(image);

                    if (image.tags && Array.isArray(image.tags)) {
                        this.insertImageTags(imageId, image.tags);
                    }

                    console.log(`Processed image ${imageId}: ${image.title || 'Untitled'}`);
                } catch (error) {
                    console.error(`Error processing image:`, image, error);
                }
            }

            // Insert metadata
            if (jsonData.metadata) {
                console.log('Inserting metadata...');
                this.insertMetadata(jsonData.metadata);
            }

            // Add conversion metadata
            this.insertMetadata({
                'conversion_date': new Date().toISOString(),
                'source_file': path.basename(jsonFilePath),
                'total_images': images.length,
                'db_version': '1.0'
            });

            // Write database to file
            const data = this.db.export();
            const buffer = Buffer.from(data);
            fs.writeFileSync(dbFilePath, buffer);

            console.log('Conversion completed successfully!');

            // Get final stats
            const stats = this.getDatabaseStats();
            console.log('Database stats:', stats);

            return stats;

        } catch (error) {
            console.error('Conversion failed:', error);
            throw error;
        }
    }

    /**
     * Get database statistics
     */
    getDatabaseStats() {
        // Get total images
        const imagesResult = this.db.exec('SELECT COUNT(*) as count FROM images');
        const totalImages = imagesResult[0]?.values[0][0] || 0;

        // Get total tags
        const tagsResult = this.db.exec('SELECT COUNT(*) as count FROM tags');
        const totalTags = tagsResult[0]?.values[0][0] || 0;

        // Get total image-tag relationships
        const imageTagsResult = this.db.exec('SELECT COUNT(*) as count FROM image_tags');
        const totalImageTagRelations = imageTagsResult[0]?.values[0][0] || 0;

        // Get major images count
        const majorImagesResult = this.db.exec('SELECT COUNT(*) as count FROM images WHERE is_major = 1');
        const majorImages = majorImagesResult[0]?.values[0][0] || 0;

        return {
            totalImages,
            totalTags,
            totalImageTagRelations,
            majorImages
        };
    }
}

/**
 * Main function to convert JSON files
 */
async function main() {
    const converter = new JsonToSqliteConverter();

    // Get command line arguments
    const args = process.argv.slice(2);

    if (args.length === 0) {
        console.log('Usage: node convert_json_to_sqlite.js <json_file> [output_db_file]');
        console.log('Example: node convert_json_to_sqlite.js data/images_data_dcim_test_01.json data/images_data_dcim_test_01.db');
        return;
    }

    const jsonFilePath = args[0];
    const dbFilePath = args[1] || jsonFilePath.replace('.json', '.db');

    if (!fs.existsSync(jsonFilePath)) {
        console.error(`JSON file not found: ${jsonFilePath}`);
        process.exit(1);
    }

    try {
        console.log(`Starting conversion of ${jsonFilePath} to ${dbFilePath}`);
        const stats = await converter.convertJsonFile(jsonFilePath, dbFilePath);

        console.log('\n✅ Conversion completed successfully!');
        console.log(`📊 Database created: ${dbFilePath}`);
        console.log(`🖼️  Total images: ${stats.totalImages}`);
        console.log(`🏷️  Total tags: ${stats.totalTags}`);
        console.log(`🔗 Image-tag relationships: ${stats.totalImageTagRelations}`);
        console.log(`⭐ Major images: ${stats.majorImages}`);

    } catch (error) {
        console.error('❌ Conversion failed:', error);
        process.exit(1);
    }
}

// Run main function if called directly
if (require.main === module) {
    main().catch(console.error);
}

module.exports = JsonToSqliteConverter;