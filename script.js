document.addEventListener('DOMContentLoaded', function() {
    // File variables for different converters
    let imageFiles = [];
    let scannedImageFiles = [];
    let excelFile = null;
    let pptFile = null;
    let pdfToEditFile = null;
    let wordFileForPdf = null;
    let pdfFileForWord = null;
    let videoFileForAudio = null;
    
    // --- UTILITY FUNCTIONS ---
    function preventDefaults(e) {
        e.preventDefault();
        e.stopPropagation();
    }

    function highlight(areaElement) {
        if (areaElement) areaElement.classList.add('highlight');
    }

    function unhighlight(areaElement) {
        if (areaElement) areaElement.classList.remove('highlight');
    }

    function setUploadAreaText(areaElement, text) {
        const pElement = areaElement.querySelector('p:not(.text-muted)');
        if (pElement) {
            pElement.textContent = text;
        }
    }
    
    function showFileInfo(elementId, fileName) {
        const fileInfoEl = document.getElementById(elementId);
        if (fileInfoEl) {
            fileInfoEl.querySelector('span').textContent = fileName;
            fileInfoEl.classList.remove('hidden');
        }
    }
    
    function hideFileInfo(elementId) {
        const fileInfoEl = document.getElementById(elementId);
        if (fileInfoEl) {
            fileInfoEl.classList.add('hidden');
        }
    }

    function setupDragAndDrop(areaElement, fileInput, callbackOnFileDropOrChange, fileInfoId = null) {
        if (!areaElement || !fileInput) return;

        ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
            areaElement.addEventListener(eventName, preventDefaults, false);
            document.body.addEventListener(eventName, preventDefaults, false);
        });

        ['dragenter', 'dragover'].forEach(eventName => {
            areaElement.addEventListener(eventName, () => highlight(areaElement), false);
        });

        ['dragleave', 'drop'].forEach(eventName => {
            areaElement.addEventListener(eventName, () => unhighlight(areaElement), false);
        });

        areaElement.addEventListener('drop', function(e) {
            const dt = e.dataTransfer;
            const files = dt.files;
            fileInput.files = files;
            if (callbackOnFileDropOrChange) {
                callbackOnFileDropOrChange(Array.from(files));
            }
            
            // For single file uploads, show file info
            if (files.length > 0 && fileInfoId) {
                showFileInfo(fileInfoId, files[0].name);
            }
        }, false);

        // Also trigger callback on manual file selection
        fileInput.addEventListener('change', function(e) {
            if (callbackOnFileDropOrChange) {
                callbackOnFileDropOrChange(Array.from(e.target.files));
            }
            
            // For single file uploads, show file info
            if (e.target.files.length > 0 && fileInfoId) {
                showFileInfo(fileInfoId, e.target.files[0].name);
            }
        });
    }

    // --- TAB SWITCHING ---
    const tabBtns = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');

    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const tabId = btn.getAttribute('data-tab');
            tabBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            tabContents.forEach(content => content.classList.remove('active'));
            const activeTabContent = document.getElementById(tabId);
            if (activeTabContent) {
                activeTabContent.classList.add('active');
            }
            resetAllInputsAndPreviews();
            hideDownloadSection();
        });
    });

    // --- DOWNLOAD SECTION ---
    const downloadSection = document.getElementById('download-section');
    const outputFilenameEl = document.getElementById('output-filename');
    const downloadBtn = document.getElementById('download-btn');
    const newConversionBtn = document.getElementById('new-conversion-btn');
    let currentBlobToDownload = null;
    let currentFilenameToDownload = '';

    function showDownloadSection(filename, blob) {
        currentBlobToDownload = blob;
        currentFilenameToDownload = filename;
        if (outputFilenameEl) outputFilenameEl.textContent = filename;
        if (downloadSection) {
            downloadSection.classList.remove('hidden');
            downloadSection.scrollIntoView({ behavior: 'smooth' });
        }
    }

    function hideDownloadSection() {
        if (downloadSection) downloadSection.classList.add('hidden');
        currentBlobToDownload = null;
        currentFilenameToDownload = '';
    }

    if (downloadBtn) {
        downloadBtn.addEventListener('click', function() {
            if (currentBlobToDownload && currentFilenameToDownload) {
                try {
                    saveAs(currentBlobToDownload, currentFilenameToDownload);
                } catch (e) {
                    console.error("Error during saveAs:", e);
                    alert("There was an error downloading the file. Your browser might be blocking pop-ups or the download.");
                }
            } else {
                alert("No file to download.");
            }
        });
    }
    
    // Set current year in footer
    const currentYearEl = document.getElementById('current-year');
    if (currentYearEl) {
        currentYearEl.textContent = new Date().getFullYear();
    }

    function resetAllInputsAndPreviews() {
        // Reset file input elements
        const inputs = document.querySelectorAll('input[type="file"]');
        inputs.forEach(input => input.value = '');
        
        // Reset preview containers
        const previews = document.querySelectorAll('.preview-container');
        previews.forEach(preview => preview.innerHTML = '');
        
        // Reset file arrays/variables
        imageFiles = [];
        scannedImageFiles = [];
        excelFile = null;
        pptFile = null;
        pdfToEditFile = null;
        wordFileForPdf = null;
        pdfFileForWord = null;
        videoFileForAudio = null;
        
        // Hide all file info elements
        hideFileInfo('pdf-file-info');
        hideFileInfo('word-file-info');
        hideFileInfo('video-file-info');
        hideFileInfo('excel-file-info');
        hideFileInfo('ppt-file-info');
        hideFileInfo('edit-pdf-file-info');
        
        // Reset upload area prompt texts
        const uploadAreaPrompts = {
            'image-upload-area': 'Drag & drop images here or click to browse',
            'pdf-upload-area': 'Drag & drop PDF file here or click to browse',
            'word-upload-area': 'Drag & drop Word file here or click to browse',
            'video-upload-area': 'Drag & drop video file here or click to browse',
            'excel-upload-area': 'Drag & drop Excel file here or click to browse',
            'ppt-upload-area': 'Drag & drop PowerPoint file here or click to browse',
            'edit-pdf-upload-area': 'Drag & drop PDF file to edit',
            'scan-upload-area': 'Drag & drop scanned image(s) here or click to browse'
        };

        for (const areaId in uploadAreaPrompts) {
            const area = document.getElementById(areaId);
            if (area) {
                setUploadAreaText(area, uploadAreaPrompts[areaId]);
            }
        }
    }

    if (newConversionBtn) {
        newConversionBtn.addEventListener('click', function() {
            hideDownloadSection();
            resetAllInputsAndPreviews();
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
    }

    // --- IMAGE TO PDF ---
    const imageUploadArea = document.getElementById('image-upload-area');
    const imageInput = document.getElementById('image-input');
    const imagePreview = document.getElementById('image-preview');
    const convertToPdfBtn = document.getElementById('convert-to-pdf');

    setupDragAndDrop(imageUploadArea, imageInput, (files) => {
        imageFiles = files;
        displayImagePreviews(imageFiles, imagePreview, 'imageFiles');
    });

    function displayImagePreviews(files, previewElement, filesArrayName) {
        if (!previewElement) return;
        previewElement.innerHTML = '';
        if (!files || files.length === 0) return;

        files.forEach((file, index) => {
            if (!file.type.match('image.*')) return;
            const reader = new FileReader();
            reader.onload = function(e) {
                const previewItem = document.createElement('div');
                previewItem.className = 'image-preview-item';
                const img = document.createElement('img');
                img.src = e.target.result;
                img.alt = file.name;
                const fileNameDiv = document.createElement('div');
                fileNameDiv.className = 'file-name';
                fileNameDiv.textContent = file.name.length > 20 ? file.name.substring(0, 17) + '...' : file.name;
                const removeBtn = document.createElement('button');
                removeBtn.className = 'remove-btn';
                removeBtn.innerHTML = '&times;';
                removeBtn.onclick = () => {
                    if (window[filesArrayName]) {
                        window[filesArrayName].splice(index, 1);
                        displayImagePreviews(window[filesArrayName], previewElement, filesArrayName);
                    }
                };
                previewItem.appendChild(img);
                previewItem.appendChild(fileNameDiv);
                previewItem.appendChild(removeBtn);
                previewElement.appendChild(previewItem);
            };
            reader.readAsDataURL(file);
        });
    }

    async function convertMultipleImagesToPdfLogic(filesToConvert, pageSizeId, pageOrientationId, pageMarginId, btnElement, options = {}) {
        if (!filesToConvert || filesToConvert.length === 0) {
            alert('Please upload at least one image.');
            return;
        }

        btnElement.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processing...';
        btnElement.disabled = true;

        try {
            const { jsPDF } = window.jspdf;
            const orientation = document.getElementById(pageOrientationId)?.value || 'portrait';
            const pageSize = document.getElementById(pageSizeId)?.value || 'a4';
            const margin = parseInt(document.getElementById(pageMarginId)?.value) || 10;

            const doc = new jsPDF({ orientation, unit: 'mm', format: pageSize });

            const {
                compressionLevelId = null,
                borderStyleId = null,
                borderColorId = null
            } = options;

            for (let i = 0; i < filesToConvert.length; i++) {
                const file = filesToConvert[i];
                if (i > 0) doc.addPage(pageSize, orientation);

                const img = await new Promise((resolve, reject) => {
                    const reader = new FileReader();
                    reader.onload = e => {
                        const image = new Image();
                        image.onload = () => resolve(image);
                        image.onerror = (err) => reject(new Error(`Failed to load image: ${file.name}. Error: ${err}`));
                        image.src = e.target.result;
                    };
                    reader.onerror = (err) => reject(new Error(`FileReader error for ${file.name}. Error: ${err}`));
                    reader.readAsDataURL(file);
                });

                const imgWidth = img.width;
                const imgHeight = img.height;
                const pageWidth = doc.internal.pageSize.getWidth() - (margin * 2);
                const pageHeight = doc.internal.pageSize.getHeight() - (margin * 2);

                let ratio = Math.min(pageWidth / imgWidth, pageHeight / imgHeight);
                let newWidth = imgWidth * ratio;
                let newHeight = imgHeight * ratio;
                let x = margin + (pageWidth - newWidth) / 2;
                let y = margin + (pageHeight - newHeight) / 2;

                if (borderStyleId && document.getElementById(borderStyleId) && 
                    borderColorId && document.getElementById(borderColorId)) {
                    const borderStyle = document.getElementById(borderStyleId).value;
                    const borderColor = document.getElementById(borderColorId).value;
                    if (borderStyle !== 'none') {
                        const borderWidthPx = 0.5; 
                        doc.setDrawColor(borderColor);
                        doc.setLineWidth(borderWidthPx);
                        if (borderStyle === 'dotted') doc.setLineDashPattern([1, 1], 0);
                        else if (borderStyle === 'dashed') doc.setLineDashPattern([3, 1.5], 0);
                        else doc.setLineDashPattern([], 0);
                        doc.rect(x - borderWidthPx, y - borderWidthPx, newWidth + (borderWidthPx * 2), newHeight + (borderWidthPx * 2));
                    }
                }

                let compressionType = 'NONE'; 
                if (compressionLevelId && document.getElementById(compressionLevelId)) {
                    const compression = document.getElementById(compressionLevelId).value;
                    if (compression === 'low') compressionType = 'SLOW'; 
                    else if (compression === 'medium') compressionType = 'MEDIUM';
                    else if (compression === 'high') compressionType = 'FAST';
                }
                doc.addImage(img, 'JPEG', x, y, newWidth, newHeight, undefined, compressionType);
            }

            const pdfName = (filesToConvert[0].name.replace(/\.[^/.]+$/, '') || 'converted_images') + '_' + Date.now() + '.pdf';
            const pdfBlob = doc.output('blob');
            showDownloadSection(pdfName, pdfBlob);

        } catch (error) {
            console.error('Image to PDF Conversion error:', error);
            alert(`An error occurred during image conversion: ${error.message}. Please check the console for details.`);
        } finally {
            btnElement.innerHTML = `<i class="fas fa-file-pdf"></i> Convert to PDF`;
            btnElement.disabled = false;
        }
    }

    if (convertToPdfBtn) {
        convertToPdfBtn.addEventListener('click', () => convertMultipleImagesToPdfLogic(
            imageFiles, 
            'page-size', 
            'page-orientation', 
            'page-margin', 
            convertToPdfBtn,
            { 
                compressionLevelId: 'compression-level', 
                borderStyleId: 'border-style',
                borderColorId: 'border-color'
            }
        ));
    }

    // --- SCAN TO PDF (Reuses Image to PDF logic) ---
    const scanUploadArea = document.getElementById('scan-upload-area');
    const scanImageInput = document.getElementById('scan-image-input');
    const scanImagePreview = document.getElementById('scan-image-preview');
    const convertScanToPdfBtn = document.getElementById('convert-scan-to-pdf');

    setupDragAndDrop(scanUploadArea, scanImageInput, (files) => {
        scannedImageFiles = files; 
        displayImagePreviews(scannedImageFiles, scanImagePreview, 'scannedImageFiles');
    });

    if (convertScanToPdfBtn) {
        convertScanToPdfBtn.addEventListener('click', () => {
            if (!scannedImageFiles || scannedImageFiles.length === 0) {
                alert("Please upload scanned image(s) first.");
                return;
            }
            convertMultipleImagesToPdfLogic(
                scannedImageFiles, 
                'scan-page-size', 
                'scan-page-orientation', 
                'scan-page-margin', 
                convertScanToPdfBtn
            );
        });
    }

    // --- PDF TO WORD (Simulated) ---
    const pdfUploadArea = document.getElementById('pdf-upload-area');
    const pdfInput = document.getElementById('pdf-input');
    const convertToWordBtn = document.getElementById('convert-to-word');

    setupDragAndDrop(pdfUploadArea, pdfInput, (files) => {
        if (files.length > 0) {
            pdfFileForWord = files[0];
            showFileInfo('pdf-file-info', pdfFileForWord.name);
        } else {
            pdfFileForWord = null;
            hideFileInfo('pdf-file-info');
        }
    }, 'pdf-file-info');

    if (convertToWordBtn) {
        convertToWordBtn.addEventListener('click', function() {
            if (!pdfFileForWord) {
                alert('Please upload a PDF file.');
                return;
            }
            this.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processing...';
            this.disabled = true;
            const outputFormat = document.getElementById('word-format')?.value || 'docx';
            const fileName = pdfFileForWord.name.replace(/\.[^/.]+$/, '') + `_converted.${outputFormat}`;

            setTimeout(() => {
                const wordBlob = new Blob([`Simulated ${outputFormat.toUpperCase()} content for ${pdfFileForWord.name}. Full client-side PDF to Word conversion is extremely complex and often requires server-side tools or advanced libraries.`], { type: 'application/octet-stream' });
                showDownloadSection(fileName, wordBlob);
                this.innerHTML = '<i class="fas fa-file-word"></i> Convert to Word';
                this.disabled = false;
            }, 2000);
        });
    }

    // --- WORD TO PDF (Using Mammoth for text extraction) ---
    const wordUploadArea = document.getElementById('word-upload-area');
    const wordInput = document.getElementById('word-input');
    const convertWordToPdfBtn = document.getElementById('convert-word-to-pdf');

    setupDragAndDrop(wordUploadArea, wordInput, (files) => {
        if (files.length > 0) {
            wordFileForPdf = files[0];
            showFileInfo('word-file-info', wordFileForPdf.name);
        } else {
            wordFileForPdf = null;
            hideFileInfo('word-file-info');
        }
    }, 'word-file-info');

    if (convertWordToPdfBtn) {
        convertWordToPdfBtn.addEventListener('click', async function() {
            if (!wordFileForPdf) {
                alert('Please upload a Word file.');
                return;
            }
            this.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processing...';
            this.disabled = true;

            try {
                const arrayBuffer = await wordFileForPdf.arrayBuffer();
                const { value: text } = await mammoth.extractRawText({ arrayBuffer });

                const { jsPDF } = window.jspdf;
                const orientation = document.getElementById('word-page-orientation')?.value || 'portrait';
                const pageSize = document.getElementById('word-page-size')?.value || 'a4';
                const doc = new jsPDF({ orientation, unit: 'mm', format: pageSize });

                const margin = 15; 
                const FONT_SIZE = 11; 
                const LINE_HEIGHT_FACTOR = 1.5;
                const MM_PER_POINT = 0.352778; 
                const lineHeightMm = FONT_SIZE * MM_PER_POINT * LINE_HEIGHT_FACTOR;
                const usableWidth = doc.internal.pageSize.getWidth() - (2 * margin);

                doc.setFont('helvetica', 'normal');
                doc.setFontSize(FONT_SIZE);
                const lines = doc.splitTextToSize(text, usableWidth);

                let y = margin;
                lines.forEach(line => {
                    if (y + lineHeightMm > doc.internal.pageSize.getHeight() - margin) {
                        doc.addPage(pageSize, orientation);
                        y = margin;
                    }
                    doc.text(line, margin, y);
                    y += lineHeightMm;
                });

                const pdfName = wordFileForPdf.name.replace(/\.[^/.]+$/, '') + '_converted.pdf';
                const pdfBlob = doc.output('blob');
                showDownloadSection(pdfName, pdfBlob);
            } catch (error) {
                console.error('Word to PDF Conversion error:', error);
                alert('An error occurred during Word to PDF conversion. The file might be corrupted or an unsupported format.');
            } finally {
                this.innerHTML = '<i class="fas fa-file-pdf"></i> Convert to PDF';
                this.disabled = false;
            }
        });
    }

    // --- VIDEO TO AUDIO (Simulated) ---
    const videoUploadArea = document.getElementById('video-upload-area');
    const videoInput = document.getElementById('video-input');
    const convertVideoToAudioBtn = document.getElementById('convert-video-to-audio');

    setupDragAndDrop(videoUploadArea, videoInput, (files) => {
        if (files.length > 0) {
            videoFileForAudio = files[0];
            showFileInfo('video-file-info', videoFileForAudio.name);
        } else {
            videoFileForAudio = null;
            hideFileInfo('video-file-info');
        }
    }, 'video-file-info');
    
    const volumeSlider = document.getElementById('volume');
    const volumeValue = document.getElementById('volume-value');
    if (volumeSlider && volumeValue) {
        volumeSlider.addEventListener('input', function() {
            volumeValue.textContent = this.value + '%';
        });
    }

    if (convertVideoToAudioBtn) {
        convertVideoToAudioBtn.addEventListener('click', function() {
            if (!videoFileForAudio) {
                alert('Please upload a video file.');
                return;
            }
            this.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Extracting Audio...';
            this.disabled = true;
            const audioFormat = document.getElementById('audio-format')?.value || 'mp3';
            const fileName = videoFileForAudio.name.replace(/\.[^/.]+$/, `.${audioFormat}`);

            setTimeout(() => {
                const audioBlob = new Blob([`Simulated ${audioFormat.toUpperCase()} audio from ${videoFileForAudio.name}. Full client-side extraction requires libraries like ffmpeg.wasm.`], { type: `audio/${audioFormat}` });
                showDownloadSection(fileName, audioBlob);
                this.innerHTML = '<i class="fas fa-file-audio"></i> Extract Audio';
                this.disabled = false;
            }, 3000);
        });
    }

    // --- EXCEL TO PDF (Basic Text Dump) ---
    const excelUploadArea = document.getElementById('excel-upload-area');
    const excelInput = document.getElementById('excel-input');
    const convertExcelToPdfBtn = document.getElementById('convert-excel-to-pdf');

    setupDragAndDrop(excelUploadArea, excelInput, (files) => {
        if (files.length > 0) {
            excelFile = files[0];
            showFileInfo('excel-file-info', excelFile.name);
        } else {
            excelFile = null;
            hideFileInfo('excel-file-info');
        }
    }, 'excel-file-info');

    if (convertExcelToPdfBtn) {
        convertExcelToPdfBtn.addEventListener('click', async function() {
            if (!excelFile) {
                alert('Please upload an Excel file.');
                return;
            }
            this.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processing Excel...';
            this.disabled = true;

            const outputFileName = excelFile.name.replace(/\.[^/.]+$/, '') + '_converted.pdf';

            try {
                const arrayBuffer = await excelFile.arrayBuffer();
                const data = new Uint8Array(arrayBuffer);
                const workbook = XLSX.read(data, { type: 'array', cellDates: true });

                const { jsPDF } = window.jspdf;
                const orientation = document.getElementById('excel-orientation')?.value || 'landscape';
                const pageSize = document.getElementById('excel-page-size')?.value || 'a4';
                const includeGridlines = document.getElementById('include-gridlines')?.checked;

                const doc = new jsPDF({ orientation, unit: 'mm', format: pageSize });
                const FONT_SIZE = 8; 
                const CELL_PADDING = 1; 
                const MM_PER_POINT = 0.352778;
                const baseLineHeight = (FONT_SIZE * MM_PER_POINT) * 1.2; 
                const margin = 10; 

                let firstSheetProcessed = true;
                workbook.SheetNames.forEach(sheetName => {
                    if (!firstSheetProcessed) {
                        doc.addPage(pageSize, orientation);
                    }
                    firstSheetProcessed = false;

                    doc.setFontSize(FONT_SIZE + 2);
                    doc.text(sheetName, margin, margin);
                    doc.setFontSize(FONT_SIZE);

                    const ws = workbook.Sheets[sheetName];
                    const jsonData = XLSX.utils.sheet_to_json(ws, { header: 1, defval: "", raw: false });

                    if (jsonData.length === 0) return; 

                    let y = margin + baseLineHeight * 2; 
                    const tableStartX = margin;
                    let tableMaxWidth = doc.internal.pageSize.getWidth() - 2 * margin;
                    
                    let numCols = 0;
                    jsonData.forEach(r => numCols = Math.max(numCols, r.length));
                    const colWidths = Array(numCols).fill(tableMaxWidth / numCols);
                    
                    jsonData.forEach((row) => {
                        let currentX = tableStartX;
                        let maxRowHeight = baseLineHeight;

                        row.forEach((cellData, colIndex) => {
                            if (colIndex < numCols) {
                                const cellText = String(cellData);
                                const textLines = doc.splitTextToSize(cellText, colWidths[colIndex] - (2 * CELL_PADDING));
                                maxRowHeight = Math.max(maxRowHeight, textLines.length * baseLineHeight);
                            }
                        });
                        
                        if (y + maxRowHeight > doc.internal.pageSize.getHeight() - margin) {
                            doc.addPage(pageSize, orientation);
                            y = margin;
                        }

                        row.forEach((cellData, colIndex) => {
                            if (colIndex < numCols) {
                                const cellText = String(cellData);
                                const textLines = doc.splitTextToSize(cellText, colWidths[colIndex] - (2 * CELL_PADDING));

                                if (includeGridlines) {
                                    doc.rect(currentX, y, colWidths[colIndex], maxRowHeight);
                                }
                                let textY = y + baseLineHeight - ( MM_PER_POINT * FONT_SIZE * 0.2 );
                                textLines.forEach(line => {
                                    doc.text(line, currentX + CELL_PADDING, textY);
                                    textY += baseLineHeight;
                                });
                                currentX += colWidths[colIndex];
                            }
                        });
                        y += maxRowHeight;
                    });
                });

                const pdfBlob = doc.output('blob');
                showDownloadSection(outputFileName, pdfBlob);

            } catch (error) {
                console.error('Excel to PDF Conversion error:', error);
                alert('An error occurred during Excel to PDF conversion. The file might be corrupted or use unsupported features. Check console for details.');
            } finally {
                this.innerHTML = '<i class="fas fa-file-pdf"></i> Convert to PDF';
                this.disabled = false;
            }
        });
    }

    // --- PPT TO PDF (Placeholder - Highly Complex) ---
    const pptUploadArea = document.getElementById('ppt-upload-area');
    const pptInput = document.getElementById('ppt-input');
    const convertPptToPdfBtn = document.getElementById('convert-ppt-to-pdf');

    setupDragAndDrop(pptUploadArea, pptInput, (files) => {
        if (files.length > 0) {
            pptFile = files[0];
            showFileInfo('ppt-file-info', pptFile.name);
        } else {
            pptFile = null;
            hideFileInfo('ppt-file-info');
        }
    }, 'ppt-file-info');

    if (convertPptToPdfBtn) {
        convertPptToPdfBtn.addEventListener('click', function() {
            if (!pptFile) {
                alert('Please upload a PowerPoint file.');
                return;
            }
            this.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processing PPT...';
            this.disabled = true;
            const fileName = pptFile.name.replace(/\.[^/.]+$/, '') + '_converted.pdf';

            setTimeout(() => {
                const pdfBlob = new Blob([`Simulated PDF from ${pptFile.name}. Client-side PPT/PPTX to PDF conversion with formatting is extremely challenging. Consider server-side tools or specialized libraries. Basic text extraction might be possible but layout will be lost.`], { type: 'application/pdf' });
                showDownloadSection(fileName, pdfBlob);
                this.innerHTML = '<i class="fas fa-file-pdf"></i> Convert PPT to PDF';
                this.disabled = false;
            }, 2000);
        });
    }

    // --- EDIT PDF (Placeholder - Complex) ---
    const editPdfUploadArea = document.getElementById('edit-pdf-upload-area');
    const editPdfInput = document.getElementById('edit-pdf-input');
    const applyPdfEditsBtn = document.getElementById('apply-pdf-edits');

    setupDragAndDrop(editPdfUploadArea, editPdfInput, (files) => {
        if (files.length > 0) {
            pdfToEditFile = files[0];
            showFileInfo('edit-pdf-file-info', pdfToEditFile.name);
        } else {
            pdfToEditFile = null;
            hideFileInfo('edit-pdf-file-info');
        }
    }, 'edit-pdf-file-info');

    if (applyPdfEditsBtn) {
        applyPdfEditsBtn.addEventListener('click', async function() {
            if (!pdfToEditFile) {
                alert('Please upload a PDF file to edit.');
                return;
            }
            this.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Applying Edits...';
            this.disabled = true;
            const fileName = 'edited_' + pdfToEditFile.name;
            
            try {
                setTimeout(() => {
                    const pdfBlob = new Blob([`Simulated edited PDF for ${pdfToEditFile.name}. Actual PDF editing requires a library like PDF-lib.js and UI for editing tools.`], { type: 'application/pdf' });
                    showDownloadSection(fileName, pdfBlob);
                }, 2000);
            } catch (err) {
                console.error("PDF Editing Error:", err);
                alert("Could not process PDF for editing. Check if PDF-lib.js is correctly loaded and the PDF is not corrupted.");
            } finally {
                this.innerHTML = '<i class="fas fa-save"></i> Apply Edits & Save PDF';
                this.disabled = false;
            }
        });
    }
});
