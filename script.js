// Global variables
let fieldCounter = 0;
let fieldsContainer; // Will be assigned on DOMContentLoaded
let addButton;     // Will be assigned on DOMContentLoaded

function createFieldGroup(dateValue = '', textValue = '') {
    fieldCounter++;
    const fieldGroup = document.createElement('div');
    fieldGroup.className = 'field-group';
    fieldGroup.dataset.id = fieldCounter;

    fieldGroup.innerHTML = `
        <label for="date_${fieldCounter}" class="label">Date ${fieldCounter}:</label>
        <input type="date" id="date_${fieldCounter}" class="date-field" value="${dateValue}">

        <label for="text_${fieldCounter}" class="label">Text ${fieldCounter}:</label>
        <textarea id="text_${fieldCounter}" class="text-field">${textValue}</textarea>

        <button type="button" class="remove-button">Remove</button>
    `;

    const removeButton = fieldGroup.querySelector('.remove-button');
    removeButton.onclick = function() {
        console.log('Remove button clicked inside field group.'); // Debug log
        fieldGroup.remove();
        updateWidgetValue();
        requestResize();
    };

    const dateField = fieldGroup.querySelector('.date-field');
    dateField.onchange = updateWidgetValue;

    const textField = fieldGroup.querySelector('.text-field');
    textField.oninput = function() {
        updateWidgetValue();
        requestResize();
    };

    fieldsContainer.appendChild(fieldGroup);
    requestResize();
    console.log('New field group added and resize requested.'); // Debug log
}

function updateWidgetValue() {
    const data = {};
    document.querySelectorAll('.field-group').forEach(group => {
        const id = group.dataset.id;
        const dateField = group.querySelector('.date-field');
        const textField = group.querySelector('.text-field');
        data[`date_${id}`] = dateField ? dateField.value : '';
        data[`text_${id}`] = textField ? textField.value : '';
    });
    // Check if JFCustomWidget is defined before using it
    if (typeof JFCustomWidget !== 'undefined') {
        JFCustomWidget.setValue(data);
        console.log('Widget value updated.'); // Debug log
    } else {
        console.error('JFCustomWidget is NOT defined in updateWidgetValue! (This should not happen now)'); // Critical error log
    }
}

function requestResize() {
    const height = document.documentElement.scrollHeight;
    // Check if JFCustomWidget is defined before using it
    if (typeof JFCustomWidget !== 'undefined') {
        JFCustomWidget.requestFrameResize({ height: height + 80 });
        console.log('Resize request sent. Height:', height + 80); // Debug log
    } else {
        console.error('JFCustomWidget is NOT defined in requestResize! (This should not happen now)'); // Critical error log
    }
}

// *** MAIN INITIALIZATION LOGIC ***
// This runs once the HTML content is fully loaded and parsed.
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOMContentLoaded fired. Initializing widget.'); // Debug log

    // Get references to the DOM elements
    fieldsContainer = document.getElementById('fields-container');
    addButton = document.querySelector('.add-button');

    // Basic error checking in case elements are not found
    if (!fieldsContainer) {
        console.error('Error: fields-container not found! Cannot initialize widget.');
        return; // Stop execution if critical elements are missing
    }
    if (!addButton) {
        console.error('Error: add-button not found! Cannot initialize widget.');
        return; // Stop execution if critical elements are missing
    }

    // Initialize with one field group on load
    createFieldGroup();
    updateWidgetValue();

    // Attach click handler to the add button
    addButton.onclick = function() {
        console.log('Add button clicked!'); // Debug log
        createFieldGroup();
        updateWidgetValue();
    };
    console.log('Add button click handler attached.'); // Debug log

    // Handle initial widget value if loaded from Jotform
    // This part still relies on JFCustomWidget. Since Network tab showed it loading,
    // it should be available by this point.
    if (typeof JFCustomWidget !== 'undefined') {
        JFCustomWidget.getValue(function(value) {
            console.log('JFCustomWidget.getValue called. Initial value:', value); // Debug log
            if (value && Object.keys(value).length > 0) {
                fieldsContainer.innerHTML = ''; // Clear initial field if there's saved data
                const keys = Object.keys(value).sort((a, b) => {
                    const idA = parseInt(a.split('_')[1]);
                    const idB = parseInt(b.split('_')[1]);
                    return idA - idB;
                });

                const fieldGroupData = {};
                keys.forEach(key => {
                    const [type, id] = key.split('_');
                    if (!fieldGroupData[id]) {
                        fieldGroupData[id] = {};
                    }
                    fieldGroupData[id][type] = value[key];
                });

                Object.values(fieldGroupData).forEach(data => {
                    createFieldGroup(data.date, data.text);
                });
                updateWidgetValue();
            }
        });
    } else {
        // This error should ideally not appear anymore if JotformCustomWidget.min.js loads.
        console.error('JFCustomWidget is NOT defined when trying to getValue during DOMContentLoaded!'); // Critical error log
    }
    console.log('Widget initialization complete via DOMContentLoaded.'); // Debug log
});

// Keeping the general message listener for diagnostic purposes, but it's not crucial for initial setup
// This will log any other messages Jotform might be sending to the iframe.
window.addEventListener('message', function(e) {
    // console.log('General message received. Origin:', e.origin, 'Data:', e.data); // Uncomment if you want to see all messages
});
