// public/script.js

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
let participantName = ""; // Participant name
let trials = []; // Array to store trial data from server
let trialDelay = 500; // 0.5 second delay between trials

// Function to shuffle an array randomly
function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

// Fetch trials data from the server
async function fetchTrials() {
    try {
        const response = await fetch('/api/trials'); // Fetch the trial data from the server
        const data = await response.json();

        console.log('Fetched trials data:', data); // Debugging log

        if (data.length === 0) {
            alert("No trial data found.");
            return;
        }

        // Shuffle trials for randomness
        trials = shuffleArray(data);

        console.log('Shuffled trials:', trials); // Debugging log

        // Set the total number of trials
        document.getElementById('total-trials').innerText = trials.length;

        // Start the first trial after a brief delay
        loadTrialWithDelay();
    } catch (error) {
        console.error('Error fetching trial data:', error);
        alert("Error fetching trial data. Please try again later.");
    }
}

// Display blank screen for a given amount of time
function showBlankScreen(callback) {
    document.getElementById('image-container').style.display = 'none';
    document.getElementById('reference-image-container').style.display = 'none';
    document.getElementById('buttons-container').style.display = 'none';
    document.getElementById('progress-section').style.display = 'none';

    setTimeout(() => {
        callback();
    }, trialDelay);
}

// Function to update the progress bar
function updateProgressBar() {
    const progressPercent = ((trialNum - 1) / trials.length) * 100;
    document.getElementById('progress-bar').style.width = `${progressPercent}%`;
}

// Load the images for the current trial
function loadImages() {
    if (trialNum <= trials.length) {
        const trial = trials[trialNum - 1];

        // Update the trial number and progress bar
        document.getElementById('current-trial').innerText = trialNum;
        updateProgressBar();

        // Set the reference image
        document.getElementById('imgRef').src = trial.referenceImage;
        console.log(trial.referenceImage);

        // Set Image A and Image B
        document.getElementById('imgA').src = trial.imageA;
        document.getElementById('imgB').src = trial.imageB;

        // Update image texts with filenames
        document.getElementById('imgAText').innerText = `Image A`;
        document.getElementById('imgBText').innerText = `Image B`;

        // Show the image containers
        document.getElementById('image-container').style.display = 'block';
        document.getElementById('reference-image-container').style.display = 'block';
        document.getElementById('buttons-container').style.display = 'block';
        document.getElementById('progress-section').style.display = 'block';
    } else {
        // All trials completed, show finish section
        document.getElementById('reference-image-container').style.display = 'none';
        document.getElementById('image-container').style.display = 'none';
        document.getElementById('buttons-container').style.display = 'none';
        document.getElementById('progress-section').style.display = 'none';
        document.getElementById('finish').style.display = 'block';
    }
}

// Load the trial with a delay (blank screen in between)
function loadTrialWithDelay() {
    showBlankScreen(() => {
        loadImages(); // Load the next trial after the blank screen
    });
}

// Record the selection and proceed to the next trial
document.getElementById('selectImgA').addEventListener('click', function() {
    handleSelection('A');
});

document.getElementById('selectImgB').addEventListener('click', function() {
    handleSelection('B');
});

// Handle selection and ensure button highlight before blank screen
function handleSelection(choice) {
    const buttonId = choice === 'A' ? 'selectImgA' : 'selectImgB';
    highlightButton(buttonId); // Highlight the button for feedback

    setTimeout(() => {
        recordSelection(choice); // Proceed to record selection after the highlight effect
    }, 300); // Wait for button highlight effect to finish before recording selection
}

// Highlight the selected button
function highlightButton(buttonId) {
    const button = document.getElementById(buttonId);
    button.classList.add('selected'); // Add the 'selected' class

    // Remove the highlight after 500ms to simulate a brief effect
    setTimeout(() => {
        button.classList.remove('selected');
    }, 500);
}

// Record the selection and load the next trial after a delay (blank screen)
function recordSelection(choice) {
    const trial = trials[trialNum - 1];

    trialData.push({
        trialNum: trialNum, // Trial number
        participant: participantName, // Participant name
        trialName: trial.trialName, // Trial name
        randomSeed: trial.randomSeed, // Random seed
        referenceImage: getFileNameFromPath(trial.referenceImage), // Reference image path
        imageA: getFileNameFromPath(trial.imageA), // Image A path
        imageB: getFileNameFromPath(trial.imageB), // Image B path
        choice: choice, // 'A' or 'B'
        // timestamp: new Date().toISOString() // Timestamp
    });

    trialNum++; // Increment the trial number
    loadTrialWithDelay(); // Show blank screen and load the next trial
}

// Listen for keypresses to select imgA or imgB
document.addEventListener('keydown', function(event) {
    if (event.key === 'a' || event.key === 'A') {
        handleSelection('A');  // User selected Image A with 'A' key
    } else if (event.key === 'b' || event.key === 'B') {
        handleSelection('B');  // User selected Image B with 'B' key
    }
});

// Sidebar open/close functions
// function openNav() {
//     document.getElementById("instruction-sidebar").style.width = "250px";
// }

// function closeNav() {
//     document.getElementById("instruction-sidebar").style.width = "0";
// }

function openNav() {
    document.getElementById("instruction-sidebar").classList.add("open");
    document.getElementById("main-content").style.marginRight = "250px"; // Push main content when sidebar opens
}

function closeNav() {
    document.getElementById("instruction-sidebar").classList.remove("open");
    document.getElementById("main-content").style.marginRight = "0"; // Reset main content position
}


// Start the experiment when the user enters their name or auto-generates a name
document.getElementById('start-button').addEventListener('click', function() {
    const inputName = document.getElementById('participant-name').value.trim();

    if (inputName !== "") {
        participantName = inputName; // Set the participant name from input
    } else {
        participantName = generateRandomName(); // Generate random participant name if input is empty
        alert(`No name entered. Using generated name: ${participantName}`);
    }

    document.getElementById('participant-container').style.display = 'none'; // Hide the name input section
    document.getElementById('instruction-container').style.display = 'none'; // Hide the instruction section

    // Show the image containers and progress section
    document.getElementById('reference-image-container').style.display = 'block';
    document.getElementById('image-container').style.display = 'block';
    document.getElementById('buttons-container').style.display = 'block';
    document.getElementById('progress-section').style.display = 'block';

    // Fetch trials data and start the experiment
    fetchTrials();

    // Show the sidebar toggle button after the trial starts
    document.getElementById('open-sidebar-btn').style.display = 'block';
    document.getElementById('instruction-sidebar').style.display = 'block'; // Show the sidebar initially
});

// Finish and upload CSV
document.getElementById('finish').addEventListener('click', function() {
    submitResults();
});

// Submit the results to the server
function submitResults() {
    const csvContent = d3.csvFormat(trialData);  

    // Send the results to the server
    fetch('/submit_results', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            participant: participantName,
            csv: csvContent
        })
    })
    .then(response => response.json())
    .then(data => {
        if (data.message === 'result uploaded Google Drive') {
            // Redirect to the finish route for final redirection
            alert("Successfully uploaded results to Google Drive.");
            window.location.href = '/finish';
        } else {
            alert("Error uploading results. Please try again later.");
        }
    })
    .catch(error => {
        console.error('Error: ', error);
        alert("Error uploading results. Please try again later.");
    });
}

// Function to generate and download the CSV file using D3.js (optional, not used in current flow)
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
