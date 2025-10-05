import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

const AddUser = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    role: "teacher"
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    try {
      // Get the token from localStorage
      const token = localStorage.getItem("token");
      if (!token) {
        setError("You must be logged in to add users");
        return;
      }

      const response = await axios.post(
        "http://localhost:8000/api/v1/users/teachers",
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      setSuccess("Teacher user created successfully!");
      setFormData({
        username: "",
        email: "",
        password: ""
      });
    } catch (err) {
      setError(err.response?.data?.detail || "An error occurred while creating the user");
    }
  };

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center bg-[#f7f7f7] relative overflow-hidden py-20">
      {/* Animated background blobs */}
      <div className="absolute top-0 -left-40 w-[600px] h-[500px] bg-[#E38B52] rounded-full mix-blend-multiply filter blur-2xl opacity-30 animate-float" />
      <div className="absolute -bottom-32 right-40 w-[600px] h-[600px] bg-[#E38B52] rounded-full mix-blend-multiply filter blur-2xl opacity-40 animate-float animation-delay-3000" />
      <div className="absolute top-1/2 left-1/2 w-[500px] h-[500px] bg-[#E38B52] rounded-full mix-blend-multiply filter blur-2xl opacity-40 animate-float animation-delay-5000" />
      <div className="absolute top-0 -left-40 w-[500px] h-[600px] bg-[#E38B52] rounded-full mix-blend-multiply filter blur-2xl opacity-30 animate-float animation-delay-7000" />

      {/* Back Button */}
      <div className="absolute top-6 left-6 z-50">
        <button
          onClick={() => navigate('/headmaster')}
          className="px-6 py-3 bg-[#E38B52] text-white rounded-xl hover:bg-[#C8742F] transition-all duration-200 shadow-[inset_0_2px_4px_rgba(255,255,255,0.3),inset_0_4px_8px_rgba(255,255,255,0.2)] hover:-translate-y-1 hover:scale-105 flex items-center gap-2"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z"
              clipRule="evenodd"
            />
          </svg>
          Back
        </button>
      </div>
      
      <div className="w-[90%] max-w-[1200px] mx-4 flex-1 flex flex-col justify-center">
        <h1 className="text-3xl font-bold text-[#170F49] mb-8 text-center font-baskervville">
          Add Teacher User
        </h1>
        
        {/* Form container */}
        <div className="relative bg-white/30 backdrop-blur-xl rounded-3xl shadow-xl p-8 md:p-12 border border-white/20 max-w-[450px] mx-auto w-full">
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <p className="text-red-500 text-sm mb-4">{error}</p>
            )}
            
            {success && (
              <p className="text-green-500 text-sm mb-4">{success}</p>
            )}
            
            {/* Username field */}
            <div className="space-y-2 w-full">
              <label 
                htmlFor="username" 
                className="block text-sm font-medium text-[#170F49] ml-4"
              >
                Username
              </label>
              <input
                id="username"
                name="username"
                type="text"
                value={formData.username}
                onChange={handleChange}
                placeholder="Enter username"
                className="w-full px-4 py-4 rounded-2xl border bg-white shadow-lg focus:outline-none focus:ring-2 focus:ring-[#6366f1] transition-all placeholder:text-[#6F6C90]"
                required
              />
            </div>
            
            {/* Email field */}
            <div className="space-y-2 w-full">
              <label 
                htmlFor="email" 
                className="block text-sm font-medium text-[#170F49] ml-4"
              >
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="Enter email address"
                className="w-full px-4 py-4 rounded-2xl border bg-white shadow-lg focus:outline-none focus:ring-2 focus:ring-[#6366f1] transition-all placeholder:text-[#6F6C90]"
                required
              />
            </div>
            
            {/* Password field */}
            <div className="space-y-2 w-full">
              <label 
                htmlFor="password" 
                className="block text-sm font-medium text-[#170F49] ml-4"
              >
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="Enter password"
                className="w-full px-4 py-4 rounded-2xl border bg-white shadow-lg focus:outline-none focus:ring-2 focus:ring-[#6366f1] transition-all placeholder:text-[#6F6C90]"
                required
              />
            </div>
            
            <input type="hidden" name="role" value={formData.role} />

            {/* Submit button */}
            <button
              type="submit"
              className="w-full bg-[#E38B52] text-white py-4 rounded-2xl hover:bg-[#C8742F] hover:-translate-y-1 transition-all duration-200 font-medium 
              shadow-[inset_0_2px_4px_rgba(255,255,255,0.3),inset_0_4px_8px_rgba(255,255,255,0.2)]"
            >
              Create Teacher User
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

export default AddUser; 