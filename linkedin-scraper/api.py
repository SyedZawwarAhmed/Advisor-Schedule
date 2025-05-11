from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
import os
import json
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
import uvicorn
from playwright.sync_api import sync_playwright
import re
import logging

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    handlers=[logging.StreamHandler()]
)

logger = logging.getLogger(__name__)

app = FastAPI(title="LinkedIn Scraper API")

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows all origins
    allow_credentials=True,
    allow_methods=["*"],  # Allows all methods
    allow_headers=["*"],  # Allows all headers
)

class LinkedInRequest(BaseModel):
    url: str
    email: Optional[str] = None

class Experience(BaseModel):
    company: str
    title: str
    duration: str

class Education(BaseModel):
    school: str
    degree: str
    fieldOfStudy: str
    dates: str

class LinkedInProfile(BaseModel):
    name: str
    headline: str
    location: str
    about: str
    experiences: List[Experience]
    education: List[Education]
    skills: List[str]
    professionalSummary: str
    industryExperience: str
    likelyFinancialInterests: str

def extract_linkedin_data(url: str) -> Dict[str, Any]:
    """Scrape LinkedIn profile data using Playwright"""
    with sync_playwright() as p:
        # Launch browser
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(
            user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36"
        )
        
        page = context.new_page()
        try:
            # Navigate to profile
            page.goto(url, wait_until="networkidle")
            
            # Check if we're redirected to login page
            if "/login" in page.url or "/checkpoint" in page.url:
                raise Exception("LinkedIn requires authentication")
            
            # Extract basic info
            name = page.query_selector(".text-heading-xlarge")
            name = name.inner_text() if name else "Unknown"
            
            headline = page.query_selector(".text-body-medium.break-words")
            headline = headline.inner_text() if headline else ""
            
            location = page.query_selector(".text-body-small.inline.t-black--light.break-words")
            location = location.inner_text() if location else ""
            
            # Extract about section
            about = ""
            about_section = page.query_selector(".pv-about__summary-text .inline-show-more-text")
            if about_section:
                about = about_section.inner_text()
            
            # Extract experiences
            experiences = []
            experience_items = page.query_selector_all(".experience-section .pv-entity__position-group")
            for item in experience_items:
                company_elem = item.query_selector(".pv-entity__secondary-title")
                title_elem = item.query_selector("h3")
                duration_elem = item.query_selector(".pv-entity__date-range span:nth-child(2)")
                
                company = company_elem.inner_text() if company_elem else ""
                title = title_elem.inner_text() if title_elem else ""
                duration = duration_elem.inner_text() if duration_elem else ""
                
                experiences.append({
                    "company": company,
                    "title": title,
                    "duration": duration
                })
            
            # Extract education
            education = []
            education_items = page.query_selector_all(".education-section .pv-education-entity")
            for item in education_items:
                school_elem = item.query_selector("h3")
                degree_elem = item.query_selector(".pv-entity__degree-name .pv-entity__comma-item")
                field_elem = item.query_selector(".pv-entity__fos .pv-entity__comma-item")
                dates_elem = item.query_selector(".pv-entity__dates span:nth-child(2)")
                
                school = school_elem.inner_text() if school_elem else ""
                degree = degree_elem.inner_text() if degree_elem else ""
                field = field_elem.inner_text() if field_elem else ""
                dates = dates_elem.inner_text() if dates_elem else ""
                
                education.append({
                    "school": school,
                    "degree": degree,
                    "fieldOfStudy": field,
                    "dates": dates
                })
            
            # Extract skills
            skills = []
            skill_items = page.query_selector_all(".pv-skill-category-entity__name-text")
            for item in skill_items:
                skill = item.inner_text()
                if skill:
                    skills.append(skill)
            
            # Analyze industry
            all_text = f"{headline} {about} {' '.join([f'{e['title']} at {e['company']}' for e in experiences])} {' '.join([f'{e['degree']} in {e['fieldOfStudy']} at {e['school']}' for e in education])}"
            
            # Define industry keywords
            industries = [
                {"name": "Technology", "keywords": ["software", "developer", "engineer", "IT", "tech", "computer", "programming", "code", "web", "data", "digital"]},
                {"name": "Finance", "keywords": ["finance", "financial", "investment", "banking", "accountant", "accounting", "bank", "wealth", "asset", "portfolio", "fund"]},
                {"name": "Healthcare", "keywords": ["health", "doctor", "nurse", "medical", "hospital", "care", "clinical", "patient", "pharma", "therapeutic"]},
                {"name": "Education", "keywords": ["education", "teacher", "professor", "academic", "school", "university", "college", "teaching", "learning", "student"]},
                {"name": "Legal", "keywords": ["legal", "law", "attorney", "lawyer", "counsel", "judicial", "compliance", "regulatory", "legislation"]},
                {"name": "Marketing", "keywords": ["marketing", "market", "brand", "advertising", "media", "PR", "public relations", "content", "digital marketing"]},
                {"name": "Sales", "keywords": ["sales", "business development", "account", "client", "revenue", "customer", "prospect", "lead"]},
                {"name": "Manufacturing", "keywords": ["manufacturing", "production", "factory", "operations", "industrial", "assembly", "supply chain"]},
                {"name": "Consulting", "keywords": ["consulting", "consultant", "advisor", "strategy", "management consulting"]},
                {"name": "Real Estate", "keywords": ["real estate", "property", "broker", "agent", "residential", "commercial", "mortgage"]}
            ]
            
            found_industries = []
            all_text_lower = all_text.lower()
            for industry in industries:
                if any(keyword.lower() in all_text_lower for keyword in industry["keywords"]):
                    found_industries.append(industry["name"])
            
            industry_text = ", ".join(found_industries) if found_industries else "Unknown industry"
            
            # Infer financial interests
            financial_interests = []
            
            # Retirement indicators
            if any(word in all_text_lower for word in ["retire", "pension", "401k", "ira"]):
                financial_interests.append("Retirement planning")
            
            # Education indicators
            if any(word in all_text_lower for word in ["college", "university", "education", "student loan"]):
                financial_interests.append("Education funding")
            
            # Real estate indicators
            if any(phrase in all_text_lower for phrase in ["real estate", "property", "home", "mortgage"]):
                financial_interests.append("Real estate investment")
            
            # Business owner indicators
            if any(word in all_text_lower for word in ["founder", "owner", "entrepreneur", "ceo", "president"]):
                financial_interests.append("Business succession planning")
            
            # Wealth management indicators
            if any(word in all_text_lower for word in ["wealth", "invest", "portfolio", "asset", "stock"]):
                financial_interests.append("Investment management")
            
            # Tax planning indicators
            if any(word in all_text_lower for word in ["tax", "cpa", "accountant"]):
                financial_interests.append("Tax optimization")
            
            # Family planning indicators
            if any(word in all_text_lower for word in ["family", "child", "kid", "parent"]):
                financial_interests.append("Family financial planning")
            
            # Default interests based on industry
            if not financial_interests:
                if "Technology" in industry_text:
                    financial_interests.extend(["Equity compensation planning", "High-income tax strategies"])
                elif "Finance" in industry_text:
                    financial_interests.extend(["Advanced investment strategies", "Risk management"])
                elif "Healthcare" in industry_text:
                    financial_interests.extend(["Practice management", "Insurance planning"])
                else:
                    financial_interests.extend(["General financial planning", "Wealth building"])
            
            interests_text = ", ".join(financial_interests)
            
            # Create summary
            professional_summary = f"{name} is {headline}. {about[:150]}{'...' if len(about) > 150 else ''}"
            
            return {
                "name": name,
                "headline": headline,
                "location": location,
                "about": about,
                "experiences": experiences,
                "education": education,
                "skills": skills,
                "professionalSummary": professional_summary,
                "industryExperience": industry_text,
                "likelyFinancialInterests": interests_text
            }
        
        finally:
            browser.close()

@app.post("/scrape", response_model=LinkedInProfile)
async def scrape_linkedin(request: LinkedInRequest):
    """
    Scrape LinkedIn profile from provided URL
    """
    try:
        logger.info(f"Scraping LinkedIn profile: {request.url}")
        
        # Normalize URL
        url = request.url
        if not url.startswith(('http://', 'https://')):
            url = 'https://' + url
            
        # Ensure it's a LinkedIn URL
        if not re.search(r'linkedin\.com', url):
            raise HTTPException(status_code=400, detail="Not a valid LinkedIn URL")
        
        # Extract data
        profile_data = extract_linkedin_data(url)
        logger.info(f"Successfully scraped profile: {profile_data['name']}")
        
        return profile_data
    
    except Exception as e:
        logger.error(f"Error scraping LinkedIn profile: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "ok"}

if __name__ == "__main__":
    # Get port from environment or use default
    port = int(os.getenv("PORT", "8000"))
    
    # Run server
    uvicorn.run("api:app", host="0.0.0.0", port=port, reload=True) 