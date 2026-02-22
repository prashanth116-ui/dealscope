"""Generate PDF version of the DealScope product spec."""
import os
import re
from fpdf import FPDF


class SpecPDF(FPDF):
    def header(self):
        if self.page_no() > 1:
            self.set_font('Helvetica', 'I', 8)
            self.set_text_color(128)
            self.cell(0, 5, 'DealScope - Product Specification & Architecture Document', align='C')
            self.ln(6)

    def footer(self):
        self.set_y(-15)
        self.set_font('Helvetica', 'I', 8)
        self.set_text_color(128)
        self.cell(0, 10, f'Page {self.page_no()}/{{nb}}', align='C')


def safe_text(text):
    """Replace unicode chars that latin-1 can't encode."""
    replacements = {
        '\u2013': '-', '\u2014': '--', '\u2018': "'", '\u2019': "'",
        '\u201c': '"', '\u201d': '"', '\u2022': '-', '\u2026': '...',
        '\u2192': '->', '\u2264': '<=', '\u2265': '>=', '\u00d7': 'x',
    }
    for old, new in replacements.items():
        text = text.replace(old, new)
    # Remove any remaining non-latin1 chars
    text = text.encode('latin-1', errors='replace').decode('latin-1')
    return text


def build_pdf():
    pdf = SpecPDF()
    pdf.alias_nb_pages()
    pdf.set_auto_page_break(auto=True, margin=20)
    pdf.add_page()

    # Cover page
    pdf.set_font('Helvetica', 'B', 28)
    pdf.set_text_color(0, 51, 102)
    pdf.ln(40)
    pdf.cell(0, 15, 'DealScope', align='C', new_x='LMARGIN', new_y='NEXT')
    pdf.set_font('Helvetica', '', 16)
    pdf.set_text_color(80)
    pdf.cell(0, 10, 'Product Specification & Architecture Document', align='C', new_x='LMARGIN', new_y='NEXT')
    pdf.ln(10)
    pdf.set_draw_color(0, 51, 102)
    pdf.line(60, pdf.get_y(), 150, pdf.get_y())
    pdf.ln(10)
    pdf.set_font('Helvetica', '', 12)
    pdf.cell(0, 8, 'Version 1.0', align='C', new_x='LMARGIN', new_y='NEXT')
    pdf.cell(0, 8, 'February 2026', align='C', new_x='LMARGIN', new_y='NEXT')
    pdf.cell(0, 8, 'Status: Pre-Development', align='C', new_x='LMARGIN', new_y='NEXT')
    pdf.ln(30)
    pdf.set_font('Helvetica', 'I', 10)
    pdf.set_text_color(100)
    pdf.cell(0, 8, 'Commercial-Grade Property Analysis Platform', align='C', new_x='LMARGIN', new_y='NEXT')
    pdf.cell(0, 8, 'iOS + Android + Web', align='C', new_x='LMARGIN', new_y='NEXT')

    # Read the markdown
    spec_path = os.path.join(os.path.dirname(__file__), 'PRODUCT_SPEC.md')
    with open(spec_path, 'r', encoding='utf-8') as f:
        content = f.read()

    lines = content.split('\n')
    pdf.add_page()

    in_code_block = False

    for line in lines:
        stripped = line.strip()

        # Skip empty lines
        if not stripped:
            if not in_code_block:
                pdf.ln(2)
            continue

        # Skip title and metadata (already on cover)
        if stripped.startswith('# DealScope'):
            continue
        if stripped.startswith('**Version') or stripped.startswith('**Date') or stripped.startswith('**Status'):
            continue

        # Horizontal rules
        if stripped == '---':
            pdf.set_draw_color(180)
            pdf.line(10, pdf.get_y(), 200, pdf.get_y())
            pdf.ln(3)
            continue

        # Code block toggle
        if stripped.startswith('```'):
            in_code_block = not in_code_block
            pdf.ln(1)
            continue

        # Code block content
        if in_code_block:
            pdf.set_font('Courier', '', 6.5)
            pdf.set_text_color(60)
            text = safe_text(line.rstrip())
            if len(text) > 110:
                text = text[:110] + '...'
            pdf.cell(0, 3.5, text, new_x='LMARGIN', new_y='NEXT')
            continue

        # Section headers (##)
        if stripped.startswith('## '):
            if pdf.get_y() > 220:
                pdf.add_page()
            pdf.ln(4)
            pdf.set_font('Helvetica', 'B', 14)
            pdf.set_text_color(0, 51, 102)
            text = stripped.replace('## ', '').split('](#')[0].rstrip(')')
            text = safe_text(text)
            pdf.cell(0, 9, text, new_x='LMARGIN', new_y='NEXT')
            pdf.set_draw_color(0, 51, 102)
            pdf.line(10, pdf.get_y(), 200, pdf.get_y())
            pdf.ln(3)
            continue

        # Subsection headers (###)
        if stripped.startswith('### '):
            if pdf.get_y() > 240:
                pdf.add_page()
            pdf.ln(3)
            pdf.set_font('Helvetica', 'B', 11)
            pdf.set_text_color(51, 51, 51)
            text = stripped.replace('### ', '').split('](#')[0].rstrip(')')
            text = safe_text(text)
            pdf.cell(0, 7, text, new_x='LMARGIN', new_y='NEXT')
            pdf.ln(2)
            continue

        # Sub-subsection headers (####)
        if stripped.startswith('#### '):
            pdf.ln(2)
            pdf.set_font('Helvetica', 'B', 10)
            pdf.set_text_color(51, 51, 51)
            text = safe_text(stripped.replace('#### ', ''))
            pdf.cell(0, 6, text, new_x='LMARGIN', new_y='NEXT')
            pdf.ln(1)
            continue

        # Table rows
        if stripped.startswith('|'):
            pdf.set_font('Courier', '', 6.5)
            pdf.set_text_color(0)
            text = stripped.replace('**', '')
            text = safe_text(text)
            if len(text) > 130:
                text = text[:130] + '...'
            pdf.cell(0, 3.8, text, new_x='LMARGIN', new_y='NEXT')
            continue

        # Checkbox items
        if stripped.startswith('- [ ]') or stripped.startswith('- [x]'):
            pdf.set_font('Helvetica', '', 8)
            pdf.set_text_color(0)
            text = stripped.replace('- [ ] ', '  [ ] ').replace('- [x] ', '  [x] ')
            text = text.replace('**', '')
            text = safe_text(text)
            pdf.set_x(10)
            pdf.multi_cell(190, 4.5, text)
            continue

        # Bullet points
        if stripped.startswith('- '):
            pdf.set_font('Helvetica', '', 8)
            pdf.set_text_color(0)
            text = stripped[2:].replace('**', '')
            text = safe_text(text)
            if len(text) > 160:
                text = text[:160] + '...'
            pdf.set_x(10)
            pdf.multi_cell(190, 4.5, '  - ' + text)
            continue

        # Numbered items
        if re.match(r'^\d+\.', stripped):
            pdf.set_font('Helvetica', '', 8)
            pdf.set_text_color(0)
            text = stripped.replace('**', '')
            text = safe_text(text)
            pdf.set_x(10)
            pdf.multi_cell(190, 4.5, text)
            continue

        # Indented lines (code-like)
        if line.startswith('  ') and not stripped.startswith('|'):
            pdf.set_font('Courier', '', 6.5)
            pdf.set_text_color(80)
            text = safe_text(line.rstrip())
            if len(text) > 110:
                text = text[:110] + '...'
            pdf.cell(0, 3.5, text, new_x='LMARGIN', new_y='NEXT')
            continue

        # Regular text
        pdf.set_font('Helvetica', '', 9)
        pdf.set_text_color(0)
        text = stripped.replace('**', '').replace('*', '')
        # Remove markdown links
        text = re.sub(r'\[([^\]]+)\]\([^)]+\)', r'\1', text)
        text = safe_text(text)
        pdf.set_x(10)
        pdf.multi_cell(190, 5, text)

    # Save
    output = os.path.join(os.path.expanduser('~'), 'OneDrive', 'Desktop', 'DealScope_Product_Spec.pdf')
    pdf.output(output)
    return output


if __name__ == '__main__':
    path = build_pdf()
    print(f'PDF saved to: {path}')
