document.addEventListener('DOMContentLoaded', async function () {
    const tableBody = document.getElementById('tbody-leaderboard');
    const editButton = document.getElementById('editLeaderboardButton');
    editButton.style.display = 'none';
    let isEditing = false;

    const { data, error } = await _supabase
        .from('profiles')
        .select(`
            uid,
            fullname,
            nationality,
            drivers!inner (
              car
            ),
            raceResults (
              points
            )
          `);
    if (error) {
        document.getElementById("errorModalLabel").textContent = 'Error';
        console.error('Error fetching data:', error.message);
        openModal('Error fetching data!');
        return;
    }

    // Sum points for each driver
    data.forEach(profile => {
        profile.totalPoints = profile.raceResults.reduce((acc, curr) => acc + curr.points, 0);
    });

    // Sort by points, then by name
    data.sort((a, b) => {
        if (b.totalPoints !== a.totalPoints) {
            return b.totalPoints - a.totalPoints;
        } else {
            return a.fullname.localeCompare(b.fullname);
        }
    });

    data.forEach((profile, index) => {
        const row = document.createElement('tr');

        const cell1 = document.createElement('td');
        cell1.textContent = index + 1;  // Position
        const cell2 = document.createElement('td');
        const link = document.createElement('a');
        link.href = `driver_profile.html?driverUid=${profile.uid}`;
        link.textContent = profile.fullname;
        cell2.appendChild(link);
        const cell3 = document.createElement('td');
        cell3.textContent = profile.nationality;
        const cell4 = document.createElement('td');
        cell4.textContent = profile.drivers.car;
        const cell5 = document.createElement('td');
        cell5.textContent = profile.totalPoints;

        row.appendChild(cell1);
        row.appendChild(cell2);
        row.appendChild(cell3);
        row.appendChild(cell4);
        row.appendChild(cell5);

        if (index === 0) { row.classList.add('gold_leaderboard') }
        if (index === 1) { row.classList.add('silver_leaderboard') }
        if (index === 2) { row.classList.add('bronze_leaderboard') }

        if (isAuthenticated && isAdmin) {
            // Edit row buttons
            const editRowButtonCell = document.createElement('td');
            const editRowButton = document.createElement('button');
            editRowButton.textContent = 'Edit row';
            editRowButton.className = 'btn btn-warning';
            editRowButton.style.padding = '0.375rem 0.75rem';
            editRowButton.style.fontSize = '1rem';
            editRowButton.style.display = 'none';
            editRowButton.onclick = function () {
                editRow(index);
            };
            editRowButtonCell.appendChild(editRowButton);
            row.appendChild(editRowButtonCell);
        }
        tableBody.appendChild(row);
    });

    const searchInput = document.getElementById('searchInput');
    searchInput.addEventListener('keyup', filterDriversByName);


    if (isAuthenticated && isAdmin) {
        editButton.style.display = 'block';
    }
    editButton.addEventListener('click', function () {
        isEditing = !isEditing;
        const isVisible = isEditing;
        toggleEditButtons(isAuthenticated, isEditing, isVisible);
    });
    toggleEditButtons(isAuthenticated, isEditing, false);
});

function filterDriversByName() {
    const input = document.getElementById('searchInput');
    const filter = input.value.toUpperCase();
    const tableBody = document.getElementById('tbody-leaderboard');
    const rows = tableBody.getElementsByTagName('tr');

    for (let i = 0; i < rows.length; i++) {
        const driverCell = rows[i].getElementsByTagName('td')[1];
        if (driverCell) {
            const driverName = driverCell.textContent || driverCell.innerText;
            if (driverName.toUpperCase().indexOf(filter) > -1) {
                rows[i].style.display = "";
            } else {
                rows[i].style.display = "none";
            }
        }
    }
}

// Modify the toggleEditButtons function
function toggleEditButtons(isAuthenticated, isEditing, isVisible) {
    const editButtons = document.querySelectorAll('.btn-warning');
    editButtons.forEach(function (button) {
        button.style.display = isAuthenticated && isEditing && isVisible ? 'block' : 'none';
    });
}

// Function to edit row in table
function editRow(rowIndex) {
    const tableBody = document.getElementById('tbody-leaderboard');
    const editedRow = tableBody.rows[rowIndex];

    // Check if the row is in edit mode
    const isInEditMode = editedRow.querySelector('.btn-warning').textContent === 'Save';

    if (isInEditMode) {
        // If in edit mode, get the inputs directly
        const inputs = editedRow.querySelectorAll('input');
        const originalValues = Array.from(inputs).map(input => input.value);

        // Skip the first and last cells which should not be editable (button)
        for (let i = 1; i < inputs.length - 2; i++) {
            const cell = editedRow.cells[i];
            cell.textContent = inputs[i].value;
        }

        // Change the "Save Changes" button back to "Edit row"
        const editButton = editedRow.querySelector('.btn-warning');
        editButton.textContent = 'Edit row';
        editButton.onclick = function () {
            editRow(rowIndex);
        };

    } else {
        // If not in edit mode, show inputs for editing
        const cells = editedRow.cells;
        const originalValues = Array.from(cells).map(cell => cell.textContent);

        // Skip the first and last cells which should not be editable
        for (let i = 1; i < cells.length - 2; i++) {
            // Check if the cell is editable
            if (isCellEditable(cells, i)) {
                const input = document.createElement('input');
                input.type = 'text';
                input.className = 'form-control';
                input.value = originalValues[i];
                cells[i].textContent = '';
                cells[i].appendChild(input);
            }
        }

        // Change the "Edit row" button to "Save Changes"
        const editButton = editedRow.querySelector('.btn-warning');
        editButton.textContent = 'Save';
        editButton.onclick = function () {
            saveChanges(rowIndex, originalValues);
        };
    }
}

// Function to check if a cell should be editable
function isCellEditable(cells, index) {
    const editRowButtonCellIndex = cells.length - 1;
    return index !== 0 && index !== editRowButtonCellIndex;
}

// Function to save changes
function saveChanges(rowIndex, originalValues) {
    const tableBody = document.getElementById('tbody-leaderboard');
    const editedRow = tableBody.rows[rowIndex];
    const inputFields = editedRow.querySelectorAll('input');

    // Check if all input values exist before updating
    if (areAllInputsValid(inputFields)) {
        const newValues = Array.from(inputFields).map(input => input.value);
        updateValues(newValues, originalValues);
    } else {
        document.getElementById("errorModalLabel").textContent = 'Error';
        console.error('Error: One or more input fields are null.');
        openModal('One or more input fields are null!');
    }
}

// Function to check if all input values are valid
function areAllInputsValid(inputFields) {
    return Array.from(inputFields).every(input => input && input.value !== undefined && input.value !== null);
}

// Function to save changes into supabase
async function updateValues(newValues, originalValues) {
    try {
        // Begin a transaction
        const { data: uidData, error: uidError } = await _supabase
            .from('profiles')
            .select('uid')
            .eq('fullname', originalValues[1])
            .single();
        if (uidError) throw uidError;

        // Use a transaction to perform both updates
        const { data: profileData, error: profileError } = await _supabase
            .from('profiles')
            .update({
                fullname: newValues[0],
                nationality: newValues[1]
            })
            .eq('uid', uidData.uid);
        if (profileError) throw profileError;

        const { data: driversData, error: driversError } = await _supabase
            .from('drivers')
            .update({
                car: newValues[2],
                points: newValues[3]
            })
            .eq('uid', uidData.uid);
        if (driversError) throw driversError;

        document.getElementById("errorModalLabel").textContent = 'Success';
        openModal('Data updated successfully!');
        disableRowEditing();
    } catch (error) {
        document.getElementById("errorModalLabel").textContent = 'Error';
        console.error('Error during updating data:', error.message);
        openModal('Error during updating data. Please try again.');
    }
}

// Function to disable editing mode for the specific row
function disableRowEditing() {
    const tableBody = document.getElementById('tbody-leaderboard');
    const inputFields = tableBody.querySelectorAll('input');
    inputFields.forEach(input => {
        const cell = input.parentElement;
        cell.textContent = input.value;
    });
    isEditing = false;
    toggleEditButtons(isAuthenticated, isEditing);
}