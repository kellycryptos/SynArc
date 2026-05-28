import os
import re
from fpdf import FPDF
import markdown

# Mapping of common unicode characters to standard ASCII/latin-1 equivalents
def sanitize_unicode(text):
    replacements = {
        '\u2014': ' -- ',  # em-dash
        '\u2013': ' - ',   # en-dash
        '\u201c': '"',     # smart double quote left
        '\u201d': '"',     # smart double quote right
        '\u2018': "'",     # smart single quote left
        '\u2019': "'",     # smart single quote right
        '\u2022': '*',     # bullet
        '\u20ac': 'EUR',   # Euro symbol
        '👍': '[FOR]',
        '👎': '[AGAINST]',
        '⚪': '[ABSTAIN]',
        '✅': '[OK]',
        '⚠️': '[WARNING]',
        '🚰': '[FAUCET]',
        '•': '*',
        '—': ' -- ',
        '–': ' - ',
        '’': "'",
        '“': '"',
        '”': '"',
        '✓': '[OK]',
        '❌': '[X]',
        '🏆': '[ROADMAPPED]',
        '🤖': '[AI]',
        '💻': '[DEV]',
        '🛡️': '[SECURITY]',
        '🛠️': '[SETUP]',
        '📚': '[DOCS]',
        '🚀': '[LAUNCH]'
    }
    for orig, rep in replacements.items():
        text = text.replace(orig, rep)
    # Encode and decode back to strip any remaining exotic non-latin-1 characters
    return text.encode('latin-1', errors='replace').decode('latin-1').replace('?', '-')

# Setup FPDF class with custom headers, footers and page numbering
class SynArcPDF(FPDF):
    def header(self):
        if self.page_no() == 1:
            return  # No header on cover page
        self.set_font("helvetica", "I", 8)
        self.set_text_color(128, 128, 128)
        header_text = sanitize_unicode("SynArc DAO -- Developer Documentation & Governance Framework")
        self.cell(0, 10, header_text, border=0, align="L")
        self.ln(12)
        # Draw a thin divider line
        self.set_draw_color(220, 220, 220)
        self.set_line_width(0.2)
        self.line(10, 18, 200, 18)

    def footer(self):
        if self.page_no() == 1:
            return  # No footer on cover page
        self.set_y(-15)
        self.set_font("helvetica", "I", 8)
        self.set_text_color(128, 128, 128)
        self.cell(0, 10, f"Page {self.page_no()}", border=0, align="C")

def main():
    print("Initializing PDF generation...")
    pdf = SynArcPDF()
    pdf.set_auto_page_break(auto=True, margin=15)
    pdf.set_margins(15, 20, 15)

    # 1. ADD COVER PAGE
    pdf.add_page()
    
    # Premium spacing
    pdf.ln(50)
    
    # Main Title
    pdf.set_font("helvetica", "B", 36)
    pdf.set_text_color(124, 58, 237) # Elegant Purple (#7C3AED)
    pdf.cell(0, 15, "SynArc", border=0, align="C", new_x="LEFT", new_y="NEXT")
    pdf.ln(5)
    
    # Subtitle
    pdf.set_font("helvetica", "B", 13)
    pdf.set_text_color(75, 85, 99) # Slate Grey
    sub_title = sanitize_unicode("GOVERNANCE & ASSET INFRASTRUCTURE FOR THE AGENTIC ECONOMY")
    pdf.cell(0, 10, sub_title, border=0, align="C", new_x="LEFT", new_y="NEXT")
    pdf.ln(20)
    
    # Separator Line
    pdf.set_draw_color(124, 58, 237)
    pdf.set_line_width(1)
    pdf.line(60, pdf.get_y(), 150, pdf.get_y())
    pdf.ln(20)

    # Sub-bullet details
    pdf.set_font("helvetica", "I", 11)
    pdf.set_text_color(107, 114, 128) # Muted text
    pdf.cell(0, 8, sanitize_unicode("Official Developer Documentation & System Architecture Portal"), border=0, align="C", new_x="LEFT", new_y="NEXT")
    pdf.cell(0, 8, sanitize_unicode("Deployed on Arc Testnet -- Powered by Circle USD Stack"), border=0, align="C", new_x="LEFT", new_y="NEXT")
    
    pdf.ln(60)
    pdf.set_font("helvetica", "B", 10)
    pdf.set_text_color(124, 58, 237)
    pdf.cell(0, 10, "SYNARC DAO WORK GROUP", border=0, align="C", new_x="LEFT", new_y="NEXT")
    pdf.set_font("helvetica", "", 9)
    pdf.set_text_color(156, 163, 175)
    pdf.cell(0, 5, sanitize_unicode("May 2026 * Production-Ready Release v1.0"), border=0, align="C", new_x="LEFT", new_y="NEXT")

    # 2. READ & COMPILE MARKDOWN FILES
    gitbook_dir = "gitbook-export"
    files = [
        "01-getting-started.md",
        "02-governance.md",
        "03-treasury.md",
        "04-ai-agents.md",
        "05-dao-registry.md",
        "06-bridge.md",
        "07-smart-contracts.md",
        "08-roadmap.md",
        "09-faq.md"
    ]

    for fname in files:
        fpath = os.path.join(gitbook_dir, fname)
        if not os.path.exists(fpath):
            print(f"Warning: File {fpath} not found. Skipping.")
            continue

        print(f"Processing {fname}...")
        
        # Read Markdown file
        with open(fpath, "r", encoding="utf-8") as f:
            md_content = f.read()

        # Sanitize non-latin-1 and unicode emoji characters
        md_content = sanitize_unicode(md_content)

        # Replace --- dividers with thin HTML breaks
        md_content = re.sub(r'\n---\n', '\n<hr/>\n', md_content)
        
        # Format bash and terminal blocks to render nicely in html2pdf
        md_content = re.sub(r'```bash\n(.*?)\n```', r'<pre><code>\1</code></pre>', md_content, flags=re.DOTALL)
        md_content = re.sub(r'```tsx\n(.*?)\n```', r'<pre><code>\1</code></pre>', md_content, flags=re.DOTALL)
        md_content = re.sub(r'```javascript\n(.*?)\n```', r'<pre><code>\1</code></pre>', md_content, flags=re.DOTALL)
        md_content = re.sub(r'```typescript\n(.*?)\n```', r'<pre><code>\1</code></pre>', md_content, flags=re.DOTALL)
        md_content = re.sub(r'```json\n(.*?)\n```', r'<pre><code>\1</code></pre>', md_content, flags=re.DOTALL)
        md_content = re.sub(r'```\n(.*?)\n```', r'<pre><code>\1</code></pre>', md_content, flags=re.DOTALL)

        # Convert Markdown to HTML
        html_content = markdown.markdown(md_content)

        # Basic tag style adjustments for premium aesthetics in FPDF2
        html_content = html_content.replace("<strong>", "<b>").replace("</strong>", "</b>")
        html_content = html_content.replace("<em>", "<i>").replace("</em>", "</i>")
        
        # Start each chapter on a new page
        pdf.add_page()
        pdf.set_font("helvetica", "", 10)
        pdf.set_text_color(31, 41, 55) # Dark Slate
        
        # Write HTML to page
        pdf.write_html(html_content)

    # 3. SAVE PDF
    output_path = "gitbook-export/synarc-developer-documentation.pdf"
    pdf.output(output_path)
    print(f"Success! PDF generated at: {output_path}")

if __name__ == "__main__":
    main()
