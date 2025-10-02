import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const ScrollToTopButton = () => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setVisible(window.scrollY > 300);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth"
    });
  };

  return (
    <button
      onClick={scrollToTop}
      title="Back to Top"
      className={`fixed z-50 bottom-8 right-8 w-12 h-12 flex items-center justify-center rounded-full bg-[#E38B52] text-white shadow-lg transition-all duration-300
        ${visible ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}
        hover:scale-110 hover:bg-[#C8742F] focus:outline-none`}
      style={{ boxShadow: '0 4px 12px rgba(0,0,0,0.2)' }}
      aria-label="Back to Top"
    >
      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
  <path strokeLinecap="round" strokeLinejoin="round" d="M12 19V5m0 0l-7 7m7-7l7 7" />
</svg>
    </button>
  );
};

const AddStudent = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("student-details");
  const [isSaving, setIsSaving] = useState(false);
  const [savedStudent, setSavedStudent] = useState(null); // store created/selected student
  // eslint-disable-next-line
  const [showSuccess, setShowSuccess] = useState(false);
  const [showPopup, setShowPopup] = useState(false);
  const [studentForm, setStudentForm] = useState({
    name: '',
    age: '',
    dob: '',
    gender: '',
    religion: '',
    caste: '',
    class_name: '',
    roll_no: '',
    birth_place: '',
    house_name: '',
    street_name: '',
    post_office: '',
    pin_code: '',
  revenue_district: '',
  block_panchayat: '',
  local_body: '',
  taluk: '',
    phone_number: '',
    email: '',
    father_name: '',
    father_education: '',
    father_occupation: '',
    mother_name: '',
    mother_education: '',
    mother_occupation: '',
    guardian_name: '',
    guardian_relationship: '',
    guardian_contact: '',
    academic_year: '',
    admission_number: '',
    admission_date: '',
    class_teacher: '',
    bank_name: '',
    account_number: '',
    branch: '',
    ifsc_code: '',
    disability_type: '',
    disability_percentage: '',
    medical_conditions: '',
    allergies: ''
  });

  const handleFieldChange = (field) => (e) => {
    setStudentForm((prev) => ({ ...prev, [field]: e.target.value }));
  };

  const saveStudent = async () => {
    try {
      setIsSaving(true);
      const baseUrl = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8000';
      const payload = { ...studentForm };
      if (!payload.dob) delete payload.dob;
      if (!payload.admission_date) delete payload.admission_date;
      if (payload.age !== undefined && payload.age !== '') {
        payload.age = parseInt(payload.age, 10);
        if (isNaN(payload.age)) delete payload.age;
      }
      if (payload.disability_percentage !== undefined) {
        const num = parseFloat(payload.disability_percentage);
        if (!Number.isNaN(num)) payload.disability_percentage = num;
        else delete payload.disability_percentage;
      }
      const endpoint = savedStudent?.id
        ? `${baseUrl}/api/v1/students/${savedStudent.id}`
        : `${baseUrl}/api/v1/students/`;
      const method = savedStudent?.id ? 'PUT' : 'POST';
      const res = await fetch(endpoint, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        let message = 'Failed to save student';
        if (err && err.detail) {
          if (Array.isArray(err.detail)) {
            message = err.detail
              .map((d) => {
                if (typeof d === 'string') return d;
                if (d && typeof d === 'object') {
                  const loc = Array.isArray(d.loc) ? d.loc.join('.') : d.loc;
                  return `${loc}: ${d.msg || d.error || 'invalid'}`;
                }
                return String(d);
              })
              .join('\n');
          } else if (typeof err.detail === 'object') {
            message = JSON.stringify(err.detail);
          } else if (typeof err.detail === 'string') {
            message = err.detail;
          }
        }
        throw new Error(message);
      }
      const data = await res.json();
      setSavedStudent(data);
      setShowPopup(true);
      // Optionally navigate or reset the form
      // navigate(-1);
    } catch (e) {
      alert(e.message || 'Error saving student');
    } finally {
      setIsSaving(false);
    }
  };

  const saveCaseRecord = async () => {
    if (!savedStudent?.id) {
      alert('Please save Student Details first to create a student, then save Case Record.');
      return;
    }
    try {
      setIsSaving(true);
      const baseUrl = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8000';

      // Minimal example: collect some of the case record fields already present
      const caseRecord = {
        identification: {
          religion: studentForm.religion,
          caste: studentForm.caste,
          disability_type: studentForm.disability_type,
          disability_percentage: studentForm.disability_percentage ? Number(studentForm.disability_percentage) : undefined,
          aadhar_number: undefined,
          blood_group: undefined,
          category: undefined,
        },
        demographic: {
          father_name: studentForm.father_name,
          father_education: studentForm.father_education,
          father_occupation: studentForm.father_occupation,
          mother_name: studentForm.mother_name,
          mother_education: studentForm.mother_education,
          mother_occupation: studentForm.mother_occupation,
          guardian_name: studentForm.guardian_name,
          guardian_relationship: studentForm.guardian_relationship,
          guardian_contact: studentForm.guardian_contact,
        },
        medical: {
          medical_conditions: studentForm.medical_conditions,
          allergies: studentForm.allergies,
          drugs: drugRows,
        },
        family: {
          household: householdRows,
        }
      };

      const res = await fetch(`${baseUrl}/api/v1/students/${savedStudent.id}/case-record`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(caseRecord)
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        let message = 'Failed to save case record';
        if (err && err.detail) {
          if (Array.isArray(err.detail)) {
            message = err.detail.map((d) => (typeof d === 'string' ? d : `${(d.loc||[]).join('.')}: ${d.msg || 'invalid'}`)).join('\n');
          } else if (typeof err.detail === 'object') message = JSON.stringify(err.detail);
          else if (typeof err.detail === 'string') message = err.detail;
        }
        throw new Error(message);
      }
      const data = await res.json();
      setSavedStudent(data);
      alert('Case record saved.');
    } catch (e) {
      alert(e.message || 'Error saving case record');
    } finally {
      setIsSaving(false);
    }
  };
const [householdRows, setHouseholdRows] = useState([
    { id: 1, name: '', age: '', education: '', occupation: '', health: '', income: '' }
  ]);

  const [drugRows, setDrugRows] = useState([
    { id: 1, name: '', dose: '' }
  ]);

  const addDrugRow = () => {
    const newRow = {
      id: drugRows.length + 1,
      name: '',
      dose: ''
    };
    setDrugRows([...drugRows, newRow]);
  };

  const addHouseholdRow = () => {
    const newRow = {
      id: householdRows.length + 1,
      name: '',
      age: '',
      education: '',
      occupation: '',
      health: '',
      income: ''
    };
    setHouseholdRows([...householdRows, newRow]);
  };

  const handleLogout = () => {
    navigate('/');
  };

  const selectClass = "w-full px-4 py-3 pr-8 rounded-xl border bg-white shadow-lg hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-[#E38B52] transition-all duration-300 text-[#6F6C90]";

  return (
    <div className="min-h-screen w-full flex flex-col items-center bg-[#f7f7f7] relative overflow-x-hidden py-20">
      {showPopup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-30">
          <div className="bg-white px-8 py-8 rounded-2xl shadow-2xl flex flex-col items-center gap-6 animate-fade-in min-w-[320px] max-w-[90vw]">
            <div className="text-green-600 text-2xl font-bold mb-2">Success!</div>
            <div className="text-gray-700 text-lg mb-4 text-center">Student details have been saved successfully.</div>
            <button
              className="bg-[#E38B52] text-white px-8 py-3 rounded-xl font-semibold text-lg hover:bg-[#C8742F] transition-all duration-200 shadow-md"
              onClick={() => { setShowPopup(false); navigate('/headmaster'); }}
            >
              Go to List
            </button>
          </div>
        </div>
      )}
      {showSuccess && (
        <div className="fixed top-8 right-8 z-50 bg-green-500 text-white px-6 py-3 rounded-xl shadow-lg animate-fade-in">
          Student details saved successfully!
        </div>
      )}
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

      {/* Animated background blobs with fixed positioning */}
      <div className="fixed top-0 -left-40 w-[600px] h-[500px] bg-[#E38B52] rounded-full mix-blend-multiply filter blur-2xl opacity-30 animate-float z-0" />
      <div className="fixed -bottom-32 right-40 w-[600px] h-[600px] bg-[#E38B52] rounded-full mix-blend-multiply filter blur-2xl opacity-40 animate-float animation-delay-3000 z-0" />
      <div className="fixed top-1/2 left-1/2 w-[500px] h-[500px] bg-[#E38B52] rounded-full mix-blend-multiply filter blur-2xl opacity-40 animate-float animation-delay-5000 z-0" />
      
      {/* Logout Button */}
      <div className="fixed top-6 right-6 z-50">
        <button
          onClick={handleLogout}
          className="px-6 py-3 bg-[#E38B52] text-white rounded-xl hover:bg-[#4f46e5] transition-all duration-200 shadow-[inset_0_2px_4px_rgba(255,255,255,0.3),inset_0_4px_8px_rgba(255,255,255,0.2)] hover:-translate-y-1 hover:scale-105 flex items-center gap-2"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M3 3a1 1 0 011 1v12a1 1 0 11-2 0V4a1 1 0 011-1zm7.707 3.293a1 1 0 010 1.414L9.414 9H17a1 1 0 110 2H9.414l1.293 1.293a1 1 0 01-1.414 1.414l-3-3a1 1 0 010-1.414l3-3a1 1 0 011.414 0z"
              clipRule="evenodd"
            />
          </svg>
          Logout
        </button>
      </div>

      {/* Header Text */}
      <div className="text-center mb-12 z-10">
        <h1 className="text-4xl font-bold text-[#170F49] font-baskervville">
          Add Student
        </h1>
        <p className="text-[#6F6C8F] mt-2">
          Add a new student to the system
        </p>
      </div>
      {/* Date and Day Section */}
      <div className="mb-6 text-center z-10">
        <p className="text-lg font-medium text-[#6F6C8F]">
          {new Date().toLocaleDateString('en-IN', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          })}
        </p>
      </div>

      <div className="w-[90%] max-w-[1200px] mx-4 z-10">
        {/* Tabs */}
        <div className="flex justify-center mb-8">
          <div className="bg-white/30 backdrop-blur-xl rounded-2xl p-2 inline-flex gap-2 shadow-lg relative w-[372px]">
            {/* Active Tab Background */}
            <div
              className="absolute h-[calc(100%-8px)] top-[4px] transition-all duration-300 ease-in-out rounded-xl bg-[#E38B52] shadow-[inset_0_2px_4px_rgba(255,255,255,0.3),inset_0_4px_8px_rgba(255,255,255,0.2)]"
              style={{
                left: activeTab === "student-details" ? "4px" : "188px",
                width: "180px",
                background: 'linear-gradient(135deg, #E38B52 0%, #F58540 100%)',
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
          </div>
        </div>
        
        {/* Main content */}
        <div className="space-y-8">
          {activeTab === "student-details" ? (
            <div className="bg-white/30 backdrop-blur-xl rounded-3xl shadow-xl p-8 md:p-12 border border-white/20 space-y-6">
              {/* Student Details Form */}
              <div className="space-y-8">
                {/* Personal Information */}
                <div>
                  <h3 className="text-xl font-semibold text-[#170F49] mb-6">Personal Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-[#170F49] mb-2">Name of Student</label>
                      <input
                        type="text"
                         className="w-full px-4 py-3 rounded-xl border bg-white shadow-lg hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-[#E38B52] transition-all duration-300"
                        placeholder="Enter student's full name"
                         value={studentForm.name}
                         onChange={handleFieldChange('name')}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-[#170F49] mb-2">Age</label>
                        <input
                          type="text"
                          inputMode="numeric"
                          pattern="[0-9]*"
                          className="w-full px-4 py-3 rounded-xl border bg-white shadow-lg hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-[#E38B52] transition-all duration-300"
                          placeholder="Age"
                          value={studentForm.age}
                          onChange={handleFieldChange('age')}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-[#170F49] mb-2">Sex</label>
                        <select className={selectClass} value={studentForm.gender} onChange={handleFieldChange('gender')}>
                          <option value="">Select</option>
                          <option value="male">Male</option>
                          <option value="female">Female</option>
                          <option value="other">Other</option>
                        </select>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Address Details */}
                <div>
                  <h3 className="text-xl font-semibold text-[#170F49] mb-6">Address Details</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-[#170F49] mb-2">Birth Place</label>
                      <input
                        type="text"
                        className="w-full px-4 py-3 rounded-xl border bg-white shadow-lg hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-[#E38B52] transition-all duration-300"
                        placeholder="Enter birth place"
                        value={studentForm.birth_place}
                        onChange={handleFieldChange('birth_place')}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-[#170F49] mb-2">House Name</label>
                      <input
                        type="text"
                        className="w-full px-4 py-3 rounded-xl border bg-white shadow-lg hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-[#E38B52] transition-all duration-300"
                        placeholder="Enter house name"
                        value={studentForm.house_name}
                        onChange={handleFieldChange('house_name')}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-[#170F49] mb-2">Block Panchayat</label>
                      <input
                        type="text"
                        className="w-full px-4 py-3 rounded-xl border bg-white shadow-lg hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-[#E38B52] transition-all duration-300"
                        placeholder="Enter block panchayat"
                        value={studentForm.block_panchayat}
                        onChange={handleFieldChange('block_panchayat')}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-[#170F49] mb-2">Local Body</label>
                      <input
                        type="text"
                        className="w-full px-4 py-3 rounded-xl border bg-white shadow-lg hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-[#E38B52] transition-all duration-300"
                        placeholder="Enter local body"
                        value={studentForm.local_body}
                        onChange={handleFieldChange('local_body')}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-[#170F49] mb-2">Taluk</label>
                      <input
                        type="text"
                        className="w-full px-4 py-3 rounded-xl border bg-white shadow-lg hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-[#E38B52] transition-all duration-300"
                        placeholder="Enter taluk"
                        value={studentForm.taluk}
                        onChange={handleFieldChange('taluk')}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-[#170F49] mb-2">Street Name</label>
                      <input
                        type="text"
                        className="w-full px-4 py-3 rounded-xl border bg-white shadow-lg hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-[#E38B52] transition-all duration-300"
                        placeholder="Enter street name"
                        value={studentForm.street_name}
                        onChange={handleFieldChange('street_name')}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-[#170F49] mb-2">Post Office</label>
                      <input
                        type="text"
                        className="w-full px-4 py-3 rounded-xl border bg-white shadow-lg hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-[#E38B52] transition-all duration-300"
                        placeholder="Enter post office"
                        value={studentForm.post_office}
                        onChange={handleFieldChange('post_office')}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-[#170F49] mb-2">Pin Code</label>
                      <input
                        type="text"
                        className="w-full px-4 py-3 rounded-xl border bg-white shadow-lg hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-[#E38B52] transition-all duration-300"
                        placeholder="Enter pin code"
                        maxLength="6"
                        value={studentForm.pin_code}
                        onChange={handleFieldChange('pin_code')}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-[#170F49] mb-2">Revenue District</label>
                      <input
                        type="text"
                        className="w-full px-4 py-3 rounded-xl border bg-white shadow-lg hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-[#E38B52] transition-all duration-300"
                        placeholder="Enter revenue district"
                        value={studentForm.revenue_district}
                        onChange={handleFieldChange('revenue_district')}
                      />
                    </div>
                  </div>
                </div>

                {/* Contact Details */}
                <div>
                  <h3 className="text-xl font-semibold text-[#170F49] mb-6">Contact Details</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-[#170F49] mb-2">Phone Number</label>
                      <input
                        type="tel"
                        className="w-full px-4 py-3 rounded-xl border bg-white shadow-lg hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-[#E38B52] transition-all duration-300"
                        placeholder="Enter phone number"
                        value={studentForm.phone_number}
                        onChange={handleFieldChange('phone_number')}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-[#170F49] mb-2">Email</label>
                      <input
                        type="email"
                        className="w-full px-4 py-3 rounded-xl border bg-white shadow-lg hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-[#E38B52] transition-all duration-300"
                        placeholder="Enter email address"
                        value={studentForm.email}
                        onChange={handleFieldChange('email')}
                      />
                    </div>
                  </div>
                </div>

                {/* Additional Details */}
                <div>
                  <h3 className="text-xl font-semibold text-[#170F49] mb-6">Additional Details</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-[#170F49] mb-2">Aadhar Number</label>
                      <input
                        type="text"
                        className="w-full px-4 py-3 rounded-xl border bg-white shadow-lg hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-[#E38B52] transition-all duration-300"
                        placeholder="Enter aadhar number"
                        maxLength="12"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-[#170F49] mb-2">Date of Birth</label>
                      <input
                        type="date"
                        className="w-full px-4 py-3 rounded-xl border bg-white shadow-lg hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-[#E38B52] transition-all duration-300"
                        value={studentForm.dob}
                        onChange={handleFieldChange('dob')}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-[#170F49] mb-2">Date of Admission</label>
                      <input
                        type="date"
                        className="w-full px-4 py-3 rounded-xl border bg-white shadow-lg hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-[#E38B52] transition-all duration-300"
                        value={studentForm.admission_date}
                        onChange={handleFieldChange('admission_date')}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-[#170F49] mb-2">Admission Number</label>
                      <input
                        type="text"
                        className="w-full px-4 py-3 rounded-xl border bg-white shadow-lg hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-[#E38B52] transition-all duration-300"
                        placeholder="Enter admission number"
                        value={studentForm.admission_number}
                        onChange={handleFieldChange('admission_number')}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-[#170F49] mb-2">Father's Name</label>
                      <input
                        type="text"
                        className="w-full px-4 py-3 rounded-xl border bg-white shadow-lg hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-[#E38B52] transition-all duration-300"
                        placeholder="Enter father's name"
                        value={studentForm.father_name}
                        onChange={handleFieldChange('father_name')}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-[#170F49] mb-2">Mother's Name</label>
                      <input
                        type="text"
                        className="w-full px-4 py-3 rounded-xl border bg-white shadow-lg hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-[#E38B52] transition-all duration-300"
                        placeholder="Enter mother's name"
                        value={studentForm.mother_name}
                        onChange={handleFieldChange('mother_name')}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-[#170F49] mb-2">Religion</label>
                      <select className={selectClass} value={studentForm.religion} onChange={handleFieldChange('religion')}>
                        <option value="">Select religion</option>
                        <option value="hinduism">Hinduism</option>
                        <option value="christianity">Christianity</option>
                        <option value="islam">Islam</option>
                        <option value="sikhism">Sikhism</option>
                        <option value="buddhism">Buddhism</option>
                        <option value="jainism">Jainism</option>
                        <option value="other">Other</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-[#170F49] mb-2">Caste</label>
                      <input
                        type="text"
                        className="w-full px-4 py-3 rounded-xl border bg-white shadow-lg hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-[#E38B52] transition-all duration-300"
                        placeholder="Enter caste"
                        value={studentForm.caste}
                        onChange={handleFieldChange('caste')}
                      />
                    </div>
                  </div>
                </div>

                {/* Academic Information */}
                <div>
                  <h3 className="text-xl font-semibold text-[#170F49] mb-6">Academic Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-[#170F49] mb-2">Class Name</label>
                      <select
                        className={selectClass}
                        value={studentForm.class_name}
                        onChange={handleFieldChange('class_name')}
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
                    <div>
                      <label className="block text-sm font-medium text-[#170F49] mb-2">Roll Number</label>
                      <input
                        type="text"
                        className="w-full px-4 py-3 rounded-xl border bg-white shadow-lg hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-[#E38B52] transition-all duration-300"
                        placeholder="Enter roll number"
                        value={studentForm.roll_no}
                        onChange={handleFieldChange('roll_no')}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-[#170F49] mb-2">Academic Year</label>
                      <input
                        type="text"
                        className="w-full px-4 py-3 rounded-xl border bg-white shadow-lg hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-[#E38B52] transition-all duration-300"
                        placeholder="e.g., 2024-2025"
                        value={studentForm.academic_year}
                        onChange={handleFieldChange('academic_year')}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-[#170F49] mb-2">Class Teacher</label>
                      <input
                        type="text"
                        className="w-full px-4 py-3 rounded-xl border bg-white shadow-lg hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-[#E38B52] transition-all duration-300"
                        placeholder="Enter class teacher's name"
                        value={studentForm.class_teacher}
                        onChange={handleFieldChange('class_teacher')}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-[#170F49] mb-2">Division (optional)</label>
                      <input
                        type="text"
                        className="w-full px-4 py-3 rounded-xl border bg-white shadow-lg hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-[#E38B52] transition-all duration-300"
                        placeholder="e.g., A, B"
                        onChange={(e)=>{ /* store in case record on save */ }}
                      />
                    </div>
                  </div>
                </div>

                {/* Disability Details */}
                <div>
                  <h3 className="text-xl font-semibold text-[#170F49] mb-6">Disability Details</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-[#170F49] mb-2">Type of Disability</label>
                      <input
                        type="text"
                        className="w-full px-4 py-3 rounded-xl border bg-white shadow-lg hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-[#E38B52] transition-all duration-300"
                        placeholder="Enter type of disability"
                        value={studentForm.disability_type}
                        onChange={handleFieldChange('disability_type')}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-[#170F49] mb-2">Percentage of Disability</label>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        className="w-full px-4 py-3 rounded-xl border bg-white shadow-lg hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-[#E38B52] transition-all duration-300"
                        placeholder="Enter percentage"
                        value={studentForm.disability_percentage}
                        onChange={handleFieldChange('disability_percentage')}
                      />
                    </div>
                  </div>
                </div>

                {/* Bank Details */}
                <div>
                  <h3 className="text-xl font-semibold text-[#170F49] mb-6">Bank Details</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-[#170F49] mb-2">Account Number</label>
                      <input
                        type="text"
                        className="w-full px-4 py-3 rounded-xl border bg-white shadow-lg hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-[#E38B52] transition-all duration-300"
                        placeholder="Enter account number"
                        value={studentForm.account_number}
                        onChange={handleFieldChange('account_number')}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-[#170F49] mb-2">Bank Name</label>
                      <input
                        type="text"
                        className="w-full px-4 py-3 rounded-xl border bg-white shadow-lg hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-[#E38B52] transition-all duration-300"
                        placeholder="Enter bank name"
                        value={studentForm.bank_name}
                        onChange={handleFieldChange('bank_name')}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-[#170F49] mb-2">Branch</label>
                      <input
                        type="text"
                        className="w-full px-4 py-3 rounded-xl border bg-white shadow-lg hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-[#E38B52] transition-all duration-300"
                        placeholder="Enter branch name"
                        value={studentForm.branch}
                        onChange={handleFieldChange('branch')}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-[#170F49] mb-2">IFSC Code</label>
                      <input
                        type="text"
                        className="w-full px-4 py-3 rounded-xl border bg-white shadow-lg hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-[#E38B52] transition-all duration-300"
                        placeholder="Enter IFSC code"
                        value={studentForm.ifsc_code}
                        onChange={handleFieldChange('ifsc_code')}
                      />
                    </div>
                  </div>
                </div>

                {/* Identification Marks */}
                <div>
                  <h3 className="text-xl font-semibold text-[#170F49] mb-6">Identification Marks</h3>
                  <div className="space-y-4">
                    <textarea
                      className="w-full px-4 py-3 rounded-xl border bg-white shadow-lg hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-[#E38B52] transition-all duration-300 resize-none"
                      rows="3"
                      placeholder="Enter identification marks"
                      value={studentForm.medical_conditions}
                      onChange={handleFieldChange('medical_conditions')}
                    ></textarea>
                  </div>
                </div>

                {/* Document Upload */}
                <div>
                  <h3 className="text-xl font-semibold text-[#170F49] mb-6">Document Upload</h3>
                  <div className="space-y-4">
                    <label 
                      htmlFor="document-upload" 
                      className="block w-full p-4 border-2 border-dashed border-[#E38B52] rounded-xl text-center cursor-pointer hover:bg-white/50 transition-all duration-200"
                    >
                      <svg 
                        className="mx-auto mb-2" 
                        width="24" 
                        height="24" 
                        viewBox="0 0 24 24" 
                        fill="none" 
                        stroke="currentColor" 
                        strokeWidth="2" 
                        strokeLinecap="round" 
                        strokeLinejoin="round"
                      >
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                        <polyline points="17 8 12 3 7 8"/>
                        <line x1="12" y1="3" x2="12" y2="15"/>
                      </svg>
                      <span className="text-[#E38B52] font-medium">Upload Documents</span>
                      <span className="block text-sm text-[#6F6C90] mt-1">Upload relevant documents (PDF format)</span>
                    </label>
                    <input type="file" id="document-upload" className="hidden" accept=".pdf" />
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-8">
              {/* Identification Data */}
              <div className="bg-white/30 backdrop-blur-xl rounded-3xl shadow-xl p-8 md:p-12 border border-white/20">
                <h2 className="text-2xl font-bold text-[#170F49] mb-10 pb-4 border-b border-[#E38B52]/20 flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2 text-[#E38B52]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2" />
                  </svg>
                  Identification Data
                </h2>

                <div className="bg-white/30 backdrop-blur-xl rounded-2xl p-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-[#170F49]">Name</label>
                      <input
                        type="text"
                        className="w-full px-4 py-3 rounded-xl border bg-white shadow-lg hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-[#E38B52] transition-all duration-300"
                        placeholder="Enter name"
                         value={studentForm.name}
                         onChange={handleFieldChange('name')}
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-[#170F49]">Sex</label>
                      <select className={selectClass} value={studentForm.gender} onChange={handleFieldChange('gender')}>
                        <option value="">Select sex</option>
                        <option value="male">Male</option>
                        <option value="female">Female</option>
                        <option value="other">Other</option>
                      </select>
                    </div>

                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-[#170F49]">Religion</label>
                      <select className={selectClass} value={studentForm.religion} onChange={handleFieldChange('religion')}>
                        <option value="">Select religion</option>
                        <option value="hinduism">Hinduism</option>
                        <option value="christianity">Christianity</option>
                        <option value="islam">Islam</option>
                        <option value="sikhism">Sikhism</option>
                        <option value="buddhism">Buddhism</option>
                        <option value="jainism">Jainism</option>
                        <option value="other">Other</option>
                      </select>
                    </div>

                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-[#170F49]">Admission Number</label>
                      <input
                        type="text"
                        className="w-full px-4 py-3 rounded-xl border bg-white shadow-lg hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-[#E38B52] transition-all duration-300"
                        placeholder="Enter admission number"
                        value={studentForm.admission_number}
                        onChange={handleFieldChange('admission_number')}
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-[#170F49]">Education</label>
                      <input
                        type="text"
                        className="w-full px-4 py-3 rounded-xl border bg-white shadow-lg hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-[#E38B52] transition-all duration-300"
                        placeholder="Enter education"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-[#170F49]">Date of Birth</label>
                      <input
                        type="date"
                        className="w-full px-4 py-3 rounded-xl border bg-white shadow-lg hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-[#E38B52] transition-all duration-300"
                        value={studentForm.dob}
                        onChange={handleFieldChange('dob')}
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-[#170F49]">Age</label>
                      <input
                        type="text"
                        className="w-full px-4 py-3 rounded-xl border bg-white shadow-lg hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-[#E38B52] transition-all duration-300"
                        placeholder="Enter age"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-[#170F49]">Blood Group</label>
                      <select className={selectClass}>
                        <option value="">Select blood group</option>
                        <option value="A+">A+</option>
                        <option value="A-">A-</option>
                        <option value="B+">B+</option>
                        <option value="B-">B-</option>
                        <option value="AB+">AB+</option>
                        <option value="AB-">AB-</option>
                        <option value="O+">O+</option>
                        <option value="O-">O-</option>
                      </select>
                    </div>

                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-[#170F49]">Aadhar Number</label>
                      <input
                        type="text"
                        className="w-full px-4 py-3 rounded-xl border bg-white shadow-lg hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-[#E38B52] transition-all duration-300"
                        placeholder="Enter Aadhar number"
                      />
                    </div>
                  </div>
                </div>

{/* Category Section */}
<div className="mt-6">
                  <label className="block text-sm font-medium text-[#170F49] mb-2">Category</label>
                  <div className="grid grid-cols-4 gap-4">
                    {['SC', 'ST', 'OBC', 'OEC'].map((category) => (
                      <label key={category} className="relative">
                        <input
                          type="radio"
                          name="category"
                          value={category}
                          className="peer absolute opacity-0"
                        />
                        <div className="flex items-center justify-center p-4 rounded-xl bg-white border-2 border-transparent cursor-pointer transition-all duration-300 hover:bg-white/90 peer-checked:bg-white peer-checked:border-[#E38B52] peer-checked:shadow-lg">
                          <span className="text-sm font-medium text-[#170F49]">{category}</span>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>
              </div>

              {/* Demographic Data */}
              <div className="bg-white/30 backdrop-blur-xl rounded-3xl shadow-xl p-8 md:p-12 border border-white/20">
                <h2 className="text-2xl font-bold text-[#170F49] mb-10 pb-4 border-b border-[#E38B52]/20 flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2 text-[#E38B52]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                  </svg>
                  Demographic Data
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
                  {/* Father's Information */}
                  <div className="bg-white/30 backdrop-blur-xl rounded-2xl p-6 space-y-8">
                    <h3 className="text-lg font-semibold text-[#170F49] pb-2 border-b border-[#E38B52]/10">Father's Details</h3>
                    <div className="space-y-6">
                      <div className="h-[85px]">
                        <label className="block text-sm font-medium text-[#170F49] mb-2">Father's Name</label>
                            <input
                          type="text"
                          className="w-full px-4 py-3 rounded-xl border bg-white shadow-lg hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-[#E38B52] transition-all duration-300"
                          placeholder="Enter father's name"
                              value={studentForm.father_name}
                              onChange={handleFieldChange('father_name')}
                        />
                      </div>
                      <div className="h-[85px]">
                        <label className="block text-sm font-medium text-[#170F49] mb-2">Father's Education</label>
                            <input
                          type="text"
                          className="w-full px-4 py-3 rounded-xl border bg-white shadow-lg hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-[#E38B52] transition-all duration-300"
                          placeholder="Enter father's education"
                              value={studentForm.father_education}
                              onChange={handleFieldChange('father_education')}
                        />
                      </div>
                      <div className="h-[85px]">
                        <label className="block text-sm font-medium text-[#170F49] mb-2">Father's Occupation</label>
                            <input
                          type="text"
                          className="w-full px-4 py-3 rounded-xl border bg-white shadow-lg hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-[#E38B52] transition-all duration-300"
                          placeholder="Enter father's occupation"
                              value={studentForm.father_occupation}
                              onChange={handleFieldChange('father_occupation')}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Mother's Information */}
                  <div className="bg-white/30 backdrop-blur-xl rounded-2xl p-6 space-y-8">
                    <h3 className="text-lg font-semibold text-[#170F49] pb-2 border-b border-[#E38B52]/10">Mother's Details</h3>
                    <div className="space-y-6">
                      <div className="h-[85px]">
                        <label className="block text-sm font-medium text-[#170F49] mb-2">Mother's Name</label>
                            <input
                          type="text"
                          className="w-full px-4 py-3 rounded-xl border bg-white shadow-lg hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-[#E38B52] transition-all duration-300"
                          placeholder="Enter mother's name"
                              value={studentForm.mother_name}
                              onChange={handleFieldChange('mother_name')}
                        />
                      </div>
                      <div className="h-[85px]">
                        <label className="block text-sm font-medium text-[#170F49] mb-2">Mother's Education</label>
                            <input
                          type="text"
                          className="w-full px-4 py-3 rounded-xl border bg-white shadow-lg hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-[#E38B52] transition-all duration-300"
                          placeholder="Enter mother's education"
                              value={studentForm.mother_education}
                              onChange={handleFieldChange('mother_education')}
                        />
                      </div>
                      <div className="h-[85px]">
                        <label className="block text-sm font-medium text-[#170F49] mb-2">Mother's Occupation</label>
                            <input
                          type="text"
                          className="w-full px-4 py-3 rounded-xl border bg-white shadow-lg hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-[#E38B52] transition-all duration-300"
                          placeholder="Enter mother's occupation"
                              value={studentForm.mother_occupation}
                              onChange={handleFieldChange('mother_occupation')}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Guardian's Information */}
                  <div className="bg-white/30 backdrop-blur-xl rounded-2xl p-6 space-y-8">
                    <h3 className="text-lg font-semibold text-[#170F49] pb-2 border-b border-[#E38B52]/10">Guardian's Details</h3>
                    <div className="space-y-6">
                      <div className="h-[85px]">
                        <label className="block text-sm font-medium text-[#170F49] mb-2">Guardian's Name</label>
                            <input
                          type="text"
                          className="w-full px-4 py-3 rounded-xl border bg-white shadow-lg hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-[#E38B52] transition-all duration-300"
                          placeholder="Enter guardian's name"
                              value={studentForm.guardian_name}
                              onChange={handleFieldChange('guardian_name')}
                        />
                      </div>
                      <div className="h-[85px]">
                        <label className="block text-sm font-medium text-[#170F49] mb-2">Guardian's Occupation</label>
                            <input
                          type="text"
                          className="w-full px-4 py-3 rounded-xl border bg-white shadow-lg hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-[#E38B52] transition-all duration-300"
                          placeholder="Enter guardian's occupation"
                              value={studentForm.guardian_contact}
                              onChange={handleFieldChange('guardian_contact')}
                        />
                      </div>
                      <div className="h-[85px]">
                        <label className="block text-sm font-medium text-[#170F49] mb-2">Guardian's Relationship</label>
                            <input
                          type="text"
                          className="w-full px-4 py-3 rounded-xl border bg-white shadow-lg hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-[#E38B52] transition-all duration-300"
                          placeholder="Enter guardian's relationship"
                              value={studentForm.guardian_relationship}
                              onChange={handleFieldChange('guardian_relationship')}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Additional Details */}
                <div className="mt-12 bg-white/30 backdrop-blur-xl rounded-2xl p-6 space-y-8">
                  <h3 className="text-lg font-semibold text-[#170F49] pb-2 border-b border-[#E38B52]/10">Additional Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-3">
                      <label className="block text-sm font-medium text-[#170F49] mb-3">Total Family Income per Month</label>
                      <input
                        type="text"
                        className="w-full px-4 py-3 rounded-xl border bg-white shadow-lg hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-[#E38B52] transition-all duration-300"
                        placeholder="Enter family income"
                      />
                    </div>
                    <div className="space-y-3">
                      <label className="block text-sm font-medium text-[#170F49] mb-3">Duration of Contact</label>
                      <input
                        type="text"
                        className="w-full px-4 py-3 rounded-xl border bg-white shadow-lg hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-[#E38B52] transition-all duration-300"
                        placeholder="Enter duration of contact"
                      />
                    </div>
                  </div>
                </div>

{/* Contact & Medical Information */}
                <div className="mt-10 space-y-8">
                  {/* Contact Information */}
                  <div className="bg-white/30 backdrop-blur-xl rounded-2xl p-6 space-y-8">
                    <h3 className="text-lg font-semibold text-[#170F49] pb-2 border-b border-[#6366f1]/10">Contact Information</h3>
                    <div className="space-y-8">
                      <div>
                        <label className="block text-sm font-medium text-[#170F49] mb-2">Address and Phone Number</label>
                        <textarea
                          className="w-full px-4 py-3 rounded-xl border bg-white shadow-lg hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-[#E38B52] transition-all duration-300 resize-none"
                          rows="3"
                          placeholder="Enter address and phone number"
                        ></textarea>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <label className="block text-sm font-medium text-[#170F49] mb-2">Informant's Name</label>
                          <input
                            type="text"
                            className="w-full px-4 py-3 rounded-xl border bg-white shadow-lg hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-[#E38B52] transition-all duration-300"
                            placeholder="Enter informant's name"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-[#170F49] mb-2">Informant's Relationship</label>
                          <input
                            type="text"
                            className="w-full px-4 py-3 rounded-xl border bg-white shadow-lg hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-[#E38B52] transition-all duration-300"
                            placeholder="Enter informant's relationship"
                          />
                        </div>
                      </div>

                      {/* Additional Contact Information */}
                      <div className="space-y-6 mt-6">
                        <div>
                          <label className="block text-sm font-medium text-[#170F49] mb-2">Duration of Contact</label>
                          <input
                            type="text"
                            className="w-full px-4 py-3 rounded-xl border bg-white shadow-lg hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-[#E38B52] transition-all duration-300"
                            placeholder="Enter duration of contact"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-[#170F49] mb-2">Present Complaints</label>
                          <textarea
                            className="w-full px-4 py-3 rounded-xl border bg-white shadow-lg hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-[#E38B52] transition-all duration-300 resize-none"
                            rows="3"
                            placeholder="Enter present complaints"
                          ></textarea>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-[#170F49] mb-2">Previous Consultation and Treatments</label>
                          <textarea
                            className="w-full px-4 py-3 rounded-xl border bg-white shadow-lg hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-[#E38B52] transition-all duration-300 resize-none"
                            rows="3"
                            placeholder="Enter previous consultation and treatments"
                          ></textarea>
                        </div>
                      </div>
                    </div>
                  </div>


                </div>
              </div>

              {/* Family History Container */}
              <div className="bg-white/30 backdrop-blur-xl rounded-3xl shadow-xl p-8 md:p-12 border border-white/20">
                <h2 className="text-2xl font-bold text-[#170F49] mb-10 pb-4 border-b border-[#E38B52]/20 flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2 text-[#E38B52]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                  Family History
                </h2>

                {/* Family Composition */}
                <div className="bg-white/30 backdrop-blur-xl rounded-2xl p-6 space-y-8 mb-8">
                  <h3 className="text-lg font-semibold text-[#170F49] pb-2 border-b border-[#E38B52]/10">Household Composition</h3>
                  <div className="overflow-hidden">
                    <table className="w-full border border-[#E38B52]/20 rounded-xl backdrop-blur-xl overflow-hidden">
                      <thead>
                        <tr className="border-b border-[#E38B52]/20">
                          <th className="px-4 py-3 text-left text-sm font-semibold text-[#170F49]">S.No</th>
                          <th className="px-4 py-3 text-left text-sm font-semibold text-[#170F49]">Name</th>
                          <th className="px-4 py-3 text-left text-sm font-semibold text-[#170F49]">Age</th>
                          <th className="px-4 py-3 text-left text-sm font-semibold text-[#170F49]">Education</th>
                          <th className="px-4 py-3 text-left text-sm font-semibold text-[#170F49]">Occupation</th>
                          <th className="px-4 py-3 text-left text-sm font-semibold text-[#170F49]">Health</th>
                          <th className="px-4 py-3 text-left text-sm font-semibold text-[#170F49]">Income</th>
                        </tr>
                      </thead>
                      <tbody>
                        {householdRows.map((row) => (
                          <tr key={row.id} className="border-b border-[#E38B52]/10">
                            <td className="px-4 py-3 text-sm text-[#170F49]">{row.id}</td>
                            <td className="px-4 py-3">
                              <input 
                                type="text"
                                value={row.name}
                                onChange={(e) => {
                                  const updatedRows = householdRows.map(r => 
                                    r.id === row.id ? { ...r, name: e.target.value } : r
                                  );
                                  setHouseholdRows(updatedRows);
                                }}
                                className="w-full px-3 py-2 bg-white/50 border border-[#E38B52]/20 rounded-xl shadow-lg hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-[#E38B52] transition-all duration-300"
                              />
                            </td>
                            <td className="px-4 py-3">
                              <input 
                                type="text"
                                value={row.age}
                                onChange={(e) => {
                                  const updatedRows = householdRows.map(r => 
                                    r.id === row.id ? { ...r, age: e.target.value } : r
                                  );
                                  setHouseholdRows(updatedRows);
                                }}
                                className="w-full px-3 py-2 bg-white/50 border border-[#E38B52]/20 rounded-xl shadow-lg hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-[#E38B52] transition-all duration-300"
                              />
                            </td>
                            <td className="px-4 py-3">
                              <input 
                                type="text"
                                value={row.education}
                                onChange={(e) => {
                                  const updatedRows = householdRows.map(r => 
                                    r.id === row.id ? { ...r, education: e.target.value } : r
                                  );
                                  setHouseholdRows(updatedRows);
                                }}
                                className="w-full px-3 py-2 bg-white/50 border border-[#E38B52]/20 rounded-xl shadow-lg hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-[#E38B52] transition-all duration-300"
                              />
                            </td>
                            <td className="px-4 py-3">
                              <input 
                                type="text"
                                value={row.occupation}
                                onChange={(e) => {
                                  const updatedRows = householdRows.map(r => 
                                    r.id === row.id ? { ...r, occupation: e.target.value } : r
                                  );
                                  setHouseholdRows(updatedRows);
                                }}
                                className="w-full px-3 py-2 bg-white/50 border border-[#E38B52]/20 rounded-xl shadow-lg hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-[#E38B52] transition-all duration-300"
                              />
                            </td>
                            <td className="px-4 py-3">
                              <input 
                                type="text"
                                value={row.health}
                                onChange={(e) => {
                                  const updatedRows = householdRows.map(r => 
                                    r.id === row.id ? { ...r, health: e.target.value } : r
                                  );
                                  setHouseholdRows(updatedRows);
                                }}
                                className="w-full px-3 py-2 bg-white/50 border border-[#E38B52]/20 rounded-xl shadow-lg hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-[#E38B52] transition-all duration-300"
                              />
                            </td>
                            <td className="px-4 py-3">
                              <input 
                                type="text"
                                value={row.income}
                                onChange={(e) => {
                                  const updatedRows = householdRows.map(r => 
                                    r.id === row.id ? { ...r, income: e.target.value } : r
                                  );
                                  setHouseholdRows(updatedRows);
                                }}
                                className="w-full px-3 py-2 bg-white/50 border border-[#E38B52]/20 rounded-xl shadow-lg hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-[#E38B52] transition-all duration-300"
                              />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    <button 
                      onClick={addHouseholdRow}
                      className="mt-4 w-full px-4 py-3 bg-[#E38B52] text-white rounded-xl hover:bg-[#E38B40] transition-all duration-200 shadow-[inset_0_2px_4px_rgba(255,255,255,0.3),inset_0_4px_8px_rgba(255,255,255,0.2)]"
                    >
                      Add Row
                    </button>
                  </div>
                </div>

                {/* Pedigree Chart Upload */}
                <div className="bg-white/30 backdrop-blur-xl rounded-2xl p-6 space-y-8 mb-8">
                  <h3 className="text-lg font-semibold text-[#170F49] pb-2 border-b border-[#E38B52]/10">Pedigree Chart</h3>
                  <label 
                    htmlFor="pedigree-upload" 
                    className="block w-full p-4 border-2 border-dashed border-[#E38B52] rounded-xl text-center cursor-pointer hover:bg-white/50 transition-all duration-200"
                  >
                    <svg 
                      className="mx-auto mb-2" 
                      width="24" 
                      height="24" 
                      viewBox="0 0 24 24" 
                      fill="none" 
                      stroke="currentColor" 
                      strokeWidth="2" 
                      strokeLinecap="round" 
                      strokeLinejoin="round"
                    >
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                      <polyline points="17 8 12 3 7 8"/>
                      <line x1="12" y1="3" x2="12" y2="15"/>
                    </svg>
                    <span className="text-[#E38B52] font-medium">Upload Pedigree Chart</span>
                    <span className="block text-sm text-[#6F6C90] mt-1">Supported formats: PDF, JPG, PNG</span>
                  </label>
                  <input type="file" id="pedigree-upload" className="hidden" accept=".pdf,.jpg,.jpeg,.png" />
                </div>

                {/* Family History Fields */}
                <div className="bg-white/30 backdrop-blur-xl rounded-2xl p-6 space-y-8 mb-8">
                  <h3 className="text-lg font-semibold text-[#170F49] pb-2 border-b border-[#E38B52]/10">Family Medical History</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-[#170F49] mb-2">Family History of Mental Illness</label>
                      <textarea
                        className="w-full px-4 py-3 rounded-xl border bg-white shadow-lg hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-[#E38B52] transition-all duration-300 resize-none"
                        rows="3"
                        placeholder="Enter family history of mental illness"
                      ></textarea>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-[#170F49] mb-2">Family History of Mental Retardation</label>
                      <textarea
                        className="w-full px-4 py-3 rounded-xl border bg-white shadow-lg hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-[#E38B52] transition-all duration-300 resize-none"
                        rows="3"
                        placeholder="Enter family history of mental retardation"
                      ></textarea>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-[#170F49] mb-2">Family History of Epilepsy and Others</label>
                      <textarea
                        className="w-full px-4 py-3 rounded-xl border bg-white shadow-lg hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-[#E38B52] transition-all duration-300 resize-none"
                        rows="3"
                        placeholder="Enter family history of epilepsy and other conditions"
                      ></textarea>
                    </div>
                  </div>
                </div>

                {/* Birth History Fields */}
                <div className="bg-white/30 backdrop-blur-xl rounded-2xl p-6 space-y-8 mb-8">
                  <h3 className="text-lg font-semibold text-[#170F49] pb-2 border-b border-[#E38B52]/10">Birth History</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-[#170F49] mb-2">Prenatal History</label>
                      <textarea
                        className="w-full px-4 py-3 rounded-xl border bg-white shadow-lg hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-[#E38B52] transition-all duration-300 resize-none"
                        rows="3"
                        placeholder="Enter prenatal history"
                      ></textarea>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-[#170F49] mb-2">Natal and Neonatal</label>
                      <textarea
                        className="w-full px-4 py-3 rounded-xl border bg-white shadow-lg hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-[#E38B52] transition-all duration-300 resize-none"
                        rows="3"
                        placeholder="Enter natal and neonatal history"
                      ></textarea>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-[#170F49] mb-2">Postnatal History</label>
                      <textarea
                        className="w-full px-4 py-3 rounded-xl border bg-white shadow-lg hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-[#E38B52] transition-all duration-300 resize-none"
                        rows="3"
                        placeholder="Enter postnatal history"
                      ></textarea>
                    </div>
                  </div>
                </div>

                {/* Development History */}
                <div className="bg-white/30 backdrop-blur-xl rounded-2xl p-6 space-y-8 mb-8">
                  <h3 className="text-lg font-semibold text-[#170F49] pb-2 border-b border-[#E38B52]/10">Development History</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-white p-6 rounded-xl shadow-lg">
                    {[
                      "Smiles at other", "Head Control", "Sitting", "Responds to name",
                      "Babbling", "First words", "Standing", "Walking",
                      "Two word phrases", "Toilet control", "Sentences", "Physical Deformity"
                    ].map((item) => (
                      <label key={item} className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          className="w-4 h-4 rounded border-gray-300 text-[#E38B52] focus:ring-[#E38B52]"
                        />
                        <span className="text-sm text-[#170F49]">{item}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Additional Information Fields */}
                <div className="bg-white/30 backdrop-blur-xl rounded-2xl p-6 space-y-8 mb-8">
                  <h3 className="text-lg font-semibold text-[#170F49] pb-2 border-b border-[#E38B52]/10">Additional Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {[
                      "School History",
                      "Occupational History",
                      "Behaviour Problems",
                      "Special Educational Assessment",
                      "Psychological Assessment",
                      "Medical Examination",
                      "Diagnosis",
                      "Management Plan"
                    ].map((field) => (
                      <div key={field}>
                        <label className="block text-sm font-medium text-[#170F49] mb-2">{field}</label>
                        <textarea
                          className="w-full px-4 py-3 rounded-xl border bg-white shadow-lg hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-[#E38B52] transition-all duration-300 resize-none"
                          rows="3"
                          placeholder={`Enter ${field.toLowerCase()}`}
                        ></textarea>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Special Education Assessment */}
              <div className="bg-white/30 backdrop-blur-xl rounded-3xl shadow-xl p-8 md:p-12 border border-white/20">
                <h2 className="text-2xl font-bold text-[#170F49] mb-10 pb-4 border-b border-[#E38B52]/20 flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2 text-[#E38B52]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h2" />
                  </svg>
                  Special Education Assessment
                </h2>

                {/* Self Help */}
                <div className="bg-white/30 backdrop-blur-xl rounded-2xl p-6 space-y-8 mb-8">
                  <h3 className="text-lg font-semibold text-[#170F49] pb-2 border-b border-[#E38B52]/10">Self Help</h3>
                  
                  {/* Food Habits */}
                  <div className="bg-white rounded-xl p-6 space-y-6 shadow-lg">
                    <h4 className="text-md font-medium text-[#170F49]">Food Habits</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-[#170F49] mb-2">Eating</label>
                        <input type="text" placeholder="Describe eating habits and capabilities" className="w-full px-4 py-3 rounded-xl border bg-white shadow-lg hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-[#E38B52] transition-all duration-300" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-[#170F49] mb-2">Drinking</label>
                        <input type="text" placeholder="Describe drinking habits and capabilities" className="w-full px-4 py-3 rounded-xl border bg-white shadow-lg hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-[#E38B52] transition-all duration-300" />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div>
                      <label className="block text-sm font-medium text-[#170F49] mb-2">Toilet Habits (Include mention hygenic where applicable)</label>
                      <input type="text" placeholder="Describe toilet habits and hygiene practices" className="w-full px-4 py-3 rounded-xl border bg-white shadow-lg hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-[#E38B52] transition-all duration-300" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-[#170F49] mb-2">Brushing</label>
                      <input type="text" placeholder="Describe brushing capabilities and routine" className="w-full px-4 py-3 rounded-xl border bg-white shadow-lg hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-[#E38B52] transition-all duration-300" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-[#170F49] mb-2">Bathing</label>
                      <input type="text" placeholder="Describe bathing capabilities and habits" className="w-full px-4 py-3 rounded-xl border bg-white shadow-lg hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-[#E38B52] transition-all duration-300" />
                    </div>
                  </div>

                  {/* Dressing */}
                  <div className="bg-white/30 backdrop-blur-xl rounded-2xl p-6 space-y-6">
                    <h4 className="text-md font-medium text-[#170F49]">Dressing</h4>
                    <div className="bg-white rounded-xl p-6 space-y-6 shadow-lg">
                      <div>
                        <label className="block text-sm font-medium text-[#170F49] mb-2">Removing and wearing clothes</label>
                        <input type="text" placeholder="Describe ability to remove and wear clothes independently" className="w-full px-4 py-3 rounded-xl border bg-white shadow-lg hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-[#E38B52] transition-all duration-300" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-[#170F49] mb-2">Unbuttoning and Buttoning</label>
                        <input type="text" placeholder="Describe ability to handle buttons independently" className="w-full px-4 py-3 rounded-xl border bg-white shadow-lg hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-[#E38B52] transition-all duration-300" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-[#170F49] mb-2">wearing shoes/Slippers</label>
                        <input type="text" placeholder="Describe ability to wear footwear independently" className="w-full px-4 py-3 rounded-xl border bg-white shadow-lg hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-[#E38B52] transition-all duration-300" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-[#170F49] mb-2">Grooming (include shaving skills where applicable)</label>
                        <input type="text" placeholder="Describe grooming abilities including shaving if applicable" className="w-full px-4 py-3 rounded-xl border bg-white shadow-lg hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-[#E38B52] transition-all duration-300" />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Motor */}
                <div className="bg-white/30 backdrop-blur-xl rounded-2xl p-6 space-y-8 mb-8">
                  <h3 className="text-lg font-semibold text-[#170F49] pb-2 border-b border-[#E38B52]/10">Motor</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-white rounded-xl p-6 shadow-lg">
                    <div>
                      <label className="block text-sm font-medium text-[#170F49] mb-2">Gross Motor</label>
                      <input type="text" placeholder="Describe capabilities in large movements, balance, and coordination" className="w-full px-4 py-3 rounded-xl border bg-white shadow-lg hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-[#E38B52] transition-all duration-300" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-[#170F49] mb-2">Fine Motor</label>
                      <input type="text" placeholder="Describe capabilities in small, precise movements" className="w-full px-4 py-3 rounded-xl border bg-white shadow-lg hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-[#E38B52] transition-all duration-300" />
                    </div>
                  </div>
                </div>

                {/* Sensory */}
                <div className="bg-white/30 backdrop-blur-xl rounded-2xl p-6 space-y-8 mb-8">
                  <h3 className="text-lg font-semibold text-[#170F49] pb-2 border-b border-[#6366f1]/10">Sensory</h3>
                  <div className="bg-white rounded-xl p-6 shadow-lg">
                    <input type="text" placeholder="Describe sensory responses and processing capabilities" className="w-full px-4 py-3 rounded-xl border bg-white shadow-lg hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-[#E38B52] transition-all duration-300" />
                  </div>
                </div>

                {/* Socialization */}
                <div className="bg-white/30 backdrop-blur-xl rounded-2xl p-6 space-y-8 mb-8">
                  <h3 className="text-lg font-semibold text-[#170F49] pb-2 border-b border-[#6366f1]/10">Socialization</h3>
                  <div className="bg-white rounded-xl p-6 space-y-6 shadow-lg">
                    <div>
                      <label className="block text-sm font-medium text-[#170F49] mb-2">Language/Communication</label>
                      <input type="text" placeholder="Describe communication abilities and language skills" className="w-full px-4 py-3 rounded-xl border bg-white shadow-lg hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-[#E38B52] transition-all duration-300" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-[#170F49] mb-2">Social behaviour</label>
                      <input type="text" placeholder="Describe interactions with others and social adaptability" className="w-full px-4 py-3 rounded-xl border bg-white shadow-lg hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-[#E38B52] transition-all duration-300" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-[#170F49] mb-2">Mobility in the nieghborhood</label>
                      <input type="text" placeholder="Describe ability to navigate and move around in familiar areas" className="w-full px-4 py-3 rounded-xl border bg-white shadow-lg hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-[#E38B52] transition-all duration-300" />
                    </div>
                  </div>
                </div>

                {/* Cognitive */}
                <div className="bg-white/30 backdrop-blur-xl rounded-2xl p-6 space-y-8 mb-8">
                  <h3 className="text-lg font-semibold text-[#170F49] pb-2 border-b border-[#6366f1]/10">Cognitive</h3>
                  <div className="bg-white rounded-xl p-6 space-y-6 shadow-lg">
                    <div>
                      <label className="block text-sm font-medium text-[#170F49] mb-2">Attention</label>
                      <input type="text" placeholder="Describe attention span and focus capabilities" className="w-full px-4 py-3 rounded-xl border bg-white shadow-lg hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-[#E38B52] transition-all duration-300" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-[#170F49] mb-2">Identification of familiar objects</label>
                      <input type="text" placeholder="Describe ability to recognize and name common objects" className="w-full px-4 py-3 rounded-xl border bg-white shadow-lg hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-[#E38B52] transition-all duration-300" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-[#170F49] mb-2">Use of familiar objects</label>
                      <input type="text" placeholder="Describe ability to appropriately use common objects" className="w-full px-4 py-3 rounded-xl border bg-white shadow-lg hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-[#E38B52] transition-all duration-300" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-[#170F49] mb-2">Following simple instruction</label>
                      <input type="text" placeholder="Describe ability to understand and follow basic instructions" className="w-full px-4 py-3 rounded-xl border bg-white shadow-lg hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-[#E38B52] transition-all duration-300" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-[#170F49] mb-2">Awareness of dangrer and hazards</label>
                      <input type="text" placeholder="Describe understanding of dangerous situations" className="w-full px-4 py-3 rounded-xl border bg-white shadow-lg hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-[#E38B52] transition-all duration-300" />
                    </div>
                  </div>

                  {/* Concept formation */}
                  <div className="bg-white/30 backdrop-blur-xl rounded-2xl p-6 space-y-6">
                    <h4 className="text-md font-medium text-[#170F49]">Concept formation (Indicate ability to match, identify name wherever applicable)</h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-[#170F49] mb-2">Color</label>
                        <input type="text" placeholder="Describe ability to recognize and match colors" className="w-full px-4 py-3 rounded-xl border bg-white shadow-lg hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-[#E38B52] transition-all duration-300" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-[#170F49] mb-2">Size</label>
                        <input type="text" placeholder="Describe understanding of size concepts" className="w-full px-4 py-3 rounded-xl border bg-white shadow-lg hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-[#E38B52] transition-all duration-300" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-[#170F49] mb-2">Sex</label>
                        <input type="text" placeholder="Describe understanding of gender concepts" className="w-full px-4 py-3 rounded-xl border bg-white shadow-lg hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-[#E38B52] transition-all duration-300" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-[#170F49] mb-2">Shape</label>
                        <input type="text" placeholder="Describe ability to recognize and name shapes" className="w-full px-4 py-3 rounded-xl border bg-white shadow-lg hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-[#E38B52] transition-all duration-300" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-[#170F49] mb-2">Number</label>
                        <input type="text" placeholder="Describe understanding of numbers and counting" className="w-full px-4 py-3 rounded-xl border bg-white shadow-lg hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-[#E38B52] transition-all duration-300" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-[#170F49] mb-2">Time</label>
                        <input type="text" placeholder="Describe understanding of time concepts" className="w-full px-4 py-3 rounded-xl border bg-white shadow-lg hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-[#E38B52] transition-all duration-300" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-[#170F49] mb-2">Money</label>
                        <input type="text" placeholder="Describe understanding of money concepts" className="w-full px-4 py-3 rounded-xl border bg-white shadow-lg hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-[#E38B52] transition-all duration-300" />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Academic */}
                <div className="bg-white/30 backdrop-blur-xl rounded-2xl p-6 space-y-8 mb-8">
                  <h3 className="text-lg font-semibold text-[#170F49] pb-2 border-b border-[#6366f1]/10">Academic (give brief history: class attended/attending indicate class/grade/level wherever appropriate)</h3>
                  <div className="bg-white rounded-xl p-6 space-y-6 shadow-lg">
                    <div>
                      <label className="block text-sm font-medium text-[#170F49] mb-2">Reading</label>
                      <input type="text" placeholder="Describe reading level and comprehension" className="w-full px-4 py-3 rounded-xl border bg-white shadow-lg hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-[#E38B52] transition-all duration-300" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-[#170F49] mb-2">Writing</label>
                      <input type="text" placeholder="Describe writing abilities and skills" className="w-full px-4 py-3 rounded-xl border bg-white shadow-lg hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-[#E38B52] transition-all duration-300" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-[#170F49] mb-2">Arithmetic</label>
                      <input type="text" placeholder="Describe mathematical understanding and abilities" className="w-full px-4 py-3 rounded-xl border bg-white shadow-lg hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-[#E38B52] transition-all duration-300" />
                    </div>
                  </div>
                </div>

                {/* Prevocational/Domestic */}
                <div className="bg-white/30 backdrop-blur-xl rounded-2xl p-6 space-y-8 mb-8">
                  <h3 className="text-lg font-semibold text-[#170F49] pb-2 border-b border-[#E38B52]/10">Prevocational/Domestic (Specify ability and interest)</h3>
                  <div className="bg-white rounded-xl p-6 shadow-lg">
                    <input type="text" placeholder="Describe prevocational skills and domestic abilities" className="w-full px-4 py-3 rounded-xl border bg-white shadow-lg hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-[#E38B52] transition-all duration-300" />
                  </div>
                  <div className="space-y-6">
                    <div>
                      <label className="block text-sm font-medium text-[#170F49] mb-2">Items of interest</label>
                      <input type="text" placeholder="List activities and objects that interest the student" className="w-full px-4 py-3 rounded-xl border bg-white shadow-lg hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-[#E38B52] transition-all duration-300" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-[#170F49] mb-2">Items of dislike</label>
                      <input type="text" placeholder="List activities and objects that the student dislikes" className="w-full px-4 py-3 rounded-xl border bg-white shadow-lg hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-[#E38B52] transition-all duration-300" />
                    </div>
                  </div>
                </div>

                {/* Additional Fields */}
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-[#170F49] mb-2">Any peculiar behaviour/behaviour problems observed</label>
                    <textarea className="w-full px-4 py-3 rounded-xl border bg-white shadow-lg hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-[#E38B52] transition-all duration-300" rows="4" placeholder="Describe any unusual behaviors or behavioral concerns observed"></textarea>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[#170F49] mb-2">Any other</label>
                    <textarea className="w-full px-4 py-3 rounded-xl border bg-white shadow-lg hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-[#E38B52] transition-all duration-300" rows="4" placeholder="Add any additional observations or comments"></textarea>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[#170F49] mb-2">Recommendation</label>
                    <textarea className="w-full px-4 py-3 rounded-xl border bg-white shadow-lg hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-[#E38B52] transition-all duration-300" rows="4" placeholder="Provide detailed recommendations for support and intervention"></textarea>
                  </div>
                </div>
              </div>

              {/* Medical Information Container */}
              <div className="bg-white/30 backdrop-blur-xl rounded-3xl shadow-xl p-8 md:p-12 border border-white/20">
                <h2 className="text-2xl font-bold text-[#170F49] mb-10 pb-4 border-b border-[#E38B52]/20 flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2 text-[#E38B52]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                  </svg>
                  Medical Information
                </h2>

                {/* Medical History */}
                <div className="space-y-8">
                  <div>
                    <h3 className="text-lg font-semibold text-[#170F49] pb-2 border-b border-[#E38B52]/10">Medical History</h3>
                    <div className="mt-6 space-y-6">
                      <div>
                        <label className="block text-sm font-medium text-[#170F49] mb-2">Any specific diagnostic</label>
                        <input type="text" placeholder="Enter specific diagnostic details" className="w-full px-4 py-3 rounded-xl border bg-white shadow-lg hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-[#E38B52] transition-all duration-300" />
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {[
                          'History of fits (seizures)',
                          'History of Recent Surgery',
                          'History of Bleeding Disorders',
                          'Using spectables/dentures/hearing aid'
                        ].map((item) => (
                          <label key={item} className="flex items-center space-x-3 bg-white p-4 rounded-xl border shadow-lg hover:[#E38B52]">
                            <input
                              type="checkbox"
                              className="w-4 h-4 rounded border-gray-300 text-[#E38B52] focus:ring-[#E38B52]"
                            />
                            <span className="text-sm text-[#170F49]">{item}</span>
                          </label>
                        ))}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-[#170F49] mb-2">Any other relevant Medical Information</label>
                        <textarea className="w-full px-4 py-3 rounded-xl border bg-white shadow-lg hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-[#E38B52] transition-all duration-300 resize-none" rows="3" placeholder="Enter other relevant medical information"></textarea>
                      </div>
                    </div>
                  </div>

                  {/* Drug History */}
                  <div>
                    <h3 className="text-lg font-semibold text-[#170F49] pb-2 border-b border-[#E38B52]/10">Drug History</h3>
                    <div className="mt-6 space-y-6">
                      <div>
                        <label className="block text-sm font-medium text-[#170F49] mb-2">Is the child on regular drugs</label>
                        <input
                          type="text"
                          placeholder="Enter details about regular medication"
                          className="w-full px-4 py-3 rounded-xl border bg-white shadow-lg hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-[#E38B52] transition-all duration-300"
                          onChange={(e) => setStudentForm((p) => ({
                            ...p,
                            medical_conditions: [p.medical_conditions, e.target.value].filter(Boolean).join(' | ')
                          }))}
                        />
                      </div>

                      <div className="overflow-hidden">
                          <table className="w-full border border-[#E38B52]/20 rounded-xl backdrop-blur-xl overflow-hidden">
                            <thead>
                              <tr className="border-b border-[#E38B52]/20">
                                <th className="px-4 py-3 text-left text-sm font-semibold text-[#170F49]">S.No</th>
                                <th className="px-4 py-3 text-left text-sm font-semibold text-[#170F49]">Name of drug</th>
                                <th className="px-4 py-3 text-left text-sm font-semibold text-[#170F49]">Dose if known</th>
                              </tr>
                            </thead>
                          <tbody>
                            {drugRows.map((row) => (
                              <tr key={row.id} className="border-b border-[#E38B52]/10">
                                <td className="px-4 py-3 text-sm text-[#170F49]">{row.id}</td>
                                <td className="px-4 py-3">
                                  <input 
                                    type="text"
                                    value={row.name}
                                    onChange={(e) => {
                                      const updatedRows = drugRows.map(r => 
                                        r.id === row.id ? { ...r, name: e.target.value } : r
                                      );
                                      setDrugRows(updatedRows);
                                    }}
                                    className="w-full px-3 py-2 bg-white/50 border border-[#E38B52]/20 rounded-xl shadow-lg hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-[#E38B52] transition-all duration-300"
                                    placeholder="Enter drug name"
                                  />
                                </td>
                                <td className="px-4 py-3">
                                  <input 
                                    type="text"
                                    value={row.dose}
                                    onChange={(e) => {
                                      const updatedRows = drugRows.map(r => 
                                        r.id === row.id ? { ...r, dose: e.target.value } : r
                                      );
                                      setDrugRows(updatedRows);
                                    }}
                                    className="w-full px-3 py-2 bg-white/50 border border-[#E38B52]/20 rounded-xl shadow-lg hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-[#E38B52] transition-all duration-300"
                                    placeholder="Enter dose"
                                  />
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                        <button 
                          onClick={addDrugRow}
                          className="mt-4 w-full px-4 py-3 bg-[#E38B52] text-white rounded-xl hover:bg-[#E38B40] transition-all duration-200 shadow-[inset_0_2px_4px_rgba(255,255,255,0.3),inset_0_4px_8px_rgba(255,255,255,0.2)]"
                        >
                          Add Drug
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Allergies */}
                  <div>
                    <h3 className="text-lg font-semibold text-[#170F49] pb-2 border-b border-[#E38B52]/10">Allergies</h3>
                    <div className="mt-6 space-y-6">
                      <div>
                        <label className="block text-sm font-medium text-[#170F49] mb-2">Allergies if any</label>
                        <input
                          type="text"
                          placeholder="Enter allergies"
                          className="w-full px-4 py-3 rounded-xl border bg-white shadow-lg hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-[#E38B52] transition-all duration-300"
                          value={studentForm.allergies}
                          onChange={handleFieldChange('allergies')}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-[#170F49] mb-2">Drug Allergy</label>
                        <input type="text" placeholder="Enter drug allergies" className="w-full px-4 py-3 rounded-xl border bg-white shadow-lg hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-[#E38B52] transition-all duration-300" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-[#170F49] mb-2">Food Allergy</label>
                        <input type="text" placeholder="Enter food allergies" className="w-full px-4 py-3 rounded-xl border bg-white shadow-lg hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-[#E38B52] transition-all duration-300" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-between w-full mt-8">
            {activeTab === 'student-details' ? (
              <button
                onClick={saveStudent}
                disabled={isSaving || !studentForm.name}
                className={`w-[48%] px-6 py-3 ${isSaving ? 'bg-gray-400' : 'bg-[#E38B52]'} text-white rounded-xl hover:bg-[#E38B40] transition-all duration-200 shadow-[inset_0_2px_4px_rgba(255,255,255,0.3),inset_0_4px_8px_rgba(255,255,255,0.2)] hover:-translate-y-1 hover:scale-105`}
              >
                {isSaving ? 'Saving...' : savedStudent?.id ? 'Update Details' : 'Save Details'}
              </button>
            ) : (
              <button
                onClick={saveCaseRecord}
                disabled={isSaving}
                className={`w-[48%] px-6 py-3 ${isSaving ? 'bg-gray-400' : 'bg-[#E38B52]'} text-white rounded-xl hover:bg-[#E38B40] transition-all duration-200 shadow-[inset_0_2px_4px_rgba(255,255,255,0.3),inset_0_4px_8px_rgba(255,255,255,0.2)] hover:-translate-y-1 hover:scale-105`}
              >
                {isSaving ? 'Saving...' : 'Save Case Record'}
              </button>
            )}
            <button
              onClick={() => navigate(-1)}
              className="w-[48%] px-6 py-3 bg-[#E38B52] text-white rounded-xl hover:bg-gray-600 transition-all duration-200 shadow-[inset_0_2px_4px_rgba(255,255,255,0.3),inset_0_4px_8px_rgba(255,255,255,0.2)] hover:-translate-y-1 hover:scale-105"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>

      {/* Animation styles */}
      <style jsx global>{`
        @keyframes float {
          0% { transform: translate(0, 0) scale(1); }
          25% { transform: translate(100px, -100px) scale(1.2); }
          50% { transform: translate(0, 100px) scale(0.9); }
          75% { transform: translate(-100px, -50px) scale(1.1); }
          100% { transform: translate(0, 0) scale(1); }
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
      
      {/* ++ ADD THIS LINE HERE ++ */}
      <ScrollToTopButton />

    </div>
  );
};

export default AddStudent;
