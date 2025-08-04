import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

const LoginPage = () => {
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

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
        const role = response.data.role || "hm"; // Default to hm if not provided
        if (role === "hm" || role === "admin" || role === "headmaster") {
          navigate("/headmaster");
        } else if (role === "teacher") {
          navigate("/teacher");
        } else {
          navigate("/"); // fallback, or you can show an error
        }
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
        <h1 className="text-3xl font-bold text-[#B3541E] mb-8 text-center font-baskervville">
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
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter password here."
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-4 rounded-2xl border border-[#B6A89B] bg-white shadow-lg shadow-[#B6A89B]/30 focus:outline-none focus:ring-2 focus:ring-[#E38B52] transition-all placeholder:text-[#B6A89B] pr-12"
                />
                {password && (
              <button
               type="button"
               aria-label={showPassword ? "Hide password" : "Show password"}
               onClick={() => setShowPassword((prev) => !prev)}
               tabIndex={0}
               className="absolute right-4 top-1/2 -translate-y-1/2 p-1 focus:outline-none"
               style={{ background: "none", border: "none", cursor: "pointer" }}
               >
           {showPassword ? (
           // Eye-off SVG
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24">
            <path stroke="#9A8D80" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M17.94 17.94A10.06 10.06 0 0 1 12 20c-5 0-9.27-3.11-11-8 1.06-2.81 2.97-5.06 5.41-6.41m3.13-1.08A9.93 9.93 0 0 1 12 4c5 0 9.27 3.11 11 8a11.05 11.05 0 0 1-2.06 3.34M1 1l22 22" />
            <circle cx="12" cy="12" r="3" stroke="#9A8D80" strokeWidth="2" />
           </svg>
            ) : (
           // Eye SVG
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24">
            <path stroke="#9A8D80" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M1 12C2.73 7.11 7 4 12 4s9.27 3.11 11 8c-1.73 4.89-6 8-11 8S2.73 16.89 1 12Z" />
            <circle cx="12" cy="12" r="3" stroke="#9A8D80" strokeWidth="2" />
            </svg>
            )}
          </button>
           )}

              </div>
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
          <p className="text-[#5E534C] text-xs text-center mt-6">
            No account? Contact administrator to manage access.
          </p>
        </div>
      </div>

      {/* Global styles for animations and input fields */}
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
        /* Custom input styles for warm, neutral palette */
        input[type="text"], input[type="password"] {
          border: 1.5px solid #e0d6cd !important; /* Pale cream */
          background: #fff;
          transition: border-color 0.25s, box-shadow 0.25s, background 0.25s;
          box-shadow: none;
          cursor: text;
        }
        input[type="text"]:hover, input[type="password"]:hover {
          background: #f9f5f2;
        }
        input[type="text"]:focus, input[type="password"]:focus {
          border-color: #9A8D80 !important; /* Soft greyish-brown */
          box-shadow: 0 0 0 4px rgba(154, 141, 128, 0.13), 0 2px 8px 0 rgba(227, 139, 82, 0.08); /* Subtle glow, warm orange depth */
          outline: none;
        }
        /* When input has value, show warm peach background */
        input[type="text"]:not(:placeholder-shown), input[type="password"]:not(:placeholder-shown) {
          background: #F4F1EE;
        }
        /* When input has value and is focused, keep peach background */
        input[type="text"]:not(:placeholder-shown):focus, input[type="password"]:not(:placeholder-shown):focus {
          background: #F4F1EE;
        }
        /* Remove browser's default password visibility toggle */
        input[type="password"]::-ms-reveal,
        input[type="password"]::-ms-clear {
          display: none;
        }
        input[type="password"]::-webkit-contacts-auto-fill-button,
        input[type="password"]::-webkit-credentials-auto-fill-button {
          visibility: hidden;
          display: none !important;
          pointer-events: none;
          height: 0;
          width: 0;
          margin: 0;
        }
        /* Autofill fix for consistent background color */
        input:-webkit-autofill,
        input:-webkit-autofill:hover,
        input:-webkit-autofill:focus,
        input:-webkit-autofill:active {
       -webkit-box-shadow: 0 0 0px 1000px #f9f5f2 inset !important;
        box-shadow: 0 0 0px 1000px #f9f5f2 inset !important;
       -webkit-text-fill-color: #1a1a1a !important;
       transition: background-color 5000s ease-in-out 0s;
       }

      `}</style>
    </div>
  );
};

export default LoginPage;