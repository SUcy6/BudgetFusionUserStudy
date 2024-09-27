// Generate a random participant name using a combination of letters
function generateRandomName() {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
    let name = '';
    for (let i = 0; i < 8; i++) {
        name += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return name;
}

// Extract the file name from a full path
function getFileNameFromPath(path) {
    return path.split('/').pop();
}

let trialData = [];
let trialNum = 1; // Start with trial 1
let participantName = ""; // Generate random participant name
let testImages = [];
let refImages = [];

// Function to shuffle an array randomly
function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}


// Fetch images dynamically from the server
async function fetchImages() {
    const response = await fetch('/images'); // Fetch the image data from the server
    const data = await response.json();

    // Group test images in pairs of A and B
    for (let i = 0; i < data.testImages.length; i += 2) {
        testImages.push({ imgA: data.testImages[i], imgB: data.testImages[i + 1] });
    }

    // Store reference images from the 'ref' folder
    refImages = data.refImages;

    // Shuffle test images for randomness
    testImages = shuffleArray(testImages);

    loadImages(); // Start the task by loading the first set of images
}


// Randomly select a reference image for the current trial
function getRandomRefImage() {
    const randomIndex = Math.floor(Math.random() * refImages.length);
    return refImages[randomIndex];
}

// Load the images for the current trial
function loadImages() {
    if (trialNum <= testImages.length) {
        // Show the reference image first
        const imgRefSrc = getRandomRefImage();
        document.getElementById('imgRef').src = imgRefSrc;

        // Shuffle imgA and imgB for randomness within each trial
        let currentTestImages = shuffleArray([testImages[trialNum - 1].imgA, testImages[trialNum - 1].imgB]);

        // Display the shuffled test images (imgA and imgB)
        document.getElementById('imgA').src = currentTestImages[0];
        document.getElementById('imgB').src = currentTestImages[1];
    } else {
        // Hide the image container and show the finish button when all trials are completed
        document.getElementById('finish').style.display = 'block';
        document.getElementById('reference-image-container').style.display = 'none';
        document.getElementById('image-container').style.display = 'none';
        document.getElementById('buttons-container').style.display = 'none';
        document.getElementById('reference-image-container').style.display = 'none';
    }
}

// Record the selection and proceed to the next trial
document.getElementById('selectImgA').addEventListener('click', function() {
    recordSelection(true); // User selected Image A
});

document.getElementById('selectImgB').addEventListener('click', function() {
    recordSelection(false); // User selected Image B
});

function recordSelection(isImgASelected) {
    // Store the current trial data
    const currentRefImage = document.getElementById('imgRef').src.replace(window.location.origin, '');  // Get the current reference image

    trialData.push({
        trial: trialNum,  // Current trial number
        participant: participantName,  // Randomly generated participant name
        imgRef: currentRefImage,  // Reference image path
        imgA: testImages[trialNum - 1].imgA,  // Image A path
        imgB: testImages[trialNum - 1].imgB,  // Image B path
        isImgASelected: isImgASelected  // Whether Image A was selected (true/false)
    });

    trialNum++; // Increment the trial number
    loadImages(); // Load the next pair of images
}

function highlightButton(buttonId) {
    const button = document.getElementById(buttonId);
    button.classList.add('selected'); // Add the 'selected' class

    // Remove the highlight after 300ms to simulate a brief effect
    setTimeout(() => {
        button.classList.remove('selected');
    }, 300);
}

// Listen for keypresses to select imgA or imgB
document.addEventListener('keydown', function(event) {
    if (event.key === 'a' || event.key === 'A') {
        highlightButton('selectImgA'); // Highlight the button for imgA
        recordSelection(true);  // User selected Image A with 'A' key
    } else if (event.key === 'b' || event.key === 'B') {
        highlightButton('selectImgB'); // Highlight the button for imgB
        recordSelection(false);  // User selected Image B with 'B' key
    }
});

// Start the experiment when the user enters their name or auto-generates a name
document.getElementById('start-button').addEventListener('click', function() {
    const inputName = document.getElementById('participant-name').value;
    
    if (inputName.trim() !== "") {
        participantName = inputName; // Set the participant name from input
    } else {
        participantName = generateRandomName(); // Generate random participant name if input is empty
        alert(`No name entered. Using generated name: ${participantName}`);
    }

    document.getElementById('participant-container').style.display = 'none'; // Hide the name input section
    // Show the image containers and buttons
    document.getElementById('reference-image-container').style.display = 'block';
    document.getElementById('image-container').style.display = 'block';
    document.getElementById('buttons-container').style.display = 'block';
    fetchImages(); // Fetch images and start the experiment
});


// Generate and download the CSV after all trials
document.getElementById('finish').addEventListener('click', function() {
    downloadCSV(); // Call the function to download CSV
});

// Function to generate and download the CSV file using D3.js
function downloadCSV() {
    // Convert trial data to CSV format
    const csvContent = d3.csvFormat(trialData);

    // Create a Blob from the CSV content
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });

    // Create a download link
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `participant_${participantName}_results.csv`); // File name with participant name
    document.body.appendChild(link); // Append the link to the document
    link.click(); // Programmatically click the link to trigger download
    document.body.removeChild(link); // Clean up
}

// Fetch images and initialize the task
fetchImages();
