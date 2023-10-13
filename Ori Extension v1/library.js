document.addEventListener('DOMContentLoaded', function () {
    loadItems('model');
    loadItems('extension');
    loadItems('command');
 


	document.getElementById('deleteSelectedBtn').addEventListener('click', function () {
    if (!anyItemsSelected()) {
        console.log("No items selected to delete");
        return;
    }
    this.classList.add('flash');
    deleteSelectedItems('model');
    deleteSelectedItems('extension');
    deleteSelectedItems('command');
    setTimeout(() => this.classList.remove('flash'), 1000);
});



    document.getElementById('deleteSelectedBtn').addEventListener('click', function () {
        // Adding logic to disable buttons if no items are selected
        if (!anyItemsSelected()) {
            console.log("No items selected to delete"); // Logging
            return;
        }
        deleteSelectedItems('model');
        deleteSelectedItems('extension');
        deleteSelectedItems('command');
    });

    document.getElementById('addItemBtn').addEventListener('click', function () {
        alert('Add Item button clicked!');
    });

    document.getElementById('toggleDefaultBtn').addEventListener('click', function () {
        // Adding logic to disable buttons if no items are selected
        if (!anyItemsSelected()) {
            console.log("No items selected to toggle default"); // Logging
            return;
        }
        toggleDefaultState('model');
        toggleDefaultState('extension');
        toggleDefaultState('command');
    });

  updateButtonState();
    document.querySelectorAll('input[type="checkbox"]').forEach(checkbox => {
        checkbox.addEventListener('change', updateButtonState);
    });


    document.getElementById('installSelectedBtn').addEventListener('click', function () {
        // Adding logic to disable buttons if no items are selected
        if (!anyItemsSelected()) {
            console.log("No items selected to install"); // Logging
            return;
        }
        installSelectedItems();
    });
});




function updateButtonState() {
    const buttons = document.querySelectorAll('#deleteSelectedBtn, #toggleDefaultBtn, #installSelectedBtn');
    const isEnabled = anyItemsSelected();
    
    buttons.forEach(button => {
        button.disabled = !isEnabled;
    });
}

// Additional function to check if any items are selected across all item types
function anyItemsSelected() {
    const checkboxes = document.querySelectorAll('input[type="checkbox"]');
    for (let i = 0; i < checkboxes.length; i++) {
        if (checkboxes[i].checked) {
            return true;
        }
    }
    return false;
}

// Adding logs to function deleteSelectedItems to track buffer/logic flow
function deleteSelectedItems(itemType) {
    console.log(`Attempting to delete selected ${itemType}`); // Logging
    chrome.storage.local.get([itemType + 's'], function (data) {
        const items = data[itemType + 's'] || [];
        const checkboxes = document.querySelectorAll(`#${itemType}sContainer input[type="checkbox"]`);

        console.log('Original items:', items); // Debug line
        const newItems = items.filter((item, index) => !checkboxes[index].checked);
        console.log('Items to keep:', newItems); // Debug line

        chrome.storage.local.set({ [itemType + 's']: newItems }, function () {
            loadItems(itemType);
        });
    });
}

// Adding logs to function toggleDefaultState to track buffer/logic flow
function toggleDefaultState(itemType) {
    console.log(`Attempting to toggle default state for ${itemType}`); // Logging
    chrome.storage.local.get([itemType + 's'], function (data) {
        const items = data[itemType + 's'] || [];
        const checkboxes = document.querySelectorAll(`#${itemType}sContainer input[type="checkbox"]`);

        checkboxes.forEach((checkbox, index) => {
            if (checkbox.checked) {
                items[index].isDefault = !items[index].isDefault;
            }
        });

        chrome.storage.local.set({ [itemType + 's']: items }, function () {
            loadItems(itemType);
        });
    });
}

// Adding logs to function installSelectedItems to track buffer/logic flow
function installSelectedItems() {
    console.log("Attempting to install selected items"); // Logging
    const selectedCheckboxes = document.querySelectorAll('input[type="checkbox"]:checked');
    let commands = [];

    selectedCheckboxes.forEach(checkbox => {
        const itemName = checkbox.getAttribute('data-item-name');
        const itemType = checkbox.getAttribute('data-item-type'); // "model", "extension", or "command"

        switch (itemType) {
            case 'extension':
            case 'command':
                commands.push(generateGitCommand(itemName, itemType));
                break;
            case 'model':
                commands.push(generateWgetCommand(itemName));
                break;
            default:
                console.error('Unsupported item type:', itemType);
        }
    });

    // Concatenate commands with " && ".
    const fullCommand = commands.join(' && ');

    // Copy to clipboard.
    navigator.clipboard.writeText(fullCommand).then(() => {
        alert('Installation commands copied to clipboard!');
    }).catch(err => {
        console.error('Could not copy text: ', err);
    });
}

// ... Rest of your provided code remains same...

function loadItems(itemType) {
    console.log(`Loading Items: ${itemType}`);
    chrome.storage.local.get([itemType + 's'], function(data) {
        const items = data[itemType + 's'] || [];
        const container = document.getElementById(itemType + 'sContainer');
        container.innerHTML = ''; 
        
        if (items.length === 0) {
            container.innerHTML = `<p>You have not added any ${itemType}s yet.</p>`;
            return;
        }

        if(itemType === 'model') {
            const groupedModels = items.reduce((groups, model) => {
                (groups[model.modelType] = groups[model.modelType] || []).push(model);
                return groups;
            }, {});

            Object.keys(groupedModels).forEach(modelType => {
                const modelTypeHeader = document.createElement('h2');
                modelTypeHeader.textContent = modelType;
                container.appendChild(modelTypeHeader);

                const table = createTableForItems(groupedModels[modelType], itemType);
                container.appendChild(table);
            });
        } else {
            const table = createTableForItems(items, itemType);
            container.appendChild(table);
        }
    });
}

function createTableForItems(items, itemType) {
  // Create a document fragment to contain the table.
  const fragment = document.createDocumentFragment();

  // Create the table element.
  const table = document.createElement('table');
  table.classList.add('table');

  // Create the table header row.
  const headerRow = document.createElement('tr');
  headerRow.classList.add('table-header');

  // Create the table header cells.
  const headerCells = ['', 'Name', 'Default'];

  if(itemType === 'model') {
    headerCells.splice(2, 0, 'SD Version');
  }

  if(itemType === 'command') {
    headerCells.push('Button');
  }

  headerCells.forEach(headerText => {
    const headerCell = document.createElement('th');
    headerCell.textContent = headerText;
    headerRow.appendChild(headerCell);
  });

  // Add the header row to the table.
  table.appendChild(headerRow);

  // Iterate over the items and create a table row for each item.
  items.forEach((item, index) => {
    console.log(`Processing ${itemType}: ${item.name}, Index: ${index}`);

    const row = document.createElement('tr');
    row.classList.add(index % 2 === 0 ? 'evenRow' : 'oddRow');

    // Create the checkbox cell.
	
    const checkboxCell = document.createElement('td');
    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.id = itemType + 'Checkbox' + index;
    checkbox.value = item.name;
	checkbox.setAttribute('data-download-link', item.url || '');
    checkbox.setAttribute('data-item-name', item.name);
    checkbox.setAttribute('data-index', index.toString());
    checkboxCell.appendChild(checkbox);
    row.appendChild(checkboxCell);

    // Create the name cell.
    const nameCell = document.createElement('td');
    const nameLink = document.createElement('a');
    nameLink.href = item.url;
    nameLink.target = "_blank";
    nameLink.textContent = item.name;
    nameCell.appendChild(nameLink);
    row.appendChild(nameCell);

    if(itemType === 'command') {
      nameLink.title = item.command;
    }

    if(itemType === 'model') {
      // Create the version cell.
      const versionCell = document.createElement('td');
      versionCell.textContent = item.version || 'N/A';
      row.appendChild(versionCell);
    }

    // Create the default cell.
    const defaultCell = document.createElement('td');
    defaultCell.textContent = item.isDefault ? '*' : '';
    row.appendChild(defaultCell);

    if(itemType === 'command') {
      // Create the button cell.
      const buttonCell = document.createElement('td');
      buttonCell.textContent = item.addButton ? '*' : '';
      row.appendChild(buttonCell);
    }

    // Add the row to the table.
    table.appendChild(row);

    if (item.notes && item.notes.trim() !== "") {
      // Create the notes row.
      const notesRow = document.createElement('tr');
      notesRow.classList.add(index % 2 === 0 ? 'evenRow' : 'oddRow');

      // Create the notes cell.
      const notesCell = document.createElement('td');
      notesCell.colSpan = headerCells.length;
      notesCell.textContent = `Notes: ${item.notes}`;
      notesCell.style.paddingLeft = '20px';
      notesCell.style.fontStyle = 'italic';
      notesCell.style.color = 'gray';

      notesRow.appendChild(notesCell);
      table.appendChild(notesRow);
    }
  });

  // Add the table to the document fragment.
  fragment.appendChild(table);

  // Return the document fragment.
  return fragment;
}

function generateGitCommand(itemName, itemType) {
    // Retrieve your item data from storage and generate the command accordingly.
    // Example:
    return `cd ${getDirectory(itemType, itemName)} && [ -d ${itemName} ] && git pull ${itemName} || git clone ${getItemGitUrl(itemName)}`;
}

function generateWgetCommand(model) {
    let filename = model.name.replace(/\W+/g, '_'); // Strip special characters, replacing with underscores
    
    if(model.url.includes('civitai.com')) {
        filename += '.safetensors';
    }

    const downloadLink = model.downloadLink;
    const modelTypeDirectory = getModelTypeDirectory(model.modelType);
    
    return `wget -O ${modelTypeDirectory}/${filename} ${downloadLink}`;
}

function generateModelCommand(model) {
    let path = "";
    let filename = model.name.replace(/\W+/g, '_'); 
    
    if(model.url.includes('civitai.com')) {
        filename += '.safetensors';
    }
    
    switch (model.modelType) {
        case 'LyCORIS':
            path = '/workspace/Stable-diffusion-webui/models/lycoris';
            break;
        case 'Embedding':
            path = '/workspace/Stable-diffusion-webui/models/embedding';
            break;
        case 'LoRA':
            path = '/workspace/Stable-diffusion-webui/models/lora';
            break;
        case 'Checkpoint':
            path = '/workspace/Stable-diffusion-webui/models/checkpoint';
            break;
        case 'Enlarger':
            path = '/workspace/Stable-diffusion-webui/models/enlarger';
            break;
        default:
            console.error('Unknown modelType:', model.modelType);
            return "";
    }
    
    return `wget -O ${path}/${filename} ${model.downloadLink}`;
}

function generateGitCommand(item) {
    const itemType = item.type;
    
    if(itemType === "Extension") {
        const path = "/workspace/Stable-diffusion-webui/extensions";
        const formattedName = item.name.replace(/\W+/g, '_');

        return `cd ${path} && ` +
               `if [ ! -d "${formattedName}" ]; then ` +
               `    git clone ${item.url} ${formattedName}; ` +
               `else ` +
               `    cd ${formattedName} && git pull && cd ..; ` +
               `fi`;
    } else if(itemType === "Command") {
        return item.command;
    } else {
        console.error('Unsupported item type:', itemType);
        return "";
    }
}

function generateCommandsForItems(items) {
    let commands = items.map(item => {
        if(item.type === "Extension" || item.type === "Command") {
            return generateGitCommand(item);
        } else { // Assuming other types are models
            return generateModelCommand(item);
        }
    });

    return commands.join(' && '); // Join all commands
}

function generateExtensionCommand(extension) {
    const formattedName = extension.name.split('|')[0].split('(')[0].split('/')[0].trim().replace(/\s+/g, '_');
    const path = '/workspace/stable-diffusion-webui/extensions';
    return `
        cd ${path} &&
        if [ ! -d "${formattedName}" ]; then 
            git clone ${extension.url} ${formattedName}
        else 
            cd ${formattedName} && git pull && cd ..
        fi`;
}

function generateCommandCommand(command) {
    return command.command;
}

function copyCommandsToClipboard(commands) {
    const fullCommand = commands.map(command => command.command).join('\n');
    copyToClipboard(fullCommand);
}

function copyToClipboard(text) {
    navigator.clipboard.writeText(text).then(function() {
        console.log('Text successfully copied to clipboard!');
    }).catch(function(err) {
        console.error('Unable to copy text to clipboard:', err);
    });
}
chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
  if (request.action === 'refreshItems') {
    loadItems('model');
    loadItems('extension');
    loadItems('command');
  }
});