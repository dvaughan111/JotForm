// Remove all console.logs for now to avoid clutter unless needed for specific debugging
// No DOMContentLoaded listener here. Jotform often initializes after this.
// JFCustomWidget should be available globally if Jotform injects it.

let fieldCounter = 0;
const fieldsContainer = document.getElementById('fields-container');
const addButton = document.querySelector('.add-button');

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
        console.error('JFCustomWidget is NOT defined in updateWidgetValue!'); // Critical error log
    }
}

function requestResize() {
    const height = document.documentElement.scrollHeight;
    // Check if JFCustomWidget is defined before using it
    if (typeof JFCustomWidget !== 'undefined') {
        JFCustomWidget.requestFrameResize({ height: height + 80 });
        console.log('Resize request sent. Height:', height + 80); // Debug log
    } else {
        console.error('JFCustomWidget is NOT defined in requestResize!'); // Critical error log
    }
}

// Event listener for messages from the parent frame (Jotform)
console.log('Adding message event listener.'); // Debug log
window.addEventListener('message', function(e) {
    console.log('Message received. Origin:', e.origin, 'Type:', e.data.type); // Debug log: Check ALL messages

    // ONLY proceed if the message is from Jotform AND indicates widget readiness
    if (e.origin.startsWith('https://www.jotform.com') && e.data.type === 'widgetReady') {
        console.log('Jotform widgetReady message received and processed!'); // Critical debug log

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
        if (typeof JFCustomWidget !== 'undefined') {
            JFCustomWidget.getValue(function(value) {
                console.log('JFCustomWidget.getValue called. Initial value:', value); // Debug log
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
        } else {
            console.error('JFCustomWidget is NOT defined when trying to getValue during initialization!'); // Critical error log
        }
        console.log('Widget initialization complete via widgetReady message.'); // Debug log
    }
});
