
document.addEventListener('DOMContentLoaded', function() {
    // Tab switching functionality
    const tabBtns = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');
    
    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const tabId = btn.getAttribute('data-tab');
            
            // Update active tab button
            tabBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            
            // Show corresponding content
            tabContents.forEach(content => content.classList.remove('active'));
            document.getElementById(tabId).classList.add('active');
        });
    });
    
    // Image to PDF functionality
    const imageUploadArea = document.getElementById('image-upload-area');
    const imageInput = document.getElementById('image-input');
    const imagePreview = document.getElementById('image-preview');
    const convertToPdfBtn = document.getElementById('convert-to-pdf');
    let imageFiles = [];
    
    // Handle image file selection
    imageInput.addEventListener('change', function(e) {
        imageFiles = Array.from(e.target.files);
        displayImagePreviews(imageFiles);
    });
    
    // Drag and drop for images
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        imageUploadArea.addEventListener(eventName, preventDefaults, false);
    });
    
    function preventDefaults(e) {
        e.preventDefault();
        e.stopPropagation();
    }
    
    ['dragenter', 'dragover'].forEach(eventName => {
        imageUploadArea.addEventListener(eventName, highlight, false);
    });
    
    ['dragleave', 'drop'].forEach(eventName => {
        imageUploadArea.addEventListener(eventName, unhighlight, false);
    });
    
    function highlight() {
        imageUploadArea.classList.add('highlight');
    }
    
    function unhighlight() {
        imageUploadArea.classList.remove('highlight');
    }
    
    imageUploadArea.addEventListener('drop', function(e) {
        const dt = e.dataTransfer;
        const files = dt.files;
        imageFiles = Array.from(files);
        displayImagePreviews(imageFiles);
    });
    
    function displayImagePreviews(files) {
        imagePreview.innerHTML = '';
        
        if (files.length === 0) {
            return;
        }
        
        files.forEach((file, index) => {
            if (!file.type.match('image.*')) return;
            
            const reader = new FileReader();
            reader.onload = function(e) {
                const previewItem = document.createElement('div');
                previewItem.className = 'image-preview-item';
                
                const img = document.createElement('img');
                img.src = e.target.result;
                img.alt = file.name;
                
                const removeBtn = document.createElement('button');
                removeBtn.className = 'remove-btn';
                removeBtn.innerHTML = '&times;';
                removeBtn.addEventListener('click', () => {
                    imageFiles.splice(index, 1);
                    displayImagePreviews(imageFiles);
                });
                
                previewItem.appendChild(img);
                previewItem.appendChild(removeBtn);
                imagePreview.appendChild(previewItem);
            };
            reader.readAsDataURL(file);
        });
    }
    
    // Convert images to PDF
    convertToPdfBtn.addEventListener('click', async function() {
        if (imageFiles.length === 0) {
            alert('Please upload at least one image');
            return;
        }
        
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF({
            orientation: document.getElementById('page-orientation').value,
            unit: 'mm',
            format: document.getElementById('page-size').value
        });
        
        const margin = parseInt(document.getElementById('page-margin').value);
        const compression = document.getElementById('compression-level').value;
        const borderStyle = document.getElementById('border-style').value;
        const borderColor = document.getElementById('border-color').value;
        const pageSpread = document.getElementById('page-spread').value;
        
        let quality = 1.0;
        if (compression === 'medium') quality = 0.8;
        if (compression === 'high') quality = 0.5;
        
        // Process each image
        for (let i = 0; i < imageFiles.length; i++) {
            const file = imageFiles[i];
            
            if (i > 0) {
                doc.addPage();
            }
            
            const img = await loadImage(file);
            const imgWidth = img.width;
            const imgHeight = img.height;
            
            const pageWidth = doc.internal.pageSize.getWidth() - (margin * 2);
            const pageHeight = doc.internal.pageSize.getHeight() - (margin * 2);
            
            let width, height;
            
            // Calculate dimensions to fit the image within the page
            if (imgWidth > imgHeight) {
                // Landscape image
                width = pageWidth;
                height = (imgHeight / imgWidth) * width;
                
                if (height > pageHeight) {
                    height = pageHeight;
                    width = (imgWidth / imgHeight) * height;
                }
            } else {
                // Portrait image
                height = pageHeight;
                width = (imgWidth / imgHeight) * height;
                
                if (width > pageWidth) {
                    width = pageWidth;
                    height = (imgHeight / imgWidth) * width;
                }
            }
            
            // Center the image
            const x = (doc.internal.pageSize.getWidth() - width) / 2;
            const y = (doc.internal.pageSize.getHeight() - height) / 2;
            
            // Add border if selected
            if (borderStyle !== 'none') {
                const borderWidth = 1;
                const borderX = x - borderWidth;
                const borderY = y - borderWidth;
                const borderWidthTotal = width + (borderWidth * 2);
                const borderHeightTotal = height + (borderWidth * 2);
                
                doc.setDrawColor(borderColor);
                doc.setLineWidth(borderWidth);
                
                if (borderStyle === 'dotted') {
                    doc.setLineDashPattern([1, 1], 0);
                } else if (borderStyle === 'dashed') {
                    doc.setLineDashPattern([3, 3], 0);
                } else {
                    doc.setLineDashPattern([], 0);
                }
                
                doc.rect(borderX, borderY, borderWidthTotal, borderHeightTotal);
            }
            
            // Add the image
            doc.addImage(img, 'JPEG', x, y, width, height, undefined, 'FAST');
        }
        
        // Handle page spread options
        if (pageSpread === 'booklet') {
            // This would require more complex handling with PDF-lib
            // For demo purposes, we'll just add a note
            doc.addPage();
            doc.text('Booklet page spread would be implemented here', 10, 10);
        } else if (pageSpread === 'magazine') {
            doc.addPage();
            doc.text('Magazine page spread would be implemented here', 10, 10);
        }
        
        // Save the PDF
        const pdfName = 'converted_' + Date.now() + '.pdf';
        doc.save(pdfName);
        
        // Show download section (though we're saving directly in this case)
        showDownloadSection(pdfName, doc.output('blob'));
    });
    
    function loadImage(file) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            const reader = new FileReader();
            
            reader.onload = function(e) {
                img.src = e.target.result;
            };
            
            img.onload = function() {
                resolve(img);
            };
            
            img.onerror = function() {
                reject(new Error('Failed to load image'));
            };
            
            reader.readAsDataURL(file);
        });
    }
    
    // PDF to Word functionality
    const pdfUploadArea = document.getElementById('pdf-upload-area');
    const pdfInput = document.getElementById('pdf-input');
    const convertToWordBtn = document.getElementById('convert-to-word');
    
    convertToWordBtn.addEventListener('click', function() {
        if (!pdfInput.files || pdfInput.files.length === 0) {
            alert('Please upload a PDF file');
            return;
        }
        
        const file = pdfInput.files[0];
        const fileName = file.name.replace('.pdf', '') + '_converted.docx';
        
        // In a real implementation, we would use a library like pdf2docx
        // For this demo, we'll simulate the conversion
        setTimeout(() => {
            showDownloadSection(fileName, new Blob(['This would be the Word document content'], { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' }));
        }, 1500);
    });
    
    // Word to PDF functionality
    const wordUploadArea = document.getElementById('word-upload-area');
    const wordInput = document.getElementById('word-input');
    const convertWordToPdfBtn = document.getElementById('convert-word-to-pdf');
    
    convertWordToPdfBtn.addEventListener('click', async function() {
        if (!wordInput.files || wordInput.files.length === 0) {
            alert('Please upload a Word file');
            return;
        }
        
        const file = wordInput.files[0];
        const fileName = file.name.replace(/\.[^/.]+$/, '') + '_converted.pdf';
        
        // Using mammoth.js to extract text from Word doc
        const arrayBuffer = await file.arrayBuffer();
        const result = await mammoth.extractRawText({ arrayBuffer });
        
        // Create PDF with the text
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF({
            orientation: document.getElementById('word-page-orientation').value,
            unit: 'mm',
            format: document.getElementById('word-page-size').value
        });
        
        // Set quality based on selection
        const quality = document.getElementById('pdf-quality').value;
        let dpi = 150;
        if (quality === 'screen') dpi = 72;
        if (quality === 'printer') dpi = 300;
        if (quality === 'prepress') dpi = 600;
        
        // Add text to PDF (in a real app, we'd preserve more formatting)
        const text = result.value;
        const lines = doc.splitTextToSize(text, 180); // 180mm width
        
        doc.setFont('helvetica');
        doc.setFontSize(12);
        doc.text(lines, 15, 20);
        
        // Save the PDF
        doc.save(fileName);
        
        // Show download section
        showDownloadSection(fileName, doc.output('blob'));
    });
    
    // Download section functionality
    const downloadSection = document.getElementById('download-section');
    const outputFilename = document.getElementById('output-filename');
    const downloadBtn = document.getElementById('download-btn');
    const newConversionBtn = document.getElementById('new-conversion-btn');
    
    function showDownloadSection(filename, blob) {
        outputFilename.textContent = filename;
        downloadSection.classList.remove('hidden');
        
        // Scroll to download section
        downloadSection.scrollIntoView({ behavior: 'smooth' });
        
        // Set up download button
        downloadBtn.onclick = function() {
            saveAs(blob, filename);
        };
    }
    
    newConversionBtn.addEventListener('click', function() {
        downloadSection.classList.add('hidden');
        
        // Reset all forms
        imageFiles = [];
        imagePreview.innerHTML = '';
        imageInput.value = '';
        pdfInput.value = '';
        wordInput.value = '';
        
        // Scroll to top
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });
});
