const express = require('express');
const { google } = require('googleapis');
const bodyParser = require('body-parser');
const streamifier = require('streamifier');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = 3000;

// Middleware to serve static files
app.use(express.static('public'));
app.use(bodyParser.json());

// Google Drive API configuration
const SCOPES = ['https://www.googleapis.com/auth/drive.file'];

const auth = new google.auth.GoogleAuth({
    credentials: {
        client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
        private_key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n'),
    },
    scopes: SCOPES,
});

const drive = google.drive({ version: 'v3', auth });

function getAllTrials(imgDir) {
    const trials = [];
    const trialFolders = fs.readdirSync(imgDir).filter(folder => {
        return fs.statSync(path.join(imgDir, folder)).isDirectory();
    });

    trialFolders.forEach(trial => {
        const trialPath = path.join(imgDir, trial);
        const subfolders = fs.readdirSync(trialPath).filter(subfolder => {
            return fs.statSync(path.join(trialPath, subfolder)).isDirectory();
        });

        if (subfolders.length === 0) {
            console.warn(`Trial ${trial} has no subfolders`);
            return;
        }

        const subfolderPath = path.join(trialPath, subfolders[0]);
        const images = fs.readdirSync(subfolderPath).filter(file => file.endsWith('.png'));

        if (!images.includes('129.png')) {
            console.warn(`Trial ${trial} subfolder doesn't have 129.png`);
            return;
        }

        const otherImages = images.filter(file => file !== '129.png');

        const shuffled = otherImages.sort(() => 0.5 - Math.random());
        const selected = shuffled.slice(0, 2);

        trials.push({
            trialName: trial,
            randomSeed: subfolders[0],
            referenceImage: path.join('img', trial, subfolders[0], '129.png'),
            imageA: path.join('img', trial, subfolders[0], selected[0]),
            imageB: path.join('img', trial, subfolders[0], selected[1]),
        });
    });

    return trials;
}

// Endpoint to get all trials
app.get('/api/trials', (req, res) => {
    const imgDirectory = path.join(__dirname, 'public', 'img');
    const trials = getAllTrials(imgDirectory);
    res.json(trials);
});

// Endpoint to submit results to Google Drive
app.post('/submit_results', async (req, res) => {
    const { participant, csv } = req.body;

    try {
        const fileMetadata = {
            'name': `participant_${participant}_results.csv`,
            'parents': [process.env.GOOGLE_DRIVE_FOLDER_ID],
        };

        const media = {
            mimeType: 'text/csv',
            body: streamifier.createReadStream(csv),
        };

        const file = await drive.files.create({
            resource: fileMetadata,
            media: media,
            fields: 'id',
        });

        console.log(`document uploaded ${file.data.id}`);
        res.status(200).json({ message: 'result uploaded Google Drive' });
    } catch (error) {
        console.error('document upload error:', error);
        res.status(500).json({ message: 'document upload to google drive error' });
    }
});

app.get('/finish', (req, res) => {
    const redirectUrl = process.env.FINAL_REDIRECT_URL;
    if (redirectUrl) {
        res.redirect(redirectUrl);
    } else {
        res.status(500).send('no redirect url provided');
    }
});


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
