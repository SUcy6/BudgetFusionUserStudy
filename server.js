const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 3000;

// Middleware to serve static files
app.use(express.static('public'));

// Endpoint to serve image paths
app.get('/images', (req, res) => {
    const testDir = path.join(__dirname, 'public', 'test'); // Path to the test images
    const refDir = path.join(__dirname, 'public', 'ref'); // Path to the reference images

    // Read test images
    const testImages = fs.readdirSync(testDir).filter(file => /\.(jpg|jpeg|png|gif)$/.test(file));

    // Read reference images
    const refImages = fs.readdirSync(refDir).filter(file => /\.(jpg|jpeg|png|gif)$/.test(file));

    // Return test and reference images
    res.json({
        testImages: testImages.map(file => `/test/${file}`),
        refImages: refImages.map(file => `/ref/${file}`)
    });
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
