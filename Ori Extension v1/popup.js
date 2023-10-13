document.addEventListener('DOMContentLoaded', initializePage);

function initializePage() {
    document.getElementById('openLibraryBtn').addEventListener('click', openLibrary);
    document.getElementById('addItemBtn').addEventListener('click', addItemBtnClicked);
    document.getElementsByClassName('close')[0].addEventListener('click', closeAddItemModal);
    document.getElementById('itemType').addEventListener('change', toggleAdditionalFields);
    window.addEventListener('click', windowOnClick);
    document.getElementById('submitItemBtn').addEventListener('click', submitItem);
    chrome.storage.local.get('commands', generateCommandButtonsFromStorage);
}

function openLibrary() {
    chrome.tabs.create({url: 'library.html'});
}

function showAddItemModal() {
    document.getElementById('addItemModal').style.display = "block";
}

function closeAddItemModal() {
    document.getElementById('addItemModal').style.display = "none";
}

function windowOnClick(event) {
    if (event.target == document.getElementById('addItemModal')) {
        closeAddItemModal();
    }
}

function generateCommandButtonsFromStorage(data) {
    const commands = data.commands || [];
    generateCommandButtons(commands);
}

function generateCommandButtons(commands) {
    const codeButtonsDiv = document.getElementById('codebuttons');
    commands.forEach(cmd => {
        if (cmd.addButton) {
            const btn = document.createElement('button');
            btn.innerText = cmd.name;
            btn.title = cmd.notes;
            btn.classList.add('command-button');
            btn.addEventListener('click', () => {
                copyToClipboard(cmd.command);
                flashButton(btn);
            });
            codeButtonsDiv.appendChild(btn);
        }
    });
}



function copyToClipboard(text) {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand('copy');
    document.body.removeChild(textarea);
}

function flashButton(button) {
    button.classList.add('flash-green');
    setTimeout(() => button.classList.remove('flash-green'), 2000);
}

function submitItem() {
  const itemInfo = {
    name: document.getElementById('name').value,
    url: document.getElementById('itemUrl').value,
    type: document.getElementById('itemType').value,
    command: document.getElementById('command').value,
    addButton: document.getElementById('addButton').checked,
    downloadLink: document.getElementById('downloadLink').value,
    isDefault: document.getElementById('isDefault').checked,
    notes: document.getElementById('notes').value,
    modelType: document.getElementById('modelType').value,
    version: document.getElementById('version').value
  };
  addItemToStorage(itemInfo);
  closeAddItemModal();

  // Send a message to the library.html page to refresh the items.
  chrome.runtime.sendMessage({action: 'refreshItems'});

  // Reload the library.html page to ensure that the items are refreshed.
  location.reload();
}


function addItemToStorage(itemInfo) {
    chrome.storage.local.get([itemInfo.type.toLowerCase() + 's'], function(result) {
        let items = result[itemInfo.type.toLowerCase() + 's'] || [];
        items.push(itemInfo);
        chrome.storage.local.set({[itemInfo.type.toLowerCase() + 's']: items}, function() {
            console.log(itemInfo.type + ' info saved to storage:', itemInfo);
            
			refreshLibraryTabs();
  
            });
        });
  }

function toggleAdditionalFields() {
    const selectedItemType = document.getElementById('itemType').value;
    document.getElementById('modelFields').style.display = (selectedItemType === 'Model') ? 'block' : 'none';
    document.getElementById('commandFields').style.display = (selectedItemType === 'Command') ? 'block' : 'none';
    document.getElementById('itemUrl').style.display = (selectedItemType === 'Command') ? 'none' : 'block';
    document.querySelector('label[for="itemUrl"]').style.display = (selectedItemType === 'Command') ? 'none' : 'block';
}

function addItemBtnClicked() {
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
        const currentTab = tabs[0];
        if (isFromCivitai(currentTab.url)) {
            chrome.scripting.executeScript({
                target: {tabId: currentTab.id},
                function: extractModelInfo
            }, (results) => {
                const modelInfo = results[0].result;
                modelInfo.url = currentTab.url;
                populateModal(modelInfo, 'Model');
            });
        } else if (isFromGitHub(currentTab.url)) {
            chrome.scripting.executeScript({
                target: {tabId: currentTab.id},
                function: extractExtInfo
            }, (results) => {
                const extInfo = results[0].result;
                extInfo.url = currentTab.url;
                populateModal(extInfo, 'Extension');
            });
        } else {
            showAddItemModal();
        }
    });
}

function isFromCivitai(url) {
    return url.includes('civitai.com');
}

function isFromGitHub(url) {
    return url.includes('github.com');
}

function extractModelInfo() {
    // Extract name
    const name = document.querySelector('h1')?.innerText || "N/A";
    
    // Extract type
    const typeElement = document.querySelector('td.mantine-1avyp1d span.mantine-Badge-inner');
    let type = "N/A";
    if (typeElement) {
        type = typeElement.textContent || typeElement.innerText;
        type = type.trim().split(" ")[0]; // Keep only the first word ("Checkpoint")
    }
    
    // Extract version
    const versionElement = document.querySelector('td.mantine-1avyp1d div.mantine-Text-root');
    const version = versionElement?.textContent.trim() || "N/A";
    
    // Extract download link
    const downloadLinkElement = document.querySelector('a[href^="/api/download/models/"]');
    const downloadLink = downloadLinkElement ? `https://civitai.com${downloadLinkElement.getAttribute('href')}` : "N/A";
    
    // Extract URL
    const url = window.location.href;

    // Log and return extracted model info
    const modelInfo = {
        name: name,
        type: 'Model',
        modelType: type,
        version: version,
        downloadLink: downloadLink,
        url: url
    };
    console.log("Model info extracted:", modelInfo);
    return modelInfo;
}


function extractExtInfo() {
    const name = document.querySelector('h1')?.innerText || "N/A";
    return {name: name};
}



function populateModal(info, type) {
    console.log("Populating modal with:", info);
    document.getElementById('name').value = info.name || '';
    document.getElementById('itemUrl').value = info.url || '';
    document.getElementById('modelType').value = info.modelType || '';
    document.getElementById('version').value = info.version || '';  // Ensure this matches extracted value
    document.getElementById('downloadLink').value = info.downloadLink || '';
    
    if (type === 'Model') {
        document.getElementById('itemType').value = 'Model';
        document.getElementById('modelFields').style.display = 'block';
        document.getElementById('commandFields').style.display = 'none';
    } else if (type === 'Extension') {
        document.getElementById('itemType').value = 'Extension';
        document.getElementById('modelFields').style.display = 'none';
        document.getElementById('commandFields').style.display = 'none';
    }
    showAddItemModal();
}

function refreshLibraryTabs() {
    chrome.tabs.query({url: '*://*/*library.html'}, function(tabs) {
        console.log(`Found ${tabs.length} tabs.`);
        tabs.forEach(tab => {
            console.log(`Sending message to tab ${tab.id}.`);
            chrome.tabs.sendMessage(tab.id, {action: 'refreshItems'});
        });
    });
}

