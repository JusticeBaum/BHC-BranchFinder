let zipCodeMap = null;
let lastReadTime = null;

async function getFileModTime() {
  try {
    const response = await fetch(chrome.runtime.getURL('../data/mapping.csv'), {
      method: 'HEAD'
    });
    const lastModified = response.headers.get('Last-Modified');
    return lastModified ? new Date(lastModified).getTime() : Date.now();
  } catch (error) {
    console.error('Error getting file modification time:', error);
    return Date.now();
  }
}

async function loadCSV() {
  try {
    const response = await fetch(chrome.runtime.getURL('../data/mapping.csv'));
    const csvText = await response.text();
    
    const lines = csvText.trim().split('\n');
    const map = new Map();
    
    const startIndex = lines[0].toLowerCase().includes('zip') ? 1 : 0;
    
    for (let i = startIndex; i < lines.length; i++) {
      const line = lines[i].trim();
      if (line) {
        const [zipCode, branch] = line.split(',').map(item => item.trim());
        if (zipCode && branch) {
          map.set(zipCode, branch);
        }
      }
    }
    
    return map;
  } catch (error) {
    console.error('Error loading CSV:', error);
    throw error;
  }
}

async function getZipCodeMap() {
  const fileModTime = await getFileModTime();
  
  if (!zipCodeMap || !lastReadTime || fileModTime > lastReadTime) {
    console.log('Loading CSV data...');
    zipCodeMap = await loadCSV();
    lastReadTime = Date.now();
    
    await chrome.storage.local.set({
      zipCodeMap: Array.from(zipCodeMap.entries()),
      lastReadTime: lastReadTime
    });
  }
  
  return zipCodeMap;
}

chrome.runtime.onStartup.addListener(async () => {
  const data = await chrome.storage.local.get(['zipCodeMap', 'lastReadTime']);
  if (data.zipCodeMap) {
    zipCodeMap = new Map(data.zipCodeMap);
    lastReadTime = data.lastReadTime;
  }
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'lookupZip') {
    getZipCodeMap()
      .then(map => {
        const branch = map.get(request.zipCode);
        sendResponse({ 
          success: true, 
          branch: branch || null,
          found: !!branch 
        });
      })
      .catch(error => {
        sendResponse({ 
          success: false, 
          error: error.message 
        });
      });
    return true;
  }
});