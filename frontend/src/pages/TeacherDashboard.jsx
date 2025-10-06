import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

const TeacherDashboard = () => {
  const navigate = useNavigate();
  //here 1st
  const [userName, setUserName] = useState("        "); // will be populated from backend
  const [showReportDialog, setShowReportDialog] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [reportDate, setReportDate] = useState(() =>
    new Date().toISOString().slice(0, 10)
  );
  const [therapyType, setTherapyType] = useState("Occupational");
  const [progressNotes, setProgressNotes] = useState("");
  const [goalsAchieved, setGoalsAchieved] = useState("");
  const [progressLevel, setProgressLevel] = useState("Excellent");
  const [isSubmitting, setIsSubmitting] = useState(false);
  //1.
  const [filterOption, setFilterOption] = useState("all");
  const [selectedClass, setSelectedClass] = useState("all");
  const [isSearchFloating, setIsSearchFloating] = useState(false);
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);
  const [studentSearch, setStudentSearch] = useState("");
  const [students, setStudents] = useState([]);
  const [studentsLoading, setStudentsLoading] = useState(false);
  // Add scroll event listener
  useEffect(() => {
    const handleScroll = () => {
      const searchBarPosition = document
        .getElementById("search-container")
        ?.getBoundingClientRect().top;
      if (searchBarPosition < 0) {
        setIsSearchFloating(true);
      } else {
        setIsSearchFloating(false);
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Fetch current user name from backend (if token available)
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) return;
        const { data } = await axios.get("http://localhost:8000/api/v1/users/me", {
          headers: { Authorization: `Bearer ${token}` },
        });
        // Prefer username, fallback to email local-part
        if (data?.username) setUserName(data.username);
        else if (data?.email) setUserName(data.email.split("@")[0]);
      } catch (err) {
        // silently fail and keep fallback
        // console.error("Failed to fetch current user:", err);
      }
    };

    fetchUser();
  }, []);

  // Fetch students from backend (similar to HeadMaster)
  useEffect(() => {
    const fetchStudents = async () => {
      // require userName to be available to filter by logged-in teacher
      if (!userName) return;
      setStudentsLoading(true);
      try {
        const params = {
          page: 1,
          page_size: 100,
        };
        if (studentSearch && studentSearch.trim()) params.search = studentSearch.trim();
        if (selectedClass && selectedClass !== "all") params.class_name = selectedClass;

        const { data } = await axios.get("http://localhost:8000/api/v1/students/", { params });
        const items = Array.isArray(data?.items) ? data.items : Array.isArray(data) ? data : [];
        const sortedStudents = [...items].sort((a, b) => (a.name || "").localeCompare(b.name || ""));

        // Filter students where class_teacher matches the logged-in username (case-insensitive)
        const filteredByTeacher = sortedStudents.filter((s) => {
          const ct = (s.class_teacher || s.classTeacher || "").toString().trim().toLowerCase();
          return ct && userName && ct === userName.toLowerCase();
        });

        setStudents(filteredByTeacher);
      } catch (err) {
        console.error("Error fetching students:", err);
      } finally {
        setStudentsLoading(false);
      }
    };

    // fetch when search, class filter, or userName change
    fetchStudents();
  }, [studentSearch, selectedClass, userName]);

  // Add this function to handle logout
  const handleLogout = () => {
    // Clear the token from localStorage
    localStorage.removeItem("token");
    // Redirect to login page
    navigate("/");
  };

  // Add this function to handle navigation to StudentPage
  const handleStudentClick = (studentId) => {
    navigate(`/student/${studentId}`);
  };

  return (
    <div className="min-h-screen w-full flex flex-col items-center bg-[#f7f7f7] relative overflow-x-hidden py-20">
      {/* Update Logout Button */}
      <div className="fixed top-6 right-6 z-50">
        <button
          onClick={handleLogout}
          className="px-6 py-3 bg-[#E38B52] text-white rounded-xl hover:bg-[#E38B52]/90 transition-all duration-200 shadow-[inset_0_2px_4px_rgba(255,255,255,0.3),inset_0_4px_8px_rgba(255,255,255,0.2)] hover:-translate-y-1 hover:scale-105 flex items-center gap-2"
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
          Hi {userName}
        </h1>
        <p className="text-[#6F6C8F] mt-2">View and Manage Students</p>
        <p className="text-[#6F6C8F] text-sm mt-1">
          {new Date().toLocaleDateString("en-US", {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
          })}
        </p>
      </div>

      {/* Floating Search Bar */}
      <div
        className={`fixed top-0 left-0 right-0 z-50 transition-transform duration-300 ease-in-out ${
          isSearchFloating ? "translate-y-0" : "-translate-y-full"
        }`}
      >
        <div className="backdrop-blur-xl p-4">
          <div className="w-[90%] max-w-[1200px] mx-auto">
            <div className="relative w-full md:w-[443px] mx-auto">
              <input
                type="text"
                placeholder="Search students..."
                className="w-full pl-10 pr-4 py-3 rounded-xl border bg-white/30 backdrop-blur-sm shadow-lg hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-[#E38B52] transition-all duration-300 placeholder:text-gray-400 hover:placeholder:text-gray-600"
                value={studentSearch}
                onChange={(e) => setStudentSearch(e.target.value)}
              />
              <svg
                className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Animated background blobs with fixed positioning */}
      <div className="fixed top-0 -left-40 w-[600px] h-[500px] bg-[#E38B52] rounded-full mix-blend-multiply filter blur-2xl opacity-30 animate-float z-0" />
      <div className="fixed -bottom-32 right-40 w-[600px] h-[600px] bg-[#E38B52] rounded-full mix-blend-multiply filter blur-2xl opacity-40 animate-float animation-delay-3000 z-0" />
      <div className="fixed top-1/2 left-1/2 w-[500px] h-[500px] bg-[#E38B52] rounded-full mix-blend-multiply filter blur-2xl opacity-40 animate-float animation-delay-5000 z-0" />
      <div className="fixed top-0 -left-40 w-[500px] h-[600px] bg-[#E38B52] rounded-full mix-blend-multiply filter blur-2xl opacity-30 animate-float animation-delay-7000 z-0" />

      <div className="w-[90%] max-w-[1200px] mx-4 z-10">
        {/* Main container */}
        <div className="relative bg-white/30 backdrop-blur-xl rounded-3xl shadow-xl p-8 md:p-12 border border-white/20">
          {/* Filter and Search Section */}
          <div className="flex justify-between items-center mb-8 px-4">
            {/* Search Bar */}
            <div className="relative">
              <input
                type="text"
                placeholder="Search students..."
                className="w-[443px] pl-10 pr-4 py-3 rounded-xl border bg-white shadow-lg hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-[#E38B52] transition-all duration-300 placeholder:text-gray-400 hover:placeholder:text-gray-600"
                value={studentSearch}
                onChange={(e) => setStudentSearch(e.target.value)}
              />
              <svg
                className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z"
                  clipRule="evenodd"
                />
              </svg>
            </div>

            <div className="flex items-center gap-3">
              {/* Add Student Button removed*/}
              <div className="relative">
                {/* Filter Button enhanced*/}
                <button
                  onClick={() => setShowFilterDropdown(!showFilterDropdown)}
                  className="px-5 py-2.5 bg-[#E38B52] text-white rounded-xl hover:bg-[#E38B52]/90 transition-all flex items-center gap-2 shadow-[0_4px_6px_-1px_rgba(0,0,0,0.1)] hover:shadow-[0_6px_8px_-1px_rgba(0,0,0,0.1)]"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M3 3a1 1 0 011-1h12a1 1 0 011 1v3a1 1 0 01-.293.707L12 11.414V15a1 1 0 01-.293.707l-2 2A1 1 0 018 17v-5.586L3.293 6.707A1 1 0 013 6V3z"
                      clipRule="evenodd"
                    />
                  </svg>
                  Filter Students
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className={`h-4 w-4 transition-transform ${
                      showFilterDropdown ? "rotate-180" : ""
                    }`}
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                      clipRule="evenodd"
                    />
                  </svg>
                </button>
                {/* Filter Dropdown Menu */}
                {showFilterDropdown && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg overflow-hidden z-50">
                    <div className="p-2 space-y-2">
                      <select
                        value={filterOption}
                        onChange={(e) => {
                          setFilterOption(e.target.value);
                        }}
                        className="w-full px-4 py-2.5 text-sm text-[#170F49] bg-[#FAF9F6] rounded-lg border border-gray-200 hover:border-[#E38B52] focus:outline-none focus:border-[#E38B52] transition-all duration-200"
                      >
                        <option value="all">All Students</option>
                        <option value="class">Class</option>
                      </select>

                      {filterOption === "class" && (
                        <select
                          value={selectedClass}
                          onChange={(e) => {
                            setSelectedClass(e.target.value);
                            setShowFilterDropdown(false);
                          }}
                          className="w-full px-4 py-2.5 text-sm text-[#170F49] bg-[#FAF9F6] rounded-lg border border-gray-200 hover:border-[#E38B52] focus:outline-none focus:border-[#E38B52] transition-all duration-200"
                        >
                          <option value="all">All Classes</option>
                          <option value="PrePrimary">PrePrimary</option>
                          <option value="Primary 1">Primary 1</option>
                          <option value="Primary 2">Primary 2</option>
                          <option value="Secondary">Secondary</option>
                          <option value="Pre vocational 1">
                            Pre vocational 1
                          </option>
                          <option value="Pre vocational 2">
                            Pre vocational 2
                          </option>
                          <option value="caregroup-below-18">
                            Care group below 18 years
                          </option>
                          <option value="caregroup-above-18">
                            Care group Above 18 years
                          </option>
                          <option value="vocational">
                            Vocational 18-35 years
                          </option>
                        </select>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Student List */}
          <div className="grid grid-cols-1 gap-4 px-4">
            {students
              .filter((student) => {
                // Search by name or class (support different field names from API)
                const studentClassLabel = (student.class_name || student.className || "").toString();
                const matchesSearch =
                  (student.name || "")
                    .toLowerCase()
                    .includes(studentSearch.toLowerCase()) ||
                  studentClassLabel
                    .toLowerCase()
                    .includes(studentSearch.toLowerCase());

                // Class filter
                const matchesClass =
                  selectedClass === "all" ||
                  studentClassLabel
                    .toLowerCase()
                    .includes(selectedClass.toLowerCase());

                return matchesSearch && matchesClass;
              })
              .map((student) => (
                <div
                  key={student.id}
                  onClick={() => handleStudentClick(student.id)}
                  className="bg-white rounded-2xl p-6 shadow-md hover:shadow-xl transition-all duration-300 hover:-translate-y-1 hover:scale-[1.02] cursor-pointer"
                >
                  <div className="flex items-center space-x-4 text-[#170F49]">
                    <div className="w-16 h-16 rounded-lg overflow-hidden">
                      <img
                        src={`https://eu.ui-avatars.com/api/?name=${student.name}&size=250`}
                        alt="Student"
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.target.src =
                            "https://via.placeholder.com/64?text=Student";
                        }}
                      />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-[#170F49]">
                        {student.name}
                      </h3>
                      <div className="space-y-1">
                        <p className="text-sm text-[#6F6C8F]">
                          <span className="font-medium">Class:</span>{" "}
                          {student.class_name || student.className || "-"}
                        </p>
                        <p className="text-sm text-[#6F6C8F]">
                          <span className="font-medium">Roll No:</span>{" "}
                          {student.roll_no || student.rollNo || "-"}
                        </p>
                      </div>
                    </div>
                    {/* 2nd Report button*/}
                    <button
                      className="px-4 py-2 bg-[#E38B52] text-white rounded-lg shadow-md hover:bg-[#E38B52]/90 transition-transform hover:scale-105"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedStudent(student);
                        setShowReportDialog(true);
                        setReportDate(new Date().toISOString().slice(0, 10));
                        setTherapyType("Occupational");
                        setProgressNotes("");
                        setGoalsAchieved("");
                        setProgressLevel("Excellent");
                      }}
                    >
                      Enter Report
                    </button>
                    <button className="text-[#E38B52] hover:text-[#4f46e5] transition-colors">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-6 w-6"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 5l7 7-7 7"
                        />
                      </svg>
                    </button>
                  </div>
                </div>
              ))}
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
      `}</style>

      {showReportDialog && selectedStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-30 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md max-h-[90vh] overflow-y-auto">
            {" "}
            {/* Added max-h and overflow */}
            <h2 className="text-2xl font-bold text-[#170F49] mb-4 text-center">
              Therapy Report for {selectedStudent.name}
            </h2>
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                
                // Validate required fields
                if (!reportDate) {
                  alert("Please select a report date.");
                  return;
                }
                
                if (!progressNotes.trim()) {
                  alert("Please enter progress notes.");
                  return;
                }
                
                try {
                  setIsSubmitting(true);
                  
                  // Get authentication token
                  const baseUrl = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8000';
                  const token = localStorage.getItem('token');
                  
                  if (!token) {
                    alert("You must be logged in to save reports.");
                    setIsSubmitting(false);
                    return;
                  }

                  const payload = {
                    student_id: selectedStudent.id,
                    report_date: reportDate,
                    therapy_type: therapyType,
                    progress_notes: progressNotes.trim(),
                    goals_achieved: goalsAchieved.trim() || null,
                    progress_level: progressLevel,
                  };

                  const config = {
                    headers: {
                      'Authorization': `Bearer ${token}`,
                      'Content-Type': 'application/json'
                    }
                  };

                  console.log("Saving therapy report:", payload);
                  console.log("API URL:", `${baseUrl}/api/v1/therapy-reports/`);
                  console.log("Config:", config);

                  // POST to backend with authentication
                  const response = await axios.post(`${baseUrl}/api/v1/therapy-reports/`, payload, config);
                  
                  console.log("Report saved successfully:", response.data);
                  
                  // Reset form fields
                  setReportDate(new Date().toISOString().slice(0, 10));
                  setTherapyType("Occupational");
                  setProgressNotes("");
                  setGoalsAchieved("");
                  setProgressLevel("Excellent");
                  
                  // Close dialog and show success
                  setShowReportDialog(false);
                  alert(`Therapy report saved successfully for ${selectedStudent.name}!`);
                  
                } catch (err) {
                  console.error("Failed to save therapy report:", err);
                  
                  if (err.response?.status === 401) {
                    alert("Your session has expired. Please log in again.");
                    // Optionally redirect to login
                    localStorage.removeItem('token');
                  } else if (err.response?.status === 422) {
                    alert("Invalid data format. Please check your inputs and try again.");
                  } else if (err.response?.status === 404) {
                    alert("Student not found. Please refresh the page and try again.");
                  } else if (err.response?.data?.detail) {
                    alert(`Error: ${err.response.data.detail}`);
                  } else if (err.message) {
                    alert(`Error: ${err.message}`);
                  } else {
                    alert("Failed to save report. Please check your connection and try again.");
                  }
                } finally {
                  setIsSubmitting(false);
                }
              }}
            >
              <div className="mb-4">
                <label className="block text-[#170F49] font-medium mb-1">
                  Date <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  required
                  className="w-full px-4 py-2 rounded-lg border focus:ring-2 focus:ring-[#E38B52]"
                  value={reportDate}
                  onChange={(e) => setReportDate(e.target.value)}
                  max={new Date().toISOString().split('T')[0]}
                />
              </div>
              <div className="mb-4">
                <label className="block text-[#170F49] font-medium mb-1">
                  Therapy Type <span className="text-red-500">*</span>
                </label>
                <select
                  required
                  className="w-full px-4 py-2 rounded-lg border focus:ring-2 focus:ring-[#E38B52]"
                  value={therapyType}
                  onChange={(e) => setTherapyType(e.target.value)}
                >
                  <option>Occupational</option>
                  <option>Physio</option>
                  <option>Speech</option>
                  <option>Behavioral</option>
                  <option>Developmental</option>
                  <option>Clinical</option>
                </select>
              </div>
              <div className="mb-4">
                <label className="block text-[#170F49] font-medium mb-1">
                  Progress Notes <span className="text-red-500">*</span>
                </label>
                <textarea
                  required
                  placeholder="Describe the student's progress, activities performed, and observations..."
                  className="w-full px-4 py-2 rounded-lg border focus:ring-2 focus:ring-[#E38B52]"
                  rows={3}
                  value={progressNotes}
                  onChange={(e) => setProgressNotes(e.target.value)}
                />
              </div>
              <div className="mb-4">
                <label className="block text-[#170F49] font-medium mb-1">
                  Goals Achieved
                </label>
                <textarea
                  placeholder="List specific goals or milestones achieved during this session (optional)..."
                  className="w-full px-4 py-2 rounded-lg border focus:ring-2 focus:ring-[#E38B52]"
                  rows={2}
                  value={goalsAchieved}
                  onChange={(e) => setGoalsAchieved(e.target.value)}
                />
              </div>
              <div className="mb-6">
                <label className="block text-[#170F49] font-medium mb-1">
                  Progress Level <span className="text-red-500">*</span>
                </label>
                <select
                  required
                  className="w-full px-4 py-2 rounded-lg border focus:ring-2 focus:ring-[#E38B52]"
                  value={progressLevel}
                  onChange={(e) => setProgressLevel(e.target.value)}
                >
                  <option>Excellent</option>
                  <option>Good</option>
                  <option>Moderate</option>
                  <option>Needs Improvement</option>
                </select>
              </div>
              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  className="px-4 py-2 rounded-lg bg-gray-200 text-[#170F49] hover:bg-gray-300"
                  onClick={() => setShowReportDialog(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className={`px-4 py-2 rounded-lg font-semibold shadow transition-all duration-200 ${
                    isSubmitting 
                      ? 'bg-gray-400 cursor-not-allowed' 
                      : 'bg-[#E38B52] hover:bg-[#E38B52]/90 text-white'
                  }`}
                >
                  {isSubmitting ? (
                    <div className="flex items-center gap-2">
                      <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                        <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" strokeOpacity="0.3"/>
                        <path fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                      </svg>
                      Saving...
                    </div>
                  ) : (
                    'Save Report'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
export default TeacherDashboard;
