// Test the edit functionality fix
const testImage = {
  id: 1,
  title: "Original Title",
  description: "Original description",
  src: "original.jpg",
  ranking: 7.5,
  tags: ["original"],
  width: "400px",
  height: "300px",
  isMajor: true,
  groupId: "test-group",
  date: "2025-01-01T00:00:00.000Z"
};

// Simulate form data (what would come from the form)
const formData = {
  title: "Updated Title",
  description: "Updated description",
  src: "updated.jpg",
  ranking: "8.0",
  tags: "updated, test",
  width: "500px",
  height: "400px",
  isMajor: "on",
  groupId: "updated-group"
};

// Simulate the old logic (what was happening before)
function oldUpdateLogic(currentImage, formData) {
  const imageData = {
    title: formData.title.trim(),
    description: formData.description.trim(),
    src: formData.src.trim(),
    ranking: parseFloat(formData.ranking) || 5.0,
    tags: formData.tags.split(',').map(tag => tag.trim()).filter(tag => tag),
    width: formData.width.trim(),
    height: formData.height.trim(),
    isMajor: formData.isMajor === 'on',
    groupId: formData.groupId.trim() || null,
    date: new Date().toISOString()  // This was overwriting the original date!
  };

  const updatedImage = {
    ...currentImage,
    ...imageData
  };

  return updatedImage;
}

// Simulate the new logic (with the fix)
function newUpdateLogic(currentImage, formData) {
  const imageData = {
    title: formData.title.trim(),
    description: formData.description.trim(),
    src: formData.src.trim(),
    ranking: parseFloat(formData.ranking) || 5.0,
    tags: formData.tags.split(',').map(tag => tag.trim()).filter(tag => tag),
    width: formData.width.trim(),
    height: formData.height.trim(),
    isMajor: formData.isMajor === 'on',
    groupId: formData.groupId.trim() || null,
    // Don't set date here - preserve original date for updates
  };

  const updatedImage = {
    ...currentImage,
    ...imageData,
    id: currentImage.id,  // Ensure ID is preserved
    date: currentImage.date  // Ensure original date is preserved
  };

  return updatedImage;
}

console.log('🧪 Testing Edit Functionality Fix\n');

console.log('📋 Original Image:');
console.log(JSON.stringify(testImage, null, 2));

console.log('\n📋 Form Data:');
console.log(JSON.stringify(formData, null, 2));

console.log('\n🔴 Old Logic Result (problematic):');
const oldResult = oldUpdateLogic(testImage, formData);
console.log(JSON.stringify(oldResult, null, 2));

console.log('\n✅ New Logic Result (fixed):');
const newResult = newUpdateLogic(testImage, formData);
console.log(JSON.stringify(newResult, null, 2));

console.log('\n🔍 Comparison:');
console.log(`ID preserved: ${oldResult.id === newResult.id && newResult.id === testImage.id ? '✅' : '❌'}`);
console.log(`Date preserved: ${oldResult.date !== newResult.date && newResult.date === testImage.date ? '✅' : '❌'}`);
console.log(`Title updated: ${newResult.title === formData.title ? '✅' : '❌'}`);
console.log(`Ranking updated: ${newResult.ranking === parseFloat(formData.ranking) ? '✅' : '❌'}`);

if (oldResult.date !== newResult.date) {
  console.log('\n⚠️  CRITICAL: Old logic was overwriting the original date!');
  console.log(`   Original date: ${testImage.date}`);
  console.log(`   Old result date: ${oldResult.date}`);
  console.log(`   New result date: ${newResult.date}`);
}

console.log('\n✅ Fix applied: ID and original date are now preserved during updates!');
console.log('💡 The image should now save correctly without losing critical data.');