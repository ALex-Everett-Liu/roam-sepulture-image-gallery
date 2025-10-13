const fs = require('fs');
const path = require('path');
const initSqlJs = require('sql.js');

/**
 * Migration script to convert old SQLite databases to the new schema
 * where id field is text instead of integer
 */

class DatabaseMigrator {
    constructor() {
        this.SQL = null;
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
     * Check if database uses old schema (integer id primary key)
     */
    isOldSchema(db) {
        try {
            // Check the table structure
            const result = db.exec("PRAGMA table_info(images)");
            if (!result.length || !result[0].values.length) {
                return false;
            }

            // Look for the id column
            const columns = result[0].values;
            const idColumn = columns.find(col => col[1] === 'id'); // col[1] is the column name

            if (!idColumn) {
                return false;
            }

            // Check if id is INTEGER and PRIMARY KEY
            const dataType = idColumn[2].toLowerCase(); // col[2] is the data type
            const isPrimaryKey = idColumn[5] === 1; // col[5] is primary key flag

            return dataType === 'integer' && isPrimaryKey;
        } catch (error) {
            console.error('Error checking schema:', error);
            return false;
        }
    }

    /**
     * Create new schema tables
     */
    createNewSchema(db) {
        // Create new tables with the updated schema
        db.run(`
            CREATE TABLE images_new (
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

        db.run(`
            CREATE TABLE tags_new (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT UNIQUE NOT NULL,
                created_at TEXT DEFAULT CURRENT_TIMESTAMP
            )
        `);

        db.run(`
            CREATE TABLE image_tags_new (
                image_pk_id INTEGER,
                tag_id INTEGER,
                PRIMARY KEY (image_pk_id, tag_id),
                FOREIGN KEY (image_pk_id) REFERENCES images_new (pk_id) ON DELETE CASCADE,
                FOREIGN KEY (tag_id) REFERENCES tags_new (id) ON DELETE CASCADE
            )
        `);

        db.run(`
            CREATE TABLE metadata_new (
                key TEXT PRIMARY KEY,
                value TEXT,
                created_at TEXT DEFAULT CURRENT_TIMESTAMP,
                updated_at TEXT DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // Create indexes
        db.run(`CREATE INDEX IF NOT EXISTS idx_images_new_group_id ON images_new (group_id)`);
        db.run(`CREATE INDEX IF NOT EXISTS idx_images_new_major ON images_new (is_major)`);
        db.run(`CREATE INDEX IF NOT EXISTS idx_images_new_ranking ON images_new (ranking)`);
        db.run(`CREATE INDEX IF NOT EXISTS idx_tags_new_name ON tags_new (name)`);
        db.run(`CREATE INDEX IF NOT EXISTS idx_image_tags_new_image_pk_id ON image_tags_new (image_pk_id)`);
        db.run(`CREATE INDEX IF NOT EXISTS idx_image_tags_new_tag_id ON image_tags_new (tag_id)`);
    }

    /**
     * Migrate data from old schema to new schema
     */
    migrateData(db) {
        try {
            // Start transaction
            db.run('BEGIN TRANSACTION');

            // Get all images from old schema
            const imagesResult = db.exec('SELECT * FROM images');
            if (imagesResult.length > 0) {
                const images = imagesResult[0];
                const columns = images.columns;
                const values = images.values;

                console.log(`Migrating ${values.length} images...`);

                // Insert images into new schema, converting id to text
                for (const row of values) {
                    const imageData = {};
                    columns.forEach((col, index) => {
                        imageData[col] = row[index];
                    });

                    // Convert numeric id to text
                    const textId = `img_${imageData.id}`;

                    const stmt = db.prepare(`
                        INSERT INTO images_new (
                            id, title, description, src, ranking, width, height,
                            is_major, group_id, major_image_id, date_added, created_at, updated_at
                        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                    `);

                    stmt.run([
                        textId,
                        imageData.title,
                        imageData.description,
                        imageData.src,
                        imageData.ranking,
                        imageData.width,
                        imageData.height,
                        imageData.is_major || 0,
                        imageData.group_id,
                        imageData.major_image_id,
                        imageData.date_added || new Date().toISOString(),
                        new Date().toISOString(),
                        new Date().toISOString()
                    ]);
                    stmt.free();
                }
            }

            // Get all tags from old schema
            const tagsResult = db.exec('SELECT * FROM tags');
            if (tagsResult.length > 0) {
                const tags = tagsResult[0];
                const columns = tags.columns;
                const values = tags.values;

                console.log(`Migrating ${values.length} tags...`);

                // Insert tags into new schema
                for (const row of values) {
                    const tagData = {};
                    columns.forEach((col, index) => {
                        tagData[col] = row[index];
                    });

                    const stmt = db.prepare(`
                        INSERT INTO tags_new (id, name, created_at)
                        VALUES (?, ?, ?)
                    `);

                    stmt.run([
                        tagData.id,
                        tagData.name,
                        new Date().toISOString()
                    ]);
                    stmt.free();
                }
            }

            // Migrate image-tag relationships
            const imageTagsResult = db.exec(`
                SELECT it.image_id, it.tag_id, i_new.pk_id as image_pk_id
                FROM image_tags it
                JOIN images_new i_new ON i_new.id = 'img_' || it.image_id
            `);

            if (imageTagsResult.length > 0) {
                const imageTags = imageTagsResult[0];
                const values = imageTags.values;

                console.log(`Migrating ${values.length} image-tag relationships...`);

                // Insert image-tag relationships into new schema
                for (const row of values) {
                    const imageId = row[0];
                    const tagId = row[1];
                    const imagePkId = row[2];

                    const stmt = db.prepare(`
                        INSERT INTO image_tags_new (image_pk_id, tag_id)
                        VALUES (?, ?)
                    `);

                    stmt.run([imagePkId, tagId]);
                    stmt.free();
                }
            }

            // Migrate metadata
            const metadataResult = db.exec('SELECT * FROM metadata');
            if (metadataResult.length > 0) {
                const metadata = metadataResult[0];
                const columns = metadata.columns;
                const values = metadata.values;

                console.log(`Migrating ${values.length} metadata entries...`);

                // Insert metadata into new schema
                for (const row of values) {
                    const metadataData = {};
                    columns.forEach((col, index) => {
                        metadataData[col] = row[index];
                    });

                    const stmt = db.prepare(`
                        INSERT INTO metadata_new (key, value, created_at, updated_at)
                        VALUES (?, ?, ?, ?)
                    `);

                    stmt.run([
                        metadataData.key,
                        metadataData.value,
                        new Date().toISOString(),
                        new Date().toISOString()
                    ]);
                    stmt.free();
                }
            }

            // Commit transaction
            db.run('COMMIT');
            console.log('✅ Data migration completed successfully');

        } catch (error) {
            // Rollback transaction on error
            db.run('ROLLBACK');
            console.error('❌ Error during data migration:', error);
            throw error;
        }
    }

    /**
     * Replace old tables with new ones
     */
    replaceTables(db) {
        try {
            // Start transaction
            db.run('BEGIN TRANSACTION');

            // Drop old tables
            console.log('Dropping old tables...');
            db.run('DROP TABLE IF EXISTS image_tags');
            db.run('DROP TABLE IF EXISTS tags');
            db.run('DROP TABLE IF EXISTS images');
            db.run('DROP TABLE IF EXISTS metadata');

            // Rename new tables to original names
            console.log('Renaming new tables...');
            db.run('ALTER TABLE images_new RENAME TO images');
            db.run('ALTER TABLE tags_new RENAME TO tags');
            db.run('ALTER TABLE image_tags_new RENAME TO image_tags');
            db.run('ALTER TABLE metadata_new RENAME TO metadata');

            // Commit transaction
            db.run('COMMIT');
            console.log('✅ Table replacement completed successfully');

        } catch (error) {
            // Rollback transaction on error
            db.run('ROLLBACK');
            console.error('❌ Error during table replacement:', error);
            throw error;
        }
    }

    /**
     * Migrate a single database file
     */
    async migrateDatabase(dbFilePath) {
        let db = null;

        try {
            console.log(`🔍 Checking database: ${dbFilePath}`);

            // Load the database
            await this.initialize();
            const fileBuffer = fs.readFileSync(dbFilePath);
            db = new this.SQL.Database(fileBuffer);

            // Check if migration is needed
            if (!this.isOldSchema(db)) {
                console.log('✅ Database already uses new schema or is not a valid image database');
                return false;
            }

            console.log('📊 Detected old schema - starting migration...');

            // Create new schema
            console.log('📝 Creating new schema...');
            this.createNewSchema(db);

            // Migrate data
            console.log('🔄 Migrating data...');
            this.migrateData(db);

            // Replace tables
            console.log('🔄 Replacing tables...');
            this.replaceTables(db);

            // Save the migrated database
            const data = db.export();
            const backupPath = dbFilePath.replace('.db', '_backup_pre_migration.db');

            // Create backup
            console.log(`💾 Creating backup: ${backupPath}`);
            fs.writeFileSync(backupPath, fileBuffer);

            // Save migrated database
            console.log(`💾 Saving migrated database: ${dbFilePath}`);
            fs.writeFileSync(dbFilePath, data);

            console.log('🎉 Migration completed successfully!');
            console.log(`📁 Backup saved at: ${backupPath}`);
            return true;

        } catch (error) {
            console.error('❌ Migration failed:', error);
            throw error;
        } finally {
            if (db) {
                db.close();
            }
        }
    }

    /**
     * Migrate all .db files in a directory
     */
    async migrateDirectory(directoryPath) {
        try {
            console.log(`📁 Scanning directory: ${directoryPath}`);

            if (!fs.existsSync(directoryPath)) {
                throw new Error(`Directory not found: ${directoryPath}`);
            }

            const files = fs.readdirSync(directoryPath);
            const dbFiles = files.filter(file => file.endsWith('.db') && !file.includes('_backup_'));

            console.log(`Found ${dbFiles.length} database files to check`);

            let migratedCount = 0;

            for (const dbFile of dbFiles) {
                const dbPath = path.join(directoryPath, dbFile);
                try {
                    const wasMigrated = await this.migrateDatabase(dbPath);
                    if (wasMigrated) {
                        migratedCount++;
                    }
                } catch (error) {
                    console.error(`❌ Failed to migrate ${dbFile}:`, error.message);
                }
            }

            console.log(`\n🎉 Migration completed!`);
            console.log(`📊 Total databases checked: ${dbFiles.length}`);
            console.log(`✅ Databases migrated: ${migratedCount}`);

        } catch (error) {
            console.error('❌ Directory migration failed:', error);
            throw error;
        }
    }
}

/**
 * Main function
 */
async function main() {
    const migrator = new DatabaseMigrator();

    // Get command line arguments
    const args = process.argv.slice(2);

    if (args.length === 0) {
        console.log('Usage: node migrate_to_new_schema.js <db_file_or_directory>');
        console.log('Example: node migrate_to_new_schema.js data/images_data.db');
        console.log('Example: node migrate_to_new_schema.js data/');
        return;
    }

    const targetPath = args[0];

    try {
        if (fs.existsSync(targetPath)) {
            const stats = fs.statSync(targetPath);

            if (stats.isFile() && targetPath.endsWith('.db')) {
                // Migrate single database file
                await migrator.migrateDatabase(targetPath);
            } else if (stats.isDirectory()) {
                // Migrate all databases in directory
                await migrator.migrateDirectory(targetPath);
            } else {
                console.error('❌ Invalid target: must be a .db file or directory');
                process.exit(1);
            }
        } else {
            console.error('❌ Target path does not exist:', targetPath);
            process.exit(1);
        }

    } catch (error) {
        console.error('❌ Migration failed:', error);
        process.exit(1);
    }
}

// Run main function if called directly
if (require.main === module) {
    main().catch(console.error);
}

module.exports = DatabaseMigrator;