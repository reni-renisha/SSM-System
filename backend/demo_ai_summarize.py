"""
Demonstration of AI Summarize functionality for Therapy Reports
This shows how the backend endpoint would work once the server is running.
"""

import os
import json
from dotenv import load_dotenv
from huggingface_hub import InferenceClient

# Load environment variables
load_dotenv()

# Sample therapy reports data (similar to what would come from database)
sample_reports = [
    {
        "id": 1,
        "report_date": "2024-01-15",
        "therapy_type": "Speech Therapy",
        "progress_level": "Good",
        "progress_notes": "Student showed significant improvement in pronunciation of consonant sounds. Completed 15 minutes of articulation exercises with good focus. Responded well to visual cues and prompts.",
        "goals_achieved": "Successfully pronounced 'th' sound in 5 different words. Maintained eye contact during conversation."
    },
    {
        "id": 2,
        "report_date": "2024-01-22", 
        "therapy_type": "Speech Therapy",
        "progress_level": "Excellent",
        "progress_notes": "Continued work on articulation and fluency. Student demonstrated increased confidence in speaking during group activities. Used complete sentences more frequently.",
        "goals_achieved": "Used complete sentences in conversation for 10 minutes without prompting. Initiated conversation with peers during therapy session."
    },
    {
        "id": 3,
        "report_date": "2024-01-29",
        "therapy_type": "Occupational Therapy", 
        "progress_level": "Good",
        "progress_notes": "Worked on fine motor skills using scissors and pencil grip exercises. Student showed improvement in hand-eye coordination activities.",
        "goals_achieved": "Cut along straight lines with 80% accuracy. Held pencil with proper tripod grip for 5 minutes."
    }
]

def simulate_ai_summarize_endpoint(student_id, from_date=None, to_date=None, therapy_type=None, model="facebook/bart-large-cnn"):
    """
    Simulates the AI summarize endpoint functionality
    """
    print(f"🔍 Processing AI Summary Request for Student {student_id}")
    print(f"   Filters: from_date={from_date}, to_date={to_date}, therapy_type={therapy_type}")
    print(f"   Model: {model}")
    print("-" * 60)
    
    # Filter reports (in real app, this would query database)
    filtered_reports = sample_reports.copy()
    
    if therapy_type:
        filtered_reports = [r for r in filtered_reports if r['therapy_type'] == therapy_type]
    
    if from_date:
        filtered_reports = [r for r in filtered_reports if r['report_date'] >= from_date]
    
    if to_date:
        filtered_reports = [r for r in filtered_reports if r['report_date'] <= to_date]
    
    print(f"📊 Found {len(filtered_reports)} reports matching filters")
    
    if not filtered_reports:
        return {"error": "No reports found matching filters"}
    
    # Build text for summarization
    text_parts = []
    for report in filtered_reports:
        part = f"""Date: {report['report_date']}
Therapy: {report['therapy_type']}
Progress Level: {report['progress_level']}
Progress Notes: {report['progress_notes']}
Goals Achieved: {report['goals_achieved']}"""
        text_parts.append(part)
    
    combined_text = "\n\n---\n\n".join(text_parts)
    
    # Call Hugging Face API
    try:
        hf_token = os.getenv('HUGGINGFACE_API_TOKEN')
        if not hf_token:
            return {"error": "HUGGINGFACE_API_TOKEN environment variable not set"}
        
        client = InferenceClient(api_key=hf_token)
        
        print("🤖 Calling Hugging Face API...")
        result = client.summarization(
            combined_text,
            model=model
        )
        
        # Extract summary text
        if hasattr(result, 'summary_text'):
            summary = result.summary_text
        elif isinstance(result, dict) and 'summary_text' in result:
            summary = result['summary_text']
        else:
            summary = str(result)
        
        response = {
            "student_id": student_id,
            "model": model,
            "used_reports": len(filtered_reports),
            "truncated": len(combined_text) > 12000,
            "summary": summary.strip()
        }
        
        return response
        
    except Exception as e:
        return {"error": f"AI summarization failed: {str(e)}"}

def main():
    print("🏥 AI THERAPY REPORT SUMMARIZATION DEMO")
    print("=" * 60)
    
    # Test 1: All reports
    print("\n📋 TEST 1: Summarize all therapy reports")
    result1 = simulate_ai_summarize_endpoint(student_id=123)
    if "error" not in result1:
        print(f"✅ SUCCESS!")
        print(f"📄 Summary ({result1['used_reports']} reports):")
        print(f"   {result1['summary']}")
    else:
        print(f"❌ ERROR: {result1['error']}")
    
    # Test 2: Speech Therapy only
    print("\n📋 TEST 2: Summarize only Speech Therapy reports")
    result2 = simulate_ai_summarize_endpoint(student_id=123, therapy_type="Speech Therapy")
    if "error" not in result2:
        print(f"✅ SUCCESS!")
        print(f"📄 Summary ({result2['used_reports']} reports):")
        print(f"   {result2['summary']}")
    else:
        print(f"❌ ERROR: {result2['error']}")
    
    # Test 3: Date range filter
    print("\n📋 TEST 3: Summarize reports from Jan 20-31, 2024")
    result3 = simulate_ai_summarize_endpoint(student_id=123, from_date="2024-01-20", to_date="2024-01-31")
    if "error" not in result3:
        print(f"✅ SUCCESS!")
        print(f"📄 Summary ({result3['used_reports']} reports):")
        print(f"   {result3['summary']}")
    else:
        print(f"❌ ERROR: {result3['error']}")

    print("\n" + "=" * 60)
    print("🎯 DEMONSTRATION COMPLETE!")
    print("\n💡 When the backend server is running, this functionality will be available at:")
    print("   POST /api/v1/therapy-reports/summary/ai")
    print("\n🔗 Frontend integration is already implemented in StudentPage.jsx")
    print("   Look for the 'AI Summary (Server)' panel in the Therapy Reports tab")

if __name__ == "__main__":
    main()