import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

const StudentViewPage = () => {
  const navigate = useNavigate();
  const [student, setStudent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState("student-details");
  const [activeCaseSection, setActiveCaseSection] = useState("identification");
  const [activeEducationSubsection, setActiveEducationSubsection] = useState("self-help");
  const [notifications, setNotifications] = useState([]);
  const [notificationsLoading, setNotificationsLoading] = useState(false);
  const [expandedReports, setExpandedReports] = useState({});
  const [translatedReports, setTranslatedReports] = useState({});
  const [translatingReports, setTranslatingReports] = useState({});

  useEffect(() => {
    fetchStudentData();
    fetchNotifications();
  }, []);

  const toggleReportExpansion = async (notificationId, isRead) => {
    const wasExpanded = expandedReports[notificationId];
    
    // Toggle expansion state
    setExpandedReports(prev => ({
      ...prev,
      [notificationId]: !prev[notificationId]
    }));

    // Mark as read when expanding (if not already read)
    if (!wasExpanded && !isRead) {
      try {
        const token = localStorage.getItem("token");
        if (!token) return;

        const baseUrl = process.env.REACT_APP_API_BASE_URL || "http://localhost:8000";
        await axios.post(
          `${baseUrl}/api/v1/notifications/mark-read`,
          { notification_id: notificationId },
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        // Update the notification in state to reflect it's been read
        setNotifications(prev =>
          prev.map(n =>
            n.id === notificationId ? { ...n, is_read: true } : n
          )
        );
      } catch (err) {
        console.error("Error marking notification as read:", err);
      }
    }
  };

  const handleTranslateReport = async (reportId, summaryText) => {
    if (!summaryText || summaryText.trim() === "") {
      alert("No summary text to translate");
      return;
    }

    try {
      setTranslatingReports(prev => ({ ...prev, [reportId]: true }));

      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("No authentication token found. Please log in again.");
      }

      const baseUrl = process.env.REACT_APP_API_BASE_URL || "http://localhost:8000";
      const res = await fetch(`${baseUrl}/api/v1/translate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          text: summaryText,
          target_language: "mal_Mlym",
          source_language: "eng_Latn",
        }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(
          errorData.detail || `Translation failed: ${res.status}`
        );
      }

      const data = await res.json();
      setTranslatedReports(prev => ({
        ...prev,
        [reportId]: data.translated_text
      }));
    } catch (e) {
      alert(`Translation failed: ${e.message}`);
      setTranslatedReports(prev => {
        const newState = { ...prev };
        delete newState[reportId];
        return newState;
      });
    } finally {
      setTranslatingReports(prev => ({
        ...prev,
        [reportId]: false
      }));
    }
  };

  const fetchStudentData = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        navigate("/login");
        return;
      }

      const baseUrl = process.env.REACT_APP_API_BASE_URL || "http://localhost:8000";
      const response = await axios.get(`${baseUrl}/api/v1/students/me`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      
      // Normalize the data to match StudentPage format
      const data = response.data;
      setStudent({
        studentId: data.student_id,
        name: data.name,
        age: data.age,
        dob: data.dob,
        gender: data.gender,
        religion: data.religion,
        caste: data.caste,
        bloodGroup: data.blood_group,
        category: data.category,
        class: data.class_name,
        rollNo: data.roll_no,
        birthPlace: data.birth_place,
        houseName: data.house_name,
        streetName: data.street_name,
        postOffice: data.post_office,
        pinCode: data.pin_code,
        revenueDistrict: data.revenue_district,
        blockPanchayat: data.block_panchayat,
        localBody: data.local_body,
        taluk: data.taluk,
        phoneNumber: data.phone_number,
        email: data.email,
        aadharNumber: data.aadhar_number,
        academicYear: data.academic_year,
        admissionNumber: data.admission_number,
        admissionDate: data.admission_date,
        classTeacher: data.class_teacher,
        fatherName: data.father_name,
        fatherEducation: data.father_education,
        fatherOccupation: data.father_occupation,
        motherName: data.mother_name,
        motherEducation: data.mother_education,
        motherOccupation: data.mother_occupation,
        guardianName: data.guardian_name,
        guardianRelationship: data.guardian_relationship,
        guardianContact: data.guardian_contact,
        photoUrl: data.photo_url,
        caseRecord: data.case_record,
      });
      setLoading(false);
    } catch (err) {
      console.error("Error fetching student data:", err);
      setError(err.response?.data?.detail || "Failed to load student data");
      setLoading(false);
    }
  };

  const fetchNotifications = async () => {
    setNotificationsLoading(true);
    try {
      const token = localStorage.getItem("token");
      if (!token) return;

      const baseUrl = process.env.REACT_APP_API_BASE_URL || "http://localhost:8000";
      const response = await axios.get(`${baseUrl}/api/v1/notifications/my-notifications`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setNotifications(response.data);
    } catch (err) {
      console.error("Error fetching notifications:", err);
    } finally {
      setNotificationsLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    delete axios.defaults.headers.common["Authorization"];
    navigate("/login");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f7f7f7]">
        <div className="text-xl text-[#170F49]">Loading...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f7f7f7]">
        <div className="text-center">
          <div className="text-xl text-red-600 mb-4">{error}</div>
          <button
            onClick={() => navigate("/login")}
            className="px-6 py-2 bg-[#E38B52] text-white rounded-lg hover:bg-[#C8742F] transition-all"
          >
            Back to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full flex flex-col items-center bg-[#f7f7f7] relative overflow-hidden py-20">
      {/* Logout button (top-right) */}
      <button
        onClick={handleLogout}
        className="absolute top-8 right-8 bg-white/30 backdrop-blur-xl rounded-2xl shadow-xl px-6 py-3 border border-white/20 hover:-translate-y-1 transition-all duration-200 flex items-center gap-2 z-10 text-[#170F49] font-medium"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
          <polyline points="16 17 21 12 16 7"></polyline>
          <line x1="21" y1="12" x2="9" y2="12"></line>
        </svg>
        Logout
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
          <div className="bg-white/30 backdrop-blur-xl rounded-2xl p-2 inline-flex gap-2 shadow-lg relative">
            {/* Active Tab Background */}
            <div
              className="absolute h-[calc(100%-8px)] top-[4px] transition-all duration-300 ease-in-out rounded-xl bg-[#E38B52] shadow-[inset_0_2px_4px_rgba(255,255,255,0.3),inset_0_4px_8px_rgba(255,255,255,0.2)]"
              style={{
                left: activeTab === "student-details" ? "4px" : activeTab === "case-record" ? "188px" : "372px",
                width: "180px",
                background: 'linear-gradient(135deg, #E38B52 0%, #E38B52 100%)',
              }}
            />
            
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
            
            {/* Reports Tab */}
            <button
              onClick={() => setActiveTab("reports")}
              className={`w-[180px] px-6 py-3 rounded-xl font-medium transition-all duration-300 relative z-10 text-center whitespace-nowrap ${
                activeTab === "reports"
                  ? "text-white"
                  : "text-[#170F49] hover:text-[#E38B52]"
              }`}
            >
              Reports
              {notifications.filter(n => !n.is_read).length > 0 && (
                <span className="ml-2 px-2 py-0.5 text-xs bg-red-500 text-white rounded-full">
                  {notifications.filter(n => !n.is_read).length}
                </span>
              )}
            </button>
          </div>
        </div>
        
        {/* Main content container */}
        <div className="relative bg-white/30 backdrop-blur-xl rounded-3xl shadow-xl p-8 md:p-12 border border-white/20">
          {activeTab === "student-details" && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
              {/* Basic Information Section */}
              <div className="col-span-full">
                <h2 className="text-xl font-semibold text-[#170F49] mb-4">Personal Information</h2>
                <div className="flex flex-col md:flex-row gap-6 p-4 md:p-6 bg-white/50 rounded-2xl">
                  {/* Student Photo */}
                  <div className="flex flex-col items-center gap-3">
                    <div className="w-40 h-40 rounded-2xl overflow-hidden border-4 border-white/50 shadow-xl">
                      <img 
                        src={student?.photoUrl || "https://placehold.co/160x160/EFEFEF/AAAAAA?text=No+Photo"}
                        alt="Student"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  </div>

                  {/* Student Details */}
                  <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 pl-8 md:pl-12">
                    <div>
                      <p className="text-sm text-[#6F6C90]">Full Name</p>
                      <p className="text-[#170F49] font-medium">{student?.name || "N/A"}</p>
                    </div>
                    <div>
                      <p className="text-sm text-[#6F6C90]">Age</p>
                      <p className="text-[#170F49] font-medium">{student?.age || "N/A"}</p>
                    </div>
                    <div>
                      <p className="text-sm text-[#6F6C90]">Student ID</p>
                      <p className="text-[#170F49] font-medium">{student?.studentId || "N/A"}</p>
                    </div>
                    <div>
                      <p className="text-sm text-[#6F6C90]">Date of Birth</p>
                      <p className="text-[#170F49] font-medium">{student?.dob || "N/A"}</p>
                    </div>
                    <div>
                      <p className="text-sm text-[#6F6C90]">Gender</p>
                      <p className="text-[#170F49] font-medium">{student?.gender || "N/A"}</p>
                    </div>
                    <div>
                      <p className="text-sm text-[#6F6C90]">Religion</p>
                      <p className="text-[#170F49] font-medium">{student?.religion || "N/A"}</p>
                    </div>
                    <div>
                      <p className="text-sm text-[#6F6C90]">Caste</p>
                      <p className="text-[#170F49] font-medium">{student?.caste || "N/A"}</p>
                    </div>
                    <div>
                      <p className="text-sm text-[#6F6C90]">Aadhar Number</p>
                      <p className="text-[#170F49] font-medium">{student?.aadharNumber || "N/A"}</p>
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
                    <p className="text-[#170F49] font-medium">{student?.birthPlace || "N/A"}</p>
                  </div>
                  <div>
                    <p className="text-sm text-[#6F6C90]">House Name</p>
                    <p className="text-[#170F49] font-medium">{student?.houseName || "N/A"}</p>
                  </div>
                  <div>
                    <p className="text-sm text-[#6F6C90]">Block Panchayat</p>
                    <p className="text-[#170F49] font-medium">{student?.blockPanchayat || "N/A"}</p>
                  </div>
                  <div>
                    <p className="text-sm text-[#6F6C90]">Local Body</p>
                    <p className="text-[#170F49] font-medium">{student?.localBody || "N/A"}</p>
                  </div>
                  <div>
                    <p className="text-sm text-[#6F6C90]">Taluk</p>
                    <p className="text-[#170F49] font-medium">{student?.taluk || "N/A"}</p>
                  </div>
                  <div>
                    <p className="text-sm text-[#6F6C90]">Street Name</p>
                    <p className="text-[#170F49] font-medium">{student?.streetName || "N/A"}</p>
                  </div>
                  <div>
                    <p className="text-sm text-[#6F6C90]">Post Office</p>
                    <p className="text-[#170F49] font-medium">{student?.postOffice || "N/A"}</p>
                  </div>
                  <div>
                    <p className="text-sm text-[#6F6C90]">Pin Code</p>
                    <p className="text-[#170F49] font-medium">{student?.pinCode || "N/A"}</p>
                  </div>
                  <div>
                    <p className="text-sm text-[#6F6C90]">Revenue District</p>
                    <p className="text-[#170F49] font-medium">{student?.revenueDistrict || "N/A"}</p>
                  </div>
                </div>
              </div>

              {/* Contact Information Section */}
              <div className="col-span-full">
                <h2 className="text-xl font-semibold text-[#170F49] mb-4">Contact Information</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6 bg-white/50 rounded-2xl">
                  <div>
                    <p className="text-sm text-[#6F6C90]">Phone Number</p>
                    <p className="text-[#170F49] font-medium">{student?.phoneNumber || "N/A"}</p>
                  </div>
                  <div>
                    <p className="text-sm text-[#6F6C90]">Email</p>
                    <p className="text-[#170F49] font-medium">{student?.email || "N/A"}</p>
                  </div>
                </div>
              </div>

              {/* Family Information Section */}
              <div className="col-span-full">
                <h2 className="text-xl font-semibold text-[#170F49] mb-4">Family Information</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6 bg-white/50 rounded-2xl">
                  <div>
                    <p className="text-sm text-[#6F6C90]">Father's Name</p>
                    <p className="text-[#170F49] font-medium">{student?.fatherName || "N/A"}</p>
                  </div>
                  <div>
                    <p className="text-sm text-[#6F6C90]">Father's Education</p>
                    <p className="text-[#170F49] font-medium">{student?.fatherEducation || "N/A"}</p>
                  </div>
                  <div>
                    <p className="text-sm text-[#6F6C90]">Father's Occupation</p>
                    <p className="text-[#170F49] font-medium">{student?.fatherOccupation || "N/A"}</p>
                  </div>
                  <div>
                    <p className="text-sm text-[#6F6C90]">Mother's Name</p>
                    <p className="text-[#170F49] font-medium">{student?.motherName || "N/A"}</p>
                  </div>
                  <div>
                    <p className="text-sm text-[#6F6C90]">Mother's Education</p>
                    <p className="text-[#170F49] font-medium">{student?.motherEducation || "N/A"}</p>
                  </div>
                  <div>
                    <p className="text-sm text-[#6F6C90]">Mother's Occupation</p>
                    <p className="text-[#170F49] font-medium">{student?.motherOccupation || "N/A"}</p>
                  </div>
                  {student?.guardianName && (
                    <>
                      <div>
                        <p className="text-sm text-[#6F6C90]">Guardian's Name</p>
                        <p className="text-[#170F49] font-medium">{student?.guardianName || "N/A"}</p>
                      </div>
                      <div>
                        <p className="text-sm text-[#6F6C90]">Guardian's Relationship</p>
                        <p className="text-[#170F49] font-medium">{student?.guardianRelationship || "N/A"}</p>
                      </div>
                      <div>
                        <p className="text-sm text-[#6F6C90]">Guardian's Contact</p>
                        <p className="text-[#170F49] font-medium">{student?.guardianContact || "N/A"}</p>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Academic Information Section */}
              <div className="col-span-full">
                <h2 className="text-xl font-semibold text-[#170F49] mb-4">Academic Information</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6 bg-white/50 rounded-2xl">
                  <div>
                    <p className="text-sm text-[#6F6C90]">Class</p>
                    <p className="text-[#170F49] font-medium">{student?.class || "N/A"}</p>
                  </div>
                  <div>
                    <p className="text-sm text-[#6F6C90]">Roll Number</p>
                    <p className="text-[#170F49] font-medium">{student?.rollNo || "N/A"}</p>
                  </div>
                  <div>
                    <p className="text-sm text-[#6F6C90]">Admission Number</p>
                    <p className="text-[#170F49] font-medium">{student?.admissionNumber || "N/A"}</p>
                  </div>
                  <div>
                    <p className="text-sm text-[#6F6C90]">Academic Year</p>
                    <p className="text-[#170F49] font-medium">{student?.academicYear || "N/A"}</p>
                  </div>
                  <div>
                    <p className="text-sm text-[#6F6C90]">Class Teacher</p>
                    <p className="text-[#170F49] font-medium">{student?.classTeacher || "N/A"}</p>
                  </div>
                  <div>
                    <p className="text-sm text-[#6F6C90]">Admission Date</p>
                    <p className="text-[#170F49] font-medium">{student?.admissionDate || "N/A"}</p>
                  </div>
                </div>
              </div>
            </div>
          )}
          {activeTab === "case-record" && (
            /* Case Record Tab */
            <div className="flex gap-6 flex-col md:flex-row">
              {/* Left Sidebar Navigation */}
              <aside className="w-full md:w-64 flex-shrink-0">
                <div className="bg-white/30 backdrop-blur-xl rounded-2xl p-4 border border-white/20 sticky top-4">
                  <nav className="space-y-2">
                    {[
                      { id: 'identification', label: 'Identification Data', icon: (
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2" />
                        </svg>
                      ) },
                      { id: 'demographic', label: 'Demographic Data', icon: (
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                      ) },
                      { id: 'contact', label: 'Contact & Medical', icon: (
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                        </svg>
                      ) },
                      { id: 'family', label: 'Family History', icon: (
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                        </svg>
                      ) },
                      { id: 'development', label: 'Development History', icon: (
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                      ) },
                      { id: 'education', label: 'Special Education', icon: (
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                        </svg>
                      ) },
                      { id: 'medical', label: 'Medical Information', icon: (
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                      ) },
                      { id: 'documents', label: 'Documents', icon: (
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                      ) }
                    ].map((section) => (
                      <button
                        key={section.id}
                        onClick={() => setActiveCaseSection(section.id)}
                        className={`w-full text-left px-4 py-3 rounded-xl transition-all duration-300 flex items-center gap-3 ${
                          activeCaseSection === section.id
                            ? 'bg-[#E38B52] text-white shadow-lg'
                            : 'bg-white/50 text-[#170F49] hover:bg-white/80'
                        }`}
                      >
                        <span className={`transition-all duration-300 ${
                          activeCaseSection === section.id ? 'text-white' : 'text-[#E38B52]'
                        }`}>{section.icon}</span>
                        <span className="text-sm font-medium">{section.label}</span>
                      </button>
                    ))}
                  </nav>
                </div>
              </aside>

              {/* Right Content Area */}
              <div className="flex-1 max-w-[1100px]">
                {/* Identification Data Section */}
                {activeCaseSection === 'identification' && (
                  <div className="bg-white/30 backdrop-blur-xl rounded-3xl shadow-xl p-8 md:p-12 border border-white/20">
                    <h2 className="text-2xl font-bold text-[#170F49] mb-6 pb-4 border-b border-[#E38B52]/20 flex items-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2 text-[#E38B52]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2" />
                      </svg>
                      Identification Data
                    </h2>
                    <div className="p-6 bg-white/50 rounded-2xl">
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                        <div className="md:col-span-2">
                          <p className="text-sm text-[#6F6C90]">Name</p>
                          <p className="text-[#170F49] font-medium">{student?.name || 'N/A'}</p>
                        </div>
                        <div className="md:col-span-2">
                          <p className="text-sm text-[#6F6C90]">Admission No</p>
                          <p className="text-[#170F49] font-medium">{student?.studentId || 'N/A'}</p>
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
                )}

                {/* Demographic Data Section */}
                {activeCaseSection === 'demographic' && (
                  <div className="bg-white/30 backdrop-blur-xl rounded-3xl shadow-xl p-8 md:p-12 border border-white/20">
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
                            <p className="text-[#170F49] font-medium">{student?.address && student?.phoneNumber ? `${student.address}, ${student.phoneNumber}` : 'N/A'}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Contact & Medical Information */}
                {activeCaseSection === 'contact' && (
                  <div className="bg-white/30 backdrop-blur-xl rounded-3xl shadow-xl p-8 md:p-12 border border-white/20">
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
                )}

                {/* Family History */}
                {activeCaseSection === 'family' && (
                  <div className="bg-white/30 backdrop-blur-xl rounded-3xl shadow-xl p-8 md:p-12 border border-white/20">
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
                              {student?.household && student.household.length > 0 ? (
                                student.household.map((member, index) => (
                                  <tr key={index} className="border-b border-[#E38B52]/10 last:border-b-0">
                                    <td className="px-4 py-3 text-sm text-[#170F49]">{index + 1}</td>
                                    <td className="px-4 py-3 text-sm text-[#170F49]">{member.name || 'N/A'}</td>
                                    <td className="px-4 py-3 text-sm text-[#170F49]">{member.age || 'N/A'}</td>
                                    <td className="px-4 py-3 text-sm text-[#170F49]">{member.education || 'N/A'}</td>
                                    <td className="px-4 py-3 text-sm text-[#170F49]">{member.occupation || 'N/A'}</td>
                                    <td className="px-4 py-3 text-sm text-[#170F49]">{member.health || 'N/A'}</td>
                                    <td className="px-4 py-3 text-sm text-[#170F49]">{member.income || 'N/A'}</td>
                                  </tr>
                                ))
                              ) : (
                                <tr>
                                  <td colSpan="7" className="px-4 py-8 text-sm text-[#6F6C90] text-center">
                                    No household composition data available
                                  </td>
                                </tr>
                              )}
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
                )}

                {/* Development History - CONTINUING BELOW */}
                {activeCaseSection === 'development' && (
                  <div className="bg-white/30 backdrop-blur-xl rounded-3xl shadow-xl p-8 md:p-12 border border-white/20">
                    <h2 className="text-2xl font-bold text-[#170F49] mb-6 pb-4 border-b border-[#E38B52]/20 flex items-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2 text-[#E38B52]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                      </svg>
                      Development History
                    </h2>
                    <div className="p-6 bg-white/50 rounded-2xl mt-6">
                      <h3 className="text-lg font-semibold text-[#170F49] mb-4">Developmental History</h3>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-x-6 gap-y-4 p-4 bg-white/70 rounded-xl">
                        {student?.developmentHistory && Object.keys(student.developmentHistory).length > 0 ? (
                          Object.entries(student.developmentHistory).map(([key, value]) => (
                            <div key={key} className="flex items-center">
                              {value ? (
                                <span className="text-green-500 font-bold mr-2 text-xl">✓</span>
                              ) : (
                                <span className="text-red-500 font-bold mr-2 text-xl">✗</span>
                              )}
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
                    <div className="mt-6">
                      <h2 className="text-2xl font-bold text-[#170F49] mb-6 pb-4 border-b border-[#E38B52]/20 flex items-center">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2 text-[#E38B52]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        Additional Information
                      </h2>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                  </div>
                )}

                {/* Special Education Assessment Section */}
                {activeCaseSection === 'education' && (
                  <div className="bg-white/30 backdrop-blur-xl rounded-3xl shadow-xl p-8 md:p-12 border border-white/20">
                    <h2 className="text-2xl font-bold text-[#170F49] mb-6 pb-4 border-b border-[#E38B52]/20 flex items-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2 text-[#E38B52]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h2" />
                      </svg>
                      Special Education Assessment
                    </h2>

                    {/* Horizontal Navigation for Subsections */}
                    <div className="mb-8 overflow-x-auto">
                      <div className="flex gap-2 min-w-max pb-2">
                        {[
                          { id: 'self-help', label: 'Self Help' },
                          { id: 'motor', label: 'Motor' },
                          { id: 'sensory', label: 'Sensory' },
                          { id: 'socialization', label: 'Socialization' },
                          { id: 'cognitive', label: 'Cognitive' },
                          { id: 'academic', label: 'Academic' },
                          { id: 'prevocational', label: 'Prevocational' },
                          { id: 'other-info', label: 'Other Info' }
                        ].map((subsection) => (
                          <button
                            key={subsection.id}
                            onClick={() => setActiveEducationSubsection(subsection.id)}
                            className={`px-6 py-2 rounded-lg text-sm font-medium transition-all duration-300 whitespace-nowrap ${
                              activeEducationSubsection === subsection.id
                                ? 'bg-[#E38B52] text-white shadow-lg'
                                : 'bg-white/50 text-[#170F49] hover:bg-white/80'
                            }`}
                          >
                            {subsection.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Self Help */}
                    {activeEducationSubsection === 'self-help' && (
                      <div className="bg-white/30 backdrop-blur-xl rounded-2xl p-6 space-y-8">
                        <h3 className="text-lg font-semibold text-[#170F49] pb-2 border-b border-[#E38B52]/10">Self Help</h3>
                        
                        {/* Food Habits */}
                        <div className="bg-white rounded-xl p-6 space-y-6 shadow-lg">
                          <h4 className="text-md font-medium text-[#170F49]">Food Habits</h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                              <label className="block text-sm font-medium text-[#170F49] mb-2">Eating</label>
                              <p className="text-[#170F49] font-medium">{student?.assessment?.self_help?.food_habits?.eating || 'N/A'}</p>
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-[#170F49] mb-2">Drinking</label>
                              <p className="text-[#170F49] font-medium">{student?.assessment?.self_help?.food_habits?.drinking || 'N/A'}</p>
                            </div>
                          </div>
                        </div>

                        <div className="space-y-6">
                          <div>
                            <label className="block text-sm font-medium text-[#170F49] mb-2">Toilet Habits (Include mention hygenic where applicable)</label>
                            <p className="text-[#170F49] font-medium">{student?.assessment?.self_help?.toilet_habits || 'N/A'}</p>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-[#170F49] mb-2">Brushing</label>
                            <p className="text-[#170F49] font-medium">{student?.assessment?.self_help?.brushing || 'N/A'}</p>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-[#170F49] mb-2">Bathing</label>
                            <p className="text-[#170F49] font-medium">{student?.assessment?.self_help?.bathing || 'N/A'}</p>
                          </div>
                        </div>

                        {/* Dressing */}
                        <div className="bg-white/30 backdrop-blur-xl rounded-2xl p-6 space-y-6">
                          <h4 className="text-md font-medium text-[#170F49]">Dressing</h4>
                          <div className="bg-white rounded-xl p-6 space-y-6 shadow-lg">
                            <div>
                              <label className="block text-sm font-medium text-[#170F49] mb-2">Removing and wearing clothes</label>
                              <p className="text-[#170F49] font-medium">{student?.assessment?.self_help?.dressing?.removing_and_wearing || 'N/A'}</p>
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-[#170F49] mb-2">Unbuttoning and Buttoning</label>
                              <p className="text-[#170F49] font-medium">{student?.assessment?.self_help?.dressing?.buttoning || 'N/A'}</p>
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-[#170F49] mb-2">wearing shoes/Slippers</label>
                              <p className="text-[#170F49] font-medium">{student?.assessment?.self_help?.dressing?.footwear || 'N/A'}</p>
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-[#170F49] mb-2">Grooming (include shaving skills where applicable)</label>
                              <p className="text-[#170F49] font-medium">{student?.assessment?.self_help?.dressing?.grooming || 'N/A'}</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Motor */}
                    {activeEducationSubsection === 'motor' && (
                      <div className="bg-white/30 backdrop-blur-xl rounded-2xl p-6 space-y-8">
                        <h3 className="text-lg font-semibold text-[#170F49] pb-2 border-b border-[#E38B52]/10">Motor</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-white rounded-xl p-6 shadow-lg">
                          <div>
                            <label className="block text-sm font-medium text-[#170F49] mb-2">Gross Motor</label>
                            <p className="text-[#170F49] font-medium">{student?.assessment?.motor?.gross_motor || 'N/A'}</p>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-[#170F49] mb-2">Fine Motor</label>
                            <p className="text-[#170F49] font-medium">{student?.assessment?.motor?.fine_motor || 'N/A'}</p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Sensory */}
                    {activeEducationSubsection === 'sensory' && (
                      <div className="bg-white/30 backdrop-blur-xl rounded-2xl p-6 space-y-8">
                        <h3 className="text-lg font-semibold text-[#170F49] pb-2 border-b border-[#E38B52]/10">Sensory</h3>
                        <div className="bg-white rounded-xl p-6 shadow-lg">
                          <p className="text-[#170F49] font-medium">{student?.assessment?.sensory || 'N/A'}</p>
                        </div>
                      </div>
                    )}

                    {/* Socialization */}
                    {activeEducationSubsection === 'socialization' && (
                      <div className="bg-white/30 backdrop-blur-xl rounded-2xl p-6 space-y-8">
                        <h3 className="text-lg font-semibold text-[#170F49] pb-2 border-b border-[#E38B52]/10">Socialization</h3>
                        <div className="bg-white rounded-xl p-6 space-y-6 shadow-lg">
                          <div>
                            <label className="block text-sm font-medium text-[#170F49] mb-2">Language/Communication</label>
                            <p className="text-[#170F49] font-medium">{student?.assessment?.socialization?.language_communication || 'N/A'}</p>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-[#170F49] mb-2">Social behaviour</label>
                            <p className="text-[#170F49] font-medium">{student?.assessment?.socialization?.social_behaviour || 'N/A'}</p>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-[#170F49] mb-2">Mobility in the neighborhood</label>
                            <p className="text-[#170F49] font-medium">{student?.assessment?.socialization?.mobility || 'N/A'}</p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Cognitive */}
                    {activeEducationSubsection === 'cognitive' && (
                      <div className="bg-white/30 backdrop-blur-xl rounded-2xl p-6 space-y-8">
                        <h3 className="text-lg font-semibold text-[#170F49] pb-2 border-b border-[#E38B52]/10">Cognitive</h3>
                        <div className="bg-white rounded-xl p-6 space-y-6 shadow-lg">
                          <div>
                            <label className="block text-sm font-medium text-[#170F49] mb-2">Attention</label>
                            <p className="text-[#170F49] font-medium">{student?.assessment?.cognitive?.attention || 'N/A'}</p>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-[#170F49] mb-2">Identification of familiar objects</label>
                            <p className="text-[#170F49] font-medium">{student?.assessment?.cognitive?.identification_of_objects || 'N/A'}</p>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-[#170F49] mb-2">Use of familiar objects</label>
                            <p className="text-[#170F49] font-medium">{student?.assessment?.cognitive?.use_of_objects || 'N/A'}</p>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-[#170F49] mb-2">Following simple instruction</label>
                            <p className="text-[#170F49] font-medium">{student?.assessment?.cognitive?.following_instruction || 'N/A'}</p>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-[#170F49] mb-2">Awareness of danger and hazards</label>
                            <p className="text-[#170F49] font-medium">{student?.assessment?.cognitive?.awareness_of_danger || 'N/A'}</p>
                          </div>
                        </div>
                        
                        {/* Concept Formation */}
                        <div className="bg-white/30 backdrop-blur-xl rounded-2xl p-6 space-y-6">
                          <h4 className="text-md font-medium text-[#170F49]">Concept formation (Indicate ability to match, identify name wherever applicable)</h4>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div>
                              <label className="block text-sm font-medium text-[#170F49] mb-2">Color</label>
                              <p className="text-[#170F49] font-medium">{student?.assessment?.cognitive?.concept_formation?.color || 'N/A'}</p>
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-[#170F49] mb-2">Size</label>
                              <p className="text-[#170F49] font-medium">{student?.assessment?.cognitive?.concept_formation?.size || 'N/A'}</p>
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-[#170F49] mb-2">Sex</label>
                              <p className="text-[#170F49] font-medium">{student?.assessment?.cognitive?.concept_formation?.sex || 'N/A'}</p>
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-[#170F49] mb-2">Shape</label>
                              <p className="text-[#170F49] font-medium">{student?.assessment?.cognitive?.concept_formation?.shape || 'N/A'}</p>
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-[#170F49] mb-2">Number</label>
                              <p className="text-[#170F49] font-medium">{student?.assessment?.cognitive?.concept_formation?.number || 'N/A'}</p>
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-[#170F49] mb-2">Time</label>
                              <p className="text-[#170F49] font-medium">{student?.assessment?.cognitive?.concept_formation?.time || 'N/A'}</p>
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-[#170F49] mb-2">Money</label>
                              <p className="text-[#170F49] font-medium">{student?.assessment?.cognitive?.concept_formation?.money || 'N/A'}</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Academic */}
                    {activeEducationSubsection === 'academic' && (
                      <div className="bg-white/30 backdrop-blur-xl rounded-2xl p-6 space-y-8">
                        <h3 className="text-lg font-semibold text-[#170F49] pb-2 border-b border-[#E38B52]/10">Academic (give brief history: class attended/attending indicate class/grade/level wherever appropriate)</h3>
                        <div className="bg-white rounded-xl p-6 space-y-6 shadow-lg">
                          <div>
                            <label className="block text-sm font-medium text-[#170F49] mb-2">Reading</label>
                            <p className="text-[#170F49] font-medium">{student?.assessment?.academic?.reading || 'N/A'}</p>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-[#170F49] mb-2">Writing</label>
                            <p className="text-[#170F49] font-medium">{student?.assessment?.academic?.writing || 'N/A'}</p>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-[#170F49] mb-2">Arithmetic</label>
                            <p className="text-[#170F49] font-medium">{student?.assessment?.academic?.arithmetic || 'N/A'}</p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Prevocational/Domestic */}
                    {activeEducationSubsection === 'prevocational' && (
                      <div className="bg-white/30 backdrop-blur-xl rounded-2xl p-6 space-y-8">
                        <h3 className="text-lg font-semibold text-[#170F49] pb-2 border-b border-[#E38B52]/10">Prevocational/Domestic (Specify ability and interest)</h3>
                        <div className="bg-white rounded-xl p-6 shadow-lg">
                          <p className="text-[#170F49] font-medium">{student?.assessment?.prevocational?.ability_and_interest || 'N/A'}</p>
                        </div>
                        <div className="space-y-6">
                          <div>
                            <label className="block text-sm font-medium text-[#170F49] mb-2">Items of interest</label>
                            <p className="text-[#170F49] font-medium">{student?.assessment?.prevocational?.items_of_interest || 'N/A'}</p>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-[#170F49] mb-2">Items of dislike</label>
                            <p className="text-[#170F49] font-medium">{student?.assessment?.prevocational?.items_of_dislike || 'N/A'}</p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Other Info */}
                    {activeEducationSubsection === 'other-info' && (
                      <div className="bg-white/30 backdrop-blur-xl rounded-2xl p-6 space-y-6">
                        <h3 className="text-lg font-semibold text-[#170F49] pb-2 border-b border-[#E38B52]/10">Additional Information</h3>
                        <div>
                          <label className="block text-sm font-medium text-[#170F49] mb-2">Any peculiar behaviour/behaviour problems observed</label>
                          <p className="text-[#170F49] font-medium">{student?.assessment?.behaviour_problems || 'N/A'}</p>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-[#170F49] mb-2">Any other</label>
                          <p className="text-[#170F49] font-medium">{student?.assessment?.any_other || 'N/A'}</p>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-[#170F49] mb-2">Recommendation</label>
                          <p className="text-[#170F49] font-medium">{student?.assessment?.recommendation || 'N/A'}</p>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Medical Information */}
                {activeCaseSection === 'medical' && (
                  <div className="bg-white/30 backdrop-blur-xl rounded-3xl shadow-xl p-8 md:p-12 border border-white/20">
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
                )}

                {/* Documents Section */}
                {activeCaseSection === 'documents' && (
                  <div className="bg-white/30 backdrop-blur-xl rounded-3xl shadow-xl p-8 md:p-12 border border-white/20">
                    <h2 className="text-2xl font-bold text-[#170F49] mb-6 pb-4 border-b border-[#E38B52]/20 flex items-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2 text-[#E38B52]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      Documents
                    </h2>
                    <div className="p-6 bg-white/50 rounded-2xl">
                      <div className="text-center py-12">
                        <svg 
                          className="mx-auto h-12 w-12 text-[#6F6C90] mb-4" 
                          fill="none" 
                          viewBox="0 0 24 24" 
                          stroke="currentColor"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        <p className="text-[#6F6C90]">Document management is available for authorized staff only</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === "reports" && (
            /* Reports Tab */
            <div className="space-y-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-[#170F49] flex items-center">
                  <svg className="w-6 h-6 mr-2 text-[#E38B52]" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Your Therapy Progress Reports
                </h2>
                {notifications.length > 0 && (
                  <span className="text-sm text-[#6F6C90]">
                    {notifications.length} {notifications.length === 1 ? 'report' : 'reports'}
                  </span>
                )}
              </div>

              {notificationsLoading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="w-8 h-8 border-4 border-[#E38B52] border-t-transparent rounded-full animate-spin"></div>
                  <span className="ml-3 text-[#6F6C90]">Loading reports...</span>
                </div>
              ) : notifications.length === 0 ? (
                <div className="bg-white/50 rounded-2xl p-12 text-center">
                  <svg className="mx-auto h-16 w-16 text-[#6F6C90] mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <p className="text-lg text-[#6F6C90] mb-2">No reports yet</p>
                  <p className="text-sm text-[#6F6C90]">Your teachers and therapists will share progress reports here</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {notifications.map((notification) => (
                    <div
                      key={notification.id}
                      className={`bg-white/50 backdrop-blur-sm rounded-2xl p-6 border transition-all duration-200 hover:shadow-lg ${
                        !notification.is_read
                          ? 'border-[#E38B52] shadow-md'
                          : 'border-white/20'
                      }`}
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <h3 className="text-lg font-bold text-[#170F49] mb-1 flex items-center gap-2">
                            {notification.title}
                            {!notification.is_read && (
                              <span className="px-2 py-0.5 text-xs bg-[#E38B52] text-white rounded-full">New</span>
                            )}
                          </h3>
                          <p className="text-sm text-[#6F6C90]">
                            Sent by {notification.sent_by_name || 'Staff'} 
                            {notification.sent_by_role && ` (${notification.sent_by_role})`}
                          </p>
                        </div>
                        <div className="text-right text-xs text-[#6F6C90]">
                          {new Date(notification.created_at).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric'
                          })}
                        </div>
                      </div>

                      {notification.message && (
                        <p className="text-sm text-[#170F49] mb-3">{notification.message}</p>
                      )}

                      {(notification.report_from_date || notification.report_to_date || notification.therapy_type) && (
                        <div className="flex flex-wrap gap-2 mb-3">
                          {notification.therapy_type && (
                            <span className="px-3 py-1 bg-[#E38B52]/10 text-[#E38B52] rounded-full text-xs font-medium">
                              {notification.therapy_type}
                            </span>
                          )}
                          {notification.report_from_date && notification.report_to_date && (
                            <span className="px-3 py-1 bg-blue-50 text-blue-600 rounded-full text-xs font-medium">
                              {notification.report_from_date} to {notification.report_to_date}
                            </span>
                          )}
                        </div>
                      )}

                      {notification.report_summary && (
                        <div className="mt-4">
                          <button
                            onClick={() => toggleReportExpansion(notification.id, notification.is_read)}
                            className="w-full p-4 bg-gradient-to-br from-orange-50/60 to-orange-100/40 rounded-xl border border-[#E38B52]/20 hover:from-orange-100/70 hover:to-orange-200/50 transition-all duration-200"
                          >
                            <div className="flex items-center justify-between">
                              <h4 className="text-sm font-bold text-[#C56930] flex items-center gap-2">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                </svg>
                                Progress Summary
                              </h4>
                              <svg
                                className={`w-5 h-5 text-[#C56930] transition-transform duration-200 ${expandedReports[notification.id] ? 'rotate-180' : ''}`}
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2.5"
                                viewBox="0 0 24 24"
                              >
                                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                              </svg>
                            </div>
                          </button>
                          {expandedReports[notification.id] && (
                            <div className="mt-2 p-4 bg-white rounded-xl border border-[#E38B52]/10">
                              <div className="flex items-center justify-between mb-3 pb-2 border-b border-gray-200">
                                <span className="text-xs font-semibold text-gray-600 uppercase">
                                  {translatedReports[notification.id] ? 'Malayalam Translation' : 'English Summary'}
                                </span>
                                <div className="flex gap-2">
                                  {translatedReports[notification.id] && (
                                    <button
                                      onClick={() => {
                                        setTranslatedReports(prev => {
                                          const newState = { ...prev };
                                          delete newState[notification.id];
                                          return newState;
                                        });
                                      }}
                                      className="text-xs text-gray-500 hover:text-[#E38B52] underline transition-colors"
                                    >
                                      Show Original
                                    </button>
                                  )}
                                  <button
                                    onClick={() => handleTranslateReport(notification.id, notification.report_summary)}
                                    disabled={translatingReports[notification.id]}
                                    className="px-3 py-1 text-xs font-medium text-white bg-[#E38B52] rounded-lg hover:bg-[#D67A3F] disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center gap-1.5 shadow-sm hover:shadow-md"
                                    title="Translate to Malayalam"
                                  >
                                    {translatingReports[notification.id] ? (
                                      <>
                                        <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                        <span>Translating...</span>
                                      </>
                                    ) : (
                                      <>
                                        <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                          <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2" fill="none" />
                                          <path d="M2 12h20" stroke="currentColor" strokeWidth="2" />
                                          <path d="M12 2a15.3 15.3 0 010 20M12 2a15.3 15.3 0 000 20" stroke="currentColor" strokeWidth="2" fill="none" />
                                        </svg>
                                        <span>മലയാളം</span>
                                      </>
                                    )}
                                  </button>
                                </div>
                              </div>
                              <div className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">
                                {translatingReports[notification.id] ? (
                                  <div className="flex items-center gap-2 text-gray-500 py-4">
                                    <div className="w-4 h-4 border-2 border-[#E38B52] border-t-transparent rounded-full animate-spin"></div>
                                    Translating to Malayalam...
                                  </div>
                                ) : translatedReports[notification.id] ? (
                                  <div className="text-base" style={{ fontFamily: 'system-ui, sans-serif', lineHeight: '1.8' }}>
                                    {translatedReports[notification.id]}
                                  </div>
                                ) : (
                                  notification.report_summary
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Add CSS animations */}
      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-20px); }
        }
        .animate-float {
          animation: float 6s ease-in-out infinite;
        }
        .animation-delay-3000 {
          animation-delay: 3s;
        }
        .animation-delay-5000 {
          animation-delay: 5s;
        }
        .animation-delay-7000 {
          animation-delay: 7s;
        }
      `}</style>
    </div>
  );
};

export default StudentViewPage;
