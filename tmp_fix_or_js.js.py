from pathlib import Path

for rel in [r"frontend/src/pages/TeacherDashboard.jsx", r"frontend/src/pages/TherapistDashboard.jsx"]:
    path = Path(rel)
    text = path.read_text()
    old = 'const msg = err.response?.data?.detail or err.response?.data?.message or err.message or "Failed to change password. Please try again."'
    new = 'const msg = (err.response?.data?.detail || err.response?.data?.message || err.message || "Failed to change password. Please try again.");'
    if old in text:
        text = text.replace(old, new)
        path.write_text(text)
