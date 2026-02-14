const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

/**
 * Saves a base64 image string to the server's uploads folder.
 * @param {string} base64String - The base64 encoded image.
 * @param {string} subFolder - The subfolder within public/uploads (e.g., 'readings').
 * @returns {string|null} - The relative path to the saved file or null if failed.
 */
function saveBase64Image(base64String, subFolder = 'readings') {
    if (!base64String || !base64String.includes(';base64,')) {
        return null;
    }

    try {
        const parts = base64String.split(';base64,');
        const mimeType = parts[0].split(':')[1];
        const imageData = parts[1];
        const extension = mimeType.split('/')[1] || 'jpg';
        
        const fileName = `${crypto.randomUUID()}.${extension}`;
        const uploadDir = path.join(__dirname, '..', '..', 'public', 'uploads', subFolder);
        
        // Ensure directory exists
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }

        const filePath = path.join(uploadDir, fileName);
        fs.writeFileSync(filePath, imageData, 'base64');
        
        // Return relative path for database storage
        return `/uploads/${subFolder}/${fileName}`;
    } catch (err) {
        console.error('Error saving base64 image:', err);
        return null;
    }
}

module.exports = { saveBase64Image };
