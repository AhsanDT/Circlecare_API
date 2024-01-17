const validateEmail = (email) => {
  return String(email)
    .toLowerCase()
    .match(
      /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|.(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
    );
};

function generateOTP() {
  const digits = "0123456789";
  let otp = "";

  for (let i = 0; i < 6; i++) {
    const randomIndex = Math.floor(Math.random() * digits.length);
    otp += digits[randomIndex];
  }

  return otp;
}

function addMinutesToTime(time, minutesToAdd) {
  const millisecondsPerMinute = 60000; // 1 minute = 60,000 milliseconds
  const timeInMilliseconds = new Date(time).getTime(); // Convert time to milliseconds
  const newTimeInMilliseconds = timeInMilliseconds + minutesToAdd * millisecondsPerMinute; // Add minutes in milliseconds
  const newTime = new Date(newTimeInMilliseconds); // Convert back to Date object
  const isoString = newTime.toISOString(); // Convert to ISO string

  return isoString;
}

function validatePassword(password) {
  // Check if password is at least 6 characters long
  if (password.length < 6) {
    return false;
  }

  // Check if password contains at least one capital letter
  if (!/[A-Z]/.test(password)) {
    return false;
  }

  // Check if password contains at least one special character
  if (!/[\W_]/.test(password)) {
    return false;
  }

  // Password meets all requirements
  return true;
}

function validateOTP(otp) {
  if (String(otp).length != 6 || isNaN(otp)) {
    return false;
  }
  return true;
}

function validateDate(dateString) {
  // Regular expression pattern for the format "DD-MM-YYYY"
  var pattern = /^(0[1-9]|[1-2]\d|3[0-1])-(0[1-9]|1[0-2])-(\d{4})$/;

  // Check if the date string matches the pattern
  if (!pattern.test(dateString)) {
    return false;
  }

  // Extract day, month, and year from the date string
  var parts = dateString.split("-");
  var day = parseInt(parts[0], 10);
  var month = parseInt(parts[1], 10);
  var year = parseInt(parts[2], 10);

  // Check if the day, month, and year are valid
  if (year < 1000 || year > 9999 || month === 0 || month > 12) {
    return false;
  }

  // Check if the day is valid for the given month and year
  var daysInMonth = new Date(year, month, 0).getDate();
  if (day === 0 || day > daysInMonth) {
    return false;
  }

  // The date is valid
  return true;
}

function validateTime(timeString) {
  // Regular expression pattern for the format "hh:mmAM" or "hh:mmPM"
  var pattern = /^(0?[1-9]|1[0-2]):[0-5][0-9](AM|PM)$/i;

  // Check if the time string matches the pattern
  if (!pattern.test(timeString)) {
    return false;
  }

  // Split the time string to extract hours, minutes, and AM/PM
  var [time, meridiem] = timeString.split(/(?=AM|PM)/i);
  var [hours, minutes] = time.split(":");

  // Convert hours to a number
  hours = parseInt(hours, 10);

  // Check if the hours and minutes are valid
  if (hours < 1 || hours > 12 || parseInt(minutes, 10) < 0 || parseInt(minutes, 10) > 59) {
    return false;
  }

  // The time is valid
  return true;
}

function isValidURL(urlString) {
  // Regular expression pattern for URL validation
  var pattern = /^(https?:\/\/)?([\da-z.-]+)\.([a-z.]{2,6})([/\w .-]*)*\/?$/i;

  // Check if the URL string matches the pattern
  if (!pattern.test(urlString)) {
    return false;
  }

  // The URL is valid
  return true;
}

function validateDateOfBirth(dateString) {
  // Validate the date format
  if (!validateDate(dateString)) {
    return false;
  }

  // Extract day, month, and year from the date string
  var parts = dateString.split("-");
  var day = parseInt(parts[0], 10);
  var month = parseInt(parts[1], 10);
  var year = parseInt(parts[2], 10);

  // Check if the date is within the range of allowed dates
  var today = new Date();
  var minDate = new Date(today.getFullYear() - 100, today.getMonth(), today.getDate()); // Minimum age of 100 years
  var maxDate = new Date(today.getFullYear() - 1, today.getMonth(), today.getDate()); // Maximum age of 18 years

  var dateOfBirth = new Date(year, month - 1, day); // Month is zero-based in JavaScript's Date object

  if (dateOfBirth < minDate || dateOfBirth > maxDate) {
    return false;
  }

  // The date of birth is valid
  return true;
}

function getAge(dateOfBirth) {
  const today = new Date();
  const [day, month, year] = dateOfBirth.split("-");

  const birthDate = new Date(`${year}-${month}-${day}`);

  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();

  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }

  return age;
}

const bcrypt = require("bcrypt");
async function existingLastPasswords(passwords, password) {
  const last_passwords = passwords.slice(-5);
  let is_exists = false;

  for (let index = 0; index < last_passwords.length; index++) {
    const isMatch = await bcrypt.compare(password, last_passwords[index]);
    if (isMatch) {
      is_exists = true;
      break;
    }
  }

  return is_exists;
}

const nodemailer = require("nodemailer");

// Create a reusable transporter object using the default SMTP transport
const transporter = nodemailer.createTransport({
  service: "Gmail",
  auth: {
    user: "noreply.ntamgroup@gmail.com", // Your Gmail email address
    pass: "xkci eymi xdxj ngsh", // Your Gmail password or an application-specific password
  },
});

// Function to send an email
function sendEmail({ to, subject, text, html }) {
  const mailOptions = {
    from: "noreply.ntamgroup@gmail.com", // Sender email address
    to: to, // Recipient email address
    subject: subject, // Email subject
    text: text, // Plain text body
    html: html, // HTML body (optional)
  };

  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      console.error("Error sending email:", error);
    } else {
      console.log("Email sent:", info.response);
    }
  });
}

module.exports = {
  validateEmail,
  generateOTP,
  addMinutesToTime,
  validatePassword,
  validateOTP,
  validateDate,
  validateDateOfBirth,
  existingLastPasswords,
  getAge,
  validateTime,
  isValidURL,
  sendEmail,
};
