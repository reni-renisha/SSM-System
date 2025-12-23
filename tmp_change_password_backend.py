from pathlib import Path

# 1) Append PasswordChange schema to backend/app/schemas/user.py
user_schema_path = Path(r"backend/app/schemas/user.py")
text = user_schema_path.read_text()
if "class PasswordChange" not in text:
    insert = """\n\nclass PasswordChange(BaseModel):\n    current_password: str\n    new_password: str\n"""
    text = text + insert
    user_schema_path.write_text(text)

# 2) Update backend/app/schemas/__init__.py to export PasswordChange
init_path = Path(r"backend/app/schemas/__init__.py")
init_text = init_path.read_text()
old_line = "from app.schemas.user import User, UserCreate, UserUpdate, Token, TokenPayload\n"
new_line = "from app.schemas.user import User, UserCreate, UserUpdate, Token, TokenPayload, PasswordChange\n"
if old_line in init_text and "PasswordChange" not in init_text:
    init_text = init_text.replace(old_line, new_line)
    init_path.write_text(init_text)

# 3) Append change-password endpoint to backend/app/api/endpoints/auth.py
auth_path = Path(r"backend/app/api/endpoints/auth.py")
auth_text = auth_path.read_text()
if "change-password" not in auth_text:
    endpoint = """\n\n@router.post("/change-password")\ndef change_password(\n    password_in: schemas.PasswordChange,\n    db: Session = Depends(deps.get_db),\n    current_user = Depends(deps.get_current_active_user),\n) -> Any:\n    \"\"\"Change the password for the current authenticated user\"\"\"\n    if not security.verify_password(password_in.current_password, current_user.hashed_password):\n        raise HTTPException(\n            status_code=status.HTTP_400_BAD_REQUEST,\n            detail="Incorrect current password",\n        )\n\n    crud.user.update(db, db_obj=current_user, obj_in={"password": password_in.new_password})\n    return {"msg": "Password updated successfully"}\n"""
    auth_text = auth_text + endpoint
    auth_path.write_text(auth_text)
