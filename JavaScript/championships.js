if (isAuthenticated && isAdmin) {
    var editButton = document.getElementById("editButton");
    var addButton = document.getElementById("addButton")
    editButton.style.display = "block";
    addButton.style.display = "block";
}

document.addEventListener('DOMContentLoaded', async function () {
    const tableBody = document.getElementById('tbody_championships');
    const editButton = document.getElementById('editButton');
    let isEditing = false;

    const { data, error } = await _supabase
        .from('championships')
        .select('*');
    if (error) {
        document.getElementById("errorModalLabel").textContent = 'Error';
        console.error('Error fetching data:', error.message);
        openModal("Error fetching championship data!");
        return;
    } else {
        data.sort((a, b) => a.name.localeCompare(b.name));
        data.forEach((championship) => {
            const row = document.createElement('tr');

            const cell1 = document.createElement('td');
            const link = document.createElement('a');
            link.href = `championship.html?championshipId=${championship.id}`;
            link.textContent = championship.name;
            cell1.appendChild(link);
            const cell2 = document.createElement('td');
            cell2.textContent = championship.startDate;
            const cell3 = document.createElement('td');
            cell3.textContent = championship.endDate;
            const cell4 = document.createElement('td');
            cell4.textContent = championship.description;

            row.appendChild(cell1);
            row.appendChild(cell2);
            row.appendChild(cell3);
            row.appendChild(cell4);

            if (isAuthenticated && isAdmin) {
                // Remove button
                const removeButtonCell = document.createElement('td');
                const removeButton = document.createElement('button');
                removeButton.textContent = 'Remove';
                removeButton.className = 'btn btn-danger btn-sm';
                removeButton.onclick = function() {
                    removeRow(row.rowIndex-1);
                };
                removeButtonCell.appendChild(removeButton);
                row.appendChild(removeButtonCell);
                // Edit row button
                const editRowButtonCell = document.createElement('td');
                const editRowButton = document.createElement('button');
                editRowButton.textContent = 'Edit row';
                editRowButton.className = 'btn btn-warning btn-sm';
                editRowButton.onclick = function () {
                    editRow(row.rowIndex-1);
                };
                editRowButtonCell.appendChild(editRowButton);
                row.appendChild(editRowButtonCell);
            }

            tableBody.appendChild(row);
        });
    }

    const searchInput = document.getElementById('searchInput');
    searchInput.addEventListener('keyup', filterChampionshipsByName);

    editButton.addEventListener('click', function() {
        isEditing = !isEditing;
        toggleRemoveButtons(isAuthenticated, isEditing);
        toggleEditButtons(isAuthenticated, isEditing);
    });

    toggleRemoveButtons(isAuthenticated, isEditing);
    toggleEditButtons(isAuthenticated, isEditing);
});

function filterChampionshipsByName() {
    const input = document.getElementById('searchInput');
    const filter = input.value.toUpperCase();
    const tableBody = document.getElementById('tbody_championships');
    const rows = tableBody.getElementsByTagName('tr');

    for (let i = 0; i < rows.length; i++) {
        const championshipCell = rows[i].getElementsByTagName('td')[0];
        if (championshipCell) {
            const championshipName = championshipCell.textContent || championshipCell.innerText;
            if (championshipName.toUpperCase().indexOf(filter) > -1) {
                rows[i].style.display = "";
            } else {
                rows[i].style.display = "none";
            }
        }
    }
}

// Function to show the remove buttons after clicking on edit button
function toggleRemoveButtons(isAuthenticated, isEditing) {
    const removeButtons = document.querySelectorAll('.btn-danger');
    removeButtons.forEach(function (button) {
        button.style.display = isAuthenticated && isEditing ? 'block' : 'none';
    });
}

// Function to show the edit buttons after clicking on edit button
function toggleEditButtons(isAuthenticated, isEditing) {
    const editButtons = document.querySelectorAll('.btn-warning');
    editButtons.forEach(function (button) {
        button.style.display = isAuthenticated && isEditing ? 'block' : 'none';
    });
}

// Old name of championship
let oldName;

// Function to edit a row from the table
function editRow(rowIndex) {
    const tableBody = document.getElementById('tbody_championships');
    const editedRow = tableBody.rows[rowIndex];
    const cells = editedRow.cells;
    oldName = cells[0].textContent;
    console.log(oldName);

    for (let i = 0; i < cells.length - 2; i++) {
        const originalText = cells[i].textContent;
        const input = document.createElement('input');
        input.type = 'text';
        input.className = 'form-control';
        input.value = originalText;
        cells[i].textContent = '';
        cells[i].appendChild(input);
    }

    // Change the "Edit row" button to "Save Changes"
    const editButton = editedRow.querySelector('.btn-warning');
    editButton.textContent = 'Save Changes';
    editButton.onclick = function () {
        saveChanges(rowIndex);
    };
}

// Function to save changes made during row editing
function saveChanges(rowIndex) {
    const tableBody = document.getElementById('tbody_championships');
    const editedRow = tableBody.rows[rowIndex];
    const cells = editedRow.cells;

    const updatedValues = [];
    for (let i = 0; i < cells.length - 2; i++) { // -2 to skip the last two cells (buttons)
        const inputField = cells[i].querySelector('input');
        if (inputField) {
            updatedValues.push(inputField.value);
        } else {
            updatedValues.push(cells[i].textContent);
        }
    }

    updateValues(rowIndex, updatedValues);
}

// Function to update row value
async function updateValues(rowIndex, updatedValues) {
    console.log(updatedValues);
    const newName = updatedValues[0];

    try {
        const { data, error } = await _supabase
            .from('championships')
            .update({ name: newName, startDate: updatedValues[1], endDate: updatedValues[2], description: updatedValues[3] })
            .eq('name', oldName);
        if (error) {
            document.getElementById("errorModalLabel").textContent = 'Error';
            console.error('Error during updating data:', error.message);
            openModal('Error during updating data!');
        } else {
            document.getElementById("errorModalLabel").textContent = 'Success';
            console.log('Data updated successfully:', data);
            openModal('Data updated sucessfully!');
            disableRowEditing();

            setTimeout(() => {
                window.location.reload();
            }, 100);
        }
    } catch (error) {
        document.getElementById("errorModalLabel").textContent = 'Error';
        console.error('Error during updating data:', error.message);
        openModal('Error during updating data!');
    }
}

// Function to disable editing mode for the specific row
function disableRowEditing() {
    const tableBody = document.getElementById('tbody_championships');
    const inputFields = tableBody.querySelectorAll('input');
    inputFields.forEach(input => {
        const cell = input.parentElement;
        cell.textContent = input.value;
    });
    isEditing = false;
    toggleRemoveButtons(isAuthenticated, isEditing);
    toggleEditButtons(isAuthenticated, isEditing);
}

// Function to remove a row from the table
function removeRow(rowIndex) {
    const tableBody = document.getElementById('tbody_championships');
    const removedRow = tableBody.rows[rowIndex];
    const name = removedRow.cells[0].textContent;
    removeChampionship(name);
    tableBody.deleteRow(rowIndex);

    setTimeout(() => {
        window.location.reload();
    }, 100);
}

// Function to add a new row to the table
function addNewRow() {
    const tableBody = document.getElementById('tbody_championships');
    const newRow = document.createElement('tr');

    for (let i = 0; i < 4; i++) {
        const cell = document.createElement('td');
        const input = document.createElement('input');
        input.type = 'text';
        input.className = 'form-control';

        cell.appendChild(input);
        newRow.appendChild(cell);
    }

    const acceptButtonCell = document.createElement('td');
    const acceptButton = document.createElement('button');
    acceptButton.textContent = 'Accept';
    acceptButton.className = 'btn btn-primary btn-sm';
    acceptButton.onclick = function() {
        handleAcceptedValues(newRow);
    };
    acceptButtonCell.appendChild(acceptButton);
    newRow.appendChild(acceptButtonCell);
    tableBody.appendChild(newRow);
}

function handleAcceptedValues(newRow) {
    const values = Array.from(newRow.getElementsByTagName('input')).map(input => input.value);
    insertData(values);
}

async function insertData(insertData) {
    try {
        const { error } = await _supabase
            .from('championships')
            .insert({
                name: insertData[0],
                startDate: insertData[1],
                endDate: insertData[2],
                description: insertData[3] });
    } catch (error) {
        document.getElementById("errorModalLabel").textContent = 'Error';
        console.error('Error during inserting data:', error.message);
        openModal('Error during inserting data.');
    }
    document.getElementById("errorModalLabel").textContent = 'Success';
    openModal("Sucessfully added!");
    setTimeout(function() {
        window.location.reload();
    }, 1000);
}


async function removeChampionship(name) {
    try {
        const { data, error } = await _supabase
            .from('championships')
            .delete()
            .eq('name', name);
    } catch (error) {
        document.getElementById("errorModalLabel").textContent = 'Error';
        console.error('Error during deleting data:', error.message);
        openModal('Error during deleting data.');
    }
}