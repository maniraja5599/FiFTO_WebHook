// Client Management System
const CLIENTS_STORAGE_KEY = 'fifto_clients';
const SELECTED_CLIENTS_KEY = 'fifto_selected_clients';

// Initialize clients - start with empty array
let clients = [];
let selectedClientIds = [];

// Load clients from localStorage
function loadClients() {
    const stored = localStorage.getItem(CLIENTS_STORAGE_KEY);
    if (stored) {
        try {
            clients = JSON.parse(stored);
        } catch (e) {
            console.error('Error loading clients:', e);
            clients = [];
        }
    } else {
        clients = [];
    }
    
    // Load selected clients
    const storedSelected = localStorage.getItem(SELECTED_CLIENTS_KEY);
    if (storedSelected) {
        try {
            selectedClientIds = JSON.parse(storedSelected);
        } catch (e) {
            selectedClientIds = [];
        }
    } else {
        selectedClientIds = [];
    }
    
    // Auto-select first client if available
    if (clients.length > 0 && selectedClientIds.length === 0) {
        selectedClientIds = [clients[0].id];
        saveSelectedClients();
    }
    
    console.log('Loaded clients:', clients.length);
    updateClientsList();
}

// Save clients to localStorage
function saveClients() {
    localStorage.setItem(CLIENTS_STORAGE_KEY, JSON.stringify(clients));
}

// Save selected clients
function saveSelectedClients() {
    localStorage.setItem(SELECTED_CLIENTS_KEY, JSON.stringify(selectedClientIds));
}

// Generate unique client ID
function generateClientId() {
    return 'client-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
}

// Add new client
function addClient(name, url, capital) {
    if (!name || !name.trim() || !url || !url.trim()) {
        throw new Error('Client name and URL are required');
    }
    
    // Validate URL
    if (!url.includes('flattrade.in')) {
        throw new Error('Invalid Flattrade URL');
    }
    
    const newClient = {
        id: generateClientId(),
        name: name.trim(),
        url: url.trim(),
        capital: parseInt(capital) || 10000000,
        createdAt: new Date().toISOString()
    };
    
    clients.push(newClient);
    saveClients();
    updateClientsList();
    updateClientSelector();
    
    // Auto-select new client
    selectedClientIds = [newClient.id];
    saveSelectedClients();
    updateClientSelector();
    loadSelectedClientsData();
    
    return newClient;
}

// Delete client
function deleteClient(clientId) {
    if (confirm('Are you sure you want to delete this client?')) {
        clients = clients.filter(c => c.id !== clientId);
        selectedClientIds = selectedClientIds.filter(id => id !== clientId);
        
        // Clear P&L data for this client
        const storageKey = `fifto_pnl_data_${clientId}`;
        localStorage.removeItem(storageKey);
        localStorage.removeItem(`${storageKey}_time`);
        
        saveClients();
        saveSelectedClients();
        updateClientsList();
        updateClientSelector();
        
        // Load data if clients remain, otherwise clear UI
        if (clients.length > 0 && selectedClientIds.length > 0) {
            loadSelectedClientsData();
        } else {
            // Clear P&L data display
            if (typeof pnlData !== 'undefined') {
                pnlData = {
                    daily: [],
                    summary: { today: { pnl: 0, percent: 0 }, mtd: { pnl: 0, percent: 0 }, total: { pnl: 0, percent: 0 } },
                    capital: 0,
                    clientName: '',
                    clientInfo: ''
                };
                if (typeof updateUI === 'function') {
                    updateUI();
                }
            }
        }
    }
}

// Clear all clients
function clearAllClients() {
    if (clients.length === 0) {
        alert('No clients to clear.');
        return;
    }
    
    if (confirm(`Are you sure you want to remove ALL ${clients.length} client(s)?\n\nThis will:\n- Delete all client records\n- Clear all cached P&L data\n- Reset all performance metrics\n\nThis action cannot be undone!`)) {
        // Clear all clients
        clients = [];
        selectedClientIds = [];
        
        // Clear all client-related localStorage data
        const keys = Object.keys(localStorage);
        keys.forEach(key => {
            if (key.startsWith('fifto_pnl_data_') || key === CLIENTS_STORAGE_KEY || key === SELECTED_CLIENTS_KEY) {
                localStorage.removeItem(key);
            }
        });
        
        // Clear main P&L data
        localStorage.removeItem('fifto_pnl_data');
        localStorage.removeItem('fifto_last_update');
        
        saveClients();
        saveSelectedClients();
        updateClientsList();
        updateClientSelector();
        
        // Clear P&L data display
        if (typeof pnlData !== 'undefined') {
            pnlData = {
                daily: [],
                summary: { today: { pnl: 0, percent: 0 }, mtd: { pnl: 0, percent: 0 }, total: { pnl: 0, percent: 0 } },
                capital: 0,
                clientName: '',
                clientInfo: 'Please add a client to view P&L data'
            };
            if (typeof updateUI === 'function') {
                updateUI();
            }
        }
        
        // Update quick stats
        if (typeof updateQuickStats === 'function') {
            updateQuickStats();
        }
        
        alert('✅ All clients have been removed successfully!');
    }
}

// Update clients list in modal
function updateClientsList() {
    const container = document.getElementById('clients-list-container');
    if (!container) return;
    
    // Update clients count
    const countEl = document.getElementById('clients-count');
    if (countEl) {
        countEl.textContent = clients.length;
    }
    
    // Update clear all button visibility
    const clearAllBtn = document.getElementById('clear-all-clients-btn');
    if (clearAllBtn) {
        clearAllBtn.style.display = clients.length > 0 ? 'block' : 'none';
    }
    
    if (clients.length === 0) {
        container.innerHTML = '<div style="text-align: center; padding: 3rem; color: var(--text-tertiary);"><p>No clients added yet.</p><p style="font-size: 0.9rem; margin-top: 0.5rem;">Use the "Add Client" tab to add your first client.</p></div>';
        return;
    }
    
    container.innerHTML = clients.map(client => `
        <div class="client-item">
            <div class="client-item-info">
                <strong>${client.name}</strong>
                <div class="client-url-container">
                    <label>Verified P&L Link</label>
                    <a href="${client.url}" target="_blank" rel="noopener" class="client-url-link">${client.url}</a>
                </div>
                <span class="client-capital">💰 Capital: ₹${(client.capital / 10000000).toFixed(2)}Cr</span>
            </div>
            <div class="client-item-actions">
                <button class="btn btn-secondary btn-small" onclick="editClient('${client.id}')" title="Edit client details">
                    ✏️ Edit
                </button>
                <button class="btn btn-warning btn-small" onclick="clearClientData('${client.id}')" title="Clear cached P&L data">
                    🗑️ Clear Data
                </button>
                <button class="btn btn-danger btn-small" onclick="deleteClient('${client.id}')" title="Delete client">
                    ❌ Delete
                </button>
            </div>
        </div>
    `).join('');
}

// Edit client
function editClient(clientId) {
    const client = clients.find(c => c.id === clientId);
    if (!client) return;
    
    // Populate edit form
    document.getElementById('edit-client-id').value = client.id;
    document.getElementById('edit-client-name-input').value = client.name;
    document.getElementById('edit-client-url-input').value = client.url;
    document.getElementById('edit-client-capital-input').value = client.capital;
    
    // Hide tabs and show edit form
    document.querySelector('.client-tabs').style.display = 'none';
    document.querySelectorAll('.tab-content').forEach(tab => tab.classList.remove('active'));
    document.getElementById('edit-client-form-container').style.display = 'block';
    
    // Scroll to edit form
    document.getElementById('edit-client-form-container').scrollIntoView({ behavior: 'smooth' });
}

// Save edited client
function saveEditedClient() {
    const clientId = document.getElementById('edit-client-id').value;
    const name = document.getElementById('edit-client-name-input').value.trim();
    const url = document.getElementById('edit-client-url-input').value.trim();
    const capital = parseInt(document.getElementById('edit-client-capital-input').value) || 10000000;
    
    if (!name || !url) {
        alert('Please fill in all required fields');
        return;
    }
    
    const clientIndex = clients.findIndex(c => c.id === clientId);
    if (clientIndex === -1) return;
    
    // Update client
    clients[clientIndex] = {
        ...clients[clientIndex],
        name: name,
        url: url,
        capital: capital
    };
    
    saveClients();
    updateClientsList();
    updateClientSelector();
    
    // Reset form and show tabs again
    document.getElementById('edit-client-form').reset();
    document.getElementById('edit-client-form-container').style.display = 'none';
    document.querySelector('.client-tabs').style.display = 'flex';
    document.querySelector('[data-tab="list"]').click();
    
    // Show success message
    const container = document.getElementById('clients-list-container');
    if (container) {
        const successMsg = document.createElement('div');
        successMsg.style.cssText = 'background: #10b981; color: white; padding: 0.75rem; border-radius: 0.5rem; margin-bottom: 1rem; text-align: center;';
        successMsg.textContent = '✅ Client updated successfully!';
        container.insertBefore(successMsg, container.firstChild);
        setTimeout(() => successMsg.remove(), 3000);
    }
    
    // Reload data if this client is selected
    if (selectedClientIds.includes(clientId)) {
        loadSelectedClientsData();
    }
}

// Clear cached data for a specific client
function clearClientData(clientId) {
    const client = clients.find(c => c.id === clientId);
    if (!client) return;
    
    if (confirm(`Clear all cached P&L data for "${client.name}"? This will force a fresh fetch on next refresh.`)) {
        // Clear localStorage data related to this client
        const storageKey = `fifto_pnl_data_${clientId}`;
        localStorage.removeItem(storageKey);
        
        // Also clear the main storage if it contains this client's data
        const mainData = localStorage.getItem('fifto_pnl_data');
        if (mainData) {
            try {
                const data = JSON.parse(mainData);
                // If current data is for this client, clear it
                if (data.clientId === clientId || 
                    (data.clientName === client.name && data.daily && data.daily.length > 0)) {
                    localStorage.removeItem('fifto_pnl_data');
                    localStorage.removeItem('fifto_last_update');
                }
            } catch (e) {
                // Ignore parse errors
            }
        }
        
        alert(`Cached data cleared for "${client.name}". Click "Refresh Data" to fetch fresh data.`);
        
        // If this client is currently selected, reload data
        if (selectedClientIds.includes(clientId)) {
            loadSelectedClientsData();
        }
    }
}

// Make functions available globally
window.editClient = editClient;
window.clearClientData = clearClientData;

// Update client list in the new UI
function updateClientSelector() {
    const container = document.getElementById('client-list-grid');
    const noClientsMsg = document.getElementById('no-clients-message');
    
    if (!container) return;
    
    // Clear existing cards
    container.innerHTML = '';
    
    if (clients.length === 0) {
        if (noClientsMsg) noClientsMsg.style.display = 'block';
        return;
    }
    
    if (noClientsMsg) noClientsMsg.style.display = 'none';
    
    // Add card for each client
    clients.forEach((client, index) => {
        const card = document.createElement('div');
        card.className = 'client-selection-card';
        const isSelected = selectedClientIds.includes(client.id);
        
        if (isSelected) {
            card.classList.add('selected');
        }
        
        // Get initials for avatar
        const initials = client.name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
        
        // Format capital
        const capitalText = client.capital >= 10000000 
            ? `₹${(client.capital / 10000000).toFixed(2)}Cr`
            : `₹${(client.capital / 100000).toFixed(2)}L`;
        
        card.innerHTML = `
            <div class="client-card-header">
                <div class="client-card-avatar">${initials}</div>
                <div class="client-card-info">
                    <h4 class="client-card-name">${client.name}</h4>
                    <div class="client-card-capital">${capitalText}</div>
                </div>
                ${isSelected ? '<span class="selected-badge">✓ Selected</span>' : ''}
            </div>
            <div class="client-card-url">
                <span class="client-card-url-label">Verified P&L Link</span>
                <a href="${client.url}" target="_blank" rel="noopener" class="client-card-url-link" onclick="event.stopPropagation()">${client.url}</a>
            </div>
            <div class="client-card-actions">
                <button class="btn btn-secondary btn-small" onclick="deleteClient('${client.id}')" title="Delete client">
                    ❌ Delete
                </button>
            </div>
        `;
        
        // Add click handler for selection
        card.addEventListener('click', (e) => {
            // Don't toggle if clicking on link or button
            if (e.target.tagName === 'A' || e.target.tagName === 'BUTTON' || e.target.closest('button')) return;
            
            handleClientCardClick(client.id);
        });
        
        container.appendChild(card);
    });
    
    // Update selected count
    updateSelectedCount();
}

// Handle client card click
function handleClientCardClick(clientId) {
    const index = selectedClientIds.indexOf(clientId);
    
    if (index > -1) {
        // Deselect
        selectedClientIds.splice(index, 1);
    } else {
        // Select
        selectedClientIds.push(clientId);
    }
    
    saveSelectedClients();
    updateClientSelector();
    updateSelectedCount();
    loadSelectedClientsData();
}

// Handle "Select All" button click
function handleSelectAllClick() {
    const allSelected = selectedClientIds.length === clients.length && clients.length > 0;
    
    if (allSelected) {
        // Deselect all
        selectedClientIds = [];
    } else {
        // Select all
        selectedClientIds = clients.map(c => c.id);
    }
    
    saveSelectedClients();
    updateClientSelector();
    updateSelectedCount();
    loadSelectedClientsData();
}

// Update selected clients count
function updateSelectedCount() {
    const countEl = document.getElementById('selected-clients-count');
    if (!countEl) return;
    
    const count = selectedClientIds.length;
    if (clients.length === 0) {
        countEl.textContent = 'No clients added';
    } else if (count === 0) {
        countEl.textContent = 'No clients selected';
    } else if (count === clients.length) {
        countEl.textContent = `All ${count} client${count !== 1 ? 's' : ''} selected (Combined View)`;
    } else {
        const selectedNames = clients
            .filter(c => selectedClientIds.includes(c.id))
            .map(c => c.name)
            .join(', ');
        countEl.textContent = `${count} client${count !== 1 ? 's' : ''} selected: ${selectedNames}`;
    }
}

// Clear selection function (kept for compatibility)
function clearSelection() {
    selectedClientIds = [];
    saveSelectedClients();
    updateClientSelector();
    updateSelectedCount();
    loadSelectedClientsData();
}

// Load data for selected clients
async function loadSelectedClientsData() {
    if (selectedClientIds.length === 0 || clients.length === 0) {
        console.warn('No clients selected');
        // Clear P&L data display if no clients
        if (typeof pnlData !== 'undefined') {
            pnlData = {
                daily: [],
                summary: { today: { pnl: 0, percent: 0 }, mtd: { pnl: 0, percent: 0 }, total: { pnl: 0, percent: 0 } },
                capital: 0,
                clientName: '',
                clientInfo: 'Please add a client to view P&L data'
            };
            if (typeof updateUI === 'function') {
                updateUI();
            }
        }
        return;
    }
    
    const selectedClients = clients.filter(c => selectedClientIds.includes(c.id));
    
    if (selectedClients.length === 0) {
        console.warn('No valid clients found');
        return;
    }
    
    // Show loading state
    const refreshBtn = document.getElementById('refresh-pnl');
    if (refreshBtn) {
        refreshBtn.disabled = true;
        refreshBtn.textContent = 'Loading...';
    }
    
    try {
        // Fetch data for all selected clients
        const clientDataPromises = selectedClients.map(client => fetchClientData(client));
        const clientDataArray = await Promise.all(clientDataPromises);
        
        // Combine data if multiple clients
        const combinedData = combineClientData(clientDataArray, selectedClients);
        
        // Update global pnlData
        if (typeof pnlData !== 'undefined') {
            pnlData = combinedData;
            if (typeof saveData === 'function') {
                saveData();
            }
            if (typeof updateUI === 'function') {
                updateUI();
            }
        }
        
        // Update verified source link
        const sourceLink = document.getElementById('verified-source-link');
        if (sourceLink && selectedClients.length === 1) {
            sourceLink.href = selectedClients[0].url;
            sourceLink.textContent = 'Flattrade Wall P&L';
        } else {
            sourceLink.href = '#';
            sourceLink.textContent = `${selectedClients.length} Clients`;
        }
        
        // Update quick stats after data is loaded
        if (typeof updateQuickStats === 'function') {
            setTimeout(() => updateQuickStats(), 300);
        }
        
    } catch (error) {
        console.error('Error loading client data:', error);
        // Silently handle errors - don't show alert
    } finally {
        if (refreshBtn) {
            refreshBtn.disabled = false;
            refreshBtn.textContent = 'Refresh Data';
        }
    }
}

// Fetch client name from verified P&L URL - Now uses hardcoded data
async function fetchClientNameFromUrl(url) {
    // No longer fetching from API - return null to use default names
    // Client names are now set in DEFAULT_CLIENTS
    return null;
}

// Fetch data for a single client - Loads from localStorage
async function fetchClientData(client) {
    try {
        // Try to load from localStorage first
        const cacheKey = `fifto_pnl_data_${client.id}`;
        const cachedData = localStorage.getItem(cacheKey);
        
        if (cachedData) {
            try {
                const parsedData = JSON.parse(cachedData);
                if (parsedData.daily && parsedData.daily.length > 0) {
                    console.log(`Using cached data for ${client.name}`);
                    return {
                        client: client,
                        data: parsedData
                    };
                }
            } catch (e) {
                console.error('Error parsing cached data:', e);
            }
        }
        
        // No cached data - return empty structure
        // User needs to fetch data using the extraction method
        console.warn(`No data found for ${client.name}. Please use "Fetch Data" to extract P&L data.`);
        return {
            client: client,
            data: {
                daily: [],
                summary: {
                    today: { pnl: 0, percent: 0 },
                    mtd: { pnl: 0, percent: 0 },
                    total: { pnl: 0, percent: 0 }
                },
                capital: client.capital || 10000000,
                clientName: client.name,
                clientInfo: `Capital: ₹${client.capital >= 10000000 ? (client.capital / 10000000).toFixed(2) + 'Cr' : (client.capital / 100000).toFixed(2) + 'L'}`,
                clientId: client.id,
                verifiedUrl: client.url
            }
        };
    } catch (error) {
        console.error(`Error loading data for ${client.name}:`, error);
        throw error;
    }
}

// Combine data from multiple clients
function combineClientData(clientDataArray, selectedClients) {
    if (clientDataArray.length === 1) {
        // Single client - return as is, ensure capital is set
        const singleData = clientDataArray[0].data;
        const clientCapital = selectedClients[0].capital || singleData.capital || 10000000;
        
        // Get client name - only use fetched name if it came from verified P&L (has verifiedUrl)
        // Otherwise use the client name from the client list
        let clientName = selectedClients[0].name; // Default to client name from list
        
        // Only use fetched name if it was actually fetched from verified page
        if (singleData.clientName && singleData.clientName.trim() && 
            singleData.clientName !== 'Unknown Client' &&
            singleData.clientName !== 'No clients added' &&
            singleData.clientName !== 'No Clients Added' &&
            !singleData.clientName.toLowerCase().startsWith('client') &&
            singleData.clientName !== 'Verified P&L Performance' &&
            singleData.verifiedUrl) { // Only if verifiedUrl exists (meaning it was fetched)
            clientName = singleData.clientName.trim();
        }
        
        return {
            ...singleData,
            clientName: clientName, // Include client name (fetched or from list)
            capital: clientCapital,
            clientInfo: singleData.clientInfo || `Capital: ₹${clientCapital >= 10000000 ? (clientCapital / 10000000).toFixed(2) + 'Cr' : (clientCapital / 100000).toFixed(2) + 'L'}`,
            clientId: selectedClients[0].id, // Ensure clientId is included
            // Preserve metadata from verified URL
            period: singleData.period || null,
            lastUpdated: singleData.lastUpdated || null,
            verifiedUrl: singleData.verifiedUrl || selectedClients[0].url || null,
            expectedPnl: singleData.expectedPnl || null
        };
    }
    
    // Multiple clients - combine data
    const totalCapital = selectedClients.reduce((sum, c) => sum + (c.capital || 0), 0);
    
    // Get client names - prioritize fetched names from data
    const combinedClientNames = selectedClients.map(c => {
        // Try to get fetched name from data if available
        const clientData = clientDataArray.find(d => d.client.id === c.id);
        if (clientData && clientData.data.clientName && 
            clientData.data.clientName !== 'Unknown Client' &&
            clientData.data.clientName !== c.name) {
            return clientData.data.clientName;
        }
        return c.name;
    }).join(', ');
    
    const combined = {
        daily: [],
        summary: {
            today: { pnl: 0, percent: 0 },
            mtd: { pnl: 0, percent: 0 },
            total: { pnl: 0, percent: 0 }
        },
        capital: totalCapital,
        clientName: `${selectedClients.length} Clients (Combined): ${combinedClientNames}`,
        clientInfo: `Capital: ₹${totalCapital >= 10000000 ? (totalCapital / 10000000).toFixed(2) + 'Cr' : (totalCapital / 100000).toFixed(2) + 'L'} | ${combinedClientNames}`,
        clientIds: selectedClients.map(c => c.id) // Include client IDs
    };
    
    // Combine daily P&L by date
    const dailyByDate = {};
    
    clientDataArray.forEach(({ client, data }) => {
        if (data.daily && Array.isArray(data.daily)) {
            data.daily.forEach(day => {
                const dateKey = day.date.split('T')[0]; // YYYY-MM-DD
                if (!dailyByDate[dateKey]) {
                    dailyByDate[dateKey] = {
                        date: day.date,
                        pnl: 0,
                        percent: 0
                    };
                }
                dailyByDate[dateKey].pnl += day.pnl;
            });
        }
        
        // Combine summaries
        if (data.summary) {
            combined.summary.today.pnl += data.summary.today.pnl || 0;
            combined.summary.mtd.pnl += data.summary.mtd.pnl || 0;
            combined.summary.total.pnl += data.summary.total.pnl || 0;
        }
    });
    
    // Convert to array and calculate percentages
    combined.daily = Object.values(dailyByDate)
        .map(day => ({
            ...day,
            percent: combined.capital ? (day.pnl / combined.capital) * 100 : 0
        }))
        .sort((a, b) => new Date(a.date) - new Date(b.date));
    
    // Recalculate total P&L from combined daily data to ensure accuracy
    const recalculatedTotalPnl = combined.daily.reduce((sum, day) => sum + day.pnl, 0);
    
    // Calculate summary percentages based on combined capital
    if (combined.capital > 0) {
        combined.summary.today.percent = (combined.summary.today.pnl / combined.capital) * 100;
        combined.summary.mtd.percent = (combined.summary.mtd.pnl / combined.capital) * 100;
        combined.summary.total.pnl = recalculatedTotalPnl; // Use recalculated total for accuracy
        combined.summary.total.percent = (recalculatedTotalPnl / combined.capital) * 100;
    } else {
        combined.summary.today.percent = 0;
        combined.summary.mtd.percent = 0;
        combined.summary.total.percent = 0;
    }
    
    return combined;
}

// Initialize client management
function initClientManagement() {
    loadClients();
    
    // No longer forcing first client to be selected
    
    updateClientsList();
    updateClientSelector();
    
    // Setup tab switching
    const tabBtns = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');
    
    tabBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            const targetTab = btn.getAttribute('data-tab');
            
            if (!targetTab) return;
            
            // Update active tab button
            tabBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            
            // Update active tab content
            tabContents.forEach(content => {
                content.classList.remove('active');
                if (content.id === `tab-${targetTab}`) {
                    content.classList.add('active');
                }
            });
        });
    });
    
    // Client form event listeners removed - UI no longer exists
    // All add client, manage clients, and client list functionality has been removed
    
    const cancelEditBtn = document.getElementById('cancel-edit');
    const cancelEditBtn2 = document.getElementById('cancel-edit-2');
    
    function hideEditForm() {
        const editForm = document.getElementById('edit-client-form');
        const editContainer = document.getElementById('edit-client-form-container');
        const tabs = document.querySelector('.client-tabs');
        
        if (editForm) editForm.reset();
        if (editContainer) editContainer.style.display = 'none';
        
        // Show tabs again
        if (tabs) tabs.style.display = 'flex';
        
        // Activate list tab
        const listTabBtn = document.querySelector('[data-tab="list"]');
        const listTabContent = document.getElementById('tab-list');
        const addTabBtn = document.querySelector('[data-tab="add"]');
        const addTabContent = document.getElementById('tab-add');
        
        if (listTabBtn && listTabContent) {
            listTabBtn.classList.add('active');
            if (addTabBtn) addTabBtn.classList.remove('active');
            listTabContent.classList.add('active');
            if (addTabContent) addTabContent.classList.remove('active');
        }
    }
    
    if (cancelEditBtn) {
        cancelEditBtn.addEventListener('click', hideEditForm);
    }
    if (cancelEditBtn2) {
        cancelEditBtn2.addEventListener('click', hideEditForm);
    }
    
    const clearBtn = document.getElementById('clear-selection');
    if (clearBtn) {
        clearBtn.addEventListener('click', () => {
            selectedClientIds = [];
            saveSelectedClients();
            updateClientSelector();
            updateSelectedCount();
            loadSelectedClientsData();
        });
    }
    
    const selectAllBtn = document.getElementById('select-all-clients');
    if (selectAllBtn) {
        selectAllBtn.addEventListener('click', handleSelectAllClick);
    }
    
    // Client management UI removed - no longer needed
    
    // Load data for selected clients on init
    if (clients.length > 0) {
        loadSelectedClientsData();
    } else {
        // Show empty state
        updateClientSelector();
    }
}

// Automatic extraction function - REMOVED (now using manual upload)
// This function has been removed. Users now upload data manually via the upload section.

// Make functions available globally
window.deleteClient = deleteClient;
window.clearAllClients = clearAllClients;

// Initialize on page load
document.addEventListener('DOMContentLoaded', initClientManagement);

