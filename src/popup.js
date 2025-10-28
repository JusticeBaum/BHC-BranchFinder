const zipCodeInput = document.getElementById('zipCode');
const lookupBtn = document.getElementById('lookupBtn');
const resultDiv = document.getElementById('result');

lookupBtn.addEventListener('click', lookupZipCode);

zipCodeInput.addEventListener('keypress', (e) => {
  if (e.key === 'Enter') {
    lookupZipCode();
  }
});

async function lookupZipCode() {
  const zipCode = zipCodeInput.value.trim();

  if (!zipCode) {
    showResult('Please enter a zip code', 'error');
    return;
  }
  
  lookupBtn.disabled = true;
  lookupBtn.textContent = 'Looking up...';
  
  try {
    const response = await chrome.runtime.sendMessage({
      action: 'lookupZip',
      zipCode: zipCode
    });
    
    if (response.success) {
      if (response.found) {
        showResult(`Branch: ${response.branch}`, 'success');
      } else {
        showResult('Zip code not found in our system', 'not-found');
      }
    } else {
      showResult(`Error: ${response.error}`, 'error');
    }
  } catch (error) {
    showResult(`Error: ${error.message}`, 'error');
  } finally {
    lookupBtn.disabled = false;
    lookupBtn.textContent = 'Find Branch';
  }
}

function showResult(message, type) {
  resultDiv.textContent = message;
  resultDiv.className = `result ${type}`;
}