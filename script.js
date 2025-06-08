// Global variables
let fieldCounter = 0;
let fieldsContainer;
let addButton;
let widgetInitialized = false; // Flag to prevent multiple initializations

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
        console.error('JFCustomWidget is NOT defined in updateWidgetValue! (Still a problem)');
    }
}

function requestResize() {
    const height = document.documentElement.scrollHeight;
    if (typeof JFCustomWidget !== 'undefined') {
        JFCustomWidget.requestFrameResize({ height: height + 80 });
        console.log('Resize request sent. Height:', height + 80);
    } else {
        console.error('JFCustomWidget is NOT defined in requestResize! (Still a problem)');
    }
}

// *** REVISED INITIALIZATION STRATEGY ***
// Wait for any message from Jotform, then check for JFCustomWidget
console.log('script.js loaded. Listening for Jotform messages...');

window.addEventListener('message', function(e) {
    // Log all incoming messages to debug what Jotform is sending
    console.log('Message received from parent. Origin:', e.origin, 'Data:', e.data);

    // Only proceed if the message is from Jotform AND we haven't initialized yet
    if (e.origin.startsWith('https://www.jotform.com') && typeof JFCustomWidget !== 'undefined' && !widgetInitialized) {
        console.log('Jotform message received, JFCustomWidget is defined. Initializing widget.');
        widgetInitialized = true; // Set flag to prevent re-initialization

        // Get references to the DOM elements
        fieldsContainer = document.getElementById('fields-container');
        addButton = document.querySelector('.add-button');

        if (!fieldsContainer || !addButton) {
            console.error('Error: fields-container or add-button not found. Widget initialization failed.');
            return;
        }

        // Initialize with one field group on load
        createFieldGroup();
        updateWidgetValue();

        // Attach click handler to the add button
        addButton.onclick = function() {
            console.log('Add button clicked!');
            createFieldGroup();
            updateWidgetValue();
        };
        console.log('Add button click handler attached.');

        // Handle initial widget value if loaded from Jotform
        JFCustomWidget.getValue(function(value) {
            console.log('JFCustomWidget.getValue called. Initial value:', value);
            if (value && Object.keys(value).length > 0) {
                fieldsContainer.innerHTML = '';
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
        console.log('Widget fully initialized.');
    }
});

// Fallback: If no message is received or JFCustomWidget isn't defined through message,
// try a small delay after DOMContentLoaded to ensure elements are there.
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOMContentLoaded fired. Preparing for potential fallback initialization.');
    // If widget hasn't been initialized by message listener within a short time, try initializing
    // This provides a safety net if the message listener somehow misses the event or JFCustomWidget isn't ready immediately after the message.
    setTimeout(function() {
        if (!widgetInitialized && typeof JFCustomWidget !== 'undefined') {
            console.warn('Fallback initialization: JFCustomWidget defined but no message-based init occurred. Proceeding with DOMContentLoaded fallback.');
            // Re-run the initialization logic. This part is a bit redundant but acts as a robust fallback.
            // In a production app, you'd refactor initialization into a single callable function.
            fieldsContainer = document.getElementById('fields-container');
            addButton = document.querySelector('.add-button');

            if (!fieldsContainer || !addButton) {
                console.error('Fallback Error: fields-container or add-button not found.');
                return;
            }
            createFieldGroup();
            updateWidgetValue();
            addButton.onclick = function() {
                console.log('Add button clicked! (Fallback Init)');
                createFieldGroup();
                updateWidgetValue();
            };
            JFCustomWidget.getValue(function(value) {
                if (value && Object.keys(value).length > 0) {
                    fieldsContainer.innerHTML = '';
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
            console.log('Widget fallback initialization complete.');
            widgetInitialized = true; // Mark as initialized
        } else if (!widgetInitialized) {
             console.log('Fallback not triggered: JFCustomWidget still undefined or widget already initialized.');
        }
    }, 500); // Give Jotform some time (0.5 seconds) after DOMContentLoaded
});
