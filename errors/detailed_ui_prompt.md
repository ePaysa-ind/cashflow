# Complete HTML Development Prompt: Document Analyzer Interface

## 🎯 **Project Overview**
Build a sophisticated document upload and AI analysis interface for business document processing. The application should handle multiple file formats, provide real-time feedback, and display comprehensive analysis results with both summary and detailed views.

---

## 📐 **Layout Architecture**

### **Main Container Structure**
```
Document: Full viewport
Body: #f5f5f5 background, 20px padding, min-height 100vh
Main Container: 1400px max-width, centered, white background
Border: 2px solid black (#000000)
Border-radius: 8px
Total Height: 80vh
```

### **Two-Column Flexbox Layout**
```
Display: flex (row direction)
Height: 80vh

Left Column: 40% width
- Top Section: 40% height (Upload area)
- Bottom Section: 60% height (Chat area)
- Separator: 1px solid #dddddd

Right Column: 60% width
- Single section: Analysis display
- No separators
```

---

## 🎨 **Typography & Color System**

### **Font Stack**
```
Primary: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif
Fallback: System sans-serif
```

### **Complete Color Palette**
```
Text Colors:
- Primary: #333333 (headings, labels)
- Secondary: #666666 (descriptions, content)
- Muted: #888888 (limits, small text)
- Light: #999999 (placeholders, disabled)
- Error: #dc3545 (alerts, important actions)

Backgrounds:
- Main: #ffffff (content areas)
- Body: #f5f5f5 (page background)
- Section: #fafafa (upload section)
- Card: #f8f9fa (summary cards, alternating rows)
- Dark: #2c3e50 (nudge cards)

Interactive Colors:
- Primary Red: #dc3545 (buttons, active states)
- Primary Red Hover: #c82333 (button hover)
- Success Green: #28a745 (table border, success states)
- Blue Accent: #007bff (upload zone hover)
- Blue Light: #f0f8ff (upload zone hover background)

Borders:
- Strong: #000000 (main container)
- Standard: #dddddd (section separators)
- Light: #cccccc (upload zone, table)
- Table: #dee2e6 (table cells)
```

---

## 📱 **Left Column Design (40% width)**

### **Top Section - Upload Area (40% height)**
```
Background: #fafafa
Padding: 20px all sides
Border-bottom: 1px solid #dddddd
Display: flex column

Elements Flow:
1. Main Title
2. Subtitle & Limit Text
3. Format Icons Row
4. Document List (conditional)
5. Upload Drop Zone
6. Analyze Button
```

#### **Title Section**
```
Main Title: "Drop or Upload your documents here"
- Font-size: 18px
- Font-weight: 600
- Color: #333333
- Margin-bottom: 8px

Subtitle: "Following formats supported."
- Font-size: 14px
- Color: #666666
- Margin-bottom: 4px

Limit Text: "3 docs or 10 MB max allowed"
- Font-size: 12px
- Color: #888888
- Margin-bottom: 15px
```

#### **Format Icons Grid**
```
Display: flex
Gap: 10px between icons
Margin-bottom: 15px
Align-items: center

Each Icon Box:
- Dimensions: 24px × 24px
- Border-radius: 4px
- Font-size: 10px
- Font-weight: bold
- Display: flex center
- Line-height: 24px

Icon Color Coding:
- PDF: Background #ff6b6b, White text
- DOC: Background #4dabf7, White text
- XLS: Background #51cf66, White text
- JPG: Background #ffd43b, Dark text #333333
- WEBP: Background #9775fa, White text
```

#### **Document List (Conditional Display)**
```
Container ID: document-list-container
Initial State: display: none
Show When: uploadedFiles.length > 0

Header: "Document Name and size MB"
- Font-size: 14px
- Font-weight: 600
- Color: #333333
- Margin-bottom: 8px

File Items:
- Dynamic generation based on uploaded files
- Format: "1. filename.pdf (2.34 MB)"
- Remove button: Red circle × button
- Background: #e3f2fd (light blue)
- Border: 1px solid #2196f3
- Border-radius: 4px
- Padding: 8px
- Font-size: 12px
```

#### **Upload Drop Zone**
```
Border: 2px dashed #cccccc
Border-radius: 6px
Padding: 20px
Text-align: center
Background: #f9f9f9
Margin-bottom: 15px
Cursor: pointer
Transition: all 0.3s ease

States:
Default: #cccccc border, #f9f9f9 background
Hover: #007bff border, #f0f8ff background
Dragover: #007bff border, #e3f2fd background

Text: "Drop files here or click to upload"
- Font-size: 14px
- Color: #666666

Hidden Input:
- Type: file
- Multiple: true
- Accept: .pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png,.webp
```

#### **Analyze Button**
```
Width: 50%
Margin: 0 auto (centered)
Padding: 10px
Font-size: 14px
Font-weight: 600
Border: none
Border-radius: 5px
Cursor: pointer
Transition: background 0.3s ease
Position: relative
Z-index: 2

States:
Active: Background #dc3545, White text
Hover: Background #c82333
Disabled: Background #6c757d, not-allowed cursor
Loading: Text "Analyzing...", disabled state

Text: "Analyze Documents" / "Re-analyze Documents"
```

### **Bottom Section - Chat Area (60% height)**
```
Background: white
Padding: 20px all sides
Display: flex column
```

#### **Chat Title**
```
Text: "Ask me anything related to these documents"
Font-size: 14px (reduced from 18px)
Font-weight: 600
Color: #333333
Margin-bottom: 15px
```

#### **Nudge Cards Row**
```
Display: flex
Gap: 10px
Margin-bottom: 15px

Each Card:
- Flex: 1 (equal width)
- Background: #2c3e50
- Color: white
- Padding: 12px
- Border-radius: 6px
- Font-size: 12px
- Text-align: center
- Cursor: pointer
- Transition: background 0.3s ease
- Position: relative
- Z-index: 1

Hover: Background #34495e

Card 1: "What are the key points?"
Card 2: "Summarize these documents"

Functionality: onClick inserts text into textarea
```

#### **Chat Textarea**
```
Flex: 1 (expands to fill space)
Border: 2px solid #dc3545
Border-radius: 6px
Padding: 15px
Font-size: 14px
Font-family: inherit
Resize: none
Margin-bottom: 15px
Outline: none

Focus State:
- Border-color: #c82333
- Box-shadow: 0 0 0 3px rgba(220, 53, 69, 0.1)

Placeholder: "Type your question here..."
Color: #999999
```

#### **Send Question Button**
```
Width: 50% (matching Analyze button)
Margin: 0 auto (centered)
Padding: 10px
Background: #dc3545
Color: white
Border: none
Border-radius: 5px
Font-size: 14px
Font-weight: 600
Cursor: pointer
Transition: background 0.3s ease

Hover: Background #c82333
Loading: Text "Processing...", disabled state

Text: "Send Question"
```

---

## 📊 **Right Column Design (60% width)**

### **Container**
```
Padding: 20px all sides
Display: flex column
Background: white
Full height of 80vh
```

### **Analysis Summary Section (Conditional)**
```
ID: analysis-summary
Initial State: display: none
Show When: Analysis is complete

Container:
- Background: #f8f9fa
- Border: 1px solid #dee2e6
- Border-radius: 8px
- Padding: 20px
- Margin-bottom: 20px

Title: "Summary"
- Font-size: 16px
- Font-weight: 600
- Color: #333333
- Margin-bottom: 15px

Summary Items:
Total Documents: Dynamic count
Document Types: Comma-separated file extensions
Key Insights: Context-aware analysis description
Confidence Level: Percentage + "High/Medium/Low"

Item Styling:
- Font-size: 14px
- Color: #555555
- Margin-bottom: 8px
- Strong labels: #333333, font-weight 600
```

### **Detailed Analysis Table Section**
```
Title: "Document Details"
- Font-size: 16px
- Font-weight: 600
- Color: #333333
- Margin-bottom: 15px

Table Container:
- Width: 100%
- Border-collapse: collapse
- Background: white
- Border: 2px solid #28a745
- Border-radius: 8px
- Overflow: hidden

Table Headers:
- Background: #28a745
- Color: white
- Padding: 12px
- Text-align: left
- Font-weight: 600
- Font-size: 14px

Headers: "Document Name" | "Key Focus Areas" | "Highlights"

Table Cells:
- Padding: 12px
- Border-bottom: 1px solid #dee2e6
- Font-size: 13px
- Color: #333333
- Vertical-align: top

Alternating Rows:
- Even rows: Background #f8f9fa
- Odd rows: Background white

Last Row: No border-bottom

Empty State:
- Colspan: 3
- Text-align: center
- Color: #999999
- Font-style: italic
- Padding: 20px
- Text: "Upload documents to see detailed analysis"
```

---

## 🦶 **Footer Design**

### **Container**
```
Full width below main 80vh layout
Background: #f8f9fa
Padding: 15px 20px
Border-top: 1px solid #dddddd
Text-align: center

Title: "Reference"
- Font-size: 14px
- Font-weight: 600
- Color: #333333
- Margin-bottom: 8px

Content: "Document Analyzer powered by Claude AI | Supports PDF, Word, Excel, JPEG, WEBP formats | Maximum 3 files or 10MB total"
- Font-size: 12px
- Color: #666666
```

---

## ⚡ **JavaScript Functionality**

### **Core Variables**
```javascript
let uploadedFiles = []; // Array to store File objects
const maxFiles = 3; // Maximum file limit
const maxSize = 10 * 1024 * 1024; // 10MB in bytes
```

### **File Upload Logic**
```javascript
// Drag and drop event handlers
- dragover: preventDefault, add visual feedback
- dragleave: remove visual feedback
- drop: preventDefault, process dropped files

// File validation
- Check file count <= 3
- Check duplicate: name AND size matching
- Check total size <= 10MB
- Validate file types: .pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png,.webp

// Error handling
- Alert messages for violations
- Graceful degradation
- Clear user feedback
```

### **Duplicate Prevention**
```javascript
// Robust duplicate checking
if (uploadedFiles.some(f => f.name === file.name && f.size === file.size)) {
    alert(`File "${file.name}" is already uploaded`);
    return;
}
```

### **UI State Management**
```javascript
// Dynamic visibility
- Document list: show/hide based on upload count
- Summary section: show after analysis
- Button states: enabled/disabled based on files

// Real-time updates
- File list with remove buttons
- Analysis table population
- Progress indicators
```

### **Analysis Simulation**
```javascript
// File-type specific analysis
PDF: "Invoice data, payment terms, client information"
Excel: "Numerical data, financial calculations, budgets"
Word: "Text analysis, contract terms, key clauses"
Images: "OCR processing, text extraction, visual elements"

// Dynamic confidence scores
- Random generation: 75-95% range
- File-type specific baselines
- Realistic variation
```

### **Chat Integration**
```javascript
// Nudge card functionality
- Insert predefined questions into textarea
- Focus textarea after insertion

// Chat validation
- Require uploaded files before chat
- Progress indication during processing
- Simulated AI responses
```

---

## 📱 **Responsive Design**

### **Mobile Breakpoint (@media max-width: 768px)**
```css
.layout-container {
    flex-direction: column;
    height: auto;
}

.left-column, .right-column {
    width: 100%;
}

.upload-section {
    height: auto;
}

.chat-section {
    height: 300px;
}

.format-icons {
    flex-wrap: wrap;
}

.nudge-cards {
    flex-direction: column;
}
```

---

## 🎨 **Visual Effects & Transitions**

### **Animations**
```css
// All interactive elements
transition: all 0.3s ease

// Specific transitions
- Hover effects: 300ms
- Color changes: 200ms
- Transform effects: 250ms
```

### **Visual Feedback**
```css
// Focus states
box-shadow: 0 0 0 3px rgba(primary-color, 0.1)

// Hover elevations
transform: translateY(-1px)
box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1)

// Loading states
- Spinner animations
- Text changes
- Disabled states
```

---

## 🔧 **Implementation Requirements**

### **HTML Structure**
```html
- Semantic HTML5 elements
- Proper form structure
- Accessible markup
- ARIA labels where needed
- Screen reader compatibility
```

### **CSS Organization**
```css
- Mobile-first approach
- Flexbox for layout
- Component-based styling
- CSS custom properties for colors
- BEM naming methodology
```

### **JavaScript Features**
```javascript
- ES6+ syntax
- Event delegation
- Error handling
- File API usage
- FormData handling
- Progress tracking
- Dynamic content generation
```

### **Browser Compatibility**
```
- Modern browsers (Chrome, Firefox, Safari, Edge)
- File API support required
- Drag & drop API support
- ES6 features used
```

---

## 🚀 **Advanced Features**

### **File Processing**
```javascript
// File size calculation and display
const sizeMB = (file.size / (1024 * 1024)).toFixed(2);

// File type detection
const fileType = file.name.split('.').pop().toUpperCase();

// Dynamic content based on file types
const focusAreas = {
    'PDF': 'Invoice data, payment terms, client information',
    'XLSX': 'Spreadsheet analysis, data trends, calculations',
    // ... etc
};
```

### **Analysis Engine Simulation**
```javascript
// Realistic confidence scoring
const confidence = (85 + Math.random() * 10).toFixed(0);

// File-type specific insights
const insights = uploadedFiles.length > 1 ? 
    'Multiple documents detected. Cross-referencing data.' :
    'Single document analysis completed.';

// Dynamic summary generation
- Total document count
- File type diversity
- Processing confidence
- Key insights extraction
```

### **User Experience Enhancements**
```javascript
// Progressive disclosure
- Hide/show sections based on state
- Dynamic button text updates
- Contextual help messages

// Error prevention
- File validation before processing
- Clear limitation messaging
- Graceful error handling

// Performance optimization
- Efficient DOM updates
- Event listener management
- Memory cleanup
```

---

## 📋 **Testing Checklist**

### **Functionality Testing**
- [ ] File upload via click works
- [ ] Drag and drop functionality works
- [ ] File type validation works
- [ ] Size limit enforcement works
- [ ] Duplicate prevention works
- [ ] File removal works
- [ ] Analysis simulation works
- [ ] Chat interface works
- [ ] Button state management works
- [ ] Responsive design works

### **User Experience Testing**
- [ ] Visual feedback for all interactions
- [ ] Clear error messages
- [ ] Intuitive navigation flow
- [ ] Accessible keyboard navigation
- [ ] Screen reader compatibility
- [ ] Mobile device compatibility

### **Edge Case Testing**
- [ ] Empty file uploads
- [ ] Oversized files
- [ ] Unsupported file types
- [ ] Network interruptions
- [ ] Browser compatibility
- [ ] Multiple rapid interactions

---

## 💡 **Development Notes**

### **Performance Considerations**
- File processing in memory only
- Efficient DOM manipulation
- Event delegation for dynamic content
- Minimal external dependencies

### **Security Considerations**
- Client-side file validation only
- No server communication in demo
- File content not actually processed
- Safe file type restrictions

### **Extensibility**
- Modular JavaScript structure
- CSS component organization
- Easy to add new file types
- Configurable limits and settings

This comprehensive prompt provides everything needed to build the exact document analyzer interface with all functionality, styling, and user experience requirements specified in detail. 🎯