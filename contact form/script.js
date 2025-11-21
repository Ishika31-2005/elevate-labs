const form = document.getElementById('contactForm');
const nameInput = document.getElementById('name');
const emailInput = document.getElementById('email');
const messageInput = document.getElementById('message');

const nameError = document.getElementById('nameError');
const emailError = document.getElementById('emailError');
const messageError = document.getElementById('messageError');

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function showError(input, errorElement, message) {
  input.classList.add("input-error");
  errorElement.textContent = message;
  errorElement.style.display = "block";
}

function clearError(input, errorElement) {
  input.classList.remove("input-error");
  errorElement.textContent = "";
  errorElement.style.display = "none";
}

function validate() {
  let valid = true;

  if (nameInput.value.trim() === "") {
    showError(nameInput, nameError, "Name is required.");
    valid = false;
  } else {
    clearError(nameInput, nameError);
  }

  if (emailInput.value.trim() === "") {
    showError(emailInput, emailError, "Email is required.");
    valid = false;
  } else if (!emailRegex.test(emailInput.value.trim())) {
    showError(emailInput, emailError, "Enter a valid email.");
    valid = false;
  } else {
    clearError(emailInput, emailError);
  }

  if (messageInput.value.trim() === "") {
    showError(messageInput, messageError, "Message is required.");
    valid = false;
  } else if (messageInput.value.trim().length < 10) {
    showError(messageInput, messageError, "Message must be at least 10 characters.");
    valid = false;
  } else {
    clearError(messageInput, messageError);
  }

  return valid;
}

form.addEventListener("submit", function (e) {
  e.preventDefault();

  if (validate()) {
    alert("Form submitted successfully!");
  }
});
