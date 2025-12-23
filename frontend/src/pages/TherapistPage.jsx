import React, { useState, useEffect } from "react";
import { formatAadhaar, cleanAadhaar } from '../utils/validation';
import { useParams } from "react-router-dom";
import axios from "axios";

const TherapistPage = () => {
  // Get the therapist ID from URL parameters
  const { id } = useParams();
  const [therapist, setTherapist] = useState(null);
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
    const fetchTherapist = async () => {
      try {
        const response = await axios.get(`http://localhost:8000/api/v1/therapists/${id}`);
        
        setTherapist({
          name: response.data.name,
          therapistId: response.data.id,
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
          specialization: response.data.specialization || 'Not specified',
          // prefer stored photo_url, otherwise ui-avatars fallback
          photoUrl: response.data.photo_url || `https://eu.ui-avatars.com/api/?name=${(response.data.name||'').replace(' ', '+')}&size=250`
        });
        setLoading(false);
      } catch (error) {
        console.error('Error fetching therapist:', error);
        setLoading(false);
      }
    };

    fetchTherapist();
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

  // Upload handler
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
      formData.append('photo', photoFile);

      const headers = {};
      const token = localStorage.getItem('access_token');
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const resp = await axios.post(
        `http://localhost:8000/api/v1/therapists/${id}/photo`,
        formData,
        {
          headers,
          onUploadProgress: (progressEvent) => {
            if (progressEvent.total) {
              const pct = Math.round((progressEvent.loaded * 100) / progressEvent.total);
              setUploadProgress(pct);
            }
          },
          validateStatus: status => status < 500
        }
      );

      if (resp.status >= 400) {
        const serverMsg = resp.data && (resp.data.detail || resp.data.message || JSON.stringify(resp.data));
        throw new Error(serverMsg || `Upload failed with status ${resp.status}`);
      }

      const newUrl = resp.data.photo_url || resp.data.url || resp.data.photoUrl;
      setTherapist(prev => ({ ...prev, photoUrl: newUrl || prev.photoUrl }));
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
        name: therapist.name,
        mobile_number: therapist.mobile,
        email: therapist.email,
        address: therapist.address,
        qualifications_details: therapist.qualifications,
        rci_number: therapist.rciNumber,
        rci_renewal_date: therapist.rci_renewal_date_raw || therapist.rciRenewalDate,
        blood_group: therapist.bloodGroup,
        category: therapist.category,
        aadhar_number: therapist.aadhar_raw ? formatAadhaar(therapist.aadhar_raw) : therapist.aadhar,
        religion: therapist.religion,
        caste: therapist.caste,
        gender: therapist.gender,
        date_of_birth: therapist.date_of_birth_raw || therapist.dob,
        specialization: therapist.specialization
      });
    }
    setIsEditing(!isEditing);
  };

  // Function to save edited data
  const handleSaveEdit = async () => {
    try {
      const payload = {
        ...editFormData,
        aadhar_number: editFormData.aadhar_number ? String(editFormData.aadhar_number).replace(/\s+/g, '') : undefined,
        date_of_birth: editFormData.date_of_birth,
        rci_renewal_date: editFormData.rci_renewal_date,
      };

      const response = await axios.put(`http://localhost:8000/api/v1/therapists/${id}`, payload);
      
      if (response.status === 200) {
        setTherapist(prev => ({
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
          specialization: editFormData.specialization
        }));
        
        setIsEditing(false);
        alert('Therapist details updated successfully!');
      }
    } catch (error) {
      console.error('Error updating therapist:', error);
      alert('Failed to update therapist details. Please try again.');
    }
  };

  // Function to cancel editing
  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditFormData({});
  };

  if (loading) {
    return (
      <div className="min-h-screen w-full flex flex-col items-center justify-center bg-[#f7f7f7]">
        <div className="text-2xl text-[#E38B52]">Loading therapist information...</div>
      </div>
    );
  }

  if (!therapist) {
    return (
      <div className="min-h-screen w-full flex flex-col items-center justify-center bg-[#f7f7f7]">
        <div className="text-2xl text-[#E38B52]">Therapist not found.</div>
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
          Therapist Information
        </h1>
        
        {/* Main content container */}
        <div className="relative bg-white/30 backdrop-blur-xl rounded-3xl shadow-xl p-8 md:p-12 border border-white/20">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
            {/* Basic Information Section */}
            <div className="col-span-full">
              <h2 className="text-xl font-semibold text-[#170F49] mb-4">Personal Information</h2>
              <div className="flex flex-col md:flex-row gap-6 p-4 md:p-6 bg-white/50 rounded-2xl">
                {/* Therapist Photo */}
                <div className="flex flex-col items-center gap-3">
                  <div className="w-40 h-40 rounded-2xl overflow-hidden border-4 border-white/50 shadow-xl">
                    <img 
                      src={therapist.photoUrl || `https://eu.ui-avatars.com/api/?name=${therapist.name.replace(' ', '+')}&size=250`}
                      alt="Therapist"
                      className="w-full h-full object-cover"
                    />
                  </div>

                  {/* Photo upload controls */}
                  <div className="flex flex-col items-center gap-2">
                    <input
                      id="therapist-photo-input"
                      type="file"
                      accept=".png,.jpg,.jpeg"
                      onChange={handlePhotoSelect}
                      className="hidden"
                    />
                    <div className="flex items-center gap-2">
                      <label htmlFor="therapist-photo-input" className="cursor-pointer text-sm text-[#E38B52] hover:underline">
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

                {/* Therapist Details */}
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
                      <p className="text-[#170F49] font-medium">{therapist.name}</p>
                    )}
                  </div>
                  <div>
                    <p className="text-sm text-[#6F6C90]">Therapist ID</p>
                    <p className="text-[#170F49] font-medium">#{therapist.therapistId}</p>
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
                      <p className="text-[#170F49] font-medium">{therapist.dob}</p>
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
                      <p className="text-[#170F49] font-medium">{therapist.gender}</p>
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
                      <p className="text-[#170F49] font-medium">{therapist.religion}</p>
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
                      <p className="text-[#170F49] font-medium">{therapist.caste}</p>
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
                    <p className="text-[#170F49] font-medium">{therapist.mobile}</p>
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
                    <p className="text-[#170F49] font-medium">{therapist.email}</p>
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
                    <p className="text-[#170F49] font-medium">{therapist.address}</p>
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
                  <p className="text-[#170F49] font-medium">{therapist.aadhar}</p>
                </div>
                <div>
                  <p className="text-sm text-[#6F6C90]">Blood Group</p>
                  <p className="text-[#170F49] font-medium">{therapist.bloodGroup}</p>
                </div>
                <div>
                  <p className="text-sm text-[#6F6C90]">Category</p>
                  <p className="text-[#170F49] font-medium">{therapist.category}</p>
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
                    <p className="text-[#170F49] font-medium">{therapist.rciNumber}</p>
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
                    <p className="text-[#170F49] font-medium">{therapist.rciRenewalDate}</p>
                  )}
                </div>
                <div>
                  <p className="text-sm text-[#6F6C90]">Specialization</p>
                  {isEditing ? (
                    <select
                      value={editFormData.specialization || ''}
                      onChange={(e) => setEditFormData({...editFormData, specialization: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E38B52] focus:border-transparent bg-white/80"
                    >
                      <option value="">Select Specialization</option>
                      <option value="Speech Therapy">Speech Therapy</option>
                      <option value="Occupational Therapy">Occupational Therapy</option>
                      <option value="Physical Therapy">Physical Therapy</option>
                      <option value="Behavioral Therapy">Behavioral Therapy</option>
                      <option value="Special Education">Special Education</option>
                      <option value="Other">Other</option>
                    </select>
                  ) : (
                    <p className="text-[#170F49] font-medium">{therapist.specialization}</p>
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
                    <p className="text-[#170F49] font-medium">{therapist.qualifications}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="col-span-full flex gap-4 mt-6">
              {isEditing ? (
                <>
                  <button 
                    onClick={handleSaveEdit}
                    className="flex-1 bg-[#E38B52] text-white py-3 rounded-2xl hover:bg-[#C8742F] hover:-translate-y-1 transition-all duration-200 font-medium shadow-[inset_0_2px_4px_rgba(255,255,255,0.3),inset_0_4px_8px_rgba(255,255,255,0.2)] flex items-center justify-center gap-2"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    Save Changes
                  </button>
                  <button 
                    onClick={handleCancelEdit}
                    className="flex-1 bg-gray-500 text-white py-3 rounded-2xl hover:bg-gray-600 hover:-translate-y-1 transition-all duration-200 font-medium shadow-[inset_0_2px_4px_rgba(255,255,255,0.3),inset_0_4px_8px_rgba(255,255,255,0.2)]"
                  >
                    Cancel
                  </button>
                </>
              ) : (
                <>
                  <button 
                    onClick={handleEditToggle}
                    className="flex-1 bg-[#E38B52] text-white py-3 rounded-2xl hover:bg-[#C8742F] hover:-translate-y-1 transition-all duration-200 font-medium shadow-[inset_0_2px_4px_rgba(255,255,255,0.3),inset_0_4px_8px_rgba(255,255,255,0.2)] flex items-center justify-center gap-2"
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

export default TherapistPage;
