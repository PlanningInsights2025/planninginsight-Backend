# Research Paper PDF Download Feature

## Overview
The research paper download feature has been implemented to generate professionally formatted academic PDFs that match the IEEE/Academic paper format shown in your reference image.

## Features Implemented

### 1. **Professional PDF Generation**
- Academic paper formatting with proper typography
- Times New Roman font (standard for academic papers)
- Proper margins and spacing
- Single-column layout (can be extended to two-column if needed)

### 2. **Document Structure** (Matching Your Image)

#### Title Section
- **Title**: Large, bold, centered, ALL CAPS (20pt)
- **Author Name(s)**: Centered below title (12pt)
- **Affiliation**: Italicized, centered (11pt)
- **Department/Institution, Location**
- **Email**: Centered contact information

#### Abstract Section
- **Format**: "ABSTRACT—" in bold followed by content
- Justified text alignment
- Proper paragraph spacing

#### Keywords Section
- **Format**: "Keywords—" in italics followed by comma-separated terms
- Maintains academic style

#### Main Content Sections
- **Roman Numeral Headings**: I. INTRODUCTION, II. METHODOLOGY, etc.
- **Drop Cap**: First letter of introduction is larger (28pt)
- **Small Caps**: First 8-12 characters after drop cap in UPPERCASE
- **Justified Text**: Professional paragraph alignment
- Proper section spacing

#### References
- **Numbered format**: [1], [2], [3]...
- Hanging indent for multi-line references
- Smaller font (9pt) for space efficiency

#### Acknowledgments (Optional)
- Unnumbered section
- Standard formatting

## How It Works

### User Flow:
1. User writes research paper in Publishing House → "Write Research Paper" tab
2. User fills in all sections (Title, Authors, Abstract, Keywords, Introduction, etc.)
3. User clicks "Save" to save as draft or completed
4. User navigates to "My Research" tab
5. User clicks **"Download PDF"** button on their paper
6. System generates professionally formatted PDF
7. PDF automatically downloads to user's device

### Technical Implementation:

#### Files Modified:
1. **`frontend/src/utils/pdfGenerator.js`** - NEW FILE
   - Core PDF generation logic
   - Academic formatting engine
   - Section rendering with proper typography

2. **`frontend/src/pages/Publishing/Publishing.jsx`**
   - Imported PDF generator
   - Updated download button to use PDF generation
   - Added loading toast notification

3. **`frontend/package.json`**
   - Added `jspdf` library
   - Added `html2canvas` library (for future enhancements)

## PDF Formatting Details

### Typography:
- **Title**: 20pt, Bold, Times New Roman, Centered
- **Author**: 12pt, Normal, Times New Roman, Centered
- **Affiliation**: 11pt, Italic, Times New Roman, Centered
- **Abstract Label**: 10pt, Bold
- **Abstract Content**: 10pt, Normal, Justified
- **Keywords**: 10pt, Italic
- **Section Headings**: 11pt, Bold, ALL CAPS
- **Body Text**: 10pt, Normal, Justified
- **References**: 9pt, Normal, Hanging indent

### Layout:
- **Page Size**: A4 (210mm × 297mm)
- **Margins**: 25mm all around
- **Line Spacing**: 1.15-1.5 (varies by section)
- **Text Justification**: Full justify for body text
- **Automatic Page Breaks**: When content exceeds page height

### Special Features:
1. **Drop Cap on Introduction**: First letter is 28pt, next 8-12 characters in small caps
2. **Text Justification**: Distributes words evenly across line width
3. **Smart Page Breaks**: Prevents section headings from being orphaned
4. **Clean HTML Stripping**: Removes all HTML tags from rich text editor content
5. **Dynamic Section Numbering**: Only includes sections that have content

## Usage Example

```javascript
import { generateResearchPaperPDF } from '../../utils/pdfGenerator'

// In your component:
const handleDownload = async (paper) => {
  try {
    toast.loading('Generating PDF...', { id: 'pdf-gen' })
    const result = await generateResearchPaperPDF(paper)
    
    if (result.success) {
      toast.success(`✅ PDF downloaded: ${result.fileName}`, { id: 'pdf-gen' })
    } else {
      toast.error(`Failed: ${result.error}`, { id: 'pdf-gen' })
    }
  } catch (error) {
    toast.error('Failed to generate PDF', { id: 'pdf-gen' })
  }
}
```

## Sample Output

The generated PDF will look like:

```
                    DIGITAL EAVESDROPPER: ACOUSTIC SPEECH 
            CHARACTERISTICS AS MARKERS OF EXACERBATIONS
                        IN COPD PATIENTS

                              Julia Merkus
                    Dept. of Language and Speech
                    Radboud University, Nijmegen
                          Nijmegen, Netherlands
                        julia.merkus@ru.nl

─────────────────────────────────────────────────────────────

ABSTRACT—Research suggests that speech deterioration indicates 
an exacerbation in patients with chronic obstructive pulmonary 
disease (COPD). This study performed a comparison of read speech 
of stable COPD patients and healthy controls...

Keywords—COPD, lung exacerbation, pulmonary disease

─────────────────────────────────────────────────────────────

                        I. INTRODUCTION

H   UMAN LANGUAGE is a mix of vowels and consonants combined 
to form words, speech is an intricate articulatory movement...

                        II. METHODOLOGY

The research methodology involved analyzing speech patterns...
```

## Testing

To test the feature:

1. Navigate to Publishing House
2. Click "Write Research Paper"
3. Fill in at least the required fields:
   - Title
   - Authors
   - Affiliation
   - Email
   - Abstract
   - Keywords
   - Introduction
4. Click "Save Research Paper"
5. Go to "My Research" tab
6. Find your paper in the list
7. Click "Download PDF" button
8. Check your Downloads folder for the PDF file

## Browser Compatibility

- ✅ Chrome/Edge (Recommended)
- ✅ Firefox
- ✅ Safari
- ⚠️ Mobile browsers (may have download limitations)

## Future Enhancements (Optional)

1. **Two-Column Layout**: Implement IEEE-style two-column format
2. **Figure/Table Support**: Add images and tables with captions
3. **Citation Management**: Automatic bibliography formatting
4. **Custom Templates**: Allow users to choose different paper styles
5. **Preview Before Download**: Show PDF preview before downloading
6. **Export Options**: Word, LaTeX, or plain text formats
7. **Collaborative Editing**: Multiple authors can work together

## Troubleshooting

### Issue: PDF not downloading
**Solution**: Check browser pop-up blocker settings

### Issue: Formatting looks different
**Solution**: Ensure all required fields are filled in

### Issue: HTML tags appearing in PDF
**Solution**: System automatically strips HTML tags from rich text editor

### Issue: References not numbered correctly
**Solution**: Format references as [1], [2], [3] or 1., 2., 3.

## Dependencies

```json
{
  "jspdf": "^2.5.1",
  "html2canvas": "^1.4.1"
}
```

## File Structure

```
frontend/
├── src/
│   ├── utils/
│   │   └── pdfGenerator.js          ← PDF generation logic
│   ├── pages/
│   │   └── Publishing/
│   │       └── Publishing.jsx       ← Download button implementation
│   └── services/
│       └── api/
│           └── publishing.js        ← API calls for research papers
```

## Notes

- The PDF format closely matches IEEE conference paper standards
- All content from ReactQuill editor is automatically cleaned
- Empty sections are automatically excluded from the PDF
- File names are automatically sanitized (spaces → hyphens)
- Toast notifications provide user feedback during generation

---

**Status**: ✅ Fully Implemented and Ready for Use

**Last Updated**: January 12, 2026
