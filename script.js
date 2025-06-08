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
    } else {
        console.error('JFCustomWidget is not defined in updateWidgetValue!');
    }
}

function requestResize() {
    const height = document.documentElement.scrollHeight;
    // Check if JFCustomWidget is defined before using it
    if (typeof JFCustomWidget !== 'undefined') {
        JFCustomWidget.requestFrameResize({ height: height + 80 });
    } else {
        console.error('JFCustomWidget is not defined in requestResize!');
    }
}

// Initial setup to run once Jotform is ready
// This is typically how Jotform expects widget initialization.
// We'll add a check for JFCustomWidget just in case, but it should be available.
window.addEventListener('message', function(e) {
    if (e.origin.startsWith('https://www.jotform.com') && e.data.type === 'widgetReady') {
        console.log('Jotform widgetReady message received.');
        // Initialize with one field group on load
        createFieldGroup();
        updateWidgetValue();

        addButton.onclick = function() {
            createFieldGroup();
            updateWidgetValue();
        };

        // Handle initial widget value if loaded from Jotform
        if (typeof JFCustomWidget !== 'undefined') {
            JFCustomWidget.getValue(function(value) {
                console.log('JFCustomWidget.getValue called. Value:', value);
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
            console.error('JFCustomWidget is not defined when trying to getValue.');
        }
    }
});
