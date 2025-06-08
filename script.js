// Global variables
let fieldCounter = 0;
let fieldsContainer; // Will be assigned on successful initialization
let addButton;     // Will be assigned on successful initialization

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
        console.log('Remove button clicked inside field group.');
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
    requestResize(); // Call resize immediately after adding to ensure correct height
    console.log('New field group added and resize requested.');
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
    // Only attempt to use JFCustomWidget if it's defined
    if (typeof JFCustomWidget !== 'undefined') {
        JFCustomWidget.setValue(data);
        console.log('Widget value updated.');
    } else {
        console.warn('JFCustomWidget is NOT defined when trying to update value. This might be a temporary race condition during initial load.');
    }
}

function requestResize() {
    const height = document.documentElement.scrollHeight;
    // Only attempt to use JFCustomWidget if it's defined
    if (typeof JFCustomWidget !== 'undefined') {
        JFCustomWidget.requestFrameResize({ height: height + 80 });
        console.log('Resize request sent. Height:', height + 80);
    } else {
        console.warn('JFCustomWidget is NOT defined when trying to resize. This might be a temporary race condition during initial load.');
    }
}

// *** THE CORE INITIALIZATION LOGIC (modified to be more robust) ***
function initializeWidget() {
    console.log('Attempting to initialize widget...');

    // Assign DOM elements - these should be available now due to script placement in body
    fieldsContainer = document.getElementById('fields-container');
    addButton = document.querySelector('.add-button');

    if (!fieldsContainer || !addButton) {
        console.error('Error: fields-container or add-button not found in DOM. Widget initialization failed.');
        return; // Exit if critical DOM elements are missing
    }

    // Attach click handler to the add button FIRST, as it's purely DOM-based
    addButton.onclick = function() {
        console.log('Add button clicked!');
        createFieldGroup(); // createFieldGroup calls updateWidgetValue and requestResize internally
    };
    console.log('Add button click handler attached.');

    // Now, wait for JFCustomWidget before doing anything that relies on it
    function waitForJFCustomWidget() {
        if (typeof JFCustomWidget !== 'undefined') {
            console.log('JFCustomWidget is defined. Proceeding with Jotform API calls.');

            // Initialize with one field group on load if no data exists
            JFCustomWidget.getValue(function(value) {
                console.log('JFCustomWidget.getValue called. Initial value:', value);
                if (value && Object.keys(value).length > 0) {
                    fieldsContainer.innerHTML = ''; // Clear the initial field if data is loaded
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
                } else {
                    // Only create initial field if no existing data was loaded
                    createFieldGroup();
                }
                updateWidgetValue(); // Ensure initial state is pushed to Jotform
            });

            console.log('Jotform API integration complete.');
        } else {
            console.warn('JFCustomWidget is not yet defined. Retrying Jotform API integration in 100ms...');
            setTimeout(waitForJFCustomWidget, 100); // Poll every 100ms
        }
    }

    // Start waiting for JFCustomWidget
    waitForJFCustomWidget();

    console.log('Widget DOM setup complete. Waiting for JFCustomWidget API.');
}


// Start the entire initialization process when the DOM is fully loaded.
// This ensures that 'fieldsContainer' and 'addButton' elements exist.
document.addEventListener('DOMContentLoaded', initializeWidget);

// General message listener (mostly for debugging other potential messages from Jotform)
window.addEventListener('message', function(e) {
    // console.log('General message received. Origin:', e.origin, 'Data:', e.data);
});
