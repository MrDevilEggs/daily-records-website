// Configuration
const REPO_OWNER = 'your-github-username';
const REPO_NAME = 'your-repo-name';
const DATA_FILE = 'data/records.json'; // Path to your data file in the repo
const TOKEN = ''; // Leave empty for public read access

// DOM Elements
const leaderNameEl = document.getElementById('leader-name');
const deputy1NameEl = document.getElementById('deputy1-name');
const deputy2NameEl = document.getElementById('deputy2-name');
const dateSelectorEl = document.getElementById('date-selector');
const searchBtn = document.getElementById('search-btn');
const recordsListEl = document.getElementById('records-list');
const currentDateEl = document.getElementById('current-date');

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    // Set default date to today
    const today = new Date().toISOString().split('T')[0];
    dateSelectorEl.value = today;
    currentDateEl.textContent = formatDate(today);
    
    // Load data
    loadData(today);
    
    // Set up event listeners
    searchBtn.addEventListener('click', () => {
        const selectedDate = dateSelectorEl.value;
        currentDateEl.textContent = formatDate(selectedDate);
        loadData(selectedDate);
    });
});

// Format date for display
function formatDate(dateString) {
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
}

// Load data from GitHub
async function loadData(date) {
    try {
        const url = `https://raw.githubusercontent.com/${REPO_OWNER}/${REPO_NAME}/main/${DATA_FILE}`;
        const response = await fetch(url);
        const data = await response.json();
        
        // Find record for selected date
        const record = data.find(r => r.date === date);
        
        if (record) {
            leaderNameEl.textContent = record.leader || 'Not assigned';
            deputy1NameEl.textContent = record.deputy1 || 'Not assigned';
            deputy2NameEl.textContent = record.deputy2 || 'Not assigned';
        } else {
            leaderNameEl.textContent = 'Not recorded';
            deputy1NameEl.textContent = 'Not recorded';
            deputy2NameEl.textContent = 'Not recorded';
        }
        
        // Load history (last 7 days)
        loadHistory(data);
    } catch (error) {
        console.error('Error loading data:', error);
        leaderNameEl.textContent = 'Error loading data';
        deputy1NameEl.textContent = 'Error loading data';
        deputy2NameEl.textContent = 'Error loading data';
    }
}

// Load history records
function loadHistory(data) {
    // Sort by date (newest first)
    const sortedData = [...data].sort((a, b) => new Date(b.date) - new Date(a.date));
    
    // Display last 7 records
    recordsListEl.innerHTML = '';
    sortedData.slice(0, 7).forEach(record => {
        const recordEl = document.createElement('div');
        recordEl.className = 'history-item';
        
        recordEl.innerHTML = `
            <div class="history-date">${formatDate(record.date)}</div>
            <div class="record-item">
                <span class="record-label">Leader:</span>
                <span class="record-value">${record.leader || 'None'}</span>
            </div>
            <div class="record-item">
                <span class="record-label">Deputies:</span>
                <span class="record-value">${record.deputy1 || 'None'}, ${record.deputy2 || 'None'}</span>
            </div>
        `;
        
        recordsListEl.appendChild(recordEl);
    });
}
