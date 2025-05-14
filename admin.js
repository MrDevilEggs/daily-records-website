// Admin Configuration - YOU NEED TO SET THESE
const REPO_OWNER = 'MrDevilEggs';
const REPO_NAME = 'daily-records-website';
const DATA_FILE = 'data/records.json'; // Path to your data file in the repo
const GITHUB_TOKEN = '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'; // Needs repo access

// DOM Elements
const adminDateEl = document.getElementById('admin-date');
const adminLeaderEl = document.getElementById('admin-leader');
const adminDeputy1El = document.getElementById('admin-deputy1');
const adminDeputy2El = document.getElementById('admin-deputy2');
const saveBtn = document.getElementById('save-btn');
const cancelBtn = document.getElementById('cancel-btn');
const adminMessageEl = document.getElementById('admin-message');
const existingRecordsEl = document.getElementById('existing-records');

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    // Set default date to today
    adminDateEl.value = new Date().toISOString().split('T')[0];
    
    // Load existing records
    loadAllRecords();
    
    // Set up event listeners
    saveBtn.addEventListener('click', saveRecord);
    cancelBtn.addEventListener('click', () => {
        window.location.href = 'index.html';
    });
});

// Load all records for editing
async function loadAllRecords() {
    try {
        const records = await fetchRecords();
        
        // Display records in a table
        existingRecordsEl.innerHTML = `
            <h3>Existing Records (${records.length})</h3>
            <div class="records-table">
                <div class="table-header">
                    <span>Date</span>
                    <span>Leader</span>
                    <span>Deputies</span>
                    <span>Actions</span>
                </div>
                ${records.map(record => `
                    <div class="table-row" data-date="${record.date}">
                        <span>${formatDate(record.date)}</span>
                        <span>${record.leader || ''}</span>
                        <span>${record.deputy1 || ''}, ${record.deputy2 || ''}</span>
                        <span>
                            <button class="edit-btn" data-date="${record.date}">Edit</button>
                            <button class="delete-btn" data-date="${record.date}">Delete</button>
                        </span>
                    </div>
                `).join('')}
            </div>
        `;
        
        // Add event listeners to edit/delete buttons
        document.querySelectorAll('.edit-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const date = e.target.getAttribute('data-date');
                editRecord(date);
            });
        });
        
        document.querySelectorAll('.delete-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const date = e.target.getAttribute('data-date');
                deleteRecord(date);
            });
        });
    } catch (error) {
        console.error('Error loading records:', error);
        existingRecordsEl.innerHTML = '<p>Error loading records</p>';
    }
}

// Fetch all records from GitHub
async function fetchRecords() {
    const url = `https://raw.githubusercontent.com/${REPO_OWNER}/${REPO_NAME}/main/${DATA_FILE}`;
    const response = await fetch(url);
    return await response.json();
}

// Edit a record
async function editRecord(date) {
    try {
        const records = await fetchRecords();
        const record = records.find(r => r.date === date);
        
        if (record) {
            adminDateEl.value = record.date;
            adminLeaderEl.value = record.leader || '';
            adminDeputy1El.value = record.deputy1 || '';
            adminDeputy2El.value = record.deputy2 || '';
            
            adminMessageEl.textContent = `Editing record for ${formatDate(date)}`;
            adminMessageEl.className = 'message info';
        }
    } catch (error) {
        console.error('Error editing record:', error);
        showMessage('Error loading record for editing', 'error');
    }
}

// Delete a record
async function deleteRecord(date) {
    if (!confirm(`Are you sure you want to delete the record for ${formatDate(date)}?`)) {
        return;
    }
    
    try {
        const records = await fetchRecords();
        const updatedRecords = records.filter(r => r.date !== date);
        
        await updateRecords(updatedRecords);
        showMessage(`Record for ${formatDate(date)} deleted`, 'success');
        loadAllRecords();
    } catch (error) {
        console.error('Error deleting record:', error);
        showMessage('Error deleting record', 'error');
    }
}

// Save a record
async function saveRecord() {
    const date = adminDateEl.value;
    const leader = adminLeaderEl.value.trim();
    const deputy1 = adminDeputy1El.value.trim();
    const deputy2 = adminDeputy2El.value.trim();
    
    if (!date) {
        showMessage('Please select a date', 'error');
        return;
    }
    
    try {
        let records = await fetchRecords();
        
        // Check if record exists for this date
        const existingIndex = records.findIndex(r => r.date === date);
        const newRecord = { date, leader, deputy1, deputy2 };
        
        if (existingIndex >= 0) {
            // Update existing record
            records[existingIndex] = newRecord;
            showMessage(`Updated record for ${formatDate(date)}`, 'info');
        } else {
            // Add new record
            records.push(newRecord);
            showMessage(`Added new record for ${formatDate(date)}`, 'success');
        }
        
        // Sort by date
        records.sort((a, b) => new Date(a.date) - new Date(b.date));
        
        // Save to GitHub
        await updateRecords(records);
        
        // Reset form
        adminLeaderEl.value = '';
        adminDeputy1El.value = '';
        adminDeputy2El.value = '';
        
        // Reload records
        loadAllRecords();
    } catch (error) {
        console.error('Error saving record:', error);
        showMessage('Error saving record', 'error');
    }
}

// Update records on GitHub
async function updateRecords(records) {
    const apiUrl = `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/${DATA_FILE}`;
    
    // First, get the current file SHA
    const getResponse = await fetch(apiUrl, {
        headers: {
            'Authorization': `token ${GITHUB_TOKEN}`,
            'Accept': 'application/vnd.github.v3+json'
        }
    });
    
    const fileData = await getResponse.json();
    const sha = fileData.sha;
    
    // Prepare the update
    const content = JSON.stringify(records, null, 2);
    const encodedContent = btoa(unescape(encodeURIComponent(content)));
    
    const updateResponse = await fetch(apiUrl, {
        method: 'PUT',
        headers: {
            'Authorization': `token ${GITHUB_TOKEN}`,
            'Accept': 'application/vnd.github.v3+json',
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            message: `Update daily records`,
            content: encodedContent,
            sha: sha
        })
    });
    
    if (!updateResponse.ok) {
        throw new Error('Failed to update file on GitHub');
    }
}

// Helper functions
function formatDate(dateString) {
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
}

function showMessage(text, type) {
    adminMessageEl.textContent = text;
    adminMessageEl.className = `message ${type}`;
}
