// background.js
chrome.runtime.onInstalled.addListener((details) => {
    if (details.reason === 'install') {
        // The extension is being installed for the first time.
        // Load default data into local storage.
        fetch('defaults.json')
            .then(response => response.json())
            .then(defaultData => {
                chrome.storage.local.set(defaultData, () => {
                    console.log('Default data loaded into local storage.');
                });
            })
            .catch(error => {
                console.error('Error loading default data:', error);
            });
    }
});
