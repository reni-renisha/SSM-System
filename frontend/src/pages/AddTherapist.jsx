import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { formatAadhaar, cleanAadhaar } from '../utils/validation';

const AddTherapist = () => {
  const navigate = useNavigate();
  const [therapistData, setTherapistData] = useState({
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
    specialization: "",
  });
  const [aadharError, setAadharError] = useState('');
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [defaultPassword, setDefaultPassword] = useState('');

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    // Special handling for Aadhaar: allow typing with spaces, keep only digits, format in groups of 4
    if (name === 'aadhar_number') {
      const raw = String(value || '');
      const digits = raw.replace(/\D/g, '').slice(0, 12);
      const formatted = digits.replace(/(\d{4})(?=\d)/g, '$1 ').trim();
      setTherapistData({ ...therapistData, [name]: formatted });

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

    setTherapistData({ ...therapistData, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setErrors({});
      setIsSubmitting(true);

      // Validate therapist data
      if (!therapistData.name || !therapistData.address || !therapistData.date_of_birth || !therapistData.gender || !therapistData.blood_group || !therapistData.mobile_number || !therapistData.aadhar_number || !therapistData.religion || !therapistData.caste || !therapistData.rci_number || !therapistData.rci_renewal_date || !therapistData.qualifications_details || !therapistData.category || !therapistData.specialization || !therapistData.email) {
        alert('Please fill in all required fields.');
        setIsSubmitting(false);
        return;
      }

      // Clean Aadhaar before sending (remove spaces)
      const cleanedAadhaar = therapistData.aadhar_number ? String(cleanAadhaar(therapistData.aadhar_number)) : '';

      const finalData = {
        ...therapistData,
        aadhar_number: cleanedAadhaar || null,
      };

      // Create therapist
      await axios.post('http://localhost:8000/api/v1/therapists/', finalData);

      // Generate default password: Therapist + last 4 digits of Aadhaar or random
      const lastFourAadhaar = cleanedAadhaar ? cleanedAadhaar.slice(-4) : Math.floor(Math.random() * 10000).toString().padStart(4, '0');
      const generatedPassword = `Therapist${lastFourAadhaar}`;
      
      // Create user account
      try {
        const token = localStorage.getItem('token');
        await axios.post('http://localhost:8000/api/v1/users/', {
          username: therapistData.email.split('@')[0],
          email: therapistData.email,
          password: generatedPassword,
          role: 'therapist',
          is_active: true,
          is_superuser: false
        }, {
          headers: token ? { Authorization: `Bearer ${token}` } : {}
        });
      } catch (userError) {
        console.warn('User creation warning:', userError);
        // Continue anyway - therapist was created
      }

      setDefaultPassword(generatedPassword);
      setShowSuccessModal(true);
      
      // Auto-redirect after 60 seconds (1 minute)
      setTimeout(() => {
        navigate('/headmaster');
      }, 60000);
    } catch (error) {
      console.error('Error adding therapist:', error);
      setIsSubmitting(false);
      alert('Error adding therapist. Please try again.');
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
    .add-therapist-root input[type="checkbox"] {
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
    <div className="add-therapist-root min-h-screen w-full flex flex-col items-center justify-center bg-[#f7f7f7] relative overflow-hidden py-20">
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
          Add Therapist
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
                value={therapistData.name}
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
                value={therapistData.address}
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
                  value={therapistData.date_of_birth}
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
                  value={therapistData.gender}
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
                  value={therapistData.blood_group}
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
                  value={therapistData.mobile_number}
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
                value={therapistData.email}
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
                value={therapistData.aadhar_number}
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
                  value={therapistData.religion}
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
                  value={therapistData.caste}
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
                  value={therapistData.rci_number}
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
                  value={therapistData.rci_renewal_date}
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
                value={therapistData.qualifications_details}
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
                value={therapistData.category}
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

            {/* Specialization Section */}
            <div className="space-y-6 w-full">
              <h2 className="text-xl font-semibold text-[#170F49] border-b pb-2">
                Specialization
              </h2>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-[#170F49] ml-4">
                  Specialization <span className="text-red-500">*</span>
                </label>
                <select
                  id="specialization"
                  value={therapistData.specialization}
                  onChange={(e) => setTherapistData({ ...therapistData, specialization: e.target.value })}
                  className={selectClassName}
                  required
                >
                  <option value="">Select Specialization</option>
                  <option value="Speech Therapy">Speech Therapy</option>
                  <option value="Occupational Therapy">Occupational Therapy</option>
                  <option value="Physical Therapy">Physical Therapy</option>
                  <option value="Behavioral Therapy">Behavioral Therapy</option>
                  <option value="Special Education">Special Education</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-[#E38B52] text-white py-4 rounded-2xl hover:bg-[#C8742F] hover:-translate-y-1 transition-all duration-200 font-medium disabled:opacity-50 disabled:cursor-not-allowed
              shadow-[inset_0_2px_4px_rgba(255,255,255,0.3),inset_0_4px_8px_rgba(255,255,255,0.2)]"
            >
              {isSubmitting ? 'Adding Therapist...' : 'Add Therapist'}
            </button>
          </form>
        </div>
      </div>

      {/* Success Modal */}
      {showSuccessModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-30">
          <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md mx-4">
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                </svg>
              </div>
              <h3 className="text-xl font-bold text-[#170F49] mb-3">Therapist Added Successfully!</h3>
              <p className="text-gray-600 mb-4">A user account has been created for the therapist to login.</p>
              
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4 text-left">
                <p className="text-sm font-medium text-[#170F49] mb-2">Login Credentials:</p>
                <p className="text-sm text-gray-700 mb-1">
                  <span className="font-medium">Username:</span> {therapistData.email.split('@')[0]}
                </p>
                <p className="text-sm text-gray-700 mb-2">
                  <span className="font-medium">Password:</span> <code className="bg-white px-2 py-1 rounded border border-gray-300 font-mono">{defaultPassword}</code>
                </p>
                <p className="text-xs text-gray-500">The therapist can change this password after login.</p>
              </div>

              <p className="text-sm text-gray-500 mb-4">Redirecting to HeadMaster in 60 seconds...</p>
              
              <button
                onClick={() => navigate('/headmaster')}
                className="w-full px-6 py-2 bg-[#E38B52] text-white rounded-lg hover:bg-[#C8742F] font-medium transition-all"
              >
                Go to HeadMaster Now
              </button>
            </div>
          </div>
        </div>
      )}

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

export default AddTherapist;
