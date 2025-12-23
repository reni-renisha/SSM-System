import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { validateTeacher, formatAadhaar, cleanAadhaar } from '../utils/validation';

const AddTeacher = () => {
  const navigate = useNavigate();
  const [teacherData, setTeacherData] = useState({
    name: "",
    address: "",
    date_of_birth: "",
    gender: "",
    blood_group: "",
    mobile_number: "",
    aadhar_number: "",
    religion: "",
    caste: "",
    rci_number: "",
    rci_renewal_date: "",
    qualifications_details: "",
    category: "",
    email: "",
  });
  const [aadharError, setAadharError] = useState('');
  const [errors, setErrors] = useState({});

  const [classAssignment, setClassAssignment] = useState({
    class: "",
    year: new Date().getFullYear().toString()
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    // Special handling for Aadhaar: allow typing with spaces, keep only digits, format in groups of 4
    if (name === 'aadhar_number') {
      const raw = String(value || '');
      const digits = raw.replace(/\D/g, '').slice(0, 12);
      const formatted = digits.replace(/(\d{4})(?=\d)/g, '$1 ').trim();
      setTeacherData({ ...teacherData, [name]: formatted });

      if (digits.length === 0) {
        setAadharError('');
      } else if (digits.length !== 12) {
        setAadharError('Aadhaar must be exactly 12 digits.');
      } else if (!/^[2-9]\d{11}$/.test(digits)) {
        setAadharError('Aadhaar must start with a digit between 2 and 9.');
      } else {
        setAadharError('');
      }
      return;
    }

    setTeacherData({ ...teacherData, [name]: value });
  };

  const handleClassAssignmentChange = (field, value) => {
    setClassAssignment({ ...classAssignment, [field]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setErrors({});

      // Validate class assignment
      if (!classAssignment.class) {
        alert('Please select a class assignment.');
        return;
      }

      // Validate teacher data
      if (!teacherData.name || !teacherData.address || !teacherData.date_of_birth || !teacherData.gender || !teacherData.blood_group || !teacherData.mobile_number || !teacherData.aadhar_number || !teacherData.religion || !teacherData.caste || !teacherData.rci_number || !teacherData.rci_renewal_date || !teacherData.qualifications_details || !teacherData.category) {
        alert('Please fill in all required fields.');
        return;
      }

      // Clean Aadhaar before sending (remove spaces)
      const cleanedAadhaar = teacherData.aadhar_number ? String(cleanAadhaar(teacherData.aadhar_number)) : '';

      const teacherDataWithAssignments = {
        ...teacherData,
        aadhar_number: cleanedAadhaar || null,
        class_assignments: [classAssignment]
      };

      await axios.post('http://localhost:8000/api/v1/teachers/', teacherDataWithAssignments);
      navigate('/headmaster');
    } catch (error) {
      console.error('Error adding teacher:', error);
      alert('Error adding teacher. Please try again.');
    }
  };

  const selectClassName = `w-full px-4 py-4 rounded-2xl border bg-white shadow-lg focus:outline-none focus:ring-2 focus:ring-[#E38B52] transition-all appearance-none text-[#6F6C90] bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%23170F49%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.4-12.8z%22%2F%3E%3C%2Fsvg%3E')] bg-[length:12px_12px] bg-[center_right_1rem] bg-no-repeat pr-10`;

  const inputEditStyles = `
    .input-edit {
      width: 100%;
      padding: 8px 12px;
      border: 1px solid #d1d5db;
      border-radius: 6px;
      background-color: #f9fafb;
      font-size: 14px;
      transition: border-color 0.2s, box-shadow 0.2s;
    }
    .input-edit:focus {
      outline: none;
      border-color: #E38B52;
      box-shadow: 0 0 0 3px rgba(227, 139, 82, 0.1);
      background-color: white;
    }
    textarea.input-edit {
      resize: vertical;
      min-height: 120px;
    }

    /* Ensure checkbox checkmark/accent color matches Add Student (use accent-color) */
    .add-teacher-root input[type="checkbox"] {
      accent-color: #E38B52;
      -webkit-accent-color: #E38B52;
    }
  `;

  // inject styles to document head if not already injected
  if (typeof document !== 'undefined' && !document.getElementById('ssm-input-edit-styles')) {
    const styleElement = document.createElement('style');
    styleElement.id = 'ssm-input-edit-styles';
    styleElement.textContent = inputEditStyles;
    document.head.appendChild(styleElement);
  }

  return (
    <div className="add-teacher-root min-h-screen w-full flex flex-col items-center justify-center bg-[#f7f7f7] relative overflow-hidden py-20">
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
      
      <div className="w-[90%] max-w-[1200px] mx-4 flex-1 flex flex-col justify-center">
        <h1 className="text-3xl font-bold text-[#170F49] mb-8 text-center font-baskervville">
          Add Teacher
        </h1>
        
        {/* Container with adjusted padding */}
        <div className="relative bg-white/30 backdrop-blur-xl rounded-3xl shadow-xl p-8 md:p-12 border border-white/20 max-w-[600px] mx-auto w-full">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2 w-full">
              <label className="block text-sm font-medium text-[#170F49] ml-4">
                Name
              </label>
              <input
                type="text"
                name="name"
                id="name"
                value={teacherData.name}
                onChange={handleInputChange}
                placeholder="Enter Name"
                className="w-full px-4 py-4 rounded-2xl border bg-white shadow-lg focus:outline-none focus:ring-2 focus:ring-[#E38B52] transition-all placeholder:text-[#6F6C90]"
                required
              />
              {errors.name && (<p className="text-red-500 text-xs mt-1">{errors.name}</p>)}
            </div>

            <div className="space-y-2 w-full">
              <label className="block text-sm font-medium text-[#170F49] ml-4">
                Address
              </label>
              <textarea
                name="address"
                id="address"
                value={teacherData.address}
                onChange={handleInputChange}
                placeholder="Enter Address"
                className="input-edit"
                required
              />
              {errors.address && (<p className="text-red-500 text-xs mt-1">{errors.address}</p>)}
            </div>

            <div className="flex gap-4">
              <div className="flex-1 space-y-2">
                <label className="block text-sm font-medium text-[#170F49] ml-4">
                  Date of Birth
                </label>
                <input
                  type="date"
                  name="date_of_birth"
                  id="date_of_birth"
                  value={teacherData.date_of_birth}
                  onChange={handleInputChange}
                  className="w-full px-4 py-4 rounded-2xl border bg-white shadow-lg focus:outline-none focus:ring-2 focus:ring-[#E38B52] transition-all text-[#6F6C90]"
                  required
                />
                {errors.date_of_birth && (<p className="text-red-500 text-xs mt-1">{errors.date_of_birth}</p>)}
              </div>
              <div className="flex-1 space-y-2">
                <label className="block text-sm font-medium text-[#170F49] ml-4">
                  Gender
                </label>
                <select
                  name="gender"
                  id="gender"
                  value={teacherData.gender}
                  onChange={handleInputChange}
                  className={selectClassName}
                  required
                >
                  <option value="">Select Gender</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
                {errors.gender && (<p className="text-red-500 text-xs mt-1">{errors.gender}</p>)}
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex-1 space-y-2">
                <label className="block text-sm font-medium text-[#170F49] ml-4">
                  Blood Group
                </label>
                <select
                  name="blood_group"
                  id="blood_group"
                  value={teacherData.blood_group}
                  onChange={handleInputChange}
                  className={selectClassName}
                  required
                >
                  <option value="">Select Blood Group</option>
                  <option value="A+">A+</option>
                  <option value="A-">A-</option>
                  <option value="B+">B+</option>
                  <option value="B-">B-</option>
                  <option value="AB+">AB+</option>
                  <option value="AB-">AB-</option>
                  <option value="O+">O+</option>
                  <option value="O-">O-</option>
                </select>
                {errors.blood_group && (<p className="text-red-500 text-xs mt-1">{errors.blood_group}</p>)}
              </div>
              <div className="flex-1 space-y-2">
                <label className="block text-sm font-medium text-[#170F49] ml-4">
                  Mobile Number
                </label>
                <input
                  type="tel"
                  name="mobile_number"
                  id="mobile_number"
                  value={teacherData.mobile_number}
                  onChange={handleInputChange}
                  placeholder="Enter Mobile Number"
                  className="w-full px-4 py-4 rounded-2xl border bg-white shadow-lg focus:outline-none focus:ring-2 focus:ring-[#E38B52] transition-all placeholder:text-[#6F6C90]"
                  required
                />
                {errors.mobile_number && (<p className="text-red-500 text-xs mt-1">{errors.mobile_number}</p>)}
              </div>
            </div>
            <div className="space-y-2 w-full">
              <label className="block text-sm font-medium text-[#170F49] ml-4">
                Email
              </label>
              <input
                type="email"
                name="email"
                id="email"
                value={teacherData.email}
                onChange={handleInputChange}
                placeholder="Enter Email"
                className="w-full px-4 py-4 rounded-2xl border bg-white shadow-lg focus:outline-none focus:ring-2 focus:ring-[#E38B52] transition-all placeholder:text-[#6F6C90]"
                required
                pattern="^[^\s@]+@[^\s@]+\.[^\s@]+$"
                onInvalid={e => e.target.setCustomValidity('Please enter a valid email address (username@domain.extension) with no spaces.')}
                onInput={e => e.target.setCustomValidity('')}
              />
              {errors.email && (<p className="text-red-500 text-xs mt-1">{errors.email}</p>)}
            </div>

            <div className="space-y-2 w-full">
              <label className="block text-sm font-medium text-[#170F49] ml-4">
                Aadhar Number
              </label>
              <input
                type="text"
                name="aadhar_number"
                id="aadhar_number"
                value={teacherData.aadhar_number}
                onChange={handleInputChange}
                inputMode="numeric"
                pattern="\d{4}\s?\d{4}\s?\d{4}"
                maxLength={14}
                placeholder="1234 5678 9012"
                className="w-full px-4 py-4 rounded-2xl border bg-white shadow-lg focus:outline-none focus:ring-2 focus:ring-[#6366f1] transition-all placeholder:text-[#6F6C90]"
                required
              />
              {aadharError && <p className="text-red-500 text-xs mt-1">{aadharError}</p>}
              {errors.aadhar_number && !aadharError && (<p className="text-red-500 text-xs mt-1">{errors.aadhar_number}</p>)}
            </div>

            <div className="flex gap-4">
              <div className="flex-1 space-y-2">
                <label className="block text-sm font-medium text-[#170F49] ml-4">
                  Religion
                </label>
                <select
                  name="religion"
                  value={teacherData.religion}
                  onChange={handleInputChange}
                  className={selectClassName}
                  required
                >
                  <option value="">Select Religion</option>
                  <option value="Hindu">Hindu</option>
                  <option value="Christian">Christian</option>
                  <option value="Muslim">Muslim</option>
                  <option value="Sikh">Sikh</option>
                  <option value="Jew">Jew</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div className="flex-1 space-y-2">
                <label className="block text-sm font-medium text-[#170F49] ml-4">
                  Caste
                </label>
                <input
                  type="text"
                  name="caste"
                  value={teacherData.caste}
                  onChange={handleInputChange}
                  placeholder="Enter Caste"
                  className="w-full px-4 py-4 rounded-2xl border bg-white shadow-lg focus:outline-none focus:ring-2 focus:ring-[#E38B52] transition-all placeholder:text-[#6F6C90]"
                  required
                />
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex-1 space-y-2">
                <label className="block text-sm font-medium text-[#170F49] ml-4">
                  RCI Number
                </label>
                <input
                  type="text"
                  name="rci_number"
                  id="rci_number"
                  value={teacherData.rci_number}
                  onChange={handleInputChange}
                  placeholder="Enter RCI Number"
                  className="w-full px-4 py-4 rounded-2xl border bg-white shadow-lg focus:outline-none focus:ring-2 focus:ring-[#E38B52] transition-all placeholder:text-[#6F6C90]"
                  required
                />
                {errors.rci_number && (<p className="text-red-500 text-xs mt-1">{errors.rci_number}</p>)}
              </div>
              <div className="flex-1 space-y-2">
                <label className="block text-sm font-medium text-[#170F49] ml-4">
                  RCI Renewal Date
                </label>
                <input
                  type="date"
                  name="rci_renewal_date"
                  id="rci_renewal_date"
                  value={teacherData.rci_renewal_date}
                  onChange={handleInputChange}
                  className="w-full px-4 py-4 rounded-2xl border bg-white shadow-lg focus:outline-none focus:ring-2 focus:ring-[#E38B52] transition-all text-[#6F6C90]"
                  required
                />
                {errors.rci_renewal_date && (<p className="text-red-500 text-xs mt-1">{errors.rci_renewal_date}</p>)}
              </div>
            </div>

            <div className="space-y-2 w-full">
              <label className="block text-sm font-medium text-[#170F49] ml-4">
                Qualifications Details
              </label>
              <textarea
                name="qualifications_details"
                id="qualifications_details"
                value={teacherData.qualifications_details}
                onChange={handleInputChange}
                placeholder="Enter Qualifications Details"
                className="input-edit"
                required
              />
              {errors.qualifications_details && (<p className="text-red-500 text-xs mt-1">{errors.qualifications_details}</p>)}
            </div>

            <div className="space-y-2 w-full">
              <label className="block text-sm font-medium text-[#170F49] ml-4">
                Category
              </label>
              <select
                name="category"
                id="category"
                value={teacherData.category}
                onChange={handleInputChange}
                className={selectClassName}
                required
              >
                <option value="">Select Category</option>
                <option value="General">General</option>
                <option value="OBC">OBC</option>
                <option value="SC">SC</option>
                <option value="ST">ST</option>
                <option value="Other">Other</option>
              </select>
              {errors.category && (<p className="text-red-500 text-xs mt-1">{errors.category}</p>)}
            </div>

            {/* Class Assignment Section */}
            <div className="space-y-6 w-full">
              <h2 className="text-xl font-semibold text-[#170F49] border-b pb-2">
                Class Assignment
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-[#170F49] ml-4">
                    Class <span className="text-red-500">*</span>
                  </label>
                  <select
                    id="class_assignment_class"
                    value={classAssignment.class}
                    onChange={(e) => handleClassAssignmentChange('class', e.target.value)}
                    className={selectClassName}
                    required
                  >
                    <option value="">Select Class</option>
                    <option value="PrePrimary">PrePrimary</option>
                    <option value="Primary 1">Primary 1</option>
                    <option value="Primary 2">Primary 2</option>
                    <option value="Secondary">Secondary</option>
                    <option value="Pre vocational 1">Pre vocational 1</option>
                    <option value="Pre vocational 2">Pre vocational 2</option>
                    <option value="Care group below 18 years">Care group below 18 years</option>
                    <option value="Care group Above 18 years">Care group Above 18 years</option>
                    <option value="Vocational 18-35 years">Vocational 18-35 years</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-[#170F49] ml-4">
                    Year <span className="text-red-500">*</span>
                  </label>
                  <select
                    id="class_assignment_year"
                    value={classAssignment.year}
                    onChange={(e) => handleClassAssignmentChange('year', e.target.value)}
                    className={selectClassName}
                    required
                  >
                    <option value={new Date().getFullYear().toString()}>{new Date().getFullYear()}</option>
                    {[...Array(5)].map((_, i) => {
                      const year = new Date().getFullYear() - i - 1;
                      return <option key={year} value={year.toString()}>{year}</option>
                    })}
                    {[...Array(5)].map((_, i) => {
                      const year = new Date().getFullYear() + i + 1;
                      return <option key={year} value={year.toString()}>{year}</option>
                    })}
                  </select>
                </div>
              </div>
            </div>

            <button
              type="submit"
              className="w-full bg-[#E38B52] text-white py-4 rounded-2xl hover:bg-[#C8742F] hover:-translate-y-1 transition-all duration-200 font-medium 
              shadow-[inset_0_2px_4px_rgba(255,255,255,0.3),inset_0_4px_8px_rgba(255,255,255,0.2)]"
            >
              Add Teacher
            </button>
          </form>
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
      `}</style>
    </div>
  );
};

export default AddTeacher;
