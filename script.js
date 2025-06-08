// Global variables
let fieldCounter = 0;
let fieldsContainer;
let addButton;

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
    requestResize();
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
    if (typeof JFCustomWidget !== 'undefined') {
        JFCustomWidget.setValue(data);
        console.log('Widget value updated.');
    } else {
        console.warn('JFCustomWidget is NOT defined in updateWidgetValue! (Race condition warning)');
    }
}

function requestResize() {
    const height = document.documentElement.scrollHeight;
    if (typeof JFCustomWidget !== 'undefined') {
        JFCustomWidget.requestFrameResize({ height: height + 80 });
        console.log('Resize request sent. Height:', height + 80);
    } else {
        console.warn('JFCustomWidget is NOT defined in requestResize! (Race condition warning)');
    }
}

// *** CRITICAL CHANGE: Refined Initialization Logic ***
function startWidgetFunctionality() {
    console.log('JFCustomWidget is now defined. Starting core widget functionality.');

    // Assign DOM elements now that JFCustomWidget is confirmed to be ready
    fieldsContainer = document.getElementById('fields-container');
    addButton = document.querySelector('.add-button');

    if (!fieldsContainer || !addButton) {
        console.error('Error: fields-container or add-button not found in DOM during JFCustomWidget ready phase. Initialization failed.');
        return;
    }

    // Initialize with one field group on load if no data exists
    // Get initial value from Jotform
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
            // Only create initial field if no existing data was loaded
            createFieldGroup();
        }
        updateWidgetValue(); // Ensure initial state is pushed to Jotform
    });

    // Attach click handler to the add button
    addButton.onclick = function() {
        console.log('Add button clicked!');
        createFieldGroup(); // createFieldGroup calls updateWidgetValue and requestResize internally
    };
    console.log('Add button click handler attached.');

    console.log('Widget functionality fully set up.');
}

// *** NEW: Initial DOM setup and then wait for JFCustomWidget ***
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOMContentLoaded fired. Preparing widget for JFCustomWidget.');

    // Poll for JFCustomWidget every 50ms
    const checkJFCustomWidgetInterval = setInterval(function() {
        if (typeof JFCustomWidget !== 'undefined') {
            clearInterval(checkJFCustomWidgetInterval); // Stop polling
            startWidgetFunctionality(); // Start the main logic
        } else {
            console.warn('JFCustomWidget is not yet defined. Polling...');
        }
    }, 50); // Check every 50 milliseconds
});

// General message listener (for debugging other potential messages from Jotform)
window.addEventListener('message', function(e) {
    // console.log('General message received. Origin:', e.origin, 'Data:', e.data);
});
