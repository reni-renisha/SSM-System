

import React, { useState, useEffect, useRef } from "react";
import { jsPDF } from "jspdf";
import { useParams } from "react-router-dom";
import axios from "axios";
const DynamicScrollButtons = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [isScrollingUp, setIsScrollingUp] = useState(false);
  const lastScrollY = useRef(0);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;

      // 1. Define "dead zones" at the top and bottom of the page
      const topThreshold = 200;
      const bottomOffset = 200;
      
      const isNearBottom = window.innerHeight + currentScrollY >= document.documentElement.offsetHeight - bottomOffset;

      // 2. Set visibility: only show buttons if we are outside the dead zones
      if (currentScrollY > topThreshold && !isNearBottom) {
        setIsVisible(true);
      } else {
        setIsVisible(false);
      }

      // 3. Determine scroll direction
      if (currentScrollY > lastScrollY.current) {
        setIsScrollingUp(false); // User is scrolling DOWN
      } else {
        setIsScrollingUp(true);  // User is scrolling UP
      }

      // 4. Update the last scroll position for the next event
      lastScrollY.current = currentScrollY;
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll(); // Run on initial mount

    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const scrollToBottom = () => {
    window.scrollTo({ top: document.documentElement.scrollHeight, behavior: "smooth" });
  };

  return (
    <div className={`fixed z-50 bottom-8 right-8 flex flex-col gap-3 transition-opacity duration-300 ${
        isVisible ? 'opacity-100' : 'opacity-0 pointer-events-none'
      }`}
    >
      {isScrollingUp ? (
        // Show Scroll to Top Button when scrolling UP
        <button
          onClick={scrollToTop}
          title="Back to Top"
          className="w-12 h-12 flex items-center justify-center rounded-full bg-[#E38B52] text-white shadow-lg transition-transform duration-300 hover:scale-110 hover:bg-[#C8742F] focus:outline-none"
          aria-label="Back to Top"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" />
          </svg>
        </button>
      ) : (
        // Show Scroll to Bottom Button when scrolling DOWN
        <button
          onClick={scrollToBottom}
          title="Scroll to Bottom"
          className="w-12 h-12 flex items-center justify-center rounded-full bg-[#E38B52] text-white shadow-lg transition-transform duration-300 hover:scale-110 hover:bg-[#C8742F] focus:outline-none"
          aria-label="Scroll to Bottom"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </button>
      )}
    </div>
  );
};

const StudentPage = () => {
  const [activeTab, setActiveTab] = useState("student-details");
  const { id } = useParams();
  const [student, setStudent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [reports, setReports] = useState([]);
  const [reportsLoading, setReportsLoading] = useState(false);
  const [visibleCount, setVisibleCount] = useState(5); // show latest 5 by default
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [editMode, setEditMode] = useState(false);
  const [editData, setEditData] = useState(null);
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const fileInputRef = useRef(null);
  const caseRecordCompletion = React.useMemo(() => {
    if (!student) return 0;

    // Define the key fields that constitute a "complete" case record
    const fieldsToCheck = [
      student.bloodGroup,
      student.category,
      student.informantName,
      student.presentComplaints,
      student.previousTreatments,
      student.totalFamilyIncome,
      student.household?.length > 0, // Check if there are any household members
      Object.keys(student.familyHistory || {}).length > 0, // Check for any family history
      Object.keys(student.birthHistory || {}).length > 0,
      Object.keys(student.developmentHistory || {}).length > 0,
      Object.keys(student.assessment || {}).length > 0,
    ];

    const completedFields = fieldsToCheck.filter(field => {
      if (typeof field === 'boolean') return field === true;
      return field; // This checks for non-empty strings, non-zero numbers, etc.
    }).length;

    const totalFields = fieldsToCheck.length;
    if (totalFields === 0) return 100;

    const percentage = Math.round((completedFields / totalFields) * 100);
    return percentage;
  }, [student]); // This calculation re-runs only when the 'student' object changes


  // Start editing: initialize editData
const handleEditStart = () => {
  setEditMode(true);
};



  // Handle input change in edit mode
  const handleEditChange = (e) => {
  const { name, value } = e.target;
  // Prevent editing studentId
  if (name === "studentId") return;
  setEditData((prev) => ({ ...prev, [name]: value }));
  };

  // Cancel editing
 const handleEditCancel = () => {
  // Remove non-editable fields from student state for editData
  if (!student) return;
  // Only include editable fields
  const {
    studentId, photoUrl, address, // non-editable
    ...editableFields
  } = student;
  setEditData(editableFields);
  setEditMode(false);
};

  // Save changes
const handleEditSave = async () => {
  try {
    const baseUrl = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8000';
    
    // This payload correctly maps your form state to what the API expects
    const payload = {
      name: editData.name,
      age: editData.age,
      dob: editData.dob,
      gender: editData.gender,
      religion: editData.religion,
      caste: editData.caste,
      class_name: editData.class,
      roll_no: editData.rollNo,
      birth_place: editData.birthPlace,
      house_name: editData.houseName,
      street_name: editData.streetName,
      post_office: editData.postOffice,
      pin_code: editData.pinCode,
      revenue_district: editData.revenueDistrict,
      block_panchayat: editData.blockPanchayat,
      local_body: editData.localBody,
      taluk: editData.taluk,
      phone_number: editData.phoneNumber,
      email: editData.email,
      father_name: editData.fatherName,
      father_education: editData.fatherEducation,
      father_occupation: editData.fatherOccupation,
      mother_name: editData.motherName,
      mother_education: editData.motherEducation,
      mother_occupation: editData.motherOccupation,
      guardian_name: editData.guardianName,
      guardian_relationship: editData.guardianRelationship,
      guardian_contact: editData.guardianContact,
      academic_year: editData.academicYear,
      admission_number: editData.admissionNumber,
      admission_date: editData.admissionDate,
      class_teacher: editData.classTeacher,
      bank_name: editData.bankName,
      account_number: editData.accountNumber,
      branch: editData.branch,
      ifsc_code: editData.ifscCode,
      blood_group: editData.bloodGroup,
      category: editData.category

    };
    // If photoFile is set, upload photo first, then update details
    if (photoFile) {
      const formData = new FormData();
      formData.append("file", photoFile);
      try {
        const res = await axios.post(`${baseUrl}/api/v1/students/${id}/photo`, formData);
        const returned = res.data;
        console.debug('Photo upload (during save) response:', returned);
        const returnedPhoto = returned?.photo_url || returned?.photoUrl || null;
        if (returnedPhoto) {
          // set both conventions so other components can read either
          setStudent(prev => ({ ...(prev || {}), photoUrl: returnedPhoto, photo_url: returnedPhoto }));
        } else {
          console.warn('Photo upload returned no photo_url/photoUrl during save:', returned);
        }
        // clear file input and revoke preview
        try { if (fileInputRef && fileInputRef.current) fileInputRef.current.value = null; } catch (err) {}
        if (photoPreview) {
          try { URL.revokeObjectURL(photoPreview); } catch (err) {}
        }
      } catch (err) {
        console.warn('Photo upload during save failed', err);
      } finally {
        setPhotoFile(null);
        setPhotoPreview(null);
      }
    }
    const putRes = await axios.put(`${baseUrl}/api/v1/students/${id}`, payload);
    const putData = putRes?.data;
    // If backend returned updated student with photo, update UI immediately
    if (putData) {
      const pdPhoto = putData.photo_url || putData.photoUrl || null;
      if (pdPhoto) {
        setStudent(prev => ({ ...(prev || {}), photoUrl: pdPhoto, photo_url: pdPhoto }));
      }
    }

    // Refresh the data cleanly (best-effort) and exit edit mode
    try { await fetchStudent(); } catch (err) { console.warn('Could not refresh after save', err); }
    setEditMode(false);

  } catch (e) {
    console.error("Failed to save changes:", e);
    alert("Could not save changes. Please try again.");
  }
};
  const handlePhotoChange = (e) => {
  const file = e.target.files[0];
  if (file) {
      // Revoke previous preview to avoid leaking object URLs
      if (photoPreview) {
        try { URL.revokeObjectURL(photoPreview); } catch (err) { /* ignore */ }
      }
      setPhotoFile(file);
      const tmpUrl = URL.createObjectURL(file);
      setPhotoPreview(tmpUrl); // Creates a temporary preview URL
  }
};

const handlePhotoUpload = async () => {
  if (!photoFile) return;

  const formData = new FormData();
  formData.append("file", photoFile);

  try {
    const baseUrl = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8000';
      // Use the returned student object from the upload endpoint to immediately update UI
      const res = await axios.post(`${baseUrl}/api/v1/students/${id}/photo`, formData);
      const returned = res.data;
      console.debug('Photo upload response:', returned);
      const returnedPhotoStandalone = returned?.photo_url || returned?.photoUrl || null;
      if (returnedPhotoStandalone) {
        setStudent(prev => ({ ...(prev || {}), photoUrl: returnedPhotoStandalone, photo_url: returnedPhotoStandalone }));
      } else {
        console.warn('Photo uploaded but server did not return photo_url/photoUrl:', returned);
      }

      // Clear the file input element so the same file can be selected again later
      try { if (fileInputRef && fileInputRef.current) fileInputRef.current.value = null; } catch (err) { /* ignore */ }

      alert("Photo uploaded successfully!");

      // Clean up preview and file state
      if (photoPreview) {
        try { URL.revokeObjectURL(photoPreview); } catch (err) { /* ignore */ }
      }
      setPhotoFile(null);
      setPhotoPreview(null);

      // Try to refresh the full student record in the background; if it fails, we already have the photo
      try { await fetchStudent(); } catch (err) { console.warn('Could not refresh student after photo upload', err); }
  } catch (error) {
    console.error("Error uploading photo:", error);
    alert("Failed to upload photo.");
  }
};

// In StudentPage.js -> fetchStudent()

const fetchStudent = async () => {
    try {
        setLoading(true);
        const baseUrl = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8000';
  const { data } = await axios.get(`${baseUrl}/api/v1/students/${id}`);
  console.debug('fetchStudent: raw API response for student', data);

        // --- REPLACE your old mapping object with this new one ---
        const mappedForDisplay = {
            // == Core & Academic ==
            name: data.name,
            age: data.age,
            studentId: data.student_id,
            dob: data.dob,
            gender: data.gender,
            class: data.class_name,
            rollNo: data.roll_no,
            academicYear: data.academic_year,
            admissionNumber: data.admission_number,
            admissionDate: data.admission_date,
            classTeacher: data.class_teacher,

            // == Personal & Contact ==
            religion: data.religion,
            caste: data.caste,
            category: data.category,
            bloodGroup: data.blood_group,
            aadharNumber: data.aadhar_number,
            phoneNumber: data.phone_number,
            email: data.email,

            // == Address ==
            birthPlace: data.birth_place,
            houseName: data.house_name,
            streetName: data.street_name,
            postOffice: data.post_office,
            pinCode: data.pin_code,
            revenueDistrict: data.revenue_district,
            blockPanchayat: data.block_panchayat,
            localBody: data.local_body,
            taluk: data.taluk,
            address: [data.house_name, data.street_name, data.post_office].filter(Boolean).join(', '),
            address_and_phone: data.address_and_phone,

            // == Family Info ==
            fatherName: data.father_name,
            fatherEducation: data.father_education,
            fatherOccupation: data.father_occupation,
            motherName: data.mother_name,
            motherEducation: data.mother_education,
            motherOccupation: data.mother_occupation,
            guardianName: data.guardian_name,
            guardianOccupation: data.guardian_occupation,
            guardianRelationship: data.guardian_relationship,
            guardianContact: data.guardian_contact,
            totalFamilyIncome: data.total_family_income,

            // == Bank Details ==
            bankName: data.bank_name,
            accountNumber: data.account_number,
            branch: data.branch,
            ifscCode: data.ifsc_code,

            // == Medical & ID ==
            disabilityType: data.disability_type,
            disabilityPercentage: data.disability_percentage,
            identificationMarks: data.identification_marks,
            photoUrl: data.photo_url,
            specific_diagnostic: data.specific_diagnostic,
            medical_conditions: data.medical_conditions,
            is_on_regular_drugs: data.is_on_regular_drugs,
            allergies: data.allergies,
            drug_allergy: data.drug_allergy,
            food_allergy: data.food_allergy,
            // Raw drug history array from the API (array of {name, dose})
            drug_history: data.drug_history || [],
            
            // == Case Record Fields ==
            informantName: data.informant_name,
            informantRelationship: data.informant_relationship,
            durationOfContact: data.duration_of_contact,
            presentComplaints: data.present_complaints,
            previousTreatments: data.previous_treatments,
            
            // Re-structured for simplicity
            familyHistory: {
                mental_illness: data.family_history_mental_illness,
                mental_retardation: data.family_history_mental_retardation,
                epilepsy: data.family_history_epilepsy,
            },
            birthHistory: {
                prenatal: data.prenatal_history,
                natal: data.natal_history,
                postnatal: data.postnatal_history,
            },
            developmentHistory: {
                smiles_at_other: data.smiles_at_other,
                head_control: data.head_control,
                sitting: data.sitting,
                responds_to_name: data.responds_to_name,
                babbling: data.babbling,
                first_words: data.first_words,
                standing: data.standing,
                walking: data.walking,
                two_word_phrases: data.two_word_phrases,
                toilet_control: data.toilet_control,
                sentences: data.sentences,
                physical_deformity: data.physical_deformity,
            },
            additionalInfo: { // You can map these individually if you prefer
                school_history: data.school_history,
                occupational_history: data.occupational_history,
                behaviour_problems: data.behaviour_problems,
            },
      // Build a nested assessment object from flat DB fields so the UI can read it
      assessment: {
        self_help: {
          food_habits: {
            eating: data.eating_habits,
            drinking: data.drinking_habits,
          },
          toilet_habits: data.toilet_habits,
          brushing: data.brushing,
          bathing: data.bathing,
          dressing: {
            removing_and_wearing: data.dressing_removing_wearing,
            buttoning: data.dressing_buttoning,
            footwear: data.dressing_footwear,
            grooming: data.dressing_grooming,
          }
        },
        motor: {
          gross_motor: data.gross_motor,
          fine_motor: data.fine_motor,
        },
        sensory: data.sensory,
        socialization: {
          language_communication: data.language_communication,
          social_behaviour: data.social_behaviour,
          mobility: data.mobility_in_neighborhood,
        },
        cognitive: {
          attention: data.attention,
          identification_of_objects: data.identification_of_objects,
          use_of_objects: data.use_of_objects,
          following_instruction: data.following_instruction,
          awareness_of_danger: data.awareness_of_danger,
          concept_formation: {
            color: data.concept_color,
            size: data.concept_size,
            sex: data.concept_sex,
            shape: data.concept_shape,
            number: data.concept_number,
            time: data.concept_time,
            money: data.concept_money,
          }
        },
        academic: {
          reading: data.academic_reading,
          writing: data.academic_writing,
          arithmetic: data.academic_arithmetic,
        },
        prevocational: {
          ability_and_interest: data.prevocational_ability,
          items_of_interest: data.prevocational_interest,
          items_of_dislike: data.prevocational_dislike,
        },
        behaviour_problems: data.behaviour_problems,
        any_other: data.any_other,
        recommendation: data.recommendation,
      },
        };

            // After mapping student, fetch therapy reports for this student
            try {
              // backend endpoint expects numeric DB id, use data.id if available, otherwise fallback to route id
              fetchReports(data.id || id);
            } catch (err) {
              console.warn('Could not fetch reports after student load', err);
            }

        setStudent(mappedForDisplay);
        const { studentId, photoUrl, address, ...editableFields } = mappedForDisplay;
        setEditData(editableFields);

    } catch (e) {
        setStudent(null);
        console.error("Failed to fetch student data:", e);
    } finally {
        setLoading(false);
    }
};

// Fetch therapy reports for a student id
const fetchReports = async (studentId) => {
  try {
    setReportsLoading(true);
    const baseUrl = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8000';
    const token = localStorage.getItem('token');
    const config = token
      ? { headers: { Authorization: `Bearer ${token}` } }
      : {};
    const { data } = await axios.get(`${baseUrl}/api/v1/therapy-reports/student/${studentId}`, config);
    // data is expected to be an array of reports
    const list = Array.isArray(data) ? data : [];
    // sort by report_date desc
    list.sort((a, b) => (b.report_date || b.created_at || '').localeCompare(a.report_date || a.created_at || ''));
    setReports(list);
  } catch (err) {
    console.error('Failed to fetch reports:', err);
    setReports([]);
  } finally {
    setReportsLoading(false);
  }
};

useEffect(() => {
  if (id) {
    fetchStudent();
  }
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, [id]);

  // Download Profile as PDF (screenshot)
// REPLACE your existing function with this one
// REPLACE your existing function with this one
const handleDownloadProfile = async () => {
  if (!student) return;

  const doc = new jsPDF();
  let y = 15;
  const leftCol = 20;
  const boxX = 87;
  const boxWidth = 105;
  const boxHeight = 8;
  const pageHeight = doc.internal.pageSize.getHeight();
  const pageWidth = doc.internal.pageSize.getWidth();

  const checkPageBreak = () => {
    if (y > pageHeight - 20) {
      doc.addPage();
      y = 20;
    }
  };

  // --- PDF Header ---
  const imgWidth = 40;
  const imgHeight = 50;
  const imgX = pageWidth - imgWidth - leftCol;
  const imgY = 30;
  doc.setDrawColor(0);
  doc.rect(imgX, imgY, imgWidth, imgHeight); 
  if (student.photoUrl) {
    try {
      doc.addImage(student.photoUrl, 'JPEG', imgX, imgY, imgWidth, imgHeight);
    } catch (e) {
      console.error("Error adding image to PDF:", e);
    }
  }
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text("ST. MARTHA'S SPECIAL SCHOOL", pageWidth / 2, y + 5, { align: 'center' });
  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  doc.text("FOR THE MENTALLY CHALLENGED", pageWidth / 2, y + 12, { align: 'center' });
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text("STUDENT RECORD FORM", pageWidth / 2, y + 25, { align: 'center' });
  y = Math.max(y + 25, imgY + imgHeight) + 5;
  // --- End Header ---

  const drawField = (label, value) => {
    // Multiline-aware field renderer. Calculates needed box height based on
    // wrapped text and prevents page overflow.
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');

    const text = String(value || '');
    const maxTextWidth = boxWidth - 4; // padding inside box
    const lines = text ? doc.splitTextToSize(text, maxTextWidth) : [''];
    const lineHeight = 6;
    const neededHeight = Math.max(boxHeight, lines.length * lineHeight + 4);

    // If the field won't fit on the current page, start a new page
    if (y + neededHeight > pageHeight - 20) {
      doc.addPage();
      y = 20;
    }

    // Label on the left
    doc.text(String(label || ''), leftCol, y + 6);
    // Draw box sized for content
    const boxY = y;
    doc.rect(boxX, boxY, boxWidth, neededHeight);

    // Write wrapped text inside the box
    let textY = boxY + 6; // first line baseline
    lines.forEach((ln) => {
      doc.text(ln, boxX + 2, textY);
      textY += lineHeight;
    });

    y += neededHeight + 6;
  };

  const drawSectionHeader = (title) => {
    checkPageBreak();
    y += 5;
    doc.setFontSize(13);
    doc.setFont('helvetica', 'bold');
    doc.text(title, leftCol, y);
    y += 8;
  };

  drawSectionHeader('Personal Information');
  drawField('NAME OF THE STUDENT', student.name);
  drawField('AGE', student.age);
  drawField('DATE OF BIRTH', student.dob);
  drawField('GENDER', student.gender);
  drawField('RELIGION', student.religion);
  drawField('CASTE', student.caste);
  drawField('AADHAR NUMBER', student.aadharNumber); // <-- ADDED

  drawSectionHeader('Address Information');
  drawField('BIRTH PLACE', student.birthPlace);
  drawField('HOUSE NAME', student.houseName);
  drawField('STREET NAME', student.streetName);
  drawField('POST OFFICE', student.postOffice);
  drawField('PIN CODE', student.pinCode);
  drawField('REVENUE DISTRICT', student.revenueDistrict);
  drawField('BLOCK PANCHAYAT', student.blockPanchayat);
  drawField('LOCAL BODY', student.localBody);
  drawField('TALUK', student.taluk);

  drawSectionHeader('Contact Information');
  drawField('PHONE NUMBER', student.phoneNumber);
  drawField('EMAIL', student.email);
  drawField('ADDRESS', student.address);

  drawSectionHeader('Family Information');
  drawField('FATHER NAME', student.fatherName);
  // We will only include the names as per your previous change
  drawField('MOTHER NAME', student.motherName);

  // --- vvv NEWLY ADDED SECTIONS vvv ---
  drawSectionHeader('Disability Details');
  drawField('TYPE OF DISABILITY', student.disabilityType);
  drawField('PERCENTAGE', student.disabilityPercentage ? `${student.disabilityPercentage}%` : '');

  drawSectionHeader('Identification Marks');
  drawField('MARKS', student.identificationMarks);
  // --- ^^^ END OF NEW SECTIONS ^^^ ---

  drawSectionHeader('Academic Information');
  drawField('CLASS', student.class);
  drawField('ROLL NUMBER', student.rollNo);
  drawField('ACADEMIC YEAR', student.academicYear);
  drawField('ADMISSION NUMBER', student.admissionNumber);
  drawField('DATE OF ADMISSION', student.admissionDate);
  drawField('CLASS TEACHER', student.classTeacher);

  drawSectionHeader('Bank Details');
  drawField('BANK NAME', student.bankName);
  drawField('ACCOUNT NUMBER', student.accountNumber);
  drawField('BRANCH', student.branch);
  drawField('IFSC CODE', student.ifscCode);

  doc.save(`Student_Profile_${student.name || "profile"}.pdf`);
};

// Download CASE RECORD only (same template style but restricted fields)
const handleDownloadCaseRecord = async () => {
  if (!student) return;

  const doc = new jsPDF();
  let y = 20; // Initial y position

  // --- Document Constants ---
  const pageHeight = doc.internal.pageSize.getHeight();
  const leftMargin = 15;
  const rightMargin = 15;
  const contentWidth = doc.internal.pageSize.getWidth() - leftMargin - rightMargin;
  const labelColumnWidth = 60; // Width for the label/title part
  const valueColumnX = leftMargin + labelColumnWidth + 5;
  const valueColumnWidth = contentWidth - labelColumnWidth - 5;
  const defaultBoxHeight = 8;
  const lineHeight = 6;
  const fieldGap = 5; // Vertical gap between fields
  const sectionGap = 8; // Vertical gap after a section header

  // --- Helper Functions ---

  const checkPageBreak = (neededHeight) => {
    if (y + neededHeight > pageHeight - 20) {
      doc.addPage();
      y = 20;
    }
  };

  const drawSectionHeader = (title) => {
    checkPageBreak(20); // Check if header fits
    y += sectionGap;
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text(title, leftMargin, y);
    y += sectionGap;
    doc.setFont("helvetica", "normal");
  };
  
  const drawSubHeader = (title) => {
      checkPageBreak(15);
      y += 4;
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text(title, leftMargin, y);
      y += 7;
      doc.setFont('helvetica', 'normal');
  };

  const drawField = (label, value) => {
    const text = String(value || "N/A");
    const lines = doc.splitTextToSize(text, valueColumnWidth - 4);
    const neededHeight = Math.max(defaultBoxHeight, lines.length * lineHeight + 4);

    checkPageBreak(neededHeight + fieldGap);

    // Draw Label
    doc.setFontSize(11);
    doc.text(label, leftMargin, y + 6);

    // Draw Value Box
    doc.rect(valueColumnX, y, valueColumnWidth, neededHeight);

    // Draw Value Text (multiline)
    let textY = y + 6;
    lines.forEach((line) => {
      doc.text(line, valueColumnX + 2, textY);
      textY += lineHeight;
    });

    y += neededHeight + fieldGap;
  };

  // --- PDF Generation Starts Here ---

  // Header
  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  doc.text("CASE RECORD", doc.internal.pageSize.getWidth() / 2, y, { align: "center" });
  y += 15;

  // 1. Identification Data
  drawSectionHeader("Identification Data");
  drawField("Name of Student", student.name);
  drawField("Admission Number", student.admissionNumber);
  drawField("Date of Birth", student.dob);
  drawField("Age", student.age);
  drawField("Gender", student.gender);
  drawField("Education", student.class);
  drawField("Blood Group", student.bloodGroup);
  drawField("Religion", student.religion);
  drawField("Category", student.category);
  drawField("Aadhar Number", student.aadharNumber);

  // 2. Demographic Data
  drawSectionHeader("Demographic Data");
  drawField("Father's Name", student.fatherName);
  drawField("Father's Education", student.fatherEducation);
  drawField("Father's Occupation", student.fatherOccupation);
  drawField("Mother's Name", student.motherName);
  drawField("Mother's Education", student.motherEducation);
  drawField("Mother's Occupation", student.motherOccupation);
  drawField("Guardian's Name", student.guardianName);
  drawField("Guardian's Relationship", student.guardianRelationship);
  drawField("Guardian's Occupation", student.guardianOccupation);
  drawField("Total Family Income", student.totalFamilyIncome);
  drawField("Address & Phone", student.address_and_phone || `${student.address || ""}${student.phoneNumber ? " | " + student.phoneNumber : ""}`);
  
  // 3. Informant Detail
  drawSectionHeader("Informant Detail");
  drawField("Informant Name", student.informantName);
  drawField("Informant Relationship", student.informantRelationship);
  drawField("Duration of Contact", student.durationOfContact);
  drawField("Present Complaints", student.presentComplaints);
  drawField("Previous Consultation and Treatments", student.previousTreatments);

  // 4. Family History
  drawSectionHeader("Family History");
  drawField("Mental Illness", student.familyHistory?.mental_illness);
  drawField("Mental Retardation", student.familyHistory?.mental_retardation);
  drawField("Epilepsy and Others", student.familyHistory?.epilepsy);

  // 5. Birth History
  drawSectionHeader("Birth History");
  drawField("Prenatal History", student.birthHistory?.prenatal);
  drawField("Natal / Neonatal History", student.birthHistory?.natal);
  drawField("Postnatal History", student.birthHistory?.postnatal);
  
  // 6. Developmental History
  drawSectionHeader("Developmental History");
  const dev = student.developmentHistory || {};
  const yesNo = (v) => (v ? 'Yes' : 'No');
  drawField('Smiles at others', yesNo(dev.smiles_at_other));
  drawField('Head control', yesNo(dev.head_control));
  drawField('Sitting', yesNo(dev.sitting));
  drawField('Responds to name', yesNo(dev.responds_to_name));
  drawField('Babbling', yesNo(dev.babbling));
  drawField('First words', yesNo(dev.first_words));
  drawField('Standing', yesNo(dev.standing));
  drawField('Walking', yesNo(dev.walking));
  drawField('Two-word phrases', yesNo(dev.two_word_phrases));
  drawField('Toilet control', yesNo(dev.toilet_control));
  drawField('Sentences', yesNo(dev.sentences));
  drawField('Physical deformity', yesNo(dev.physical_deformity));

  // 7. Special Education Assessment
  drawSectionHeader("Special Education Assessment");
  const assessment = student.assessment || {};
  
  drawSubHeader("Self Help / ADL");
  drawField("Eating Habits", assessment.self_help?.food_habits?.eating);
  drawField("Drinking Habits", assessment.self_help?.food_habits?.drinking);
  drawField("Toilet Habits", assessment.self_help?.toilet_habits);
  drawField("Brushing", assessment.self_help?.brushing);
  drawField("Bathing", assessment.self_help?.bathing);
  drawField("Dressing (Removing/Wearing)", assessment.self_help?.dressing?.removing_and_wearing);
  drawField("Dressing (Buttoning)", assessment.self_help?.dressing?.buttoning);
  drawField("Dressing (Footwear)", assessment.self_help?.dressing?.footwear);
  drawField("Grooming", assessment.self_help?.dressing?.grooming);

  drawSubHeader("Motor");
  drawField("Gross Motor", assessment.motor?.gross_motor);
  drawField("Fine Motor", assessment.motor?.fine_motor);

  drawSubHeader("Sensory");
  drawField("Sensory Skills", assessment.sensory);

  drawSubHeader("Socialization");
  drawField("Language/Communication", assessment.socialization?.language_communication);
  drawField("Social Behaviour", assessment.socialization?.social_behaviour);
  drawField("Mobility in Neighborhood", assessment.socialization?.mobility);
  
  drawSubHeader("Cognitive");
  drawField("Attention", assessment.cognitive?.attention);
  drawField("Identification of Objects", assessment.cognitive?.identification_of_objects);
  drawField("Use of Objects", assessment.cognitive?.use_of_objects);
  drawField("Following Instruction", assessment.cognitive?.following_instruction);
  drawField("Awareness of Danger", assessment.cognitive?.awareness_of_danger);
  drawField("Concept - Color", assessment.cognitive?.concept_formation?.color);
  drawField("Concept - Size", assessment.cognitive?.concept_formation?.size);
  drawField("Concept - Sex", assessment.cognitive?.concept_formation?.sex);
  drawField("Concept - Shape", assessment.cognitive?.concept_formation?.shape);
  drawField("Concept - Number", assessment.cognitive?.concept_formation?.number);
  drawField("Concept - Time", assessment.cognitive?.concept_formation?.time);
  drawField("Concept - Money", assessment.cognitive?.concept_formation?.money);

  drawSubHeader("Academic");
  drawField("Reading", assessment.academic?.reading);
  drawField("Writing", assessment.academic?.writing);
  drawField("Arithmetic", assessment.academic?.arithmetic);

  drawSubHeader("Prevocational / Domestic");
  drawField("Ability & Interest", assessment.prevocational?.ability_and_interest);
  drawField("Items of Interest", assessment.prevocational?.items_of_interest);
  drawField("Items of Dislike", assessment.prevocational?.items_of_dislike);
  
  drawSubHeader("Observations & Recommendations");
  drawField("Behaviour Problems", assessment.behaviour_problems);
  drawField("Any Other Information", assessment.any_other);
  drawField("Recommendation", assessment.recommendation);
  
  // 8. Medical, Allergies & Drug History
  drawSectionHeader("Medical, Allergies & Drug History");
  drawField('Medical conditions', student.medical_conditions);
  drawField('Specific diagnostic', student.specific_diagnostic);
  drawField('Is on regular drugs', student.is_on_regular_drugs ? 'Yes' : 'No');
  drawField('Drug allergy', student.drug_allergy);
  drawField('Food allergy', student.food_allergy);

  if (Array.isArray(student.drug_history) && student.drug_history.length > 0) {
      drawSubHeader('Drug History Details');
      student.drug_history.forEach((drug, idx) => {
          drawField(`Drug ${idx + 1}: ${drug.name || 'Unnamed'}`, `Dose: ${drug.dose || 'N/A'}`);
      });
  }

  // Save with a clean filename
  const safeName = (student.name || "student").replace(/[^a-z0-9_-]/gi, "_");
  doc.save(`case-record_${safeName}.pdf`);
};

  if (loading) {
    return (
      <div className="min-h-screen w-full flex flex-col items-center justify-center bg-[#f7f7f7]">
        <div className="text-2xl text-[#E38B52]">Loading student information...</div>
      </div>
    );
  }

  return (
  <div id="profile-to-download" className="min-h-screen w-full flex flex-col items-center bg-[#f7f7f7] relative overflow-hidden py-20">
      {/* Back button */}
      <button
        onClick={() => window.history.back()}
        className="absolute top-8 left-8 bg-white/30 backdrop-blur-xl rounded-2xl shadow-xl p-3 border border-white/20 hover:-translate-y-1 transition-all duration-200 flex items-center gap-2 z-10"
      >
        <svg 
          xmlns="http://www.w3.org/2000/svg" 
          width="24" 
          height="24" 
          viewBox="0 0 24 24" 
          fill="none" 
          stroke="currentColor" 
          strokeWidth="2" 
          strokeLinecap="round" 
          strokeLinejoin="round"
        >
          <path d="M19 12H5M12 19l-7-7 7-7"/>
        </svg>
      </button>

      {/* Animated background blobs */}
      <div className="absolute top-0 -left-40 w-[600px] h-[500px] bg-[#E38B52] rounded-full mix-blend-multiply filter blur-2xl opacity-30 animate-float z-0" />
      <div className="absolute -bottom-32 right-40 w-[600px] h-[600px] bg-[#E38B52] rounded-full mix-blend-multiply filter blur-2xl opacity-40 animate-float animation-delay-3000 z-0" />
      <div className="absolute top-1/2 left-1/2 w-[500px] h-[500px] bg-[#E38B52] rounded-full mix-blend-multiply filter blur-2xl opacity-40 animate-float animation-delay-5000 z-0" />
      <div className="absolute top-0 -left-40 w-[500px] h-[600px] bg-[#E38B52] rounded-full mix-blend-multiply filter blur-2xl opacity-30 animate-float animation-delay-7000 z-0" />
      
      <div className="w-[90%] max-w-[1200px] mx-4 flex-1 flex flex-col">
        <h1 className="text-3xl font-bold text-[#170F49] mb-8 text-center font-baskervville">
          Student Information
        </h1>

        {/* Tabs */}
        <div className="flex justify-center mb-8">
          <div className="bg-white/30 backdrop-blur-xl rounded-2xl p-2 inline-flex gap-2 shadow-lg relative w-[560px]">
            {/* Active Tab Background */}
            <div
              className="absolute h-[calc(100%-8px)] top-[4px] transition-all duration-300 ease-in-out rounded-xl bg-[#E38B52] shadow-[inset_0_2px_4px_rgba(255,255,255,0.3),inset_0_4px_8px_rgba(255,255,255,0.2)]"
              style={{
                left:
                  activeTab === "student-details"
                    ? "4px"
                    : activeTab === "case-record"
                    ? "188px"
                    : "372px",
                width: "180px",
                background: 'linear-gradient(135deg, #E38B52 0%, #E38B52 100%)',
              }}
            >
              {/* Animated particles */}
              <div className="absolute inset-0 overflow-hidden rounded-xl">
                <div className="particle-1"></div>
                <div className="particle-2"></div>
                <div className="particle-3"></div>
              </div>
            </div>
            
            {/* Student Details Tab */}
            <button
              onClick={() => setActiveTab("student-details")}
              className={`w-[180px] px-6 py-3 rounded-xl font-medium transition-all duration-300 relative z-10 text-center whitespace-nowrap ${
                activeTab === "student-details"
                  ? "text-white"
                  : "text-[#170F49] hover:text-[#E38B52]"
              }`}
            >
              Student Details
            </button>
            
            {/* Case Record Tab */}
            <button
              onClick={() => setActiveTab("case-record")}
              className={`w-[180px] px-6 py-3 rounded-xl font-medium transition-all duration-300 relative z-10 text-center whitespace-nowrap ${
                activeTab === "case-record"
                  ? "text-white"
                  : "text-[#170F49] hover:text-[#E38B52]"
              }`}
            >
              Case Record
            </button>

            {/* Therapy Reports Tab */}
            <button
              onClick={() => setActiveTab("therapy-reports")}
              className={`w-[180px] px-6 py-3 rounded-xl font-medium transition-all duration-300 relative z-10 text-center whitespace-nowrap ${
                activeTab === "therapy-reports"
                  ? "text-white"
                  : "text-[#170F49] hover:text-[#E38B52]"
              }`}
            >
              Therapy Reports
            </button>
          </div>
        </div>
        
        {/* Main content container */}
        <div className="relative bg-white/30 backdrop-blur-xl rounded-3xl shadow-xl p-8 md:p-12 border border-white/20">
          {activeTab === "therapy-reports" ? (
            <div className="w-full">
              <h2 className="text-2xl font-bold text-[#170F49] mb-6 pb-4 border-b border-[#E38B52]/20 flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2 text-[#E38B52]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-6a2 2 0 012-2h2a2 2 0 012 2v6m-6 0h6" />
                </svg>
                Therapy Reports
              </h2>
              <div className="p-6 bg-white/50 rounded-2xl">
                {/* Date range filters */}
                <div className="flex items-center gap-3 mb-4">
                  <label className="text-sm text-[#6F6C90]">From:</label>
                  <input type="date" value={fromDate} onChange={(e) => { setFromDate(e.target.value); setVisibleCount(5); }} className="px-3 py-2 border rounded-md" />
                  <label className="text-sm text-[#6F6C90]">To:</label>
                  <input type="date" value={toDate} onChange={(e) => { setToDate(e.target.value); setVisibleCount(5); }} className="px-3 py-2 border rounded-md" />
                  <button onClick={() => { setFromDate(''); setToDate(''); setVisibleCount(5); }} className="ml-auto px-3 py-2 bg-[#E38B52] text-white rounded-md">Reset</button>
                </div>

                {reportsLoading ? (
                  <p className="text-sm text-[#6F6C90]">Loading reports...</p>
                ) : reports.length === 0 ? (
                  <p className="text-sm text-[#6F6C90]">No therapy reports found for this student.</p>
                ) : (
                  (() => {
                    const filtered = reports.filter((r) => {
                      if (fromDate) {
                        if (!r.report_date || new Date(r.report_date) < new Date(fromDate)) return false;
                      }
                      if (toDate) {
                        if (!r.report_date || new Date(r.report_date) > new Date(toDate)) return false;
                      }
                      return true;
                    });

                    const visible = filtered.slice(0, visibleCount);

                    return (
                      <div className="space-y-4">
                        {visible.map((r) => (
                          <details key={r.id} className="bg-white rounded-lg border p-4 shadow-sm">
                            <summary className="flex justify-between items-center cursor-pointer">
                              <div>
                                <div className="text-sm text-[#6F6C90]">{new Date(r.report_date).toLocaleDateString()}</div>
                                <div className="text-lg font-semibold text-[#170F49]">{r.therapy_type || 'Therapy'}</div>
                              </div>
                              <div className="text-sm text-[#6F6C90]">{r.progress_level || ''}</div>
                            </summary>
                            <div className="mt-4 text-sm text-[#333] space-y-3">
                              {r.progress_notes && (
                                <div>
                                  <div className="text-xs text-[#6F6C90]">Progress Notes</div>
                                  <div className="text-sm">{r.progress_notes}</div>
                                </div>
                              )}
                              {r.goals_achieved && (
                                <div>
                                  <div className="text-xs text-[#6F6C90]">Goals Achieved</div>
                                  <div className="text-sm">{r.goals_achieved}</div>
                                </div>
                              )}
                              <div className="text-xs text-[#6F6C90]">Recorded</div>
                              <div className="text-sm">{new Date(r.created_at).toLocaleString()}</div>
                            </div>
                          </details>
                        ))}

                        {filtered.length > visibleCount && (
                          <div className="text-center mt-4">
                            <button
                              onClick={() => setVisibleCount((v) => v + 5)}
                              className="px-4 py-2 bg-[#E38B52] text-white rounded-md"
                            >
                              Load more
                            </button>
                          </div>
                        )}
                        {filtered.length === 0 && (
                          <p className="text-sm text-[#6F6C90]">No reports match the selected date range.</p>
                        )}
                      </div>
                    );
                  })()
                )}
              </div>
            </div>
          ) : activeTab === "student-details" ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
              {/* Basic Information Section */}
              <div className="col-span-full">
                <h2 className="text-xl font-semibold text-[#170F49] mb-4">Personal Information</h2>
                <div className="flex flex-col md:flex-row gap-6 p-4 md:p-6 bg-white/50 rounded-2xl">
                  {/* Student Photo */}
<div className="flex flex-col items-center gap-3">
  <div className="w-40 h-40 rounded-2xl overflow-hidden border-4 border-white/50 shadow-xl">
    <img 
      // This logic shows the preview, then the saved photo, then a placeholder
      src={photoPreview || student?.photoUrl || "https://placehold.co/160x160/EFEFEF/AAAAAA?text=No+Photo"}
      alt="Student"
      className="w-full h-full object-cover"
    />
  </div>

  {/* This is the hidden file input that gets triggered */}
  <input
    type="file"
    ref={fileInputRef}
    onChange={handlePhotoChange}
    accept="image/png, image/jpeg"
    style={{ display: 'none' }}
  />

  {/* This button now opens the file selection dialog */}
  <button 
    onClick={() => fileInputRef.current.click()} 
    className="text-sm text-[#E38B52] hover:text-[#E38B52]/90 transition-colors duration-200 flex items-center gap-1"
  >
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
        <polyline points="17 8 12 3 7 8"/>
        <line x1="12" y1="3" x2="12" y2="15"/>
    </svg>
    Update Photo
  </button>

  {/* This button only appears when a new file is ready to be saved */}
  {photoFile && (
    <button
      onClick={handlePhotoUpload}
      className="mt-2 px-4 py-2 bg-green-500 text-white text-sm rounded-xl hover:bg-green-600 transition-all duration-200 shadow-md"
    >
      Save Photo
    </button>
  )}
</div>

                  {/* Student Details */}
                  <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 pl-8 md:pl-12">
                    <div>
                      <p className="text-sm text-[#6F6C90]">Full Name</p>
                      {editMode ? (
                        <>
                        <input type="text" name="name" value={editData?.name || ''} onChange={handleEditChange} className="input-edit" />
                        </>
                      ) : (
                        <p className="text-[#170F49] font-medium">{student?.name}</p>
                      )}
                    </div>
                    <div>
                      <p className="text-sm text-[#6F6C90]">Age</p>
                      {editMode ? (
                        <input type="number" name="age" value={editData?.age || ''} onChange={handleEditChange} className="input-edit" />
                      ) : (
                        <p className="text-[#170F49] font-medium">{student?.age}</p>
                      )}
                    </div>
                    <div>
                      <p className="text-sm text-[#6F6C90]">Student ID</p>
                      <input type="text" name="studentId" value={student?.studentId || ''} className="input-edit" readOnly />
                    </div>
                    <div>
                      <p className="text-sm text-[#6F6C90]">Date of Birth</p>
                      {editMode ? (
                        <input type="date" name="dob" value={editData?.dob || ''} onChange={handleEditChange} className="input-edit" />
                      ) : (
                        <p className="text-[#170F49] font-medium">{student?.dob}</p>
                      )}
                    </div>
                    <div>
                      <p className="text-sm text-[#6F6C90]">Gender</p>
                      {editMode ? (
                        <input type="text" name="gender" value={editData?.gender || ''} onChange={handleEditChange} className="input-edit" />
                      ) : (
                        <p className="text-[#170F49] font-medium">{student?.gender}</p>
                      )}
                    </div>
                    <div>
                      <p className="text-sm text-[#6F6C90]">Religion</p>
                      {editMode ? (
                        <input type="text" name="religion" value={editData?.religion || ''} onChange={handleEditChange} className="input-edit" />
                      ) : (
                        <p className="text-[#170F49] font-medium">{student?.religion}</p>
                      )}
                    </div>
                    <div>
                      <p className="text-sm text-[#6F6C90]">Caste</p>
                      {editMode ? (
                        <input type="text" name="caste" value={editData?.caste || ''} onChange={handleEditChange} className="input-edit" />
                      ) : (
                        <p className="text-[#170F49] font-medium">{student?.caste}</p>
                      )}
                    </div>
                    {/* Blood Group - EDIT ONLY */}
                  {editMode && (
                    <div>
                      <p className="text-sm text-[#6F6C90]">Blood Group</p>
                      <input type="text" name="bloodGroup" value={editData?.bloodGroup || ''} onChange={handleEditChange} className="input-edit" />
                    </div>
                  )}

                  {/* Category - EDIT ONLY */}
                  {editMode && (
                    <div>
                      <p className="text-sm text-[#6F6C90]">Category</p>
                      <input type="text" name="category" value={editData?.category || ''} onChange={handleEditChange} className="input-edit" />
                    </div>
                  )}
                    <div>
      <p className="text-sm text-[#6F6C90]">Aadhar Number</p>
      {editMode ? (
        <input type="text" name="aadharNumber" value={editData?.aadharNumber || ''} onChange={handleEditChange} className="input-edit" />
      ) : (
        <p className="text-[#170F49] font-medium">{student?.aadharNumber}</p>
      )}
    </div>
                  </div>
                </div>
              </div>

              {/* Address Information Section */}
              <div className="col-span-full">
                <h2 className="text-xl font-semibold text-[#170F49] mb-4">Address Information</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6 bg-white/50 rounded-2xl">
                  <div>
                    <p className="text-sm text-[#6F6C90]">Birth Place</p>
                    {editMode ? (
                      <input type="text" name="birthPlace" value={editData?.birthPlace || ''} onChange={handleEditChange} className="input-edit" />
                    ) : (
                      <p className="text-[#170F49] font-medium">{student?.birthPlace}</p>
                    )}
                  </div>
                  <div>
                    <p className="text-sm text-[#6F6C90]">House Name</p>
                    {editMode ? (
                      <input type="text" name="houseName" value={editData?.houseName || ''} onChange={handleEditChange} className="input-edit" />
                    ) : (
                      <p className="text-[#170F49] font-medium">{student?.houseName}</p>
                    )}
                  </div>
                   <div>
                     <p className="text-sm text-[#6F6C90]">Block Panchayat</p>
                     {editMode ? (
                       <input type="text" name="blockPanchayat" value={editData?.blockPanchayat || ''} onChange={handleEditChange} className="input-edit" />
                     ) : (
                       <p className="text-[#170F49] font-medium">{student?.blockPanchayat}</p>
                     )}
                   </div>
                   <div>
                     <p className="text-sm text-[#6F6C90]">Local Body</p>
                     {editMode ? (
                       <input type="text" name="localBody" value={editData?.localBody || ''} onChange={handleEditChange} className="input-edit" />
                     ) : (
                       <p className="text-[#170F49] font-medium">{student?.localBody}</p>
                     )}
                   </div>
                   <div>
                     <p className="text-sm text-[#6F6C90]">Taluk</p>
                     {editMode ? (
                       <input type="text" name="taluk" value={editData?.taluk || ''} onChange={handleEditChange} className="input-edit" />
                     ) : (
                       <p className="text-[#170F49] font-medium">{student?.taluk}</p>
                     )}
                   </div>
                  <div>
                    <p className="text-sm text-[#6F6C90]">Street Name</p>
                    {editMode ? (
                      <input type="text" name="streetName" value={editData?.streetName || ''} onChange={handleEditChange} className="input-edit" />
                    ) : (
                      <p className="text-[#170F49] font-medium">{student?.streetName}</p>
                    )}
                  </div>
                  <div>
                    <p className="text-sm text-[#6F6C90]">Post Office</p>
                    {editMode ? (
                      <input type="text" name="postOffice" value={editData?.postOffice || ''} onChange={handleEditChange} className="input-edit" />
                    ) : (
                      <p className="text-[#170F49] font-medium">{student?.postOffice}</p>
                    )}
                  </div>
                  <div>
                    <p className="text-sm text-[#6F6C90]">Pin Code</p>
                    {editMode ? (
                      <input type="text" name="pinCode" value={editData?.pinCode || ''} onChange={handleEditChange} className="input-edit" />
                    ) : (
                      <p className="text-[#170F49] font-medium">{student?.pinCode}</p>
                    )}
                  </div>
                  <div>
                    <p className="text-sm text-[#6F6C90]">Revenue District</p>
                    {editMode ? (
                      <input type="text" name="revenueDistrict" value={editData?.revenueDistrict || ''} onChange={handleEditChange} className="input-edit" />
                    ) : (
                      <p className="text-[#170F49] font-medium">{student?.revenueDistrict}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Contact Information Section */}
              <div className="col-span-full">
                <h2 className="text-xl font-semibold text-[#170F49] mb-4">Contact Information</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6 bg-white/50 rounded-2xl">
                  <div>
                    <p className="text-sm text-[#6F6C90]">Phone Number</p>
                    {editMode ? (
                      <input type="text" name="phoneNumber" value={editData?.phoneNumber || ''} onChange={handleEditChange} className="input-edit" />
                    ) : (
                      <p className="text-[#170F49] font-medium">{student?.phoneNumber}</p>
                    )}
                  </div>
                  <div>
                    <p className="text-sm text-[#6F6C90]">Email</p>
                    {editMode ? (
                      <input type="email" name="email" value={editData?.email || ''} onChange={handleEditChange} className="input-edit" />
                    ) : (
                      <p className="text-[#170F49] font-medium">{student?.email}</p>
                    )}
                  </div>
                  <div>
                    <p className="text-sm text-[#6F6C90]">Address</p>
                    {editMode ? (
                      <input type="text" name="address" value={editData?.address || ''} onChange={handleEditChange} className="input-edit" />
                    ) : (
                      <p className="text-[#170F49] font-medium">{student?.address}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Family Information Section */}
<div className="col-span-full">
  <h2 className="text-xl font-semibold text-[#170F49] mb-4">Family Information</h2>
  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6 bg-white/50 rounded-2xl">
    <div>
      <p className="text-sm text-[#6F6C90]">Father's Name</p>
      {editMode ? (
        <input type="text" name="fatherName" value={editData?.fatherName || ''} onChange={handleEditChange} className="input-edit" />
      ) : (
        <p className="text-[#170F49] font-medium">{student?.fatherName}</p>
      )}
    </div>
    <div>
      <p className="text-sm text-[#6F6C90]">Mother's Name</p>
      {editMode ? (
        <input type="text" name="motherName" value={editData?.motherName || ''} onChange={handleEditChange} className="input-edit" />
      ) : (
        <p className="text-[#170F49] font-medium">{student?.motherName}</p>
      )}
    </div>
  </div>
</div>
              <div className="col-span-full">
            <h2 className="text-xl font-semibold text-[#170F49] mb-4">Disability Details</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6 bg-white/50 rounded-2xl">
              <div>
                <p className="text-sm text-[#6F6C90]">Type of Disability</p>
                {editMode ? (
                  <input type="text" name="disabilityType" value={editData?.disabilityType || ''} onChange={handleEditChange} className="input-edit" />
                ) : (
                  <p className="text-[#170F49] font-medium">{student?.disabilityType || 'N/A'}</p>
                )}
              </div>
              <div>
                <p className="text-sm text-[#6F6C90]">Percentage of Disability</p>
                {editMode ? (
                  <input type="number" name="disabilityPercentage" value={editData?.disabilityPercentage || ''} onChange={handleEditChange} className="input-edit" />
                ) : (
                  <p className="text-[#170F49] font-medium">{student?.disabilityPercentage ? `${student.disabilityPercentage}%` : 'N/A'}</p>
                )}
              </div>
            </div>
            <div className="col-span-full">
  <h2 className="text-xl font-semibold text-[#170F49] mb-4">Identification Marks</h2>
  <div className="p-6 bg-white/50 rounded-2xl">
    {editMode ? (
      <textarea
        name="identificationMarks"
        value={editData?.identificationMarks || ''}
        onChange={handleEditChange}
        className="input-edit w-full"
        rows="3"
      />
    ) : (
      <p className="text-[#170F49] font-medium">{student?.identificationMarks || 'N/A'}</p>
    )}
  </div>
</div>
          </div>

              {/* Academic Information Section */}
              <div className="col-span-full">
                <h2 className="text-xl font-semibold text-[#170F49] mb-4">Academic Information</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6 bg-white/50 rounded-2xl">
                  <div>
                    <p className="text-sm text-[#6F6C90]">Class</p>
                    {editMode ? (
                      <input type="text" name="class" value={editData?.class || ''} onChange={handleEditChange} className="input-edit" />
                    ) : (
                      <p className="text-[#170F49] font-medium">{student?.class}</p>
                    )}
                  </div>
                  <div>
                    <p className="text-sm text-[#6F6C90]">Division</p>
                    {editMode ? (
                      <input type="text" name="rollNo" value={editData?.rollNo || ''} onChange={handleEditChange} className="input-edit" />
                    ) : (
                      <p className="text-[#170F49] font-medium">{student?.rollNo}</p>
                    )}
                  </div>
                  <div>
                    <p className="text-sm text-[#6F6C90]">Roll Number</p>
                    {editMode ? (
                      <input type="text" name="rollNo" value={editData?.rollNo || ''} onChange={handleEditChange} className="input-edit" />
                    ) : (
                      <p className="text-[#170F49] font-medium">{student?.rollNo}</p>
                    )}
                  </div>
                  <div>
                    <p className="text-sm text-[#6F6C90]">Academic Year</p>
                    {editMode ? (
                      <input type="text" name="academicYear" value={editData?.academicYear || ''} onChange={handleEditChange} className="input-edit" />
                    ) : (
                      <p className="text-[#170F49] font-medium">{student?.academicYear}</p>
                    )}
                  </div>
                  <div>
                    <p className="text-sm text-[#6F6C90]">Admission Number</p>
                    {editMode ? (
                      <input type="text" name="admissionNumber" value={editData?.admissionNumber || ''} onChange={handleEditChange} className="input-edit" />
                    ) : (
                      <p className="text-[#170F49] font-medium">{student?.admissionNumber}</p>
                    )}
                  </div>
                  <div>
                    <p className="text-sm text-[#6F6C90]">Date of Admission</p>
                    {editMode ? (
                      <input type="date" name="admissionDate" value={editData?.admissionDate || ''} onChange={handleEditChange} className="input-edit" />
                    ) : (
                      <p className="text-[#170F49] font-medium">{student?.admissionDate}</p>
                    )}
                  </div>
                  <div>
      <p className="text-sm text-[#6F6C90]">Class Teacher</p>
      {editMode ? (
        <input type="text" name="classTeacher" value={editData?.classTeacher || ''} onChange={handleEditChange} className="input-edit" />
      ) : (
        <p className="text-[#170F49] font-medium">{student?.classTeacher || 'N/A'}</p>
      )}
    </div>
                </div>
              </div>

              {/* Bank Details Section */}
              <div className="col-span-full">
                <h2 className="text-xl font-semibold text-[#170F49] mb-4">Bank Details</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6 bg-white/50 rounded-2xl">
                  <div>
                    <p className="text-sm text-[#6F6C90]">Account Number</p>
                    {editMode ? (
                      <input type="text" name="accountNumber" value={editData?.accountNumber || ''} onChange={handleEditChange} className="input-edit" />
                    ) : (
                      <p className="text-[#170F49] font-medium">{student?.accountNumber}</p>
                    )}
                  </div>
                  <div>
                    <p className="text-sm text-[#6F6C90]">Bank Name</p>
                    {editMode ? (
                      <input type="text" name="bankName" value={editData?.bankName || ''} onChange={handleEditChange} className="input-edit" />
                    ) : (
                      <p className="text-[#170F49] font-medium">{student?.bankName}</p>
                    )}
                  </div>
                  <div>
                    <p className="text-sm text-[#6F6C90]">Branch</p>
                    {editMode ? (
                      <input type="text" name="branch" value={editData?.branch || ''} onChange={handleEditChange} className="input-edit" />
                    ) : (
                      <p className="text-[#170F49] font-medium">{student?.branch}</p>
                    )}
                  </div>
                  <div>
                    <p className="text-sm text-[#6F6C90]">IFSC Code</p>
                    {editMode ? (
                      <input type="text" name="ifscCode" value={editData?.ifscCode || ''} onChange={handleEditChange} className="input-edit" />
                    ) : (
                      <p className="text-[#170F49] font-medium">{student?.ifscCode}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Therapies Section */}
              <div className="col-span-full">
                <h2 className="text-xl font-semibold text-[#170F49] mb-4">Therapies</h2>
                
                {/* Current Therapies */}
                <div className="mb-6 p-6 bg-white/50 rounded-2xl">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-medium text-[#170F49]">Current Therapies</h3>
                    <button className="bg-white/30 backdrop-blur-xl rounded-xl shadow-sm p-2 px-4 border border-white/20 hover:-translate-y-1 transition-all duration-200 flex items-center gap-2">
                      <svg 
                        width="16" 
                        height="16" 
                        viewBox="0 0 24 24" 
                        fill="none" 
                        stroke="currentColor" 
                        strokeWidth="2" 
                        strokeLinecap="round" 
                        strokeLinejoin="round"
                      >
                        <path d="M12 20h9"/>
                        <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/>
                      </svg>
                      <span className="text-sm font-medium">Edit Progress</span>
                    </button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Speech Therapy Card */}
                    <div className="p-4 bg-white/70 rounded-xl">
                      <div className="flex items-start gap-4">
                        <div className="relative w-20 h-20">
                          {/* Circular Progress */}
                          <svg className="w-20 h-20 transform -rotate-90">
                            <circle
                              className="text-gray-200"
                              strokeWidth="5"
                              stroke="currentColor"
                              fill="transparent"
                              r="35"
                              cx="40"
                              cy="40"
                            />
                            <circle
                              className="text-[#E38B52]"
                              strokeWidth="5"
                              strokeDasharray={220}
                              strokeDashoffset={66} // 220 - (220 * percentageComplete)
                              strokeLinecap="round"
                              stroke="currentColor"
                              fill="transparent"
                              r="35"
                              cx="40"
                              cy="40"
                            />
                          </svg>
                          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                            <span className="text-sm font-medium text-[#170F49]">70%</span>
                          </div>
                        </div>

                        <div className="flex-1">
                          <h4 className="text-[#170F49] font-medium mb-1">Speech Therapy</h4>
                          <p className="text-sm text-[#6F6C90] mb-2">Sessions: 15/20</p>
                          <div className="flex items-center gap-2 text-sm text-[#6F6C90]">
                            <svg 
                              width="16" 
                              height="16" 
                              viewBox="0 0 24 24" 
                              fill="none" 
                              stroke="currentColor" 
                              strokeWidth="2" 
                              strokeLinecap="round" 
                              strokeLinejoin="round"
                            >
                              <circle cx="12" cy="12" r="10"/>
                              <polyline points="12 6 12 12 16 14"/>
                            </svg>
                            Next Session: Tomorrow, 10:00 AM
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Occupational Therapy Card */}
                    <div className="p-4 bg-white/70 rounded-xl">
                      <div className="flex items-start gap-4">
                        <div className="relative w-20 h-20">
                          <svg className="w-20 h-20 transform -rotate-90">
                            <circle
                              className="text-gray-200"
                              strokeWidth="5"
                              stroke="currentColor"
                              fill="transparent"
                              r="35"
                              cx="40"
                              cy="40"
                            />
                            <circle
                              className="text-[#E38B52]"
                              strokeWidth="5"
                              strokeDasharray={220}
                              strokeDashoffset={132} // 220 - (220 * percentageComplete)
                              strokeLinecap="round"
                              stroke="currentColor"
                              fill="transparent"
                              r="35"
                              cx="40"
                              cy="40"
                            />
                          </svg>
                          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                            <span className="text-sm font-medium text-[#170F49]">40%</span>
                          </div>
                        </div>

                        <div className="flex-1">
                          <h4 className="text-[#170F49] font-medium mb-1">Occupational Therapy</h4>
                          <p className="text-sm text-[#6F6C90] mb-2">Sessions: 8/20</p>
                          <div className="flex items-center gap-2 text-sm text-[#6F6C90]">
                            <svg 
                              width="16" 
                              height="16" 
                              viewBox="0 0 24 24" 
                              fill="none" 
                              stroke="currentColor" 
                              strokeWidth="2" 
                              strokeLinecap="round" 
                              strokeLinejoin="round"
                            >
                              <circle cx="12" cy="12" r="10"/>
                              <polyline points="12 6 12 12 16 14"/>
                            </svg>
                            Next Session: Friday, 2:00 PM
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>                
              </div>

              {/* Certificates Section */}
              <div className="col-span-full">
                <h2 className="text-xl font-semibold text-[#170F49] mb-4">Certificates</h2>
                <div className="p-6 bg-white/50 rounded-2xl">
                  {/* Certificates List */}
                  <div className="space-y-4">
                    {/* Example certificates - replace with actual data */}
                    <div className="flex items-center justify-between p-4 bg-white/70 rounded-xl">
                      <div className="flex items-center gap-3">
                        <svg 
                          width="24" 
                          height="24" 
                          viewBox="0 0 24 24" 
                          fill="none" 
                          stroke="#E38B52" 
                          strokeWidth="2" 
                          strokeLinecap="round" 
                          strokeLinejoin="round"
                        >
                          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                          <polyline points="14 2 14 8 20 8"/>
                          <line x1="16" y1="13" x2="8" y2="13"/>
                          <line x1="16" y1="17" x2="8" y2="17"/>
                          <line x1="10" y1="9" x2="8" y2="9"/>
                        </svg>
                        <div>
                          <p className="font-medium text-[#170F49]">Academic Excellence Certificate</p>
                          <p className="text-sm text-[#6F6C90]">Uploaded on 15 Jan 2024</p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button className="p-2 hover:bg-white/80 rounded-lg transition-all duration-200">
                          <svg 
                            width="20" 
                            height="20" 
                            viewBox="0 0 24 24" 
                            fill="none" 
                            stroke="currentColor" 
                            strokeWidth="2" 
                            strokeLinecap="round" 
                            strokeLinejoin="round"
                          >
                            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                            <circle cx="12" cy="12" r="3"/>
                          </svg>
                        </button>
                        <button className="p-2 hover:bg-white/80 rounded-lg transition-all duration-200">
                          <svg 
                            width="20" 
                            height="20" 
                            viewBox="0 0 24 24" 
                            fill="none" 
                            stroke="currentColor" 
                            strokeWidth="2" 
                            strokeLinecap="round" 
                            strokeLinejoin="round"
                          >
                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                            <polyline points="7 10 12 15 17 10"/>
                            <line x1="12" y1="15" x2="12" y2="3"/>
                          </svg>
                        </button>
                      </div>
                    </div>

                    <div className="flex items-center justify-between p-4 bg-white/70 rounded-xl">
                      <div className="flex items-center gap-3">
                        <svg 
                          width="24" 
                          height="24" 
                          viewBox="0 0 24 24" 
                          fill="none" 
                          stroke="#E38B52" 
                          strokeWidth="2" 
                          strokeLinecap="round" 
                          strokeLinejoin="round"
                        >
                          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                          <polyline points="14 2 14 8 20 8"/>
                          <line x1="16" y1="13" x2="8" y2="13"/>
                          <line x1="16" y1="17" x2="8" y2="17"/>
                          <line x1="10" y1="9" x2="8" y2="9"/>
                        </svg>
                        <div>
                          <p className="font-medium text-[#170F49]">Medical Certificate</p>
                          <p className="text-sm text-[#6F6C90]">Uploaded on 10 Jan 2024</p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button className="p-2 hover:bg-white/80 rounded-lg transition-all duration-200">
                          <svg 
                            width="20" 
                            height="20" 
                            viewBox="0 0 24 24" 
                            fill="none" 
                            stroke="currentColor" 
                            strokeWidth="2" 
                            strokeLinecap="round" 
                            strokeLinejoin="round"
                          >
                            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                            <circle cx="12" cy="12" r="3"/>
                          </svg>
                        </button>
                        <button className="p-2 hover:bg-white/80 rounded-lg transition-all duration-200">
                          <svg 
                            width="20" 
                            height="20" 
                            viewBox="0 0 24 24" 
                            fill="none" 
                            stroke="currentColor" 
                            strokeWidth="2" 
                            strokeLinecap="round" 
                            strokeLinejoin="round"
                          >
                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                            <polyline points="7 10 12 15 17 10"/>
                            <line x1="12" y1="15" x2="12" y2="3"/>
                          </svg>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
  <div className="grid grid-cols-1 gap-8">
    {/* Case Record Completion Progress Bar */}
    <div className="col-span-full bg-white/50 rounded-2xl p-6 shadow-lg border border-white/30">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-lg font-semibold text-[#170F49]">Case Record Completion</h3>
        <span className="text-xl font-bold text-[#E38B52]">{caseRecordCompletion}%</span>
      </div>
      <div className="w-full bg-white/50 rounded-full h-3 shadow-inner">
        <div
          className="bg-gradient-to-r from-[#F58540] to-[#E38B52] h-3 rounded-full shadow-md transition-all duration-700 ease-out"
          style={{ width: `${caseRecordCompletion}%` }}
        ></div>
      </div>
    </div>

    {/* Identification Data Section */}
    <div className="col-span-full">
      <h2 className="text-2xl font-bold text-[#170F49] mb-6 pb-4 border-b border-[#E38B52]/20 flex items-center">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2 text-[#E38B52]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2" />
        </svg>
        Identification Data
      </h2>
      <div className="p-6 bg-white/50 rounded-2xl mb-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="md:col-span-2">
            <p className="text-sm text-[#6F6C90]">Name</p>
            <p className="text-[#170F49] font-medium">{student?.name || 'N/A'}</p>
          </div>
          <div className="md:col-span-2">
            <p className="text-sm text-[#6F6C90]">Admission No</p>
            <p className="text-[#170F49] font-medium">{student?.admissionNumber || 'N/A'}</p>
          </div>
          <div className="md:col-span-2">
            <p className="text-sm text-[#6F6C90]">Date of Birth</p>
            <p className="text-[#170F49] font-medium">{student?.dob || 'N/A'}</p>
          </div>
          <div>
            <p className="text-sm text-[#6F6C90]">Age</p>
            <p className="text-[#170F49] font-medium">{student?.age || 'N/A'}</p>
          </div>
          <div>
            <p className="text-sm text-[#6F6C90]">Sex</p>
            <p className="text-[#170F49] font-medium">{student?.gender || 'N/A'}</p>
          </div>
          <div className="md:col-span-2">
            <p className="text-sm text-[#6F6C90]">Education</p>
            <p className="text-[#170F49] font-medium">{student?.class || 'N/A'}</p>
          </div>
          <div className="md:col-span-2">
            <p className="text-sm text-[#6F6C90]">Blood Group</p>
            <p className="text-[#170F49] font-medium">{student?.bloodGroup || 'N/A'}</p>
          </div>
          <div className="md:col-span-2">
            <p className="text-sm text-[#6F6C90]">Religion</p>
            <p className="text-[#170F49] font-medium">{student?.religion || 'N/A'}</p>
          </div>
          <div className="md:col-span-2">
            <p className="text-sm text-[#6F6C90]">Category (SC/ST/OBC/OEC)</p>
            <p className="text-[#170F49] font-medium">{student?.category || 'N/A'}</p>
          </div>
          <div className="md:col-span-4">
            <p className="text-sm text-[#6F6C90]">Aadhar Number</p>
            <p className="text-[#170F49] font-medium">{student?.aadharNumber || 'N/A'}</p>
          </div>
        </div>
      </div>
    </div>

{/* Demographic Data Section */}
<div className="col-span-full">
  <h2 className="text-2xl font-bold text-[#170F49] mb-6 pb-4 border-b border-[#E38B52]/20 flex items-center">
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2 text-[#E38B52]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
    </svg>
    Demographic Data
  </h2>
  <div className="space-y-6">
    {/* Family Cards */}
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {/* Father's Card */}
      <div className="bg-white/50 rounded-2xl p-6 shadow-sm hover:shadow-lg transition-shadow duration-300">
        <h3 className="text-lg font-semibold text-[#170F49] mb-4">Father's Information</h3>
        <div className="space-y-3">
          <div>
            <p className="text-sm text-[#6F6C90]">Name</p>
            <p className="text-[#170F49] font-medium">{student?.fatherName || 'N/A'}</p>
          </div>
          <div>
            <p className="text-sm text-[#6F6C90]">Education</p>
            <p className="text-[#170F49] font-medium">{student?.fatherEducation || 'N/A'}</p>
          </div>
          <div>
            <p className="text-sm text-[#6F6C90]">Occupation</p>
            <p className="text-[#170F49] font-medium">{student?.fatherOccupation || 'N/A'}</p>
          </div>
        </div>
      </div>

      {/* Mother's Card */}
      <div className="bg-white/50 rounded-2xl p-6 shadow-sm hover:shadow-lg transition-shadow duration-300">
        <h3 className="text-lg font-semibold text-[#170F49] mb-4">Mother's Information</h3>
        <div className="space-y-3">
          <div>
            <p className="text-sm text-[#6F6C90]">Name</p>
            <p className="text-[#170F49] font-medium">{student?.motherName || 'N/A'}</p>
          </div>
          <div>
            <p className="text-sm text-[#6F6C90]">Education</p>
            <p className="text-[#170F49] font-medium">{student?.motherEducation || 'N/A'}</p>
          </div>
          <div>
            <p className="text-sm text-[#6F6C90]">Occupation</p>
            <p className="text-[#170F49] font-medium">{student?.motherOccupation || 'N/A'}</p>
          </div>
        </div>
      </div>

      {/* Guardian's Card */}
      <div className="bg-white/50 rounded-2xl p-6 shadow-sm hover:shadow-lg transition-shadow duration-300">
        <h3 className="text-lg font-semibold text-[#170F49] mb-4">Guardian's Information</h3>
        <div className="space-y-3">
          <div>
            <p className="text-sm text-[#6F6C90]">Name</p>
            <p className="text-[#170F49] font-medium">{student?.guardianName || 'N/A'}</p>
          </div>
          <div>
            <p className="text-sm text-[#6F6C90]">Relationship</p>
            <p className="text-[#170F49] font-medium">{student?.guardianRelationship || 'N/A'}</p>
          </div>
          <div>
            <p className="text-sm text-[#6F6C90]">Occupation</p>
            <p className="text-[#170F49] font-medium">{student?.guardianOccupation || 'N/A'}</p>
          </div>
        </div>
      </div>
    </div>

    {/* Additional Info Section */}
    <div className="bg-white/50 rounded-2xl p-6 mt-6 shadow-sm">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <p className="text-sm text-[#6F6C90]">Total Family Income per Month</p>
          <p className="text-[#170F49] font-medium">{student?.totalFamilyIncome || 'N/A'}</p>
        </div>
        <div>
          <p className="text-sm text-[#6F6C90]">Address & Phone Number</p>
          <p className="text-[#170F49] font-medium">{student?.address_and_phone || `${student?.address}, ${student?.phoneNumber}`}</p>
        </div>
      </div>
    </div>
  </div>
</div>

{/* Contact & Medical Information */}
<div className="col-span-full">
    <h2 className="text-2xl font-bold text-[#170F49] mb-6 pb-4 border-b border-[#E38B52]/20 flex items-center">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2 text-[#E38B52]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2z" />
        </svg>
        Contact & Medical Information
    </h2>
    <div className="p-8 bg-white/50 rounded-2xl mb-8 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-6 border-b border-white/60">
            <div>
                <p className="text-sm text-[#6F6C90]">Informant's Name</p>
                <p className="text-lg text-[#170F49] font-medium">{student?.informantName || 'N/A'}</p>
            </div>
            <div>
                <p className="text-sm text-[#6F6C90]">Relationship</p>
                <p className="text-lg text-[#170F49] font-medium">{student?.informantRelationship || 'N/A'}</p>
            </div>
        </div>
        <div className="pb-6 border-b border-white/60">
            <p className="text-sm text-[#6F6C90]">Duration of Contact</p>
            <p className="text-lg text-[#170F49] font-medium">{student?.durationOfContact || 'N/A'}</p>
        </div>
        <div className="pb-6 border-b border-white/60">
            <p className="text-sm text-[#6F6C90]">Present Complaints</p>
            <p className="text-lg text-[#170F49] font-medium leading-relaxed">{student?.presentComplaints || 'N/A'}</p>
        </div>
        <div>
            <p className="text-sm text-[#6F6C90]">Previous Consultation and Treatments</p>
            <p className="text-lg text-[#170F49] font-medium leading-relaxed">{student?.previousTreatments || 'N/A'}</p>
        </div>
    </div>
</div>

              {/* Family History */}
              <div className="col-span-full">
                <h2 className="text-2xl font-bold text-[#170F49] mb-6 pb-4 border-b border-[#E38B52]/20 flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2 text-[#E38B52]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                  Family History
                </h2>
                <div className="space-y-6">
                  {/* Household Composition */}
                  <div className="p-6 bg-white/50 rounded-2xl">
                    <h3 className="text-lg font-semibold text-[#170F49] mb-4">Household Composition</h3>
                    <div className="overflow-x-auto">
                      <table className="w-full border-collapse rounded-xl overflow-hidden">
                        <thead className="bg-[#E38B52]/10">
                          <tr>
                            <th className="px-4 py-3 text-left text-sm font-semibold text-[#170F49]">S.No</th>
                            <th className="px-4 py-3 text-left text-sm font-semibold text-[#170F49]">Name</th>
                            <th className="px-4 py-3 text-left text-sm font-semibold text-[#170F49]">Age</th>
                            <th className="px-4 py-3 text-left text-sm font-semibold text-[#170F49]">Education</th>
                            <th className="px-4 py-3 text-left text-sm font-semibold text-[#170F49]">Occupation</th>
                            <th className="px-4 py-3 text-left text-sm font-semibold text-[#170F49]">Health</th>
                            <th className="px-4 py-3 text-left text-sm font-semibold text-[#170F49]">Income</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white/70">
                          <tr className="border-b border-[#E38B52]/10">
                            <td className="px-4 py-3 text-sm text-[#170F49]">1</td>
                            <td className="px-4 py-3 text-sm text-[#170F49]">{student?.fatherName}</td>
                            <td className="px-4 py-3 text-sm text-[#170F49]">42</td>
                            <td className="px-4 py-3 text-sm text-[#170F49]">{student?.fatherEducation}</td>
                            <td className="px-4 py-3 text-sm text-[#170F49]">{student?.fatherOccupation}</td>
                            <td className="px-4 py-3 text-sm text-[#170F49]">Good</td>
                            <td className="px-4 py-3 text-sm text-[#170F49]">₹30,000</td>
                          </tr>
                          <tr className="border-b border-[#E38B52]/10">
                            <td className="px-4 py-3 text-sm text-[#170F49]">2</td>
                            <td className="px-4 py-3 text-sm text-[#170F49]">{student?.motherName}</td>
                            <td className="px-4 py-3 text-sm text-[#170F49]">38</td>
                            <td className="px-4 py-3 text-sm text-[#170F49]">{student?.motherEducation}</td>
                            <td className="px-4 py-3 text-sm text-[#170F49]">{student?.motherOccupation}</td>
                            <td className="px-4 py-3 text-sm text-[#170F49]">Good</td>
                            <td className="px-4 py-3 text-sm text-[#170F49]">₹15,000</td>
                          </tr>
                          <tr>
                            <td className="px-4 py-3 text-sm text-[#170F49]">3</td>
                            <td className="px-4 py-3 text-sm text-[#170F49]">{student?.guardianName}</td>
                            <td className="px-4 py-3 text-sm text-[#170F49]">14</td>
                            <td className="px-4 py-3 text-sm text-[#170F49]">8th Grade</td>
                            <td className="px-4 py-3 text-sm text-[#170F49]">Student</td>
                            <td className="px-4 py-3 text-sm text-[#170F49]">Special Needs</td>
                            <td className="px-4 py-3 text-sm text-[#170F49]">-</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Medical History */}
<div className="p-6 bg-white/50 rounded-2xl">
  <h3 className="text-lg font-semibold text-[#170F49] mb-4">Medical History</h3>
  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
    <div>
      <p className="text-sm text-[#6F6C90]">Family History of Mental Illness</p>
      <p className="text-[#170F49] font-medium">{student?.familyHistory?.mental_illness || 'N/A'}</p>
    </div>
    <div>
      <p className="text-sm text-[#6F6C90]">Family History of Mental Retardation</p>
      <p className="text-[#170F49] font-medium">{student?.familyHistory?.mental_retardation || 'N/A'}</p>
    </div>
    <div>
      <p className="text-sm text-[#6F6C90]">Family History of Epilepsy and Others</p>
      <p className="text-[#170F49] font-medium">{student?.familyHistory?.epilepsy || 'N/A'}</p>
    </div>
  </div>
</div>

                 {/* Birth History */}
<div className="p-6 bg-white/50 rounded-2xl">
  <h3 className="text-lg font-semibold text-[#170F49] mb-4">Birth History</h3>
  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
    <div>
      <p className="text-sm text-[#6F6C90]">Prenatal History</p>
      <p className="text-[#170F49] font-medium">{student?.birthHistory?.prenatal || 'N/A'}</p>
    </div>
    <div>
      <p className="text-sm text-[#6F6C90]">Natal and Neonatal</p>
      <p className="text-[#170F49] font-medium">{student?.birthHistory?.natal || 'N/A'}</p>
    </div>
    <div>
      <p className="text-sm text-[#6F6C90]">Postnatal History</p>
      <p className="text-[#170F49] font-medium">{student?.birthHistory?.postnatal || 'N/A'}</p>
    </div>
  </div>
</div>
                </div>
              </div>
{/* Developmental History */}
<div className="p-6 bg-white/50 rounded-2xl mt-6">
    <h3 className="text-lg font-semibold text-[#170F49] mb-4">Developmental History</h3>
    <div className="grid grid-cols-2 md:grid-cols-4 gap-x-6 gap-y-4 p-4 bg-white/70 rounded-xl">
        {/* Check if developmentHistory exists and has entries */}
        {student?.developmentHistory && Object.keys(student.developmentHistory).length > 0 ? (
            Object.entries(student.developmentHistory).map(([key, value]) => (
                <div key={key} className="flex items-center">
                    {/* Display a green check for true, red cross for false */}
                    {value ? (
                        <span className="text-green-500 font-bold mr-2 text-xl">✓</span>
                    ) : (
                        <span className="text-red-500 font-bold mr-2 text-xl">✗</span>
                    )}
                    {/* Format the key from snake_case to Title Case */}
                    <p className="text-[#170F49] font-medium capitalize">
                        {key.replace(/_/g, ' ')}
                    </p>
                </div>
            ))
        ) : (
            <p className="col-span-full text-center text-[#6F6C90]">No development history recorded.</p>
        )}
    </div>
</div>
{/* Additional Information Section */}
<div className="col-span-full mt-6">
  <h2 className="text-2xl font-bold text-[#170F49] mb-6 pb-4 border-b border-[#E38B52]/20 flex items-center">
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2 text-[#E38B52]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
    Additional Information
  </h2>

  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
    {/* Check if additionalInfo exists and has keys */}
    {student?.additionalInfo && Object.keys(student.additionalInfo).length > 0 ? (
      Object.entries(student.additionalInfo).map(([key, value]) => (
        <div key={key} className="bg-white/50 rounded-2xl p-6 shadow-sm min-h-[120px]">
          <h3 className="text-md font-semibold text-[#170F49] mb-2 capitalize">
            {key.replace(/_/g, ' ')}
          </h3>
          <p className="text-[#170F49] text-base leading-relaxed">
            {value || 'N/A'}
          </p>
        </div>
      ))
    ) : (
      <div className="md:col-span-2 text-center p-6 bg-white/50 rounded-2xl">
        <p className="text-[#6F6C90]">No additional information has been recorded.</p>
      </div>
    )}
  </div>
</div>
{/* Special Education Assessment Section */}
<div className="col-span-full mt-6">
  <h2 className="text-2xl font-bold text-[#170F49] mb-6 pb-4 border-b border-[#E38B52]/20 flex items-center">
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2 text-[#E38B52]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h2" />
    </svg>
    Special Education Assessment
  </h2>

  {/* Self Help Section Card */}
  <div className="bg-white/50 rounded-2xl p-6 shadow-sm mb-6">
    <h3 className="text-xl font-semibold text-[#170F49] mb-4">Self Help</h3>
    <div className="space-y-4">

      {/* Food Habits */}
      <div className="bg-white/70 rounded-xl p-4">
        <h4 className="text-md font-medium text-[#170F49] mb-3">Food Habits</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-[#6F6C90]">Eating</p>
            <p className="text-[#170F49] font-medium">{student?.assessment?.self_help?.food_habits?.eating || 'N/A'}</p>
          </div>
          <div>
            <p className="text-sm text-[#6F6C90]">Drinking</p>
            <p className="text-[#170F49] font-medium">{student?.assessment?.self_help?.food_habits?.drinking || 'N/A'}</p>
          </div>
        </div>
      </div>

      {/* Other Habits */}
      <div className="bg-white/70 rounded-xl p-4 space-y-3">
        <div>
          <p className="text-sm text-[#6F6C90]">Toilet Habits</p>
          <p className="text-[#170F49] font-medium">{student?.assessment?.self_help?.toilet_habits || 'N/A'}</p>
        </div>
        <div>
          <p className="text-sm text-[#6F6C90]">Brushing</p>
          <p className="text-[#170F49] font-medium">{student?.assessment?.self_help?.brushing || 'N/A'}</p>
        </div>
        <div>
          <p className="text-sm text-[#6F6C90]">Bathing</p>
          <p className="text-[#170F49] font-medium">{student?.assessment?.self_help?.bathing || 'N/A'}</p>
        </div>
      </div>

      {/* Dressing */}
      <div className="bg-white/70 rounded-xl p-4">
        <h4 className="text-md font-medium text-[#170F49] mb-3">Dressing</h4>
        <div className="space-y-3">
          <div>
            <p className="text-sm text-[#6F6C90]">Removing and wearing clothes</p>
            <p className="text-[#170F49] font-medium">{student?.assessment?.self_help?.dressing?.removing_and_wearing || 'N/A'}</p>
          </div>
          <div>
            <p className="text-sm text-[#6F6C90]">Unbuttoning and Buttoning</p>
            <p className="text-[#170F49] font-medium">{student?.assessment?.self_help?.dressing?.buttoning || 'N/A'}</p>
          </div>
          <div>
            <p className="text-sm text-[#6F6C90]">Wearing shoes/Slippers</p>
            <p className="text-[#170F49] font-medium">{student?.assessment?.self_help?.dressing?.footwear || 'N/A'}</p>
          </div>
          <div>
            <p className="text-sm text-[#6F6C90]">Grooming</p>
            <p className="text-[#170F49] font-medium">{student?.assessment?.self_help?.dressing?.grooming || 'N/A'}</p>
          </div>
        </div>
      </div>
    </div>
  </div>
  {/* The other sections like Motor, Sensory, etc. will follow the same pattern here */}
</div>
{/* Motor Section Card */}
  <div className="bg-white/50 rounded-2xl p-6 shadow-sm mb-6">
    <h3 className="text-xl font-semibold text-[#170F49] mb-4">Motor</h3>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-white/70 rounded-xl p-4">
      <div>
        <p className="text-sm text-[#6F6C90]">Gross Motor</p>
        <p className="text-[#170F49] font-medium">{student?.assessment?.motor?.gross_motor || 'N/A'}</p>
      </div>
      <div>
        <p className="text-sm text-[#6F6C90]">Fine Motor</p>
        <p className="text-[#170F49] font-medium">{student?.assessment?.motor?.fine_motor || 'N/A'}</p>
      </div>
    </div>
  </div>

  {/* Sensory Section Card */}
  <div className="bg-white/50 rounded-2xl p-6 shadow-sm mb-6">
    <h3 className="text-xl font-semibold text-[#170F49] mb-4">Sensory</h3>
    <div className="bg-white/70 rounded-xl p-4">
      <p className="text-[#170F49] font-medium">{student?.assessment?.sensory || 'N/A'}</p>
    </div>
  </div>

  {/* Socialization Section Card */}
  <div className="bg-white/50 rounded-2xl p-6 shadow-sm mb-6">
    <h3 className="text-xl font-semibold text-[#170F49] mb-4">Socialization</h3>
    <div className="bg-white/70 rounded-xl p-4 space-y-4">
      <div>
        <p className="text-sm text-[#6F6C90]">Language/Communication</p>
        <p className="text-[#170F49] font-medium">{student?.assessment?.socialization?.language_communication || 'N/A'}</p>
      </div>
      <div>
        <p className="text-sm text-[#6F6C90]">Social Behaviour</p>
        <p className="text-[#170F49] font-medium">{student?.assessment?.socialization?.social_behaviour || 'N/A'}</p>
      </div>
      <div>
        <p className="text-sm text-[#6F6C90]">Mobility in the Neighborhood</p>
        <p className="text-[#170F49] font-medium">{student?.assessment?.socialization?.mobility || 'N/A'}</p>
      </div>
    </div>
  </div>

  {/* Cognitive Section Card */}
  <div className="bg-white/50 rounded-2xl p-6 shadow-sm mb-6">
    <h3 className="text-xl font-semibold text-[#170F49] mb-4">Cognitive</h3>
    <div className="space-y-4">
      <div className="bg-white/70 rounded-xl p-4 space-y-4">
        <div>
          <p className="text-sm text-[#6F6C90]">Attention</p>
          <p className="text-[#170F49] font-medium">{student?.assessment?.cognitive?.attention || 'N/A'}</p>
        </div>
        <div>
          <p className="text-sm text-[#6F6C90]">Identification of familiar objects</p>
          <p className="text-[#170F49] font-medium">{student?.assessment?.cognitive?.identification_of_objects || 'N/A'}</p>
        </div>
        <div>
          <p className="text-sm text-[#6F6C90]">Use of familiar objects</p>
          <p className="text-[#170F49] font-medium">{student?.assessment?.cognitive?.use_of_objects || 'N/A'}</p>
        </div>
        <div>
          <p className="text-sm text-[#6F6C90]">Following simple instruction</p>
          <p className="text-[#170F49] font-medium">{student?.assessment?.cognitive?.following_instruction || 'N/A'}</p>
        </div>
        <div>
          <p className="text-sm text-[#6F6C90]">Awareness of danger and hazards</p>
          <p className="text-[#170F49] font-medium">{student?.assessment?.cognitive?.awareness_of_danger || 'N/A'}</p>
        </div>
      </div>
      
      {/* Concept Formation */}
      <div className="bg-white/70 rounded-xl p-4">
        <h4 className="text-md font-medium text-[#170F49] mb-3">Concept Formation</h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <p className="text-sm text-[#6F6C90]">Color</p>
            <p className="text-[#170F49] font-medium">{student?.assessment?.cognitive?.concept_formation?.color || 'N/A'}</p>
          </div>
          <div>
            <p className="text-sm text-[#6F6C90]">Size</p>
            <p className="text-[#170F49] font-medium">{student?.assessment?.cognitive?.concept_formation?.size || 'N/A'}</p>
          </div>
          <div>
            <p className="text-sm text-[#6F6C90]">Sex</p>
            <p className="text-[#170F49] font-medium">{student?.assessment?.cognitive?.concept_formation?.sex || 'N/A'}</p>
          </div>
          <div>
            <p className="text-sm text-[#6F6C90]">Shape</p>
            <p className="text-[#170F49] font-medium">{student?.assessment?.cognitive?.concept_formation?.shape || 'N/A'}</p>
          </div>
          <div>
            <p className="text-sm text-[#6F6C90]">Number</p>
            <p className="text-[#170F49] font-medium">{student?.assessment?.cognitive?.concept_formation?.number || 'N/A'}</p>
          </div>
          <div>
            <p className="text-sm text-[#6F6C90]">Time</p>
            <p className="text-[#170F49] font-medium">{student?.assessment?.cognitive?.concept_formation?.time || 'N/A'}</p>
          </div>
          <div>
            <p className="text-sm text-[#6F6C90]">Money</p>
            <p className="text-[#170F49] font-medium">{student?.assessment?.cognitive?.concept_formation?.money || 'N/A'}</p>
          </div>
        </div>
      </div>
    </div>
  </div>

  {/* Academic Section Card */}
  <div className="bg-white/50 rounded-2xl p-6 shadow-sm mb-6">
    <h3 className="text-xl font-semibold text-[#170F49] mb-4">Academic</h3>
    <div className="bg-white/70 rounded-xl p-4 space-y-4">
      <div>
        <p className="text-sm text-[#6F6C90]">Reading</p>
        <p className="text-[#170F49] font-medium">{student?.assessment?.academic?.reading || 'N/A'}</p>
      </div>
      <div>
        <p className="text-sm text-[#6F6C90]">Writing</p>
        <p className="text-[#170F49] font-medium">{student?.assessment?.academic?.writing || 'N/A'}</p>
      </div>
      <div>
        <p className="text-sm text-[#6F6C90]">Arithmetic</p>
        <p className="text-[#170F49] font-medium">{student?.assessment?.academic?.arithmetic || 'N/A'}</p>
      </div>
    </div>
  </div>

  {/* Prevocational/Domestic Section Card */}
  <div className="bg-white/50 rounded-2xl p-6 shadow-sm mb-6">
    <h3 className="text-xl font-semibold text-[#170F49] mb-4">Prevocational/Domestic</h3>
    <div className="bg-white/70 rounded-xl p-4 space-y-4">
      <div>
        <p className="text-sm text-[#6F6C90]">Ability and Interest</p>
        <p className="text-[#170F49] font-medium">{student?.assessment?.prevocational?.ability_and_interest || 'N/A'}</p>
      </div>
      <div>
        <p className="text-sm text-[#6F6C90]">Items of Interest</p>
        <p className="text-[#170F49] font-medium">{student?.assessment?.prevocational?.items_of_interest || 'N/A'}</p>
      </div>
      <div>
        <p className="text-sm text-[#6F6C90]">Items of Dislike</p>
        <p className="text-[#170F49] font-medium">{student?.assessment?.prevocational?.items_of_dislike || 'N/A'}</p>
      </div>
    </div>
  </div>

  {/* Observations and Recommendations Card */}
  <div className="bg-white/50 rounded-2xl p-6 shadow-sm">
    <h3 className="text-xl font-semibold text-[#170F49] mb-4">Observations & Recommendations</h3>
    <div className="bg-white/70 rounded-xl p-4 space-y-4">
      <div>
        <p className="text-sm text-[#6F6C90]">Any peculiar behaviour/behaviour problems observed</p>
        <p className="text-[#170F49] font-medium">{student?.assessment?.behaviour_problems || 'N/A'}</p>
      </div>
      <div>
        <p className="text-sm text-[#6F6C90]">Any other</p>
        <p className="text-[#170F49] font-medium">{student?.assessment?.any_other || 'N/A'}</p>
      </div>
      <div>
        <p className="text-sm text-[#6F6C90]">Recommendation</p>
        <p className="text-[#170F49] font-medium">{student?.assessment?.recommendation || 'N/A'}</p>
      </div>
    </div>
  </div>
              {/* Medical Information */}
              <div className="col-span-full">
                <h2 className="text-2xl font-bold text-[#170F49] mb-6 pb-4 border-b border-[#E38B52]/20 flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2 text-[#E38B52]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                  </svg>
                  Medical Information
                </h2>
                <div className="space-y-6">
                  {/* Medical Status */}
                  <div className="p-6 bg-white/50 rounded-2xl">
                    <h3 className="text-lg font-semibold text-[#170F49] mb-4">Medical Status</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <p className="text-sm text-[#6F6C90]">Specific Diagnostic</p>
                        <p className="text-[#170F49] font-medium">{student?.specific_diagnostic || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-sm text-[#6F6C90]">Medical Conditions</p>
                        <div className="flex flex-wrap gap-2 mt-1">
                          {(student?.medical_conditions || '').toString().split(',').filter(Boolean).map((c, idx) => (
                            <span key={idx} className="px-3 py-1 bg-white/70 rounded-full text-sm text-[#170F49]">{c.trim()}</span>
                          ))}
                        </div>
                      </div>
                      <div>
                        <p className="text-sm text-[#6F6C90]">On Regular Drugs</p>
                        <p className="text-[#170F49] font-medium">{student?.is_on_regular_drugs || 'N/A'}</p>
                      </div>
                    </div>
                  </div>

                  {/* Drug History */}
                  <div className="p-6 bg-white/50 rounded-2xl">
                    <h3 className="text-lg font-semibold text-[#170F49] mb-4">Drug History</h3>
                    <p className="text-[#170F49] mb-4">{student?.is_on_regular_drugs ? student.is_on_regular_drugs : 'N/A'}</p>
                    <div className="overflow-x-auto">
                      <table className="w-full border-collapse rounded-xl overflow-hidden">
                        <thead className="bg-[#E38B52]/10">
                          <tr>
                            <th className="px-4 py-3 text-left text-sm font-semibold text-[#170F49]">S.No</th>
                            <th className="px-4 py-3 text-left text-sm font-semibold text-[#170F49]">Name of drug</th>
                            <th className="px-4 py-3 text-left text-sm font-semibold text-[#170F49]">Dose</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white/70">
                          {(student?.drug_history || []).map((d, i) => (
                            <tr key={i} className="border-b border-[#E38B52]/10">
                              <td className="px-4 py-3 text-sm text-[#170F49]">{i + 1}</td>
                              <td className="px-4 py-3 text-sm text-[#170F49]">{d?.name || 'N/A'}</td>
                              <td className="px-4 py-3 text-sm text-[#170F49]">{d?.dose || 'N/A'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Allergies */}
                  <div className="p-6 bg-white/50 rounded-2xl">
                    <h3 className="text-lg font-semibold text-[#170F49] mb-4">Allergies</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div>
                        <p className="text-sm text-[#6F6C90]">Drug Allergy</p>
                        <p className="text-[#170F49] font-medium">{student?.drug_allergy || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-sm text-[#6F6C90]">Food Allergy</p>
                        <p className="text-[#170F49] font-medium">{student?.food_allergy || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-sm text-[#6F6C90]">Other Allergies</p>
                        <p className="text-[#170F49] font-medium">{student?.allergies || 'N/A'}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Documents Section */}
              <div className="col-span-full">
                <h2 className="text-2xl font-bold text-[#170F49] mb-6 pb-4 border-b border-[#E38B52]/20 flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2 text-[#E38B52]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Documents
                </h2>
                <div className="p-6 bg-white/50 rounded-2xl">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-white/70 rounded-xl">
                      <div className="flex items-center gap-3">
                        <svg 
                          width="24" 
                          height="24" 
                          viewBox="0 0 24 24" 
                          fill="none" 
                          stroke="#E38B52" 
                          strokeWidth="2" 
                          strokeLinecap="round" 
                          strokeLinejoin="round"
                        >
                          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                          <polyline points="14 2 14 8 20 8"/>
                          <line x1="16" y1="13" x2="8" y2="13"/>
                          <line x1="16" y1="17" x2="8" y2="17"/>
                          <line x1="10" y1="9" x2="8" y2="9"/>
                        </svg>
                        <div>
                          <p className="font-medium text-[#170F49]">Medical Assessment Report</p>
                          <p className="text-sm text-[#6F6C90]">Updated on: 10 Jan 2024</p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button className="p-2 hover:bg-white/80 rounded-lg transition-all duration-200">
                          <svg 
                            width="20" 
                            height="20" 
                            viewBox="0 0 24 24" 
                            fill="none" 
                            stroke="currentColor" 
                            strokeWidth="2" 
                            strokeLinecap="round" 
                            strokeLinejoin="round"
                          >
                            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                            <circle cx="12" cy="12" r="3"/>
                          </svg>
                        </button>
                        <button className="p-2 hover:bg-white/80 rounded-lg transition-all duration-200">
                          <svg 
                            width="20" 
                            height="20" 
                            viewBox="0 0 24 24" 
                            fill="none" 
                            stroke="currentColor" 
                            strokeWidth="2" 
                            strokeLinecap="round" 
                            strokeLinejoin="round"
                          >
                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                            <polyline points="7 10 12 15 17 10"/>
                            <line x1="12" y1="15" x2="12" y2="3"/>
                          </svg>
                        </button>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between p-4 bg-white/70 rounded-xl">
                      <div className="flex items-center gap-3">
                        <svg 
                          width="24" 
                          height="24" 
                          viewBox="0 0 24 24" 
                          fill="none" 
                          stroke="#E38B52" 
                          strokeWidth="2" 
                          strokeLinecap="round" 
                          strokeLinejoin="round"
                        >
                          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                          <polyline points="14 2 14 8 20 8"/>
                          <line x1="16" y1="13" x2="8" y2="13"/>
                          <line x1="16" y1="17" x2="8" y2="17"/>
                          <line x1="10" y1="9" x2="8" y2="9"/>
                        </svg>
                        <div>
                          <p className="font-medium text-[#170F49]">Disability Certificate</p>
                          <p className="text-sm text-[#6F6C90]">Updated on: 5 Dec 2023</p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button className="p-2 hover:bg-white/80 rounded-lg transition-all duration-200">
                          <svg 
                            width="20" 
                            height="20" 
                            viewBox="0 0 24 24" 
                            fill="none" 
                            stroke="currentColor" 
                            strokeWidth="2" 
                            strokeLinecap="round" 
                            strokeLinejoin="round"
                          >
                            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                            <circle cx="12" cy="12" r="3"/>
                          </svg>
                        </button>
                        <button className="p-2 hover:bg-white/80 rounded-lg transition-all duration-200">
                          <svg 
                            width="20" 
                            height="20" 
                            viewBox="0 0 24 24" 
                            fill="none" 
                            stroke="currentColor" 
                            strokeWidth="2" 
                            strokeLinecap="round" 
                            strokeLinejoin="round"
                          >
                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                            <polyline points="7 10 12 15 17 10"/>
                            <line x1="12" y1="15" x2="12" y2="3"/>
                          </svg>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons with adjusted margin */}
          <div className="flex gap-4 mt-6 md:mt-8">
            {editMode ? (
              <>
                <button className="flex-1 bg-gray-300 py-4 rounded-2xl font-medium" onClick={handleEditCancel}>Cancel</button>
                <button className="flex-1 bg-[#E38B52] text-white py-4 rounded-2xl font-medium" onClick={handleEditSave}>Save Changes</button>
              </>
            ) : (
              <button className="flex-1 bg-[#E38B52] text-white py-4 rounded-2xl hover:bg-[#E38B52]/90 hover:-translate-y-1 transition-all duration-200 font-medium shadow-[inset_0_2px_4px_rgba(255,255,255,0.3),inset_0_4px_8px_rgba(255,255,255,0.2)]" onClick={handleEditStart}>
                Edit Details
              </button>
            )}
            {activeTab === 'case-record' ? (
              <button
                className="flex-1 bg-white/30 backdrop-blur-xl rounded-2xl shadow-xl p-3 border border-white/20 hover:-translate-y-1 transition-all font-medium duration-200"
                onClick={handleDownloadCaseRecord}
              >
                Download Case Record
              </button>
            ) : (
              <button
                className="flex-1 bg-white/30 backdrop-blur-xl rounded-2xl shadow-xl p-3 border border-white/20 hover:-translate-y-1 transition-all font-medium duration-200"
                onClick={handleDownloadProfile}
              >
                Download Profile
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Global styles for animations */}
      <style jsx global>{`
        @keyframes float {
          0% {
            transform: translate(0, 0) scale(1);
          }
          25% {
            transform: translate(100px, -100px) scale(1.2);
          }
          50% {
            transform: translate(0, 100px) scale(0.9);
          }
          75% {
            transform: translate(-100px, -50px) scale(1.1);
          }
          100% {
            transform: translate(0, 0) scale(1);
          }
        }
        .animate-float {
          animation: float 15s infinite ease-in-out;
        }
        .animation-delay-3000 {
          animation-delay: -5s;
        }
        .animation-delay-5000 {
          animation-delay: -10s;
        }
        .animation-delay-7000 {
          animation-delay: -15s;
        }

        @keyframes float-particle {
          0%, 100% { transform: translate(0, 0) scale(1); }
          50% { transform: translate(var(--tx), var(--ty)) scale(0.8); }
        }

        .particle-1, .particle-2, .particle-3 {
          position: absolute;
          width: 4px;
          height: 4px;
          border-radius: 50%;
          background: rgba(255, 255, 255, 0.5);
          pointer-events: none;
        }

        .particle-1 {
          top: 20%;
          left: 20%;
          --tx: 10px;
          --ty: -10px;
          animation: float-particle 3s infinite ease-in-out;
        }

        .particle-2 {
          top: 50%;
          right: 20%;
          --tx: -15px;
          --ty: 5px;
          animation: float-particle 4s infinite ease-in-out;
        }

        .particle-3 {
          bottom: 20%;
          left: 50%;
          --tx: 5px;
          --ty: 15px;
          animation: float-particle 5s infinite ease-in-out;
        }
      `}</style>
      
      {/* Move the button component INSIDE the main div */}
      <DynamicScrollButtons /> 

    </div>
  );
};

export default StudentPage;
