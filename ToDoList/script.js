// Select elements
const taskInput = document.getElementById("taskInput");
const addBtn = document.getElementById("addBtn");
const taskList = document.getElementById("taskList");

// Add Task
addBtn.addEventListener("click", function() {
    const taskText = taskInput.value.trim();
    if(taskText === "") return; // Don't add empty tasks

    // Create list item
    const li = document.createElement("li");
    li.textContent = taskText;

    // Add click to toggle completed
    li.addEventListener("click", function() {
        li.classList.toggle("completed");
    });

    // Create remove button
    const removeBtn = document.createElement("button");
    removeBtn.textContent = "Delete";
    removeBtn.className = "remove-btn";
    removeBtn.addEventListener("click", function(e) {
        e.stopPropagation(); // Prevent toggle completed when removing
        li.remove();
    });

    // Append button to list item
    li.appendChild(removeBtn);

    // Append list item to UL
    taskList.appendChild(li);

    // Clear input
    taskInput.value = "";
});
