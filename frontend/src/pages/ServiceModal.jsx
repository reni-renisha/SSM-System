// ServiceModal.jsx

import React, { useEffect } from 'react';

const ServiceModal = ({ isOpen, onClose, cardData }) => {
  // Effect to handle the 'Escape' key press for closing the modal
  useEffect(() => {
    const handleEsc = (event) => {
      if (event.keyCode === 27) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleEsc);

    // Cleanup function to remove the event listener
    return () => {
      window.removeEventListener('keydown', handleEsc);
    };
  }, [onClose]);

  // If the modal is not open, render nothing
  if (!isOpen) {
    return null;
  }

  return (
    // Backdrop: a semi-transparent overlay that covers the whole screen
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60 backdrop-blur-sm"
      onClick={onClose} // Close the modal if the user clicks the backdrop
    >
      {/* Modal Content */}
      <div
        className="relative w-full max-w-2xl p-8 mx-4 bg-white rounded-2xl shadow-2xl"
        onClick={(e) => e.stopPropagation()} // Prevents the modal from closing when clicking inside it
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-500 hover:text-gray-800"
          aria-label="Close modal"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
        </button>
        
        {/* The data from the clicked card */}
        {cardData && (
          <>
            <h2 className="text-3xl font-bold text-[#D3723B] mb-4 font-baskervville">
              {cardData.title}
            </h2>
            <div className="text-gray-700 text-lg leading-relaxed max-h-[60vh] overflow-y-auto">
              {cardData.description}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default ServiceModal;