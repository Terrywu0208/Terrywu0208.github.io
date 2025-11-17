// Configuration
const CONFIG = {
  DATA_PATH: 'data/data.json',
  DELAY_BETWEEN_LINKS: 100, // milliseconds
  AUTO_OPEN_DELAY: 100 // milliseconds
};

// Get batch ID from URL parameters, or use localStorage to remember last selection
function getBatchId() {
  const urlParams = new URLSearchParams(window.location.search);
  const batchId = urlParams.get('batch');
  if (batchId) {
    localStorage.setItem('lastBatchId', batchId);
    return batchId;
  }
  // If no URL parameter, use the record in localStorage
  return localStorage.getItem('lastBatchId') || 'latest';
}

// Load JSON data
async function loadData() {
  try {
    const response = await fetch(CONFIG.DATA_PATH + '?t=' + Date.now()); // Add timestamp to avoid cache
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('[ERROR] Failed to load data:', error);
    // Display error message to user
    const urlList = document.getElementById('urlList');
    if (urlList) {
      const isLocalFile = window.location.protocol === 'file:';
      let errorMessage = '';
      
      if (isLocalFile) {
        // Local file system error
        errorMessage = `
          <div class="no-data" style="text-align: left; padding: 20px;">
            <div style="margin-bottom: 15px;">[ERROR] Cannot load ${CONFIG.DATA_PATH}</div>
            <div style="font-size: 12px; line-height: 1.8; color: #ffaa00;">
              <div style="margin-bottom: 10px;"><strong>Reason:</strong> Browser security policy prevents direct reading of local files</div>
              <div style="margin-bottom: 15px;"><strong>Solutions:</strong></div>
              <div style="margin-left: 20px; margin-bottom: 10px;">
                <strong>Method 1 (Recommended):</strong> Use a local server<br>
                <code style="color: #00ff00; background: rgba(0,0,0,0.5); padding: 2px 5px;">python -m http.server 8000</code><br>
                Then open <code style="color: #00ff00; background: rgba(0,0,0,0.5); padding: 2px 5px;">http://localhost:8000/openall.html</code> in your browser
              </div>
              <div style="margin-left: 20px; margin-bottom: 10px;">
                <strong>Method 2:</strong> Deploy to GitHub Pages and it will work normally
              </div>
            </div>
          </div>
        `;
      } else {
        // GitHub Pages or other HTTP server error
        errorMessage = `
          <div class="no-data" style="text-align: left; padding: 20px;">
            <div style="margin-bottom: 15px;">[ERROR] Cannot load ${CONFIG.DATA_PATH}</div>
            <div style="font-size: 12px; line-height: 1.8; color: #ffaa00;">
              <div style="margin-bottom: 10px;"><strong>Possible causes:</strong></div>
              <div style="margin-left: 20px; margin-bottom: 10px;">
                • ${CONFIG.DATA_PATH} file does not exist or path is incorrect<br>
                • Network connection issue<br>
                • Server configuration problem
              </div>
              <div style="margin-top: 15px; color: #00ffff;">
                [INFO] Please ensure ${CONFIG.DATA_PATH} file has been correctly uploaded to GitHub Pages
              </div>
            </div>
          </div>
        `;
      }
      
      urlList.innerHTML = errorMessage;
    }
    return { batches: [] };
  }
}

// Format time
function formatTime(timestamp) {
  const date = new Date(timestamp);
  return date.toLocaleString('en-US', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  });
}

// Display batch selector
function populateBatchSelector(batches) {
  const select = document.getElementById('batchSelect');
  select.innerHTML = '';
  
  if (batches.length === 0) {
    select.innerHTML = '<option value="">[NO_DATA]</option>';
    return;
  }
  
  // Add "latest" option
  const latestOption = document.createElement('option');
  latestOption.value = 'latest';
  latestOption.textContent = '[LATEST_BATCH]';
  select.appendChild(latestOption);
  
  // Add historical batches (newest first)
  batches.slice().reverse().forEach((batch, index) => {
    const option = document.createElement('option');
    option.value = batch.id.toString();
    option.textContent = `BATCH_${batch.id} - ${formatTime(batch.timestamp)}`;
    select.appendChild(option);
  });
  
  // Set current selection
  const currentBatchId = getBatchId();
  if (currentBatchId === 'latest' || !batches.find(b => b.id.toString() === currentBatchId)) {
    select.value = 'latest';
  } else {
    select.value = currentBatchId;
  }
  
  // Listen for selection changes
  select.addEventListener('change', (e) => {
    const selectedId = e.target.value;
    if (selectedId === 'latest') {
      localStorage.setItem('lastBatchId', 'latest');
      window.history.replaceState({}, '', window.location.pathname);
    } else {
      localStorage.setItem('lastBatchId', selectedId);
      window.history.replaceState({}, '', `?batch=${selectedId}`);
    }
    displayBatch(batches, selectedId);
  });
}

// Display batch content
function displayBatch(batches, batchId, autoOpen = false) {
  const urlList = document.getElementById('urlList');
  const batchInfo = document.getElementById('batchInfo');
  const openAllBtn = document.getElementById('openAllBtn');
  
  let selectedBatch;
  
  if (batchId === 'latest' || batchId === '') {
    // Display the latest batch
    selectedBatch = batches.length > 0 ? batches[batches.length - 1] : null;
  } else {
    // Display specified batch
    selectedBatch = batches.find(b => b.id.toString() === batchId);
  }
  
  if (!selectedBatch || !selectedBatch.urls || selectedBatch.urls.length === 0) {
    urlList.innerHTML = '<div class="no-data">[NO_LINKS_IN_BATCH]</div>';
    batchInfo.textContent = '';
    openAllBtn.style.display = 'none';
    return;
  }
  
  // Display batch information
  batchInfo.textContent = `CREATED: ${formatTime(selectedBatch.timestamp)} | LINKS: ${selectedBatch.urls.length}`;
  
  // Display link list
  urlList.innerHTML = '';
  selectedBatch.urls.forEach((url, index) => {
    const urlItem = document.createElement('div');
    urlItem.className = 'url-item';
    const paddedIndex = String(index + 1).padStart(3, '0');
    urlItem.innerHTML = `<a href="${url}" target="_blank">[${paddedIndex}] ${url}</a>`;
    urlList.appendChild(urlItem);
  });
  
  // Function to open all links
  function openAllLinks() {
    if (!selectedBatch || !selectedBatch.urls || selectedBatch.urls.length === 0) {
      return false;
    }
    
    const totalUrls = selectedBatch.urls.length;
    let blockedCount = 0;
    
    // Use small delay to avoid browser blocking pop-ups, but ensure immediate trigger
    selectedBatch.urls.forEach((url, index) => {
      setTimeout(() => {
        const newWindow = window.open(url, '_blank');
        
        // Check if blocked
        if (!newWindow) {
          // window.open returns null means blocked
          blockedCount++;
          console.warn(`[ERROR] Popup blocked for: ${url}`);
        } else {
          // Further check: try to access window properties
          try {
            // If window is blocked, accessing some properties may fail
            const test = newWindow.closed;
          } catch (e) {
            blockedCount++;
            console.warn(`[ERROR] Popup blocked for: ${url}`);
          }
        }
      }, index * CONFIG.DELAY_BETWEEN_LINKS); // Each link spaced by configured delay
    });
    
    return blockedCount === 0;
  }
  
  // Set button click event
  openAllBtn.onclick = () => {
    openAllBtn.disabled = true;
    openAllBtn.textContent = '[EXECUTING...]';
    
    openAllLinks();
    
    // Restore button state after 500ms
    setTimeout(() => {
      openAllBtn.disabled = false;
      openAllBtn.textContent = 'EXECUTE_ALL_LINKS';
    }, 500);
  };
  
  // Button always displayed
  openAllBtn.style.display = 'block';
  openAllBtn.disabled = false;
  openAllBtn.textContent = 'EXECUTE_ALL_LINKS';
  
  // If it's the first load (autoOpen = true), automatically execute opening all links
  if (autoOpen) {
    // Delay a bit before executing to ensure page is fully loaded
    setTimeout(() => {
      openAllLinks();
    }, CONFIG.AUTO_OPEN_DELAY);
  }
}

// Initialize
async function init() {
  const data = await loadData();
  const batches = data.batches || [];
  
  populateBatchSelector(batches);
  const currentBatchId = getBatchId();
  // Auto-open on first load (autoOpen = true)
  displayBatch(batches, currentBatchId, true);
}

// Initialize on page load
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}

