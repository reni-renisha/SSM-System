import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

const HeadMaster = () => {
  const navigate = useNavigate();
  const [filterOption, setFilterOption] = useState("all");
  const [selectedClass, setSelectedClass] = useState("all");
  const [isSearchFloating, setIsSearchFloating] = useState(false);
  const [activeTab, setActiveTab] = useState(() => {
    // Get the saved tab from localStorage, default to "students"
    return localStorage.getItem('headmistressActiveTab') || "students";
  });
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [teacherToDelete, setTeacherToDelete] = useState(null);
  const [teacherSearch, setTeacherSearch] = useState("");
  const [studentSearch, setStudentSearch] = useState("");

  // Add scroll event listener
  useEffect(() => {
    const handleScroll = () => {
      const searchBarPosition = document.getElementById('search-container')?.getBoundingClientRect().top;
      if (searchBarPosition < 0) {
        setIsSearchFloating(true);
      } else {    
        setIsSearchFloating(false);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const fetchTeachers = async () => {
      try {
        const response = await axios.get('http://localhost:8000/api/v1/teachers/');
        // Sort teachers alphabetically by name
        const sortedTeachers = response.data.sort((a, b) => 
          a.name.localeCompare(b.name)
        );
        setTeachers(sortedTeachers);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching teachers:', error);
        setLoading(false);
      }
    };

    if (activeTab === 'teachers') {
      fetchTeachers();
    }
  }, [activeTab]);

  // Add this function to handle logout
  const handleLogout = () => {
    navigate('/');
  };

  // Add this function to handle navigation to AddStudent
  const handleAddStudent = () => {
    // Don't change tab, maintain current state
    navigate('/add-student');
  };

  // Add this function to handle navigation to AddTeacher
  const handleAddTeacher = () => {
    // Don't change tab, maintain current state
    navigate('/add-teacher');
  };

  // Add this function to handle navigation to StudentPage
  const handleStudentClick = (studentId) => {
    // Don't change tab, maintain current state
    navigate(`/student/${studentId}`);
  };

  // Add this function to handle navigation to TeacherPage
  const handleTeacherClick = (teacherId) => {
    // Don't change tab, maintain current state
    navigate(`/teacher/${teacherId}`);
  };

  // Add this function to handle navigation to AddUser
  const handleAddUserClick = () => {
    navigate('/add-user');
  };

  // Add this function to handle teacher deletion
  const handleDeleteTeacher = async (teacherId, teacherName) => {
    // Show custom confirmation modal
    setTeacherToDelete({ id: teacherId, name: teacherName });
    setShowDeleteConfirm(true);
  };

  // Function to confirm deletion
  const confirmDelete = async () => {
    if (!teacherToDelete) return;
    
    try {
      const response = await axios.delete(`http://localhost:8000/api/v1/teachers/${teacherToDelete.id}`);
      
      if (response.status === 200 || response.status === 204) {
        // Remove the teacher from the local state
        setTeachers(teachers.filter(teacher => teacher.id !== teacherToDelete.id));
        alert(`${teacherToDelete.name} has been successfully deleted.`);
      }
    } catch (error) {
      console.error('Error deleting teacher:', error);
      alert('Failed to delete teacher. Please try again.');
    } finally {
      setShowDeleteConfirm(false);
      setTeacherToDelete(null);
    }
  };

  // Function to cancel deletion
  const cancelDelete = () => {
    setShowDeleteConfirm(false);
    setTeacherToDelete(null);
  };

  // 1. Add state for student delete modal
  const [showStudentDeleteConfirm, setShowStudentDeleteConfirm] = useState(false);
  const [studentToDelete, setStudentToDelete] = useState(null);

  // 2. Add handler functions
  const handleDeleteStudent = (studentId, studentName) => {
    setStudentToDelete({ id: studentId, name: studentName });
    setShowStudentDeleteConfirm(true);
  };
  const confirmDeleteStudent = () => {
    // TODO: Implement actual delete logic (API call)
    // For now, just close the modal
    setShowStudentDeleteConfirm(false);
    setStudentToDelete(null);
    alert(`${studentToDelete?.name} has been deleted (placeholder).`);
  };
  const cancelDeleteStudent = () => {
    setShowStudentDeleteConfirm(false);
    setStudentToDelete(null);
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

      {/* Add User Button */}
      <div className="fixed top-6 left-6 z-50">
        <button
          onClick={handleAddUserClick}
          className="px-6 py-3 bg-[#E38B52] text-white rounded-xl hover:bg-[#E38B52]/90 transition-all duration-200 shadow-[inset_0_2px_4px_rgba(255,255,255,0.3),inset_0_4px_8px_rgba(255,255,255,0.2)] hover:-translate-y-1 hover:scale-105 flex items-center gap-2"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              d="M8 9a3 3 0 100-6 3 3 0 000 6zM8 11a6 6 0 016 6H2a6 6 0 016-6zM16 7a1 1 0 10-2 0v1h-1a1 1 0 100 2h1v1a1 1 0 102 0v-1h1a1 1 0 100-2h-1V7z"
            />
          </svg>
          Add User
        </button>
      </div>

      {/* Header Text */}
      <div className="text-center mb-12 z-10">
        <h1 className="text-4xl font-bold text-[#170F49] font-baskervville">
          Headmistress's Page
        </h1>
        <p className="text-[#6F6C8F] mt-2">
          Manage Students and Teachers
        </p>
      </div>

      {/* Floating Search Bar */}
      <div className={`fixed top-0 left-0 right-0 z-50 transition-transform duration-300 ease-in-out ${isSearchFloating ? 'translate-y-0' : '-translate-y-full'}`}>
        <div className="backdrop-blur-xl p-4">
          <div className="w-[90%] max-w-[1200px] mx-auto">
            <div className="relative w-full md:w-[443px] mx-auto">
              <input
                type="text"
                placeholder={`Search ${activeTab === "students" ? "students" : "teachers"}...`}
                className="w-full pl-10 pr-4 py-3 rounded-xl border bg-[#FAF9F6] shadow-lg hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-[#E38B52] transition-all duration-300 placeholder:text-gray-400 hover:placeholder:text-gray-600"
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
        {/* Tabs */}
        <div className="flex justify-center mb-8">
          <div className="bg-white/30 backdrop-blur-xl rounded-2xl p-2 inline-flex gap-2 shadow-lg relative">
            {/* Active Tab Background */}
            <div
              className="absolute h-[calc(100%-8px)] top-[4px] transition-all duration-300 ease-in-out rounded-xl bg-[#E38B52] shadow-[inset_0_2px_4px_rgba(255,255,255,0.3),inset_0_4px_8px_rgba(255,255,255,0.2)]"
              style={{
                left: activeTab === "students" ? "4px" : "50%",
                width: "calc(50% - 6px)",
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
            
            {/* Students Tab */}
            <button
              onClick={() => {
                setActiveTab("students");
                localStorage.setItem('headmistressActiveTab', "students");
              }}
              className={`px-6 py-3 rounded-xl font-medium transition-all duration-300 relative z-10 ${
                activeTab === "students"
                  ? "text-white scale-105"
                  : "text-[#170F49] hover:text-[#E38B52]"
              }`}
            >
              Students List
            </button>
            
            {/* Teachers Tab */}
            <button
              onClick={() => {
                setActiveTab("teachers");
                localStorage.setItem('headmistressActiveTab', "teachers");
              }}
              className={`px-6 py-3 rounded-xl font-medium transition-all duration-300 relative z-10 ${
                activeTab === "teachers"
                  ? "text-white scale-105"
                  : "text-[#170F49] hover:text-[#E38B52]"
              }`}
            >
              Teachers List
            </button>
          </div>
        </div>
        
        {/* Main container */}
        <div className="relative bg-white/30 backdrop-blur-xl rounded-3xl shadow-xl p-8 md:p-12 border border-white/20">
          {activeTab === "students" ? (
            <>
              {/* Filter and Search Section */}
              <div className="flex justify-between items-center mb-8 px-4">
                {/* Search Bar */}
                <div id="search-container" className="relative">
                  <input
                    type="text"
                    placeholder="Search students..."
                    className="w-[443px] pl-10 pr-4 py-3 rounded-xl border bg-[#FAF9F6] shadow-lg hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-[#E38B52] transition-all duration-300 placeholder:text-gray-400 hover:placeholder:text-gray-600"
                    value={studentSearch}
                    onChange={e => setStudentSearch(e.target.value)}
                  />
                  <svg
                    className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M8 4a4 4 0 100 8 4  4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>

                <div className="flex items-center gap-3">
                  {/* Add Student Button */}
                  <button 
                    onClick={handleAddStudent}
                    className="px-6 py-3 bg-[#E38B52] text-white rounded-xl hover:bg-[#E38B52]/90 transition-all duration-200 shadow-[inset_0_2px_4px_rgba(255,255,255,0.3),inset_0_4px_8px_rgba(255,255,255,0.2)] hover:-translate-y-1 hover:scale-105 flex items-center gap-2"
                  >
                    <svg 
                      xmlns="http://www.w3.org/2000/svg" 
                      className="h-5 w-5" 
                      viewBox="0 0 20 20" 
                      fill="currentColor"
                    >
                      <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                    </svg>
                    Add Student
                  </button>

                  {/* Filter Button with Dropdown */}
                  <div className="relative">
                    <button 
                      onClick={() => setShowFilterDropdown(!showFilterDropdown)}
                      className="p-3 bg-[#E38B52] text-white rounded-xl hover:bg-[#E38B52]/90 transition-all duration-200 shadow-[inset_0_2px_4px_rgba(255,255,255,0.3),inset_0_4px_8px_rgba(255,255,255,0.2)] hover:-translate-y-1 hover:scale-105"
                    >
                      <svg 
                        xmlns="http://www.w3.org/2000/svg" 
                        className="h-5 w-5" 
                        viewBox="0 0 20 20" 
                        fill="currentColor"
                      >
                        <path fillRule="evenodd" d="M3 3a1 1 0 011-1h12a1 1 0 011 1v3a1 1 0 01-.293.707L12 11.414V15a1 1 0 01-.293.707l-2 2A1 1 0 018 17v-5.586L3.293 6.707A1 1 0 013 6V3z" clipRule="evenodd" />
                      </svg>
                    </button>

                    {/* Filter Dropdown Menu */}
                    {showFilterDropdown && (
                      <div className="absolute right-0 mt-2 w-48 bg-[#FAF9F6] rounded-xl shadow-lg overflow-hidden z-50">
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
                          
                          {filterOption === 'class' && (
                            <select
                              value={selectedClass}
                              onChange={(e) => {
                                setSelectedClass(e.target.value);
                                setShowFilterDropdown(false);
                              }}
                              className="w-full px-4 py-2.5 text-sm text-[#170F49] bg-[#FAF9F6] rounded-lg border border-gray-200 hover:border-[#E38B52] focus:outline-none focus:border-[#E38B52] transition-all duration-200"
                            >
                              <option value="all">All Classes</option>
                              <option value="preprimary">PrePrimary</option>
                              <option value="primary1">Primary 1</option>
                              <option value="primary2">Primary 2</option>
                              <option value="secondary">Secondary</option>
                              <option value="prevocational1">Pre vocational 1</option>
                              <option value="prevocational2">Pre vocational 2</option>
                              <option value="caregroup-below-18">Care group below 18 years</option>
                              <option value="caregroup-above-18">Care group Above 18 years</option>
                              <option value="vocational">Vocational 18-35 years</option>
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
                {/* Filter students based on search */}
                {[
                  { id: 'malavika', name: 'Malavika', class: 'Primary 1', rollNo: 33 },
                  { id: 'renisha', name: 'Renisha', class: 'X-B', rollNo: 44 },
                  { id: 'lydia', name: 'Lydia', class: 'X-C', rollNo: 32 },
                  { id: 'sreedhanya', name: 'Sreedhanya', class: 'X-A', rollNo: 51 }
                ]
                .filter(student => 
                  student.name.toLowerCase().includes(studentSearch.toLowerCase())
                )
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
                            e.target.src = "https://via.placeholder.com/64?text=Student";
                          }}
                        />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-[#170F49]">{student.name}</h3>
                        <div className="space-y-1">
                          <p className="text-sm text-[#6F6C8F]">
                            <span className="font-medium">Class:</span> {student.class}
                          </p>
                          <p className="text-sm text-[#6F6C8F]">
                            <span className="font-medium">Roll No:</span> {student.rollNo}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <button
                          className="p-2 text-[#E38B52] hover:text-[#E38B52]/90 rounded-lg transition-colors"
                          title="View Student Profile"
                          onClick={e => {
                            e.stopPropagation();
                            handleStudentClick(student.id);
                          }}
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </button>
                        <button 
                          className="p-2 text-red-500 hover:text-red-700 hover:bg-[rgba(227,139,82,0.2)] rounded-lg transition-colors"
                          title="Delete Student"
                          onClick={e => {
                            e.stopPropagation();
                            handleDeleteStudent(student.id, student.name);
                          }}
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <>
              {/* Teachers List Content */}
              {/* Filter and Search Section */}
              <div className="flex justify-between items-center mb-8 px-4">
                {/* Search Bar */}
                <div id="search-container" className="relative">
                  <input
                    type="text"
                    placeholder="Search teachers..."
                    className="w-[443px] pl-10 pr-4 py-3 rounded-xl border bg-[#FAF9F6] shadow-lg hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-[#E38B52] transition-all duration-300 placeholder:text-gray-400 hover:placeholder:text-gray-600"
                    value={teacherSearch}
                    onChange={e => setTeacherSearch(e.target.value)}
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

                {/* Add Teacher Button */}
                <button 
                  onClick={handleAddTeacher}
                  className="px-6 py-3 bg-[#E38B52] text-white rounded-xl hover:bg-[#E38B52]/90 transition-all duration-200 shadow-[inset_0_2px_4px_rgba(255,255,255,0.3),inset_0_4px_8px_rgba(255,255,255,0.2)] hover:-translate-y-1 hover:scale-105 flex items-center gap-2"
                >
                  <svg 
                    xmlns="http://www.w3.org/2000/svg" 
                    className="h-5 w-5" 
                    viewBox="0 0 20 20" 
                    fill="currentColor"
                  >
                    <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                  </svg>
                  Add Teacher
                </button>
              </div>

              {/* Teachers List */}
              <div className="grid grid-cols-1 gap-4 px-4">
                {teachers
                  .filter(teacher =>
                    teacher.name.toLowerCase().includes(teacherSearch.toLowerCase()) ||
                    (teacher.qualifications_details && teacher.qualifications_details.toLowerCase().includes(teacherSearch.toLowerCase())) ||
                    (teacher.mobile_number && teacher.mobile_number.includes(teacherSearch))
                  )
                  .map((teacher) => (
                    <div 
                      key={teacher.id}
                      onClick={() => handleTeacherClick(teacher.id)}
                      className="bg-white rounded-2xl p-6 shadow-md hover:shadow-xl transition-all duration-300 hover:-translate-y-1 hover:scale-[1.02] cursor-pointer"
                    >
                      <div className="flex items-center space-x-4 text-[#170F49]">
                        <div className="w-16 h-16 rounded-lg overflow-hidden">
                          <img 
                            src={`https://eu.ui-avatars.com/api/?name=${teacher.name.replace(' ', '+')}&size=250`}
                            alt="Teacher"
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="flex-1">
                          <h3 className="text-lg font-semibold text-[#170F49]">
                            {teacher.name}
                          </h3>
                          <div className="space-y-1">
                            <p className="text-sm text-[#6F6C8F]">
                              <span className="font-medium">Mobile:</span> {teacher.mobile_number}
                            </p>
                            <p className="text-sm text-[#6F6C8F]">
                              <span className="font-medium">Qualifications:</span> {teacher.qualifications_details}
                            </p>
                          </div>
                        </div>
                        <div className="flex space-x-2">
                          <button 
                            onClick={() => handleTeacherClick(teacher.id)}
                            className="text-[#E38B52] hover:text-[#E38B52]/90 transition-colors p-2 rounded-lg hover:bg-[#E38B52]/10"
                            title="View Teacher Details"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                          </button>
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteTeacher(teacher.id, teacher.name);
                            }}
                            className="text-red-500 hover:text-red-700 transition-colors p-2 rounded-lg hover:bg-[rgba(227,139,82,0.2)]"
                            title="Delete Teacher"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            </>
          )}
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
        .rainbow-blob {
          background: conic-gradient(
            from 0deg,
            #ff0000,
            #ff8000,
            #ffff00,
            #00ff00,
            #00ffff,
            #0000ff,
            #8000ff,
            #ff0080,
            #ff0000
          );
          animation: float 15s infinite ease-in-out, spin 15s linear infinite;
        }
        @keyframes spin {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }

        /* Wider Scrollbar Styles */
        .scrollbar-thin::-webkit-scrollbar {
          width: 10px;
        }

        .scrollbar-thin::-webkit-scrollbar-track {
          background: transparent;
        }

        .scrollbar-thin::-webkit-scrollbar-thumb {
          background: #E38B52;
          border-radius: 5px;
        }

        .scrollbar-thin::-webkit-scrollbar-thumb:hover {
          background: #E38B52;
        }

        /* Firefox */
        .scrollbar-thin {
          scrollbar-width: auto;
          scrollbar-color: #E38B52 transparent;
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

      {/* Custom Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-[#FAF9F6] rounded-2xl p-8 max-w-md w-full mx-4 shadow-2xl transform transition-all">
            <div className="text-center">
              {/* Warning Icon */}
              <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-100 mb-4">
                <svg className="h-8 w-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              
              {/* Title */}
              <h3 className="text-lg font-bold text-gray-900 mb-2">
                Delete Teacher
              </h3>
              
              {/* Message */}
              <p className="text-sm text-gray-600 mb-6">
                Are you sure you want to delete <span className="font-semibold text-[#170F49]">{teacherToDelete?.name}</span>? 
                <br />
                <span className="text-red-600 font-medium">This action cannot be undone.</span>
              </p>
              
              {/* Buttons */}
              <div className="flex space-x-3">
                <button
                  onClick={cancelDelete}
                  className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors duration-200 font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDelete}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors duration-200 font-medium"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Custom Delete Confirmation Modal for Students */}
      {showStudentDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-8 max-w-md w-full mx-4 shadow-2xl transform transition-all">
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-100 mb-4">
                <svg className="h-8 w-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">
                Delete Student
              </h3>
              <p className="text-sm text-gray-600 mb-6">
                Are you sure of deleting this profile?
              </p>
              <div className="flex space-x-3">
                <button
                  onClick={cancelDeleteStudent}
                  className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors duration-200 font-medium"
                >
                  No
                </button>
                <button
                  onClick={confirmDeleteStudent}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors duration-200 font-medium"
                >
                  Yes
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default HeadMaster;
