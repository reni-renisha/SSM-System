import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import mainfront from "../images/mainfront.jpg";
import vision from "../images/vision.jpg";
import mission from "../images/mission.jpg";
import teachers from "../images/teachers.jpg";
import logo from "../images/logo.png";

const LandingPage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen w-full flex flex-col bg-white relative overflow-hidden"> {/* Changed background to white */}
      {/* Removed Animated background blobs for cleaner look like the example */}

      {/* Header Section - Replaces Navigation */}
      {/* Further reduced horizontal padding for edge alignment */}
      <header className="absolute top-0 left-0 right-0 z-20 px-2 py-6 sm:px-4">
        <div className="flex justify-between items-center w-full"> {/* Ensure full width */}
          {/* Logo and School Name - Top Left */}
          <div className="flex items-center gap-2 sm:gap-3 mt-2">
            <img src={logo} alt="School Logo" className="h-14 w-14 sm:h-16 sm:w-16 object-contain" />
            <div className="flex flex-col justify-center leading-tight ml-1 sm:ml-2">
              <span className="text-base sm:text-xl md:text-2xl font-semibold text-[#E38B52] font-baskervville text-left">St. Martha's Special School</span>
              <span className="text-xs sm:text-sm md:text-lg font-semibold text-[#7A3700] font-baskervville text-left md:mt-0 -mt-1">For The Mentally Challenged</span>
            </div>
          </div>

          {/* Login Button - Top Right - Final Adjusted Style */}
          <button
            onClick={() => navigate('/login')}
            className="px-8 py-3 text-base bg-[#E38B52] text-white rounded-lg hover:bg-[#C8742F] transition-all duration-200 shadow-[inset_0_2px_4px_rgba(255,255,255,0.3),inset_0_4px_8px_rgba(255,255,255,0.2)] hover:-translate-y-1 hover:scale-105 flex items-center gap-2" // Match LoginPage sign in button color
          >
            {/* Added Login Icon (Arrow entering door) */}
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M3 3a1 1 0 011 1v12a1 1 0 11-2 0V4a1 1 0 011-1zm7.707 3.293a1 1 0 010 1.414L9.414 9H17a1 1 0 110 2H9.414l1.293 1.293a1 1 0 01-1.414 1.414l-3-3a1 1 0 010-1.414l3-3a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
            Login
          </button>
        </div>
      </header>

      {/* Main Image and Hero Text Container */}
      <div className="relative w-full h-screen flex items-center justify-center overflow-hidden"> {/* Full screen height */}
        {/* Background Image with Blur and Gradient */}
        <div className="absolute inset-0 z-0 transform scale-105"> {/* Added scale-105 here */}
          <img
            src={mainfront}
            alt="St. Martha's Special School Background"
            className="w-full h-full object-cover filter blur-sm" // Blur remains on image
          />
          {/* Gradient Overlay: Image to White - Adjusted start opacity */}
          <div className="absolute inset-0 bg-gradient-to-b from-white/10 via-white/60 to-white z-10"></div> {/* Changed from-transparent to from-white/10 */}
        </div>

        {/* Centered Hero Text - Updated Structure and Styling */}
        <div className="relative z-10 text-center max-w-3xl px-4"> {/* Increased max-width slightly */}
          {/* Main Heading */}
          <h2 className="text-4xl sm:text-5xl md:text-6xl font-bold text-[#7A3700] mb-6 font-baskervville leading-tight"> {/* Improved contrast for hero title */}
            Every Child Matters,<br/>Every Moment Counts.
          </h2>
          {/* Subtitle */}
          <p className="text-lg sm:text-xl text-[#A86A3D] leading-relaxed"> {/* Adjusted size and color for palette harmony */}
            St. Martha's Special School provides a caring, inclusive environment for children with mild general learning disabilities. We believe in nurturing each child's unique potential through individualized education and support.
          </p>
        </div>
      </div>

      {/* Content Below the Fold (Vision, Mission, etc.) */}
      {/* Added mx-auto and max-w-7xl to center the content container */}
      <div className="relative z-10 bg-white pt-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Vision and Mission Blocks */}
        {/* Removed max-w-7xl and horizontal padding from inner divs as the parent now handles it */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full mb-12">
          <div className="bg-white/30 backdrop-blur-xl rounded-3xl overflow-hidden border border-white/20 shadow-xl hover:bg-white/40 hover:-translate-y-1 hover:shadow-2xl transition-all duration-300 group">
            <div className="h-48 overflow-hidden">
              <img
                src={vision}
                alt="Our Vision"
                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
              />
            </div>
            <div className="p-8">
              <h3 className="text-3xl text-left font-bold text-[#7A3700] mb-3 font-baskervville group-hover:text-[#A04F0B]">Our Vision</h3>
              <p className="text-[#6F6C90] text-lg leading-relaxed group-hover:text-[#514f7d]">
                Our vision is the holistic development of the mentally challenged children and to empower them to live a self-reliant and dignified life, fully and happily integrated into their communities.
              </p>
            </div>
          </div>
          <div className="bg-white/30 backdrop-blur-xl rounded-3xl overflow-hidden border border-white/20 shadow-xl hover:bg-white/40 hover:-translate-y-1 hover:shadow-2xl transition-all duration-300 group">
            <div className="h-48 overflow-hidden">
              <img
                src={mission}
                alt="Our Mission"
                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
              />
            </div>
            <div className="p-8">
              <h3 className="text-3xl text-left font-bold text-[#7A3700] mb-3 font-baskervville group-hover:text-[#A04F0B]">Our Mission</h3>
              <p className="text-[#6F6C90] text-lg leading-relaxed group-hover:text-[#514f7d]">
                Our mission is to identify and build the capacities of the mentally challenged children entrusted to our care, empower them with curriculum and vocational training, uplift them as self-reliant and dignified persons who contribute their share in nation-building.
              </p>
            </div>
          </div>
        </div>

        {/* Services and Features */}
        <h2 className="text-3xl font-bold text-[#7A3700] mb-8 font-baskervville text-center">Our Services & Facilities</h2>
        {/* Removed max-w-7xl and horizontal padding from inner divs as the parent now handles it */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 lg:gap-10 w-full mb-16">
          {[
            {
              title: "Special Education",
              description: "Based on the individual strengths and abilities, the children are divided into different groups. We cater the needs of each child. The children are periodically evaluated and assessed by the professionals."
            },
            {
              title: "Physiotherapy",
              description: "Department of physiotherapy center is one of the highlights of this institution. We are equipped with an advanced physiotherapy lab and two physiotherapists are working as full time staffs."
            },
            {
              title: "Speech Therapy",
              description: "The speech therapist give regular training to all and this is always in tune with one's need."
            },
            {
              title: "Behavioural Therapy",
              description: "A Clinical Psychologist is working here as staff member, catering the counseling needs of the students and the parents."
            },
            {
              title: "Computer Lab",
              description: "Computer lab is well equipped with very recent software, benefiting the staff in teaching and the students in learning."
            },
            {
              title: "Audio-Visual Room",
              description: "We have a well developed audio-visual lab. Students enjoy the sessions and the staff paves the way for fast learning."
            },
            {
              title: "Arts & Sports",
              description: "Comprehensive coaching in both arts and sports by experienced teachers. Students participate in various cultural activities, music, arts, and sports competitions at district and state levels, contributing to their overall development and building confidence through creative expression and physical activities."
            },
            {
              title: "Vocational Training Centre",
              description: "Students get training in a variety of items and they interestingly participate in horticulture, tailoring and making candles, agarbathy, envelops and paper bags."
            },
            {
              title: "Sensory Integration",
              description: "Our school has thw facility of sensory therapy to clam down the autistic children who has the sensory issues."
            }
          ].map((feature, index) => (
            <div
              key={index}
              className="bg-gradient-to-br from-white/40 to-white/20 backdrop-blur-xl rounded-3xl p-8 border border-white/20 shadow-xl hover:bg-white/40 hover:-translate-y-2 hover:shadow-2xl transition-all duration-300 group"
            >
              <h3 className="text-xl font-bold text-[#7A3700] mb-4 group-hover:text-[#A04F0B] transition-colors duration-300">{feature.title}</h3>
              <p className="text-[#6F6C90] group-hover:text-[#514f7d] transition-colors duration-300 leading-relaxed">{feature.description}</p>
            </div>
          ))}
        </div>

        {/* Teachers Image Section - Moved inside the centered container */}
        <div className="relative w-full h-[900px] overflow-hidden group my-16 bg-gray-100"> {/* Added margin top/bottom */}
          <img
            src={teachers}
            alt="Our Teachers"
            className="w-full h-full object-contain transform scale-100 group-hover:scale-105 transition-transform duration-700"
          />
        </div>
      </div> {/* This now correctly closes the centered container AFTER the Teachers image */}

      {/* Footer - Remains outside the main content centered div */}
      <footer className="relative z-10 bg-white/30 backdrop-blur-xl border-t border-white/20 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between gap-8">
            <div className="text-[#6F6C90] text-base space-y-3">
              <p className="text-xl font-bold text-[#7A3700]">If you wish to extend your helping hands, Please contact us.</p>
              <p className="text-lg font-medium">Donations to our institution are eligible for tax exemption under section 80G. Please make your contributions in the name of "St. Martha's Special School"</p>
              <div className="mt-4">
                <p className="text-lg font-bold text-[#7A3700]">Bank Details: The Catholic Syrian Bank Ltd. Kazhakuttom</p>
                <p className="text-lg font-medium">Account number: 0179-00454017-190001</p>
                <p className="text-lg font-medium">IFSC Code: CSBK0000179</p>
              </div>
            </div>
            <div className="flex flex-col">
              <h3 className="text-3xl font-bold text-[#7A3700] mb-6 text-left">Contact Us</h3>
              <div className="text-[#6F6C90] text-base space-y-3">
              <div className="grid grid-cols-[32px_1fr] gap-x-3 gap-y-3 mt-2">
                <div className="flex items-center justify-center h-8"><i className="fa-solid fa-location-dot fa-lg text-[#6F6C90]"></i></div>
                <div className="flex items-center h-8">Kalpana Road, Chittattumukku P.O Menamkulam, 695301</div>
                <div className="flex items-center justify-center h-8"><svg className="w-5 h-5 text-[#C76B1D]" fill="currentColor" viewBox="0 0 20 20"><path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z"/></svg></div>
                <div className="flex items-center h-8">9388084403, 9388084401</div>
                <div className="flex items-center justify-center h-8"><svg className="w-6 h-6 text-[#C76B1D]" fill="currentColor" viewBox="0 0 20 20"><path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z"/><path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z"/></svg></div>
                <div className="flex items-center h-8">stmarthaspecialschool@gmail.com</div>
                <div className="flex items-center justify-center h-8"><i className="fa-brands fa-whatsapp fa-lg text-[#C76B1D]"></i></div>
                <div className="flex items-center h-8">9388084403</div>
                <div className="flex items-center justify-center h-8"><i className="fa-brands fa-facebook fa-lg text-[#C76B1D]"></i></div>
                <div className="flex items-center h-8">stmarthaspecialschool@gmail.com</div>
                <div className="flex items-center justify-center h-8"><i className="fa-brands fa-telegram fa-lg text-[#C76B1D]"></i></div>
                <div className="flex items-center h-8">9388084403</div>
              </div>
            </div>
            </div>
          </div>
        </div>
        <div className="text-center mt-8 text-[#6F6C90] text-sm border-t border-white/20 pt-4">
          <p>© 2025 St. Martha's Special School. All rights reserved.</p>
          <p className="mt-2">Providing Quality Special Education Since 2005</p>
        </div>
      </footer>

      <ScrollToTopButton />
    </div>
  );
};

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
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <button
      onClick={scrollToTop}
      title="Back to Top"
      className={`fixed z-50 bottom-5 right-5 w-10 h-10 flex items-center justify-center rounded-full bg-white shadow-lg transition-all duration-300
        ${visible ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}
        hover:scale-110 hover:brightness-110 focus:outline-none`}
      style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.15)' }}
      aria-label="Back to Top"
    >
      <i className="fa-solid fa-arrow-up text-[#C76B1D] text-lg"></i>
    </button>
  );
};

export default LandingPage;
