from pathlib import Path

# Helper to patch a file via simple string replacement

def patch_file(path_str, replacements):
    path = Path(path_str)
    text = path.read_text()
    original_text = text
    for old, new in replacements:
        if old not in text:
            continue
        text = text.replace(old, new)
    if text != original_text:
        path.write_text(text)

# 1) TeacherDashboard.jsx: add state, handler, header button, and modal
teacher_path = "frontend/src/pages/TeacherDashboard.jsx"

# 1a) add state variables after studentsLoading
patch_file(teacher_path, [
    (
"  const [students, setStudents] = useState([]);\n  const [studentsLoading, setStudentsLoading] = useState(false);\n  // Add scroll event listener\n",
"  const [students, setStudents] = useState([]);\n  const [studentsLoading, setStudentsLoading] = useState(false);\n  const [showPasswordModal, setShowPasswordModal] = useState(false);\n  const [currentPassword, setCurrentPassword] = useState(\"\");\n  const [newPassword, setNewPassword] = useState(\"\");\n  const [confirmPassword, setConfirmPassword] = useState(\"\");\n  const [passwordError, setPasswordError] = useState(\"\");\n  const [passwordSuccess, setPasswordSuccess] = useState(\"\");\n  const [isChangingPassword, setIsChangingPassword] = useState(false);\n  // Add scroll event listener\n"
    )
])

# 1b) add change password handler after handleStudentClick
patch_file(teacher_path, [
    (
"  const handleStudentClick = (studentId) => {\n    navigate(`/student/${studentId}`);\n  };\n\n  return (\n",
"  const handleStudentClick = (studentId) => {\n    navigate(`/student/${studentId}`);\n  };\n\n  const handleChangePassword = async (e) => {\n    e.preventDefault();\n    setPasswordError(\"\");\n    setPasswordSuccess(\"\");\n\n    if (!currentPassword || !newPassword || !confirmPassword) {\n      setPasswordError(\"Please fill in all fields\");\n      return;\n    }\n    if (newPassword !== confirmPassword) {\n      setPasswordError(\"New password and confirm password do not match\");\n      return;\n    }\n\n    const token = localStorage.getItem(\"token\");\n    if (!token) {\n      setPasswordError(\"Authentication token not found. Please log in again.\");\n      return;\n    }\n\n    try {\n      setIsChangingPassword(true);\n      await axios.post(\"http://localhost:8000/api/v1/auth/change-password\", {\n        current_password: currentPassword,\n        new_password: newPassword,\n      }, {\n        headers: { Authorization: `Bearer ${token}` },\n      });\n      setPasswordSuccess(\"Password updated successfully.\");\n      setCurrentPassword(\"\");\n      setNewPassword(\"\");\n      setConfirmPassword(\"\");\n      setTimeout(() => {\n        setShowPasswordModal(false);\n        setPasswordSuccess(\"\");\n      }, 1500);\n    } catch (err) {\n      const msg = err.response?.data?.detail or err.response?.data?.message or err.message or \"Failed to change password. Please try again.\"\n      setPasswordError(msg);\n    } finally {\n      setIsChangingPassword(false);\n    }\n  };\n\n  return (\n"
    )
])

# 1c) add a Change Password button under header text
patch_file(teacher_path, [
    (
"        <p className=\"text-[#6F6C8F] text-sm mt-1\">\n          {new Date().toLocaleDateString(\"en-US\", {\n            weekday: \"long\",\n            year: \"numeric\",\n            month: \"long\",\n            day: \"numeric\",\n          })}\n        </p>\n      </div>\n\n      {/* Floating Search Bar */}\n",
"        <p className=\"text-[#6F6C8F] text-sm mt-1\">\n          {new Date().toLocaleDateString(\"en-US\", {\n            weekday: \"long\",\n            year: \"numeric\",\n            month: \"long\",\n            day: \"numeric\",\n          })}\n        </p>\n        <button\n          onClick={() => {\n            setShowPasswordModal(true);\n            setCurrentPassword(\"\");\n            setNewPassword(\"\");\n            setConfirmPassword(\"\");\n            setPasswordError(\"\");\n            setPasswordSuccess(\"\");\n          }}\n          className=\"mt-4 px-4 py-2 text-sm rounded-xl border border-[#E38B52] text-[#E38B52] hover:bg-[#E38B52]/10 transition-all\"\n        >\n          Change Password\n        </button>\n      </div>\n\n      {/* Floating Search Bar */}\n"
    )
])

# 1d) add Change Password modal before report dialog
patch_file(teacher_path, [
    (
"      `}</style>\n\n      {showReportDialog && selectedStudent && (\n",
"      `}</style>\n\n      {showPasswordModal && (\n        <div className=\"fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-30\">\n          <div className=\"bg-white rounded-2xl shadow-2xl p-8 w-full max-w-sm mx-4\">\n            <h2 className=\"text-xl font-bold text-[#170F49] mb-4 text-center\">\n              Change Password\n            </h2>\n            <form onSubmit={handleChangePassword} className=\"space-y-4\">\n              <div>\n                <label className=\"block text-sm font-medium text-[#170F49] mb-1\">Current Password</label>\n                <input\n                  type=\"password\"\n                  className=\"w-full px-4 py-2 rounded-lg border focus:ring-2 focus:ring-[#E38B52]\"\n                  value={currentPassword}\n                  onChange={(e) => setCurrentPassword(e.target.value)}\n                />\n              </div>\n              <div>\n                <label className=\"block text-sm font-medium text-[#170F49] mb-1\">New Password</label>\n                <input\n                  type=\"password\"\n                  className=\"w-full px-4 py-2 rounded-lg border focus:ring-2 focus:ring-[#E38B52]\"\n                  value={newPassword}\n                  onChange={(e) => setNewPassword(e.target.value)}\n                />\n              </div>\n              <div>\n                <label className=\"block text-sm font-medium text-[#170F49] mb-1\">Confirm New Password</label>\n                <input\n                  type=\"password\"\n                  className=\"w-full px-4 py-2 rounded-lg border focus:ring-2 focus:ring-[#E38B52]\"\n                  value={confirmPassword}\n                  onChange={(e) => setConfirmPassword(e.target.value)}\n                />\n              </div>\n              {passwordError && (\n                <p className=\"text-sm text-red-600\">{passwordError}</p>\n              )}\n              {passwordSuccess && (\n                <p className=\"text-sm text-green-600\">{passwordSuccess}</p>\n              )}\n              <div className=\"flex justify-end gap-3 mt-2\">\n                <button\n                  type=\"button\"\n                  className=\"px-4 py-2 rounded-lg bg-gray-200 text-[#170F49] hover:bg-gray-300 disabled:opacity-50\"\n                  onClick={() => {\n                    setShowPasswordModal(false);\n                    setPasswordError(\"\");\n                    setPasswordSuccess(\"\");\n                  }}\n                  disabled={isChangingPassword}\n                >\n                  Cancel\n                </button>\n                <button\n                  type=\"submit\"\n                  className=\"px-4 py-2 rounded-lg bg-[#E38B52] text-white font-semibold shadow hover:bg-[#E38B52]/90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center\"\n                  disabled={isChangingPassword}\n                >\n                  {isChangingPassword ? \"Updating...\" : \"Update Password\"}\n                </button>\n              </div>\n            </form>\n          </div>\n        </div>\n      )}\n\n      {showReportDialog && selectedStudent && (\n"
    )
])

# 2) TherapistDashboard.jsx: mirror the same changes
therapist_path = "frontend/src/pages/TherapistDashboard.jsx"

# 2a) add state variables after studentsLoading
patch_file(therapist_path, [
    (
"  const [students, setStudents] = useState([]);\n  const [studentsLoading, setStudentsLoading] = useState(false);\n\n  useEffect(() => {\n",
"  const [students, setStudents] = useState([]);\n  const [studentsLoading, setStudentsLoading] = useState(false);\n  const [showPasswordModal, setShowPasswordModal] = useState(false);\n  const [currentPassword, setCurrentPassword] = useState(\"\");\n  const [newPassword, setNewPassword] = useState(\"\");\n  const [confirmPassword, setConfirmPassword] = useState(\"\");\n  const [passwordError, setPasswordError] = useState(\"\");\n  const [passwordSuccess, setPasswordSuccess] = useState(\"\");\n  const [isChangingPassword, setIsChangingPassword] = useState(false);\n\n  useEffect(() => {\n"
    )
])

# 2b) add handler after handleStudentClick
patch_file(therapist_path, [
    (
"  const handleStudentClick = (studentId) => {\n    navigate(`/student/${studentId}`);\n  };\n\n  return (\n",
"  const handleStudentClick = (studentId) => {\n    navigate(`/student/${studentId}`);\n  };\n\n  const handleChangePassword = async (e) => {\n    e.preventDefault();\n    setPasswordError(\"\");\n    setPasswordSuccess(\"\");\n\n    if (!currentPassword || !newPassword || !confirmPassword) {\n      setPasswordError(\"Please fill in all fields\");\n      return;\n    }\n    if (newPassword !== confirmPassword) {\n      setPasswordError(\"New password and confirm password do not match\");\n      return;\n    }\n\n    const token = localStorage.getItem(\"token\");\n    if (!token) {\n      setPasswordError(\"Authentication token not found. Please log in again.\");\n      return;\n    }\n\n    try {\n      setIsChangingPassword(true);\n      await axios.post(\"http://localhost:8000/api/v1/auth/change-password\", {\n        current_password: currentPassword,\n        new_password: newPassword,\n      }, {\n        headers: { Authorization: `Bearer ${token}` },\n      });\n      setPasswordSuccess(\"Password updated successfully.\");\n      setCurrentPassword(\"\");\n      setNewPassword(\"\");\n      setConfirmPassword(\"\");\n      setTimeout(() => {\n        setShowPasswordModal(false);\n        setPasswordSuccess(\"\");\n      }, 1500);\n    } catch (err) {\n      const msg = err.response?.data?.detail or err.response?.data?.message or err.message or \"Failed to change password. Please try again.\"\n      setPasswordError(msg);\n    } finally {\n      setIsChangingPassword(false);\n    }\n  };\n\n  return (\n"
    )
])

# 2c) add Change Password button under header text
patch_file(therapist_path, [
    (
"        <p className=\"text-[#6F6C8F] text-sm mt-1\">\n          {new Date().toLocaleDateString(\"en-US\", {\n            weekday: \"long\",\n            year: \"numeric\",\n            month: \"long\",\n            day: \"numeric\",\n          })}\n        </p>\n      </div>\n\n      {/* Floating Search Bar */}\n",
"        <p className=\"text-[#6F6C8F] text-sm mt-1\">\n          {new Date().toLocaleDateString(\"en-US\", {\n            weekday: \"long\",\n            year: \"numeric\",\n            month: \"long\",\n            day: \"numeric\",\n          })}\n        </p>\n        <button\n          onClick={() => {\n            setShowPasswordModal(true);\n            setCurrentPassword(\"\");\n            setNewPassword(\"\");\n            setConfirmPassword(\"\");\n            setPasswordError(\"\");\n            setPasswordSuccess(\"\");\n          }}\n          className=\"mt-4 px-4 py-2 text-sm rounded-xl border border-[#E38B52] text-[#E38B52] hover:bg-[#E38B52]/10 transition-all\"\n        >\n          Change Password\n        </button>\n      </div>\n\n      {/* Floating Search Bar */}\n"
    )
])

# 2d) add Change Password modal before report dialog
patch_file(therapist_path, [
    (
"      `}</style>\n\n      {showReportDialog && selectedStudent && (\n",
"      `}</style>\n\n      {showPasswordModal && (\n        <div className=\"fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-30\">\n          <div className=\"bg-white rounded-2xl shadow-2xl p-8 w-full max-w-sm mx-4\">\n            <h2 className=\"text-xl font-bold text-[#170F49] mb-4 text-center\">\n              Change Password\n            </h2>\n            <form onSubmit={handleChangePassword} className=\"space-y-4\">\n              <div>\n                <label className=\"block text-sm font-medium text-[#170F49] mb-1\">Current Password</label>\n                <input\n                  type=\"password\"\n                  className=\"w-full px-4 py-2 rounded-lg border focus:ring-2 focus:ring-[#E38B52]\"\n                  value={currentPassword}\n                  onChange={(e) => setCurrentPassword(e.target.value)}\n                />\n              </div>\n              <div>\n                <label className=\"block text-sm font-medium text-[#170F49] mb-1\">New Password</label>\n                <input\n                  type=\"password\"\n                  className=\"w-full px-4 py-2 rounded-lg border focus:ring-2 focus:ring-[#E38B52]\"\n                  value={newPassword}\n                  onChange={(e) => setNewPassword(e.target.value)}\n                />\n              </div>\n              <div>\n                <label className=\"block text-sm font-medium text-[#170F49] mb-1\">Confirm New Password</label>\n                <input\n                  type=\"password\"\n                  className=\"w-full px-4 py-2 rounded-lg border focus:ring-2 focus:ring-[#E38B52]\"\n                  value={confirmPassword}\n                  onChange={(e) => setConfirmPassword(e.target.value)}\n                />\n              </div>\n              {passwordError && (\n                <p className=\"text-sm text-red-600\">{passwordError}</p>\n              )}\n              {passwordSuccess && (\n                <p className=\"text-sm text-green-600\">{passwordSuccess}</p>\n              )}\n              <div className=\"flex justify-end gap-3 mt-2\">\n                <button\n                  type=\"button\"\n                  className=\"px-4 py-2 rounded-lg bg-gray-200 text-[#170F49] hover:bg-gray-300 disabled:opacity-50\"\n                  onClick={() => {\n                    setShowPasswordModal(false);\n                    setPasswordError(\"\");\n                    setPasswordSuccess(\"\");\n                  }}\n                  disabled={isChangingPassword}\n                >\n                  Cancel\n                </button>\n                <button\n                  type=\"submit\"\n                  className=\"px-4 py-2 rounded-lg bg-[#E38B52] text-white font-semibold shadow hover:bg-[#E38B52]/90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center\"\n                  disabled={isChangingPassword}\n                >\n                  {isChangingPassword ? \"Updating...\" : \"Update Password\"}\n                </button>\n              </div>\n            </form>\n          </div>\n        </div>\n      )}\n\n      {showReportDialog && selectedStudent && (\n"
    )
])
