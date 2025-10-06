import os
from dotenv import load_dotenv
from huggingface_hub import InferenceClient

# Load environment variables
load_dotenv()

# Test the Hugging Face integration
def test_hf_summarization():
    try:
        hf_token = os.getenv('HUGGINGFACE_API_TOKEN')
        
        client = InferenceClient(api_key=hf_token)
        
        test_text = """
        Date: 2024-01-15
        Therapy: Speech Therapy
        Progress Level: Good
        Progress Notes: Student showed improvement in pronunciation of consonant sounds. Completed 15 minutes of articulation exercises.
        Goals Achieved: Successfully pronounced 'th' sound in 5 different words.
        
        ---
        
        Date: 2024-01-22
        Therapy: Speech Therapy  
        Progress Level: Excellent
        Progress Notes: Continued work on articulation. Student demonstrated increased confidence in speaking.
        Goals Achieved: Used complete sentences in conversation for 10 minutes without prompting.
        """
        
        result = client.summarization(
            test_text,
            model="facebook/bart-large-cnn",
        )
        
        print("✅ Hugging Face API Test Successful!")
        print(f"Summary: {result}")
        return True
        
    except Exception as e:
        print(f"❌ Hugging Face API Test Failed: {e}")
        return False

if __name__ == "__main__":
    test_hf_summarization()