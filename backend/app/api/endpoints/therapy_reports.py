from typing import Any, List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from datetime import datetime
import google.generativeai as genai
import os

from app import crud, schemas
from app.api import deps
from app.core.config import settings

router = APIRouter()


@router.get("/test")
def test_endpoint():
    """Simple test endpoint to verify the API is working"""
    return {"message": "Therapy reports API is working"}


@router.post("/", response_model=schemas.therapy_report.TherapyReport)
def create_report(
    *,
    db: Session = Depends(deps.get_db),
    report_in: schemas.therapy_report.TherapyReportCreate,
    current_user: schemas.user.User = Depends(deps.get_current_active_user),
) -> Any:
    """Create a therapy report for a student."""
    try:
        # Set teacher_id from current_user if not provided
        if not report_in.teacher_id:
            report_in.teacher_id = current_user.id
        
        # Validate required fields
        if not report_in.report_date:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="Report date is required"
            )
        
        if not report_in.progress_notes or not report_in.progress_notes.strip():
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="Progress notes are required"
            )
        
        # Create the therapy report
        therapy_report = crud.therapy_report.create(db, obj_in=report_in)
        
        print(f"Therapy report created successfully: ID {therapy_report.id} for student ID {report_in.student_id} by user {current_user.username if hasattr(current_user, 'username') else current_user.id}")
        
        return therapy_report
        
    except HTTPException:
        raise
    except Exception as e:
        import traceback
        print(f"Error creating therapy report: {str(e)}")
        print(f"Traceback: {traceback.format_exc()}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Internal server error while creating therapy report: {str(e)}"
        )


@router.get("/student/{student_id}", response_model=List[schemas.therapy_report.TherapyReport])
def list_reports_for_student(
    student_id: int,
    db: Session = Depends(deps.get_db),
    current_user: schemas.user.User = Depends(deps.get_current_active_user),
) -> Any:
    """List therapy reports for a student."""
    # Authorization can be added (e.g., only teacher or admin)
    return crud.therapy_report.get_by_student(db, student_id=student_id)


@router.get("/ai-summary/{student_id}")
def generate_ai_summary(
    student_id: int,
    start_date: Optional[str] = Query(None, description="Start date in YYYY-MM-DD format"),
    end_date: Optional[str] = Query(None, description="End date in YYYY-MM-DD format"),
    therapy_type: Optional[str] = Query(None, description="Therapy type filter"),
    db: Session = Depends(deps.get_db),
    current_user: schemas.user.User = Depends(deps.get_current_active_user),
) -> Any:
    """Generate AI summary for therapy reports of a student."""
    try:
        # Configure Gemini API
        gemini_api_key = settings.GEMINI_API_KEY
        print(f"DEBUG: GEMINI_API_KEY = {gemini_api_key[:10] + '...' if gemini_api_key else 'None'}")
        
        if not gemini_api_key:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Gemini API key not configured"
            )
        
        genai.configure(api_key=gemini_api_key)
        
        # Get therapy reports for the student
        reports = crud.therapy_report.get_by_student(db, student_id=student_id)
        
        # Apply filters
        filtered_reports = []
        for report in reports:
            # Date filter
            if start_date:
                try:
                    start = datetime.strptime(start_date, "%Y-%m-%d").date()
                    if report.report_date and report.report_date < start:
                        continue
                except ValueError:
                    pass
            
            if end_date:
                try:
                    end = datetime.strptime(end_date, "%Y-%m-%d").date()
                    if report.report_date and report.report_date > end:
                        continue
                except ValueError:
                    pass
            
            # Therapy type filter
            if therapy_type and therapy_type != "All":
                if report.therapy_type != therapy_type:
                    continue
            
            filtered_reports.append(report)
        
        if not filtered_reports:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="No therapy reports found matching the criteria"
            )
        
        # Prepare data for AI analysis
        report_data = []
        for report in filtered_reports:
            report_info = {
                "date": report.report_date.isoformat() if report.report_date else "No date",
                "therapy_type": report.therapy_type or "Not specified",
                "progress_notes": report.progress_notes or "",
                "goals_achieved": report.goals_achieved or "",
                "progress_level": report.progress_level or "",
                "created_at": report.created_at.isoformat() if report.created_at else "No date",
                "updated_at": report.updated_at.isoformat() if report.updated_at else "No date"
            }
            report_data.append(report_info)
        
        # Generate AI prompt (concise to reduce token usage)
        prompt = f"""
        Analyze {len(filtered_reports)} therapy reports from {start_date or 'start'} to {end_date or 'end'} ({therapy_type or 'all types'}):
        
        {report_data}
        
        Provide a professional summary with:
        1. Overall progress trends
        2. Key achievements and goals met
        3. Areas needing attention
        4. Recommendations for future sessions
        
        Keep response concise but professional for healthcare team review.
        """
        
        # Debug: Test API connection and list models
        try:
            print("DEBUG: Testing Gemini API connection...")
            available_models = list(genai.list_models())
            print(f"DEBUG: Found {len(available_models)} total models")
            
            content_models = []
            for model in available_models:
                print(f"DEBUG: Model: {model.name}, Methods: {model.supported_generation_methods}")
                if 'generateContent' in model.supported_generation_methods:
                    content_models.append(model.name)
                    print(f"DEBUG: ✓ Content generation model: {model.name}")
            
            if not content_models:
                print("DEBUG: No models support content generation!")
                raise Exception("No models available for content generation")
                
            # Use the first available model
            model_name = content_models[0]
            print(f"DEBUG: Using model: {model_name}")
            
        except Exception as e:
            print(f"DEBUG: Error accessing Gemini API: {e}")
            print(f"DEBUG: API Key present: {bool(gemini_api_key)}")
            print(f"DEBUG: API Key length: {len(gemini_api_key) if gemini_api_key else 0}")
            raise Exception(f"Failed to access Gemini API: {e}")
        
        # Generate content with the available model
        try:
            model = genai.GenerativeModel(model_name)
            response = model.generate_content(prompt)
            print(f"DEBUG: Successfully generated content with {model_name}")
        except Exception as e:
            print(f"DEBUG: Content generation failed: {e}")
            error_str = str(e)
            if "429" in error_str and "quota" in error_str.lower():
                raise HTTPException(
                    status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                    detail="AI service quota exceeded. Please try again in a few minutes. The free tier has daily/hourly limits."
                )
            elif "quota" in error_str.lower():
                raise HTTPException(
                    status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                    detail="AI service temporarily unavailable due to quota limits. Please try again later."
                )
            raise Exception(f"Content generation failed with {model_name}: {e}")
        
        # Prepare response data
        date_range_display = f"{start_date or 'Any time'} to {end_date or 'Any time'}"
        therapy_type_display = therapy_type or "All types"
        
        return {
            "success": True,
            "summary": {
                "ai_summary": response.text,
                "report_count": len(filtered_reports),
                "date_range": date_range_display,
                "therapy_type": therapy_type_display,
                "generated_at": datetime.now().isoformat()
            }
        }
        
    except HTTPException:
        raise
    except Exception as e:
        import traceback
        print(f"Error generating AI summary: {str(e)}")
        print(f"Traceback: {traceback.format_exc()}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate AI summary: {str(e)}"
        )