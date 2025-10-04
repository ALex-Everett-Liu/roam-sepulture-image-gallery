const fs = require('fs');
const DatabaseManager = require('./database');

async function testDatabaseUpdate() {
    const dbPath = 'data/images_data_dcim_01.db';

    console.log('Testing database update functionality...');

    // Check file before update
    const statsBefore = fs.statSync(dbPath);
    console.log('Before update:');
    console.log('  Size:', statsBefore.size, 'bytes');
    console.log('  Modified:', statsBefore.mtime);

    // Load database and make an update
    const dbManager = new DatabaseManager();
    await dbManager.loadDatabase(dbPath);

    // Get first image
    const data = dbManager.getAllImages();
    if (data.images.length === 0) {
        console.log('No images found to update');
        return;
    }

    const image = data.images[0];
    console.log('Updating image ID:', image.id);
    console.log('Current title:', image.title);

    // Update the image
    const updatedImage = {
        ...image,
        title: image.title + ' (Updated at ' + new Date().toISOString() + ')'
    };

    await dbManager.updateImage(updatedImage);

    // Save the database
    console.log('Saving database...');
    dbManager.save();

    // Close database
    dbManager.close();

    // Check file after update
    const statsAfter = fs.statSync(dbPath);
    console.log('\nAfter update:');
    console.log('  Size:', statsAfter.size, 'bytes');
    console.log('  Modified:', statsAfter.mtime);
    console.log('  File was modified:', statsAfter.mtime.getTime() !== statsBefore.mtime.getTime());
    console.log('  Size change:', statsAfter.size - statsBefore.size, 'bytes');

    console.log('\nTest completed successfully!');
}

testDatabaseUpdate().catch(console.error);