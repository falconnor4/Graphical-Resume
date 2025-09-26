import json
from fpdf2 import FPDF

def create_pdf(resume_data_str):
    resume = json.loads(resume_data_str)

    pdf = FPDF()
    pdf.add_page()

    # Set font
    pdf.set_font("Arial", size=12)

    # Title
    pdf.set_font("Arial", 'B', 16)
    pdf.cell(200, 10, txt=resume['contact']['name'], ln=True, align='C')
    pdf.set_font("Arial", size=12)
    pdf.cell(200, 10, txt=resume['contact']['title'], ln=True, align='C')
    pdf.cell(200, 10, txt=f"{resume['contact']['email']} | {resume['contact']['location']}", ln=True, align='C')
    pdf.ln(10)

    # Summary
    if resume['sections']['summary']['enabled']:
        pdf.set_font("Arial", 'B', 14)
        pdf.cell(200, 10, txt="Summary", ln=True, align='L')
        pdf.set_font("Arial", size=12)
        pdf.multi_cell(0, 5, txt=resume['summary'])
        pdf.ln(10)

    # Experience
    if resume['sections']['experience']['enabled']:
        pdf.set_font("Arial", 'B', 14)
        pdf.cell(200, 10, txt="Experience", ln=True, align='L')
        pdf.set_font("Arial", size=12)
        for exp in resume['experience']:
            pdf.set_font("Arial", 'B', 12)
            pdf.cell(0, 5, txt=exp['title'], ln=True)
            pdf.set_font("Arial", 'I', 12)
            pdf.cell(0, 5, txt=f"{exp['company']} | {exp['dates']}", ln=True)
            pdf.set_font("Arial", size=12)
            pdf.multi_cell(0, 5, txt=exp['description'])
            pdf.ln(5)

    # Projects
    if resume['sections']['projects']['enabled']:
        pdf.set_font("Arial", 'B', 14)
        pdf.cell(200, 10, txt="Projects", ln=True, align='L')
        pdf.set_font("Arial", size=12)
        for proj in resume['projects']:
            pdf.set_font("Arial", 'B', 12)
            pdf.cell(0, 5, txt=proj['name'], ln=True)
            pdf.set_font("Arial", size=12)
            pdf.multi_cell(0, 5, txt=proj['description'])
            if proj.get('github'):
                pdf.cell(0, 5, txt=f"GitHub: {proj['github']}", ln=True)
            if proj.get('demo'):
                pdf.cell(0, 5, txt=f"Demo: {proj['demo']}", ln=True)
            pdf.ln(5)

    # Skills
    if resume['sections']['skills']['enabled']:
        pdf.set_font("Arial", 'B', 14)
        pdf.cell(200, 10, txt="Skills", ln=True, align='L')
        pdf.set_font("Arial", size=12)
        for category, skills in resume['skills'].items():
            if category in resume['sections']['skills']['categories']:
                pdf.set_font("Arial", 'B', 12)
                pdf.cell(0, 5, txt=resume['sections']['skills']['categories'][category], ln=True)
                pdf.set_font("Arial", size=12)
                pdf.multi_cell(0, 5, txt=", ".join(skills))
                pdf.ln(5)

    # Education
    if resume['sections']['education']['enabled']:
        pdf.set_font("Arial", 'B', 14)
        pdf.cell(200, 10, txt="Education", ln=True, align='L')
        pdf.set_font("Arial", size=12)
        for edu in resume['education']:
            pdf.set_font("Arial", 'B', 12)
            pdf.cell(0, 5, txt=edu['degree'], ln=True)
            pdf.set_font("Arial", 'I', 12)
            pdf.cell(0, 5, txt=f"{edu['university']} | {edu['dates']}", ln=True)
            if edu.get('coursework'):
                pdf.set_font("Arial", size=12)
                pdf.multi_cell(0, 5, txt=f"Relevant Coursework: {', '.join(edu['coursework'])}")
            pdf.ln(5)

    return pdf.output(dest='S').encode('latin-1')
