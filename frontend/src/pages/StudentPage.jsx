import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";

const StudentPage = () => {
  const [activeTab, setActiveTab] = useState("student-details");
  const { id } = useParams();
  const [student, setStudent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [editData, setEditData] = useState(null);

  // Start editing: initialize editData
  const handleEditStart = () => {
    setEditData(student);
    setEditMode(true);
  };

  // Handle input change in edit mode
  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditData((prev) => ({ ...prev, [name]: value }));
  };

  // Cancel editing
  const handleEditCancel = () => {
    setEditMode(false);
    setEditData(student);
  };

  // Save changes
  const handleEditSave = async () => {
    try {
      const baseUrl = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8000';
      await axios.put(`${baseUrl}/api/v1/students/${id}`, editData);
      // Refresh student data
      const { data } = await axios.get(`${baseUrl}/api/v1/students/${id}`);
      const mapped = {
        name: data.name,
        studentId: data.student_id,
        dob: data.dob,
        gender: data.gender,
        religion: data.religion,
        caste: data.caste,
        class: data.class_name,
        rollNo: data.roll_no,
        birthPlace: data.birth_place,
        houseName: data.house_name,
        streetName: data.street_name,
        postOffice: data.post_office,
        pinCode: data.pin_code,
        revenueDistrict: data.revenue_district,
        phoneNumber: data.phone_number,
        email: data.email,
        address: [data.house_name, data.street_name, data.post_office, data.revenue_district, data.pin_code].filter(Boolean).join(', '),
        fatherName: data.father_name,
        fatherEducation: data.father_education,
        fatherOccupation: data.father_occupation,
        motherName: data.mother_name,
        motherEducation: data.mother_education,
        motherOccupation: data.mother_occupation,
        guardianName: data.guardian_name,
        guardianRelationship: data.guardian_relationship,
        guardianContact: data.guardian_contact,
        academicYear: data.academic_year,
        admissionNumber: data.admission_number,
        admissionDate: data.admission_date,
        classTeacher: data.class_teacher,
        bankName: data.bank_name,
        accountNumber: data.account_number,
        branch: data.branch,
        ifscCode: data.ifsc_code
      };
      setStudent(mapped);
      setEditMode(false);
    } catch (e) {
      // handle error (optional)
    }
  };

  useEffect(() => {
    const fetchStudent = async () => {
      try {
        const baseUrl = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8000';
        const { data } = await axios.get(`${baseUrl}/api/v1/students/${id}`);
        const mapped = {
          name: data.name,
          studentId: data.student_id,
          dob: data.dob,
          gender: data.gender,
          religion: data.religion,
          caste: data.caste,
          class: data.class_name,
          rollNo: data.roll_no,
          birthPlace: data.birth_place,
          houseName: data.house_name,
          streetName: data.street_name,
          postOffice: data.post_office,
          pinCode: data.pin_code,
          revenueDistrict: data.revenue_district,
          phoneNumber: data.phone_number,
          email: data.email,
          address: [data.house_name, data.street_name, data.post_office, data.revenue_district, data.pin_code].filter(Boolean).join(', '),
          fatherName: data.father_name,
          fatherEducation: data.father_education,
          fatherOccupation: data.father_occupation,
          motherName: data.mother_name,
          motherEducation: data.mother_education,
          motherOccupation: data.mother_occupation,
          guardianName: data.guardian_name,
          guardianRelationship: data.guardian_relationship,
          guardianContact: data.guardian_contact,
          academicYear: data.academic_year,
          admissionNumber: data.admission_number,
          admissionDate: data.admission_date,
          classTeacher: data.class_teacher,
          bankName: data.bank_name,
          accountNumber: data.account_number,
          branch: data.branch,
          ifscCode: data.ifsc_code
        };
        setStudent(mapped);
      } catch (e) {
        setStudent(null);
      } finally {
        setLoading(false);
      }
    };
    fetchStudent();
  }, [id]);

  // removed mocks

  if (loading) {
    return (
      <div className="min-h-screen w-full flex flex-col items-center justify-center bg-[#f7f7f7]">
        <div className="text-2xl text-[#E38B52]">Loading student information...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full flex flex-col items-center bg-[#f7f7f7] relative overflow-hidden py-20">
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
          <div className="bg-white/30 backdrop-blur-xl rounded-2xl p-2 inline-flex gap-2 shadow-lg relative w-[372px]">
            {/* Active Tab Background */}
            <div
              className="absolute h-[calc(100%-8px)] top-[4px] transition-all duration-300 ease-in-out rounded-xl bg-[#E38B52] shadow-[inset_0_2px_4px_rgba(255,255,255,0.3),inset_0_4px_8px_rgba(255,255,255,0.2)]"
              style={{
                left: activeTab === "student-details" ? "4px" : "188px",
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
          </div>
        </div>
        
        {/* Main content container */}
        <div className="relative bg-white/30 backdrop-blur-xl rounded-3xl shadow-xl p-8 md:p-12 border border-white/20">
          {activeTab === "student-details" ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
              {/* Basic Information Section */}
              <div className="col-span-full">
                <h2 className="text-xl font-semibold text-[#170F49] mb-4">Personal Information</h2>
                <div className="flex flex-col md:flex-row gap-6 p-4 md:p-6 bg-white/50 rounded-2xl">
                  {/* Student Photo */}
                  <div className="flex flex-col items-center gap-3">
                    <div className="w-40 h-40 rounded-2xl overflow-hidden border-4 border-white/50 shadow-xl">
                      {/* eslint-disable-next-line jsx-a11y/img-redundant-alt */}
                      <img 
                        src="https://img.freepik.com/free-photo/portrait-cute-little-boy-white-t-shirt_23-2148445671.jpg"
                        alt="Student Photo"
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <button className="text-sm text-[#E38B52] hover:text-[#E38B52]/90 transition-colors duration-200 flex items-center gap-1">
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
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                        <polyline points="17 8 12 3 7 8"/>
                        <line x1="12" y1="3" x2="12" y2="15"/>
                      </svg>
                      Update Photo
                    </button>
                  </div>

                  {/* Student Details */}
                  <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 pl-8 md:pl-12">
                    <div>
                      <p className="text-sm text-[#6F6C90]">Full Name</p>
                      {editMode ? (
                        <input type="text" name="name" value={editData?.name || ''} onChange={handleEditChange} className="input-edit" />
                      ) : (
                        <p className="text-[#170F49] font-medium">{student?.name}</p>
                      )}
                    </div>
                    <div>
                      <p className="text-sm text-[#6F6C90]">Student ID</p>
                      {editMode ? (
                        <input type="text" name="studentId" value={editData?.studentId || ''} className="input-edit" readOnly />
                      ) : (
                        <p className="text-[#170F49] font-medium">{student?.studentId}</p>
                      )}
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

              {/* Parent Information Section */}
              <div className="col-span-full">
                <h2 className="text-xl font-semibold text-[#170F49] mb-4">Family Information</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 p-6 bg-white/50 rounded-2xl">
                  <div className="p-4 bg-white/70 rounded-xl">
                    <h3 className="text-lg font-medium text-[#170F49] pb-2 border-b border-[#E38B52]/10 mb-4">Father's Details</h3>
                    <div className="space-y-3">
                      <div>
                        <p className="text-sm text-[#6F6C90]">Name</p>
                        {editMode ? (
                          <input type="text" name="fatherName" value={editData?.fatherName || ''} onChange={handleEditChange} className="input-edit" />
                        ) : (
                          <p className="text-[#170F49] font-medium">{student?.fatherName}</p>
                        )}
                      </div>
                      <div>
                        <p className="text-sm text-[#6F6C90]">Education</p>
                        {editMode ? (
                          <input type="text" name="fatherEducation" value={editData?.fatherEducation || ''} onChange={handleEditChange} className="input-edit" />
                        ) : (
                          <p className="text-[#170F49] font-medium">{student?.fatherEducation}</p>
                        )}
                      </div>
                      <div>
                        <p className="text-sm text-[#6F6C90]">Occupation</p>
                        {editMode ? (
                          <input type="text" name="fatherOccupation" value={editData?.fatherOccupation || ''} onChange={handleEditChange} className="input-edit" />
                        ) : (
                          <p className="text-[#170F49] font-medium">{student?.fatherOccupation}</p>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="p-4 bg-white/70 rounded-xl">
                    <h3 className="text-lg font-medium text-[#170F49] pb-2 border-b border-[#E38B52]/10 mb-4">Mother's Details</h3>
                    <div className="space-y-3">
                      <div>
                        <p className="text-sm text-[#6F6C90]">Name</p>
                        {editMode ? (
                          <input type="text" name="motherName" value={editData?.motherName || ''} onChange={handleEditChange} className="input-edit" />
                        ) : (
                          <p className="text-[#170F49] font-medium">{student?.motherName}</p>
                        )}
                      </div>
                      <div>
                        <p className="text-sm text-[#6F6C90]">Education</p>
                        {editMode ? (
                          <input type="text" name="motherEducation" value={editData?.motherEducation || ''} onChange={handleEditChange} className="input-edit" />
                        ) : (
                          <p className="text-[#170F49] font-medium">{student?.motherEducation}</p>
                        )}
                      </div>
                      <div>
                        <p className="text-sm text-[#6F6C90]">Occupation</p>
                        {editMode ? (
                          <input type="text" name="motherOccupation" value={editData?.motherOccupation || ''} onChange={handleEditChange} className="input-edit" />
                        ) : (
                          <p className="text-[#170F49] font-medium">{student?.motherOccupation}</p>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="p-4 bg-white/70 rounded-xl">
                    <h3 className="text-lg font-medium text-[#170F49] pb-2 border-b border-[#E38B52]/10 mb-4">Guardian's Details</h3>
                    <div className="space-y-3">
                      <div>
                        <p className="text-sm text-[#6F6C90]">Name</p>
                        <p className="text-[#170F49] font-medium">{student?.guardianName}</p>
                      </div>
                      <div>
                        <p className="text-sm text-[#6F6C90]">Relationship</p>
                        <p className="text-[#170F49] font-medium">{student?.guardianRelationship}</p>
                      </div>
                      <div>
                        <p className="text-sm text-[#6F6C90]">Occupation</p>
                        <p className="text-[#170F49] font-medium">{student?.guardianContact}</p>
                      </div>
                    </div>
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

                {/* Completed Therapies */}
                <div className="p-6 bg-white/50 rounded-2xl">
                  <h3 className="text-lg font-medium text-[#170F49] mb-4">Completed Therapies</h3>
                  <div className="space-y-4">
                    <div className="p-4 bg-white/70 rounded-xl">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="text-[#170F49] font-medium mb-1">Physical Therapy</h4>
                          <p className="text-sm text-[#6F6C90]">Completed on: 15 Dec 2023</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm">Completed</span>
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
                              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                              <polyline points="14 2 14 8 20 8"/>
                              <line x1="16" y1="13" x2="8" y2="13"/>
                              <line x1="16" y1="17" x2="8" y2="17"/>
                              <line x1="10" y1="9" x2="8" y2="9"/>
                            </svg>
                          </button>
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
            <div className="grid grid-cols-1 gap-6">
              {/* Identification Data Section */}
              <div className="col-span-full">
                <h2 className="text-2xl font-bold text-[#170F49] mb-6 pb-4 border-b border-[#E38B52]/20 flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2 text-[#E38B52]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2" />
                  </svg>
                  Identification Data
                </h2>
                <div className="p-6 bg-white/50 rounded-2xl mb-8">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div>
                      <p className="text-sm text-[#6F6C90]">Type of Disability</p>
                      <p className="text-[#170F49] font-medium">Multiple Disabilities</p>
                    </div>
                    <div>
                      <p className="text-sm text-[#6F6C90]">Percentage of Disability</p>
                      <p className="text-[#170F49] font-medium">75%</p>
                    </div>
                    <div>
                      <p className="text-sm text-[#6F6C90]">Blood Group</p>
                      <p className="text-[#170F49] font-medium">B+</p>
                    </div>
                    <div>
                      <p className="text-sm text-[#6F6C90]">Aadhar Number</p>
                      <p className="text-[#170F49] font-medium">XXXX-XXXX-1234</p>
                    </div>
                    <div>
                      <p className="text-sm text-[#6F6C90]">Category</p>
                      <p className="text-[#170F49] font-medium">OBC</p>
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
                <div className="p-6 bg-white/50 rounded-2xl mb-8">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <p className="text-sm text-[#6F6C90]">Total Family Income per Month</p>
                      <p className="text-[#170F49] font-medium">₹45,000</p>
                    </div>
                    <div>
                      <p className="text-sm text-[#6F6C90]">Duration of Contact</p>
                      <p className="text-[#170F49] font-medium">2 Years</p>
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
                <div className="p-6 bg-white/50 rounded-2xl mb-8">
                  <h3 className="text-lg font-semibold text-[#170F49] mb-4">Contact Information</h3>
                  <div className="p-4 bg-white/70 rounded-xl mb-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <p className="text-sm text-[#6F6C90]">Address and Phone Number</p>
                        <p className="text-[#170F49] font-medium">{student?.address}, {student?.phoneNumber}</p>
                      </div>
                      <div>
                        <p className="text-sm text-[#6F6C90]">Informant's Name</p>
                        <p className="text-[#170F49] font-medium">{student?.guardianName} (Guardian)</p>
                      </div>
                    </div>
                  </div>

                  <h3 className="text-lg font-semibold text-[#170F49] mb-4">Present Complaints</h3>
                  <div className="p-4 bg-white/70 rounded-xl mb-6">
                    <p className="text-[#170F49]">Difficulty in concentration and learning new concepts. Shows signs of anxiety in new social situations.</p>
                  </div>

                  <h3 className="text-lg font-semibold text-[#170F49] mb-4">Previous Consultation and Treatments</h3>
                  <div className="p-4 bg-white/70 rounded-xl">
                    <p className="text-[#170F49]">Consulted with Dr. Johnson at City Hospital in 2022. Received speech therapy for 6 months with moderate improvement.</p>
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
                        <p className="text-[#170F49] font-medium">None reported</p>
                      </div>
                      <div>
                        <p className="text-sm text-[#6F6C90]">Family History of Mental Retardation</p>
                        <p className="text-[#170F49] font-medium">None reported</p>
                      </div>
                      <div>
                        <p className="text-sm text-[#6F6C90]">Family History of Epilepsy and Others</p>
                        <p className="text-[#170F49] font-medium">Maternal grandfather had epilepsy</p>
                      </div>
                    </div>
                  </div>

                  {/* Birth History */}
                  <div className="p-6 bg-white/50 rounded-2xl">
                    <h3 className="text-lg font-semibold text-[#170F49] mb-4">Birth History</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div>
                        <p className="text-sm text-[#6F6C90]">Prenatal History</p>
                        <p className="text-[#170F49] font-medium">Normal pregnancy with regular checkups</p>
                      </div>
                      <div>
                        <p className="text-sm text-[#6F6C90]">Natal and Neonatal</p>
                        <p className="text-[#170F49] font-medium">Cesarean delivery due to fetal distress. Birth weight: 2.8kg</p>
                      </div>
                      <div>
                        <p className="text-sm text-[#6F6C90]">Postnatal History</p>
                        <p className="text-[#170F49] font-medium">Mild jaundice treated with phototherapy for 2 days</p>
                      </div>
                    </div>
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
                        <p className="text-[#170F49] font-medium">Autism Spectrum Disorder with ADHD features</p>
                      </div>
                      <div>
                        <p className="text-sm text-[#6F6C90]">Medical Conditions</p>
                        <div className="flex flex-wrap gap-2 mt-1">
                          <span className="px-3 py-1 bg-white/70 rounded-full text-sm text-[#170F49]">History of fits (seizures)</span>
                          <span className="px-3 py-1 bg-white/70 rounded-full text-sm text-[#170F49]">Using spectacles</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Drug History */}
                  <div className="p-6 bg-white/50 rounded-2xl">
                    <h3 className="text-lg font-semibold text-[#170F49] mb-4">Drug History</h3>
                    <p className="text-[#170F49] mb-4">The child is on regular medication</p>
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
                          <tr className="border-b border-[#E38B52]/10">
                            <td className="px-4 py-3 text-sm text-[#170F49]">1</td>
                            <td className="px-4 py-3 text-sm text-[#170F49]">Methylphenidate</td>
                            <td className="px-4 py-3 text-sm text-[#170F49]">10mg once daily</td>
                          </tr>
                          <tr>
                            <td className="px-4 py-3 text-sm text-[#170F49]">2</td>
                            <td className="px-4 py-3 text-sm text-[#170F49]">Risperidone</td>
                            <td className="px-4 py-3 text-sm text-[#170F49]">0.5mg at bedtime</td>
                          </tr>
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
                        <p className="text-[#170F49] font-medium">Penicillin</p>
                      </div>
                      <div>
                        <p className="text-sm text-[#6F6C90]">Food Allergy</p>
                        <p className="text-[#170F49] font-medium">Peanuts</p>
                      </div>
                      <div>
                        <p className="text-sm text-[#6F6C90]">Other Allergies</p>
                        <p className="text-[#170F49] font-medium">Dust mites</p>
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
            <button className="flex-1  bg-white/30 backdrop-blur-xl rounded-2xl shadow-xl p-3 border border-white/20 hover:-translate-y-1 transition-all font-medium duration-200">
              Download Profile
            </button>
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
    </div>
  );
};

export default StudentPage;
