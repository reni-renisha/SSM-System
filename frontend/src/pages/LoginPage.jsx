import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

const LoginPage = () => {
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!username || !password) {
      setError("Please fill out both fields.");
      return;
    }

    try {
      const formData = new FormData();
      formData.append("username", username);
      formData.append("password", password);

      const response = await axios.post("http://localhost:8000/api/v1/auth/login", formData);
      
      if (response.data.access_token) {
        // Store the token in localStorage
        localStorage.setItem("token", response.data.access_token);
        // Set the default authorization header for future requests
        axios.defaults.headers.common["Authorization"] = `Bearer ${response.data.access_token}`;
        
        // Redirect based on user role
        navigate('/headmaster');
      }
    } catch (err) {
      setError(err.response?.data?.detail || "An error occurred during login.");
    }
  };

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center bg-[#f7f7f7] relative overflow-hidden py-20">
      {/* Animated background blobs */}
      <div className="absolute top-0 -left-40 w-[600px] h-[500px] bg-[#E38B52] rounded-full mix-blend-multiply filter blur-2xl opacity-30 animate-float" />
      <div className="absolute -bottom-32 right-40 w-[600px] h-[600px] bg-[#E38B52] rounded-full mix-blend-multiply filter blur-2xl opacity-40 animate-float animation-delay-3000" />
      <div className="absolute top-1/2 left-1/2 w-[500px] h-[500px] bg-[#E38B52] rounded-full mix-blend-multiply filter blur-2xl opacity-40 animate-float animation-delay-5000" />
      <div className="absolute top-0 -left-40 w-[500px] h-[600px] bg-[#E38B52] rounded-full mix-blend-multiply filter blur-2xl opacity-30 animate-float animation-delay-7000" />
      
      <div className="w-[90%] max-w-[1200px] mx-4 flex-1 flex flex-col justify-center">
        <h1 className="text-3xl font-bold text-[#7A3E11] mb-8 text-center font-baskervville">
          Sign in to your account
        </h1>
        
        {/* Login container */}
        <div className="relative bg-white/30 backdrop-blur-xl rounded-3xl shadow-xl p-8 md:p-12 border border-white/20 max-w-[450px] mx-auto w-full">
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <p className="text-red-500 text-sm mb-4">{error}</p>
            )}
            
            {/* Username field */}
            <div className="space-y-2 w-full">
              <label 
                htmlFor="username" 
                className="block text-sm font-medium text-[#5E534C] ml-4"
              >
                Username
              </label>
              <input
                id="username"
                type="text"
                placeholder="Enter username here."
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-4 py-4 rounded-2xl border border-[#B6A89B] bg-white shadow-lg shadow-[#B6A89B]/30 focus:outline-none focus:ring-2 focus:ring-[#E38B52] transition-all placeholder:text-[#B6A89B]"
              />
            </div>
            
            {/* Password field */}
            <div className="space-y-2 w-full">
              <label 
                htmlFor="password" 
                className="block text-sm font-medium text-[#5E534C] ml-4"
              >
                Password
              </label>
              <input
                id="password"
                type="password"
                placeholder="Enter password here."
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-4 rounded-2xl border border-[#B6A89B] bg-white shadow-lg shadow-[#B6A89B]/30 focus:outline-none focus:ring-2 focus:ring-[#E38B52] transition-all placeholder:text-[#B6A89B]"
              />
            </div>
            
            {/* Submit button */}
            <button
              type="submit"
              className="w-full bg-[#E38B52] text-white py-4 rounded-2xl hover:bg-[#C8742F] hover:-translate-y-1 transition-all duration-200 font-medium 
              shadow-[inset_0_2px_4px_rgba(255,255,255,0.3),inset_0_4px_8px_rgba(255,255,255,0.2)]"
            >
              Sign in
            </button>
          </form>
          
          {/* Info text */}
          <p className="text-[#B97A4A] text-xs text-center mt-6">
            No account? Contact administrator to manage access.
          </p>
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

export default LoginPage;