import React from 'react';
import { Routes, Route, BrowserRouter } from 'react-router-dom';
import LoginPage from './pages/LoginPage.jsx';
import LandingPage from './pages/LandingPage.jsx';
import HeadMaster from './pages/HeadMaster.jsx';
import AddTeacher from './pages/AddTeacher.jsx';
import AddTherapist from './pages/AddTherapist.jsx';
import AddStudent from './pages/AddStudent.jsx';
import StudentPage from './pages/StudentPage.jsx';
import TeacherPage from './pages/TeacherPage.jsx';
import TherapistPage from './pages/TherapistPage.jsx';
import TeacherDashboard from './pages/TeacherDashboard.jsx';
import TherapistDashboard from './pages/TherapistDashboard.jsx';
import AddUser from './pages/AddUser.jsx';

function App() {
  return (
    <BrowserRouter>
      <div className="App">
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/headmaster" element={<HeadMaster />} />
          <Route path="/teacher" element={<TeacherDashboard />} />
          <Route path="/therapist" element={<TherapistDashboard />} />
          <Route path="/add-teacher" element={<AddTeacher />} />
          <Route path="/add-therapist" element={<AddTherapist />} />
          <Route path="/add-student" element={<AddStudent />} />
          <Route path="/add-user" element={<AddUser />} />
          <Route path="/student/:id" element={<StudentPage />} />
          <Route path="/teacher/:id" element={<TeacherPage />} />
          <Route path="/therapist/:id" element={<TherapistPage />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;
