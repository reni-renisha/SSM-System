import React, { useState, useEffect } from "react";
import { formatAadhaar } from '../utils/validation';
import { useParams } from "react-router-dom";
import axios from "axios";

const TeacherPage = () => {
  // Get the teacher ID from URL parameters
  const { id } = useParams();
  const [teacher, setTeacher] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editFormData, setEditFormData] = useState({});

  // Photo upload state
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [photoError, setPhotoError] = useState(null);
  
  useEffect(() => {
    const fetchTeacher = async () => {
      try {
        const response = await axios.get(`http://localhost:8000/api/v1/teachers/${id}`);
        
        // Map API response to the format expected by the UI
        const classAssignments = response.data.class_assignments || [];
        const formattedClasses = classAssignments.map(assignment => ({
          class: assignment.class || 'Not specified',
          subject: assignment.subject || 'Not specified',
          days: assignment.days && assignment.days.length > 0 ? assignment.days.join(', ') : 'Not specified',
          timing: assignment.startTime && assignment.endTime ? `${assignment.startTime} - ${assignment.endTime}` : 'Not specified'
        }));

        setTeacher({
          name: response.data.name,
          teacherId: response.data.id,
          // keep both raw ISO values (for editing) and formatted strings (for display)
          date_of_birth_raw: response.data.date_of_birth,
          dob: response.data.date_of_birth ? new Date(response.data.date_of_birth).toLocaleDateString('en-US', { 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
          }) : '',
          gender: response.data.gender,
          religion: response.data.religion,
          caste: response.data.caste,
          mobile: response.data.mobile_number,
          email: response.data.email || 'Not provided',
          address: response.data.address,
          aadhar_raw: response.data.aadhar_number,
          aadhar: formatAadhaar(response.data.aadhar_number),
          bloodGroup: response.data.blood_group,
          category: response.data.category,
          rciNumber: response.data.rci_number,
          rci_renewal_date_raw: response.data.rci_renewal_date,
          rciRenewalDate: response.data.rci_renewal_date ? new Date(response.data.rci_renewal_date).toLocaleDateString('en-US', { 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
          }) : '',
          qualifications: response.data.qualifications_details,
          // prefer stored photo_url, otherwise ui-avatars fallback
          photoUrl: response.data.photo_url || `https://eu.ui-avatars.com/api/?name=${(response.data.name||'').replace(' ', '+')}&size=250`,
          classes: formattedClasses
        });
        setLoading(false);
      } catch (error) {
        console.error('Error fetching teacher:', error);
        setLoading(false);
      }
    };

    fetchTeacher();
  }, [id]);

  // File selection handler
  const handlePhotoSelect = (e) => {
    setPhotoError(null);
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    const allowed = ['image/png', 'image/jpeg', 'image/jpg'];
    if (!allowed.includes(file.type)) {
      setPhotoError('Only PNG and JPG images are allowed.');
      return;
    }
    // optional size limit (5MB)
    if (file.size > 5 * 1024 * 1024) {
      setPhotoError('File too large. Max 5MB allowed.');
      return;
    }
    setPhotoFile(file);
    setPhotoPreview(URL.createObjectURL(file));
  };

  // Upload handler - adjust endpoint if backend expects different path/field
  const uploadPhoto = async () => {
    if (!photoFile) {
      setPhotoError('No file selected.');
      return;
    }
    setUploading(true);
    setUploadProgress(0);
    setPhotoError(null);
    try {
      const formData = new FormData();
      // Use 'photo' as the form field (change if backend expects a different name)
      formData.append('photo', photoFile);

      // Do NOT set Content-Type explicitly. Let the browser set the multipart boundary.
      const headers = {};
      // If your backend requires auth, set the Authorization header (example uses localStorage)
      const token = localStorage.getItem('access_token');
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const resp = await axios.post(
        `http://localhost:8000/api/v1/teachers/${id}/photo`,
        formData,
        {
          headers,
          onUploadProgress: (progressEvent) => {
            if (progressEvent.total) {
              const pct = Math.round((progressEvent.loaded * 100) / progressEvent.total);
              setUploadProgress(pct);
            }
          },
          validateStatus: status => status < 500 // let 4xx pass so we can handle them
        }
      );

      if (resp.status >= 400) {
        // show server-provided message if any
        const serverMsg = resp.data && (resp.data.detail || resp.data.message || JSON.stringify(resp.data));
        throw new Error(serverMsg || `Upload failed with status ${resp.status}`);
      }

      // backend should return updated photo URL
      const newUrl = resp.data.photo_url || resp.data.url || resp.data.photoUrl;
      setTeacher(prev => ({ ...prev, photoUrl: newUrl || prev.photoUrl }));
      setPhotoFile(null);
      if (photoPreview) { URL.revokeObjectURL(photoPreview); }
      setPhotoPreview(null);
      setUploadProgress(0);
      alert('Photo uploaded successfully.');
    } catch (err) {
      console.error('Photo upload failed', err, err.response?.data || '');
      setPhotoError(err.message || 'Upload failed. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const cancelPhotoSelection = () => {
    if (photoPreview) {
      URL.revokeObjectURL(photoPreview);
    }
    setPhotoFile(null);
    setPhotoPreview(null);
    setPhotoError(null);
    setUploadProgress(0);
  };
  
  // Function to handle edit mode toggle
  const handleEditToggle = () => {
    if (!isEditing) {
      // Enter edit mode - populate form with current data
      setEditFormData({
        name: teacher.name,
        mobile_number: teacher.mobile,
        email: teacher.email,
        address: teacher.address,
        qualifications_details: teacher.qualifications,
        rci_number: teacher.rciNumber,
        // populate edit fields with RAW ISO values so date inputs work correctly
        rci_renewal_date: teacher.rci_renewal_date_raw || teacher.rciRenewalDate,
        blood_group: teacher.bloodGroup,
        category: teacher.category,
        // populate Aadhaar with formatted string for editing, but we'll clean before sending
        aadhar_number: teacher.aadhar_raw ? formatAadhaar(teacher.aadhar_raw) : teacher.aadhar,
        religion: teacher.religion,
        caste: teacher.caste,
        gender: teacher.gender,
        date_of_birth: teacher.date_of_birth_raw || teacher.dob
      });
    }
    setIsEditing(!isEditing);
  };

  // Function to save edited data
  const handleSaveEdit = async () => {
    try {
      // Clean Aadhaar (remove spaces) and ensure payload dates are ISO
      const payload = {
        ...editFormData,
        aadhar_number: editFormData.aadhar_number ? String(editFormData.aadhar_number).replace(/\s+/g, '') : undefined,
        date_of_birth: editFormData.date_of_birth,
        rci_renewal_date: editFormData.rci_renewal_date,
      };

      const response = await axios.put(`http://localhost:8000/api/v1/teachers/${id}`, payload);
      
      if (response.status === 200) {
        // Update the local teacher state with new data
        // Update local teacher state for display, keep formatted strings
        setTeacher(prev => ({
          ...prev,
          name: editFormData.name,
          mobile: editFormData.mobile_number,
          email: editFormData.email,
          address: editFormData.address,
          qualifications: editFormData.qualifications_details,
          rciNumber: editFormData.rci_number,
          rci_renewal_date_raw: editFormData.rci_renewal_date,
          rciRenewalDate: editFormData.rci_renewal_date ? new Date(editFormData.rci_renewal_date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : '',
          bloodGroup: editFormData.blood_group,
          category: editFormData.category,
          aadhar_raw: editFormData.aadhar_number ? String(editFormData.aadhar_number).replace(/\s+/g, '') : undefined,
          aadhar: editFormData.aadhar_number ? formatAadhaar(editFormData.aadhar_number) : prev.aadhar,
          religion: editFormData.religion,
          caste: editFormData.caste,
          gender: editFormData.gender,
          date_of_birth_raw: editFormData.date_of_birth,
          dob: editFormData.date_of_birth ? new Date(editFormData.date_of_birth).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : prev.dob,
        }));
        
        setIsEditing(false);
        alert('Teacher details updated successfully!');
      }
    } catch (error) {
      console.error('Error updating teacher:', error);
      alert('Failed to update teacher details. Please try again.');
    }
  };

  // Function to cancel editing
  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditFormData({});
  };

  const getTeacherData = (teacherId) => {
    // Mock data for different teachers
    const teachers = {
      'arjun-jayakumar': {
        name: 'Arjun Jayakumar',
        teacherId: 'TCH2024001',
        dob: '15 January 1985',
        gender: 'Male',
        religion: 'Hinduism',
        caste: 'General',
        mobile: '+91 9876543210',
        email: 'arjun.jayakumar@school.edu',
        address: '123 Teacher Colony, Education Street, Knowledge City - 560001',
        aadhar: 'XXXX-XXXX-1234',
        bloodGroup: 'O+',
        category: 'General',
        rciNumber: 'RCI12345678',
        rciRenewalDate: '10 January 2025',
        qualifications: 'Bachelor of Education (B.Ed) in Special Education from Kerala University. Masters in AI/ML from IIT.',
        subject: 'AI/ML',
        classAssigned: 'X-B',
        classes: [
          { class: 'Class 10-B', subject: 'AI/ML', days: 'Monday, Wednesday, Friday', timing: '10:00 AM - 11:00 AM' },
          { class: 'Class 9-A', subject: 'Computer Science', days: 'Tuesday, Thursday', timing: '11:15 AM - 12:15 PM' }
        ]
      },
      'aditya-s-nair': {
        name: 'Aditya S Nair',
        teacherId: 'TCH2024002',
        dob: '22 March 1990',
        gender: 'Male',
        religion: 'Hinduism',
        caste: 'General',
        mobile: '+91 9876543211',
        email: 'aditya.s.nair@school.edu',
        address: '456 Knowledge Park, Wisdom Lane, Intellect City - 560002',
        aadhar: 'XXXX-XXXX-5678',
        bloodGroup: 'A+',
        category: 'General',
        rciNumber: 'RCI87654321',
        rciRenewalDate: '15 February 2025',
        qualifications: 'Bachelor of Education (B.Ed) from Mumbai University. Masters in Mathematics from IISc Bangalore.',
        subject: 'Mathematics',
        classAssigned: 'X-A',
        classes: [
          { class: 'Class 10-A', subject: 'Mathematics', days: 'Monday, Wednesday, Friday', timing: '9:00 AM - 10:00 AM' },
          { class: 'Class 8-B', subject: 'Mathematics', days: 'Tuesday, Thursday', timing: '10:15 AM - 11:15 AM' }
        ]
      },
      'abhiram-krishna': {
        name: 'Abhiram Krishna',
        teacherId: 'TCH2024003',
        dob: '10 October 1988',
        gender: 'Male',
        religion: 'Hinduism',
        caste: 'General',
        mobile: '+91 9876543212',
        email: 'abhiram.krishna@school.edu',
        address: '789 Educator Homes, Learning Road, Academic City - 560003',
        aadhar: 'XXXX-XXXX-9012',
        bloodGroup: 'B+',
        category: 'General',
        rciNumber: 'RCI24681357',
        rciRenewalDate: '20 March 2025',
        qualifications: 'Bachelor of Special Education from Delhi University. Masters in History from JNU.',
        subject: 'Not Mathematics',
        classAssigned: 'X-A',
        classes: [
          { class: 'Class 10-A', subject: 'History', days: 'Monday, Wednesday', timing: '11:00 AM - 12:00 PM' },
          { class: 'Class 9-B', subject: 'Social Studies', days: 'Tuesday, Thursday, Friday', timing: '1:15 PM - 2:15 PM' }
        ]
      },
      'faheem-mohammed': {
        name: 'Faheem Mohammed',
        teacherId: 'TCH2024004',
        dob: '5 May 1992',
        gender: 'Male',
        religion: 'Islam',
        caste: 'General',
        mobile: '+91 9876543213',
        email: 'faheem.mohammed@school.edu',
        address: '101 Scholar Avenue, Teaching Street, Automotive City - 560004',
        aadhar: 'XXXX-XXXX-3456',
        bloodGroup: 'AB+',
        category: 'General',
        rciNumber: 'RCI13579246',
        rciRenewalDate: '25 April 2025',
        qualifications: 'Bachelor of Education in Automotive Engineering. Masters in Mechanical Engineering from MIT.',
        subject: 'Cars',
        classAssigned: 'X-A',
        classes: [
          { class: 'Class 10-A', subject: 'Automotive Technology', days: 'Monday, Wednesday, Friday', timing: '2:00 PM - 3:00 PM' },
          { class: 'Class 11-B', subject: 'Mechanical Design', days: 'Tuesday, Thursday', timing: '9:15 AM - 10:15 AM' }
        ]
      }
    };

    return teachers[teacherId] || {
      name: 'Teacher Not Found',
      teacherId: 'Unknown',
      dob: 'Unknown',
      gender: 'Unknown',
      religion: 'Unknown',
      caste: 'Unknown',
      mobile: 'Unknown',
      email: 'Unknown',
      address: 'Unknown',
      aadhar: 'Unknown',
      bloodGroup: 'Unknown',
      category: 'Unknown',
      rciNumber: 'Unknown',
      rciRenewalDate: 'Unknown',
      qualifications: 'Unknown',
      subject: 'Unknown',
      classAssigned: 'Unknown',
      classes: []
    };
  };

  if (loading) {
    return (
      <div className="min-h-screen w-full flex flex-col items-center justify-center bg-[#f7f7f7]">
        <div className="text-2xl text-[#E38B52]">Loading teacher information...</div>
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
        Back
      </button>

      {/* Animated background blobs */}
      <div className="absolute top-0 -left-40 w-[600px] h-[500px] bg-[#E38B52] rounded-full mix-blend-multiply filter blur-2xl opacity-30 animate-float z-0" />
      <div className="absolute -bottom-32 right-40 w-[600px] h-[600px] bg-[#E38B52] rounded-full mix-blend-multiply filter blur-2xl opacity-40 animate-float animation-delay-3000 z-0" />
      <div className="absolute top-1/2 left-1/2 w-[500px] h-[500px] bg-[#E38B52] rounded-full mix-blend-multiply filter blur-2xl opacity-40 animate-float animation-delay-5000 z-0" />
      <div className="absolute top-0 -left-40 w-[500px] h-[600px] bg-[#E38B52] rounded-full mix-blend-multiply filter blur-2xl opacity-30 animate-float animation-delay-7000 z-0" />
      
      <div className="w-[90%] max-w-[1200px] mx-4 flex-1 flex flex-col">
        <h1 className="text-3xl font-bold text-[#170F49] mb-8 text-center font-baskervville">
          Teacher Information
        </h1>
        
        {/* Main content container */}
        <div className="relative bg-white/30 backdrop-blur-xl rounded-3xl shadow-xl p-8 md:p-12 border border-white/20">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
            {/* Basic Information Section */}
            <div className="col-span-full">
              <h2 className="text-xl font-semibold text-[#170F49] mb-4">Personal Information</h2>
              <div className="flex flex-col md:flex-row gap-6 p-4 md:p-6 bg-white/50 rounded-2xl">
                {/* Teacher Photo */}
                <div className="flex flex-col items-center gap-3">
                  <div className="w-40 h-40 rounded-2xl overflow-hidden border-4 border-white/50 shadow-xl">
                    <img 
                      src={teacher.photoUrl || `https://eu.ui-avatars.com/api/?name=${teacher.name.replace(' ', '+')}&size=250`}
                      alt="Teacher"
                      className="w-full h-full object-cover"
                    />
                  </div>

                  {/* Photo upload controls */}
                  <div className="flex flex-col items-center gap-2">
                    <input
                      id="teacher-photo-input"
                      type="file"
                      accept=".png,.jpg,.jpeg"
                      onChange={handlePhotoSelect}
                      className="hidden"
                    />
                    <div className="flex items-center gap-2">
                      <label htmlFor="teacher-photo-input" className="cursor-pointer text-sm text-[#E38B52] hover:underline">
                        Choose Photo
                      </label>
                      {photoPreview ? (
                        <button type="button" onClick={cancelPhotoSelection} className="text-sm text-gray-500 hover:text-gray-700">
                          Cancel
                        </button>
                      ) : null}
                    </div>

                    {photoPreview && (
                      <div className="mt-2 w-28 h-28 rounded-md overflow-hidden border border-gray-200">
                        <img src={photoPreview} alt="Preview" className="w-full h-full object-cover" />
                      </div>
                    )}

                    <div className="flex items-center gap-2 mt-2">
                      <button
                        type="button"
                        onClick={uploadPhoto}
                        disabled={!photoFile || uploading}
                        className={`px-3 py-2 rounded-md text-white ${photoFile && !uploading ? 'bg-[#E38B52] hover:bg-[#C8742F]' : 'bg-gray-300 cursor-not-allowed'}`}
                      >
                        {uploading ? `Uploading ${uploadProgress}%` : 'Upload'}
                      </button>
                      {photoError && <p className="text-sm text-red-500">{photoError}</p>}
                    </div>
                  </div>
                </div>

                {/* Teacher Details */}
                <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 pl-8 md:pl-12">
                  <div>
                    <p className="text-sm text-[#6F6C90]">Full Name</p>
                    {isEditing ? (
                      <input
                        type="text"
                        value={editFormData.name || ''}
                        onChange={(e) => setEditFormData({...editFormData, name: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E38B52] focus:border-transparent bg-white/80"
                      />
                    ) : (
                      <p className="text-[#170F49] font-medium">{teacher.name}</p>
                    )}
                  </div>
                  <div>
                    <p className="text-sm text-[#6F6C90]">Teacher ID</p>
                    <p className="text-[#170F49] font-medium">#{teacher.teacherId}</p>
                  </div>
                  <div>
                    <p className="text-sm text-[#6F6C90]">Date of Birth</p>
                    {isEditing ? (
                      <input
                        type="date"
                        value={editFormData.date_of_birth || ''}
                        onChange={(e) => setEditFormData({...editFormData, date_of_birth: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E38B52] focus:border-transparent bg-white/80"
                      />
                    ) : (
                      <p className="text-[#170F49] font-medium">{teacher.dob}</p>
                    )}
                  </div>
                  <div>
                    <p className="text-sm text-[#6F6C90]">Gender</p>
                    {isEditing ? (
                      <select
                        value={editFormData.gender || ''}
                        onChange={(e) => setEditFormData({...editFormData, gender: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E38B52] focus:border-transparent bg-white/80"
                      >
                        <option value="">Select Gender</option>
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                        <option value="Other">Other</option>
                      </select>
                    ) : (
                      <p className="text-[#170F49] font-medium">{teacher.gender}</p>
                    )}
                  </div>
                  <div>
                    <p className="text-sm text-[#6F6C90]">Religion</p>
                    {isEditing ? (
                      <input
                        type="text"
                        value={editFormData.religion || ''}
                        onChange={(e) => setEditFormData({...editFormData, religion: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E38B52] focus:border-transparent bg-white/80"
                      />
                    ) : (
                      <p className="text-[#170F49] font-medium">{teacher.religion}</p>
                    )}
                  </div>
                  <div>
                    <p className="text-sm text-[#6F6C90]">Caste</p>
                    {isEditing ? (
                      <input
                        type="text"
                        value={editFormData.caste || ''}
                        onChange={(e) => setEditFormData({...editFormData, caste: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E38B52] focus:border-transparent bg-white/80"
                      />
                    ) : (
                      <p className="text-[#170F49] font-medium">{teacher.caste}</p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Contact Information Section */}
            <div className="col-span-full">
              <h2 className="text-xl font-semibold text-[#170F49] mb-4">Contact Information</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6 bg-white/50 rounded-2xl">
                <div>
                  <p className="text-sm text-[#6F6C90]">Mobile Number</p>
                  {isEditing ? (
                    <input
                      type="tel"
                      value={editFormData.mobile_number || ''}
                      onChange={(e) => setEditFormData({...editFormData, mobile_number: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E38B52] focus:border-transparent bg-white/80"
                    />
                  ) : (
                    <p className="text-[#170F49] font-medium">{teacher.mobile}</p>
                  )}
                </div>
                <div>
                  <p className="text-sm text-[#6F6C90]">Email</p>
                  {isEditing ? (
                    <input
                      type="email"
                      value={editFormData.email || ''}
                      onChange={(e) => setEditFormData({...editFormData, email: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E38B52] focus:border-transparent bg-white/80"
                    />
                  ) : (
                    <p className="text-[#170F49] font-medium">{teacher.email}</p>
                  )}
                </div>
                <div className="md:col-span-2">
                  <p className="text-sm text-[#6F6C90]">Address</p>
                  {isEditing ? (
                    <textarea
                      value={editFormData.address || ''}
                      onChange={(e) => setEditFormData({...editFormData, address: e.target.value})}
                      rows="3"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E38B52] focus:border-transparent bg-white/80 resize-none"
                    />
                  ) : (
                    <p className="text-[#170F49] font-medium">{teacher.address}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Identification Details Section */}
            <div className="col-span-full">
              <h2 className="text-xl font-semibold text-[#170F49] mb-4">Identification Details</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6 bg-white/50 rounded-2xl">
                <div>
                  <p className="text-sm text-[#6F6C90]">Aadhar Number</p>
                  <p className="text-[#170F49] font-medium">{teacher.aadhar}</p>
                </div>
                <div>
                  <p className="text-sm text-[#6F6C90]">Blood Group</p>
                  <p className="text-[#170F49] font-medium">{teacher.bloodGroup}</p>
                </div>
                <div>
                  <p className="text-sm text-[#6F6C90]">Category</p>
                  <p className="text-[#170F49] font-medium">{teacher.category}</p>
                </div>
              </div>
            </div>

            {/* Professional Information Section */}
            <div className="col-span-full">
              <h2 className="text-xl font-semibold text-[#170F49] mb-4">Professional Information</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6 bg-white/50 rounded-2xl">
                <div>
                  <p className="text-sm text-[#6F6C90]">RCI Number</p>
                  {isEditing ? (
                    <input
                      type="text"
                      value={editFormData.rci_number || ''}
                      onChange={(e) => setEditFormData({...editFormData, rci_number: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E38B52] focus:border-transparent bg-white/80"
                    />
                  ) : (
                    <p className="text-[#170F49] font-medium">{teacher.rciNumber}</p>
                  )}
                </div>
                <div>
                  <p className="text-sm text-[#6F6C90]">RCI Renewal Date</p>
                  {isEditing ? (
                    <input
                      type="date"
                      value={editFormData.rci_renewal_date || ''}
                      onChange={(e) => setEditFormData({...editFormData, rci_renewal_date: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E38B52] focus:border-transparent bg-white/80"
                    />
                  ) : (
                    <p className="text-[#170F49] font-medium">{teacher.rciRenewalDate}</p>
                  )}
                </div>
                <div className="md:col-span-2">
                  <p className="text-sm text-[#6F6C90]">Qualifications Details</p>
                  {isEditing ? (
                    <textarea
                      value={editFormData.qualifications_details || ''}
                      onChange={(e) => setEditFormData({...editFormData, qualifications_details: e.target.value})}
                      rows="3"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E38B52] focus:border-transparent bg-white/80 resize-none"
                    />
                  ) : (
                    <p className="text-[#170F49] font-medium">{teacher.qualifications}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Classes Assigned Section */}
            <div className="col-span-full">
              <h2 className="text-xl font-semibold text-[#170F49] mb-4">Classes Assigned</h2>
              <div className="p-6 bg-white/50 rounded-2xl">
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse rounded-xl overflow-hidden">
                    <thead className="bg-[#E38B52]/10">
                      <tr>
                        <th className="px-4 py-3 text-left text-sm font-semibold text-[#170F49]">Class</th>
                        <th className="px-4 py-3 text-left text-sm font-semibold text-[#170F49]">Subject</th>
                        <th className="px-4 py-3 text-left text-sm font-semibold text-[#170F49]">Days</th>
                        <th className="px-4 py-3 text-left text-sm font-semibold text-[#170F49]">Timing</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white/70">
                      {teacher.classes.map((classItem, index) => (
                        <tr key={index} className={index < teacher.classes.length - 1 ? "border-b border-[#E38B52]/10" : ""}>
                          <td className="px-4 py-3 text-sm text-[#170F49]">{classItem.class}</td>
                          <td className="px-4 py-3 text-sm text-[#170F49]">{classItem.subject}</td>
                          <td className="px-4 py-3 text-sm text-[#170F49]">{classItem.days}</td>
                          <td className="px-4 py-3 text-sm text-[#170F49]">{classItem.timing}</td>
                        </tr>
                      ))}
                      {teacher.classes.length === 0 && (
                        <tr>
                          <td colSpan="4" className="px-4 py-3 text-sm text-center text-[#6F6C90]">
                            No class assignments found. Class assignments can be added when creating or editing a teacher.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Documents Section */}
            <div className="col-span-full">
              <h2 className="text-xl font-semibold text-[#170F49] mb-4">Documents</h2>
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
                        <p className="font-medium text-[#170F49]">RCI Certificate</p>
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
                        <p className="font-medium text-[#170F49]">Educational Certificates</p>
                        <p className="text-sm text-[#6F6C90]">Uploaded on 15 Dec 2023</p>
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

          {/* Action Buttons */}
          <div className="flex gap-4 mt-6 md:mt-8">
            {isEditing ? (
              <>
                <button 
                  onClick={handleSaveEdit}
                  className="flex-1 bg-[#E38B52] text-white py-4 rounded-2xl hover:bg-[#C8742F] hover:-translate-y-1 transition-all duration-200 font-medium shadow-[inset_0_2px_4px_rgba(255,255,255,0.3),inset_0_4px_8px_rgba(255,255,255,0.2)] flex items-center justify-center gap-2"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  Save Changes
                </button>
                <button 
                  onClick={handleCancelEdit}
                  className="flex-1 bg-gray-500 text-white py-4 rounded-2xl hover:bg-gray-600 hover:-translate-y-1 transition-all duration-200 font-medium shadow-[inset_0_2px_4px_rgba(255,255,255,0.3),inset_0_4px_8px_rgba(255,255,255,0.2)]"
                >
                  Cancel
                </button>
              </>
            ) : (
              <>
                <button 
                  onClick={handleEditToggle}
                  className="flex-1 bg-[#E38B52] text-white py-4 rounded-2xl hover:bg-[#C8742F] hover:-translate-y-1 transition-all duration-200 font-medium shadow-[inset_0_2px_4px_rgba(255,255,255,0.3),inset_0_4px_8px_rgba(255,255,255,0.2)] flex items-center justify-center gap-2"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                  </svg>
                  Edit Details
                </button>
                <button className="flex-1 bg-white/30 backdrop-blur-xl rounded-2xl shadow-xl p-3 border border-white/20 hover:-translate-y-1 transition-all font-medium duration-200">
                  Download Profile
                </button>
              </>
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
    </div>
  );
};

export default TeacherPage;