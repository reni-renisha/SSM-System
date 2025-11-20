// Validation utilities for student form
// Revenue district constraint removed: accept any non-empty string
// const DISTRICTS = [ /* Removed */ ];

export const isText = (v, max = 100) => typeof v === 'string' && v.trim().length > 0 && v.trim().length <= max && /^[A-Za-z\s.'-]+$/.test(v);
export const isOptionalText = (v, max = 100) => !v || (typeof v === 'string' && v.trim().length <= max && /^[A-Za-z\s.'-]*$/.test(v));
export const isNumeric = (v) => /^\d+$/.test(String(v));
export const validateName = (v) => !!v && isText(v, 100);
export const validateAge = (v) => { const n = parseInt(v, 10); return !Number.isNaN(n) && n > 0 && n < 150; };
export const validateGender = (v) => ['Male','Female','Other'].includes(v);
export const validatePin = (v) => /^\d{6}$/.test(String(v));
export const validateDistrict = (v) => !!v && typeof v === 'string' && v.trim().length > 0;
export const validatePhone = (v) => /^[6-9]\d{9}$/.test(String(v));
export const validateEmail = (v) => !v || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(v));
export const validateAadhaar = (v) => /^[2-9]\d{11}$/.test(String(v));
export const formatAadhaar = (raw) => {
  const digits = String(raw || '').replace(/\D/g, '').slice(0,12);
  return digits.replace(/(\d{4})(?=\d)/g, '$1 ').trim();
};
export const cleanAadhaar = (formatted) => String(formatted || '').replace(/\s+/g, '');
export const validateDatePast = (v) => {
  if (!v) return false;
  const d = new Date(v);
  if (isNaN(d.getTime())) return false;
  const today = new Date();
  today.setHours(0,0,0,0);
  return d < today;
};
export const validateDateNotFuture = (v) => {
  if (!v) return false;
  const d = new Date(v);
  if (isNaN(d.getTime())) return false;
  const today = new Date();
  today.setHours(0,0,0,0);
  return d <= today;
};
export const validateAdmissionNumber = (v) => /^[A-Za-z0-9]{1,20}$/.test(String(v));
export const validateRollNo = (v) => /^[0-9]+$/.test(String(v));
export const validateAcademicYear = (v) => {
  if (!/^\d{4}-\d{4}$/.test(String(v))) return false;
  const [a,b] = String(v).split('-').map(x=>parseInt(x,10));
  return b - a === 1;
};
export const validateDivision = (v) => !v || (/^[A-Za-z]$/.test(String(v)));
export const validateDisabilityPercentage = (v) => v === '' || (Number(v) >= 0 && Number(v) <= 100);
export const validateAccountNumber = (v) => !v || /^\d{9,18}$/.test(String(v));
export const validateIFSC = (v) => /^[A-Z]{4}0\d{6}$/.test(String(v));
export const validateIdentificationMarks = (v) => !v || /^[A-Za-z0-9\s,.'-]{0,200}$/.test(String(v));
export const validateFilePDF = (file) => {
  if (!file) return { ok: true };
  const max = 5 * 1024 * 1024;
  const isPdf = file.type === 'application/pdf' || (file.name && file.name.toLowerCase().endsWith('.pdf'));
  if (!isPdf) return { ok: false, error: 'File must be a PDF' };
  if (file.size > max) return { ok: false, error: 'File exceeds 5 MB' };
  return { ok: true };
};

// --- Teacher-specific validators ---
export const validateRCINumber = (v) => /^[A-Za-z0-9]{1,20}$/.test(String(v));
export const validateDateTodayOrFuture = (v) => {
  if (!v) return false;
  const d = new Date(v);
  if (isNaN(d.getTime())) return false;
  const today = new Date();
  today.setHours(0,0,0,0);
  return d >= today;
};
export const validateQualifications = (v) => !!v && typeof v === 'string' && v.trim().length > 0 && v.trim().length <= 200;
export const validateCategory = (v) => ['General','OBC','SC','ST','SC/ST','Other'].includes(String(v));
export const validateBloodGroup = (v) => ['A+','A-','B+','B-','AB+','AB-','O+','O-'].includes(String(v));
export const validateTime = (v) => /^([01]\d|2[0-3]):([0-5]\d)$/.test(String(v));

export function validateClassAssignment(assignment) {
  const errors = {};
  if (!assignment.class) errors.class = 'Select class.';
  if (!assignment.subject || !/^[A-Za-z\s.'-]{1,50}$/.test(String(assignment.subject))) errors.subject = 'Subject is required, text only, max 50 chars.';
  if (!assignment.days || !Array.isArray(assignment.days) || assignment.days.length === 0) errors.days = 'Select at least one day.';
  if (!validateTime(assignment.startTime)) errors.startTime = 'Start time is required and must be HH:MM.';
  if (!validateTime(assignment.endTime)) errors.endTime = 'End time is required and must be HH:MM.';
  if (validateTime(assignment.startTime) && validateTime(assignment.endTime)) {
    const [sh, sm] = assignment.startTime.split(':').map(Number);
    const [eh, em] = assignment.endTime.split(':').map(Number);
    const s = sh * 60 + sm;
    const e = eh * 60 + em;
    if (!(e > s)) errors.timeRange = 'End time must be after start time.';
  }
  return errors;
}

export function validateTeacher(form, classAssignments) {
  const errors = {};
  if (!validateName(form.name)) errors.name = 'Teacher name is required, text only, max 100 chars.';
  if (!form.address || typeof form.address !== 'string' || form.address.trim().length === 0 || form.address.trim().length > 200) errors.address = 'Address is required, max 200 chars.';
  if (!validateDatePast(form.date_of_birth)) errors.date_of_birth = 'Date of birth must be a valid past date.';
  if (!validateGender(form.gender)) errors.gender = 'Select a valid gender.';
  if (!validateBloodGroup(form.blood_group)) errors.blood_group = 'Select a valid blood group.';
  if (!validatePhone(form.mobile_number)) errors.mobile_number = 'Mobile must be 10 digits and start with 6-9.';
  if (!validateEmail(form.email)) errors.email = 'A valid email is required.';
  if (!validateAadhaar(cleanAadhaar(form.aadhar_number))) errors.aadhar_number = 'Aadhaar must be 12 digits and start with 2-9.';
  if (!validateRCINumber(form.rci_number)) errors.rci_number = 'RCI number is required, alphanumeric, max 20 chars.';
  if (!validateDateTodayOrFuture(form.rci_renewal_date)) errors.rci_renewal_date = 'RCI renewal date must be today or in the future.';
  if (!validateQualifications(form.qualifications_details)) errors.qualifications_details = 'Qualifications are required, max 200 chars.';
  if (!validateCategory(form.category)) errors.category = 'Select a valid category.';

  // Validate class assignments
  const assignmentErrors = [];
  for (let i = 0; i < classAssignments.length; i++) {
    const aErr = validateClassAssignment(classAssignments[i]);
    assignmentErrors.push(aErr);
  }

  const valid = Object.keys(errors).length === 0 && assignmentErrors.every(a => Object.keys(a).length === 0);
  return { valid, errors, assignmentErrors };
}

export function validateStudent(form) {
  const errors = {};
  if (!validateName(form.name)) errors.name = 'Name is required, text only, max 100 chars.';
  if (!validateAge(form.age)) errors.age = 'Age is required and must be a valid number.';
  if (!validateGender(form.gender)) errors.gender = 'Select a valid gender.';
  if (!validatePin(form.pin_code)) errors.pin_code = 'Pin Code must be exactly 6 digits.';
  if (!validateDistrict(form.revenue_district)) errors.revenue_district = 'Revenue district must be a non-empty string.';
  if (!validatePhone(form.phone_number)) errors.phone_number = 'Phone must be 10 digits and start with 6-9.';
  if (!validateEmail(form.email)) errors.email = 'Invalid email address.';
  if (!validateAadhaar(cleanAadhaar(form.aadhar_number))) errors.aadhar_number = 'Aadhaar must be 12 digits and start with 2-9.';
  if (!validateDatePast(form.dob)) errors.dob = 'Date of birth must be a valid past date.';
  if (!validateDateNotFuture(form.admission_date)) errors.admission_date = 'Admission date cannot be in the future.';
  if (!validateAdmissionNumber(form.admission_number)) errors.admission_number = 'Admission number must be alphanumeric, max 20 chars.';
  if (!isOptionalText(form.father_name, 100)) errors.father_name = 'Father\'s name must be text, max 100 chars.';
  if (!isOptionalText(form.mother_name, 100)) errors.mother_name = 'Mother\'s name must be text, max 100 chars.';
  if (!form.class_name) errors.class_name = 'Select class.';
  if (!validateRollNo(form.roll_no)) errors.roll_no = 'Roll number must be numeric.';
  if (!validateAcademicYear(form.academic_year)) errors.academic_year = 'Academic year must be in format YYYY-YYYY and consecutive years.';
  if (!isOptionalText(form.class_teacher, 100)) errors.class_teacher = 'Class teacher name must be text, max 100 chars.';
  if (!validateDivision(form.division)) errors.division = 'Division must be a single letter.';
  if (!validateDisabilityPercentage(form.disability_percentage)) errors.disability_percentage = 'Percentage must be between 0 and 100.';
  if (!validateAccountNumber(form.account_number)) errors.account_number = 'Account number must be 9-18 digits.';
  if (!isOptionalText(form.bank_name, 100)) errors.bank_name = 'Bank name must be text, max 100 chars.';
  if (!isOptionalText(form.branch, 100)) errors.branch = 'Branch must be text, max 100 chars.';
  if (!validateIFSC(form.ifsc_code)) errors.ifsc_code = 'IFSC must be 11 chars: 4 letters + 0 + 6 digits.';
  if (!validateIdentificationMarks(form.identification_marks)) errors.identification_marks = 'Identification marks must be text, max 200 chars.';

  return { valid: Object.keys(errors).length === 0, errors };
}

export default {
  validateStudent,
  formatAadhaar,
  cleanAadhaar,
  validateTeacher,
  validateClassAssignment,
  validateRCINumber,
  validateDateTodayOrFuture,
  validateQualifications,
  validateCategory,
  validateBloodGroup,
  validateTime,
};
