// Global variables
let fieldCounter = 0;
let fieldsContainer; // Will be assigned on successful initialization
let addButton;     // Will be assigned on successful initialization
let isWidgetInitialized = false; // Flag to ensure initialization only runs once

// Function to create a new field group (Date + Text)
function createFieldGroup(dateValue = '', textValue = '') {
    fieldCounter++;
    const fieldGroup = document.createElement('div');
    fieldGroup.className = 'field-group';
    fieldGroup.dataset.id = fieldCounter; // Store unique ID for removal and data mapping

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
        fieldGroup.remove(); // Remove the field group from the DOM
        updateWidgetValue(); // Update Jotform with new data
        requestResize();     // Request iframe resize
    };

    const dateField = fieldGroup.querySelector('.date-field');
    dateField.onchange = updateWidgetValue; // Update value on date change

    const textField = fieldGroup.querySelector('.text-field');
    textField.oninput = function() {
        updateWidgetValue(); // Update value on text input
        requestResize();     // Request resize as text area might grow
    };

    fieldsContainer.appendChild(fieldGroup); // Add new field group to the container
    requestResize(); // Request resize after adding a new field
    console.log('New field group added and resize requested.');
}

// Function to collect all data and send to Jotform
function updateWidgetValue() {
    const data = {};
    document.querySelectorAll('.field-group').forEach(group => {
        const id = group.dataset.id;
        const dateField = group.querySelector('.date-field');
        const textField = group.querySelector('.text-field');
        data[`date_${id}`] = dateField ? dateField.value : '';
        data[`text_${id}`] = textField ? textField.value : '';
    });
    // Only call JFCustomWidget methods if it's defined
    if (typeof JFCustomWidget !== 'undefined') {
        JFCustomWidget.setValue(data);
        console.log('Widget value updated.');
    } else {
        console.warn('JFCustomWidget is NOT defined in updateWidgetValue! (This should eventually stop appearing)');
    }
}

// Function to request iframe resize from Jotform
function requestResize() {
    const height = document.documentElement.scrollHeight;
    // Only call JFCustomWidget methods if it's defined
    if (typeof JFCustomWidget !== 'undefined') {
        // Adding a small buffer to height to avoid scrollbars
        JFCustomWidget.requestFrameResize({ height: height + 80 });
        console.log('Resize request sent. Height:', height + 80);
    } else {
        console.warn('JFCustomWidget is NOT defined in requestResize! (This should eventually stop appearing)');
    }
}


// *** THE CORE INITIALIZATION LOGIC - triggered when JFCustomWidget is ready ***
function initializeWidgetFunctionality() {
    if (isWidgetInitialized) {
        console.log('Widget already initialized. Skipping redundant initialization.');
        return;
    }
    isWidgetInitialized = true; // Set flag to prevent re-initialization

    console.log('JFCustomWidget is defined and ready. Starting core widget functionality.');

    // Assign DOM elements now that JFCustomWidget is confirmed to be ready
    fieldsContainer = document.getElementById('fields-container');
    addButton = document.querySelector('.add-button');

    if (!fieldsContainer || !addButton) {
        console.error('Error: fields-container or add-button not found in DOM. Initialization failed.');
        return;
    }

    // Attach click handler to the add button
    addButton.onclick = function() {
        console.log('Add button clicked!');
        createFieldGroup(); // This also calls updateWidgetValue and requestResize internally
    };
    console.log('Add button click handler attached.');

    // Get initial value from Jotform (if any saved data)
    JFCustomWidget.getValue(function(value) {
        console.log('JFCustomWidget.getValue called. Initial value:', value);
        if (value && Object.keys(value).length > 0) {
            fieldsContainer.innerHTML = ''; // Clear initial field if data is loaded
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
            // Only create one initial field if no existing data was loaded
            createFieldGroup();
        }
        updateWidgetValue(); // Ensure initial state is pushed to Jotform
    });

    console.log('Widget functionality fully set up.');
}


// *** MAIN ENTRY POINT: Listen for 'widgetReady' message or poll aggressively ***
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOMContentLoaded fired. Setting up JFCustomWidget listener/polling.');

    // Attempt 1: Listen for the 'widgetReady' message from Jotform
    window.addEventListener('message', function(e) {
        if (e.data.type === 'widgetReady') {
            console.log('Received widgetReady message from Jotform. Starting initialization.');
            // Give it a tiny moment just in case, then initialize
            setTimeout(initializeWidgetFunctionality, 10);
        }
        // console.log('General message received. Origin:', e.origin, 'Data:', e.data); // Uncomment for verbose message logging
    });

    // Attempt 2: Aggressive polling just in case 'widgetReady' isn't consistently sent
    // or if JFCustomWidget defines itself *after* the initial message.
    const checkJFCustomWidgetInterval = setInterval(function() {
        if (typeof JFCustomWidget !== 'undefined' && !isWidgetInitialized) {
            console.log('JFCustomWidget detected via polling. Starting initialization.');
            clearInterval(checkJFCustomWidgetInterval); // Stop polling
            initializeWidgetFunctionality(); // Start the main logic
        } else if (isWidgetInitialized) {
            clearInterval(checkJFCustomWidgetInterval); // Stop polling if already initialized
        }
    }, 50); // Check every 50 milliseconds
});
