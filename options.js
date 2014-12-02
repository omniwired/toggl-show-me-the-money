// Saves options to chrome.storage
function save_options() {
    var hourlyWage = document.getElementById('hourlyWage').value;
    var useMinutes = document.getElementById('useMinutes').checked;
    var currencyCharacter = document.getElementById('currencyCharacter').value;
    chrome.storage.sync.set({
        hourlyWage: hourlyWage,
        useMinutes: useMinutes,
        currencyCharacter: currencyCharacter
    }, function() {
        // Update status to let user know options were saved.
        var status = document.getElementById('status');
        status.textContent = 'Options saved.';
        setTimeout(function() {
            status.textContent = '';
        }, 750);
    });
}

// Restores select box and checkbox state using the preferences
// stored in chrome.storage.
function restore_options() {
    // Use default value color = 'red' and likesColor = true.
    chrome.storage.sync.get({
        hourlyWage: 1,
        useMinutes: false,
        currencyCharacter: '$'
    }, function(items) {
        document.getElementById('i18n-hourlyWage').innerText = chrome.i18n.getMessage("hourlyWage");
        document.getElementById('i18n-useMinutes').innerText = chrome.i18n.getMessage("useMinutes");
        document.getElementById('i18n-currencyCharacter').innerText = chrome.i18n.getMessage("currencyCharacter");
        document.getElementById('hourlyWage').value = items.hourlyWage;
        document.getElementById('useMinutes').checked = items.useMinutes;
    });
}
document.addEventListener('DOMContentLoaded', restore_options);
document.getElementById('save').addEventListener('click',
    save_options);