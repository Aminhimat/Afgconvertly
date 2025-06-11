/**
 * @file Main script for Convertly application, handling UI interactions,
 * file processing, and conversions.
 * @author Your Name/Convertly Team
 * @version 1.1.0
 */

/**
 * Initializes the application after the DOM is fully loaded.
 * Sets up event listeners for tabs, file inputs, and conversion buttons.
 * @listens DOMContentLoaded
 */
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

    /**
     * Prevents default event behavior and stops event propagation.
     * @param {Event} e - The event object.
     */
    function preventDefaults(e) {
        e.preventDefault();
        e.stopPropagation();
    }

    /**
     * Adds a 'highlight' class to a given HTML element.
     * Typically used for drag-and-drop visual feedback.
     * @param {HTMLElement} areaElement - The HTML element to highlight.
     */
    function highlight(areaElement) {
        if (areaElement) areaElement.classList.add('highlight');
    }

    /**
     * Removes the 'highlight' class from a given HTML element.
     * Typically used for drag-and-drop visual feedback.
     * @param {HTMLElement} areaElement - The HTML element to unhighlight.
     */
    function unhighlight(areaElement) {
        if (areaElement) areaElement.classList.remove('highlight');
    }

    /**
     * Sets the text content of the main paragraph within an upload area.
     * Excludes the muted helper text paragraph.
     * @param {HTMLElement} areaElement - The upload area HTML element.
     * @param {string} text - The text to set.
     */
    function setUploadAreaText(areaElement, text) {
        const pElement = areaElement.querySelector('p:not(.text-muted)');
        if (pElement) {
            pElement.textContent = text;
        }
    }
    
    /**
     * Shows a file information display element and sets its text content.
     * @param {string} elementId - The ID of the file information HTML element.
     * @param {string} fileName - The name of the file to display.
     */
    function showFileInfo(elementId, fileName) {
        const fileInfoEl = document.getElementById(elementId);
        if (fileInfoEl) {
            fileInfoEl.querySelector('span').textContent = fileName;
            fileInfoEl.classList.remove('hidden');
        }
    }
    
    /**
     * Hides a file information display element.
     * @param {string} elementId - The ID of the file information HTML element.
     */
    function hideFileInfo(elementId) {
        const fileInfoEl = document.getElementById(elementId);
        if (fileInfoEl) {
            fileInfoEl.classList.add('hidden');
        }
    }

    /**
     * Sets up drag and drop functionality for a given area.
     * Also handles file selection via click on the associated file input.
     * Updates the prompt text within the areaElement to show selected file info.
     * @param {HTMLElement} areaElement - The HTML element that serves as the drop zone.
     * @param {HTMLInputElement} fileInput - The file input element associated with the drop zone.
     * @param {function(File[]): void} callbackOnFileDropOrChange - Callback function to execute when files are dropped or selected.
     * @param {string|null} [fileInfoId=null] - Optional ID of an element to display separate single file information (e.g., for non-image previews).
     */
    function setupDragAndDrop(areaElement, fileInput, callbackOnFileDropOrChange, fileInfoId = null) {
        if (!areaElement || !fileInput) return;

        const promptElement = areaElement.querySelector('p:not(.text-muted)');
        const originalPromptText = promptElement ? promptElement.textContent : '';

        ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
            areaElement.addEventListener(eventName, preventDefaults, false);
            document.body.addEventListener(eventName, preventDefaults, false); // Prevent browser default for unhandled drops
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
            const fileArray = Array.from(files);

            if (callbackOnFileDropOrChange) {
                callbackOnFileDropOrChange(fileArray);
            }
            
            if (promptElement) {
                if (fileArray.length === 1) {
                    promptElement.textContent = `File selected: ${fileArray[0].name}`;
                } else if (fileArray.length > 1) {
                    promptElement.textContent = `${fileArray.length} files selected`;
                } else if (originalPromptText) {
                    promptElement.textContent = originalPromptText;
                }
            }

            if (fileArray.length > 0 && fileInfoId) {
                showFileInfo(fileInfoId, fileArray[0].name);
            } else if (fileArray.length === 0 && fileInfoId) {
                hideFileInfo(fileInfoId);
            }
        }, false);

        fileInput.addEventListener('change', function(e) {
            const filesArray = Array.from(e.target.files);
            if (callbackOnFileDropOrChange) {
                callbackOnFileDropOrChange(filesArray);
            }

            if (promptElement) {
                if (filesArray.length === 1) {
                    promptElement.textContent = `File selected: ${filesArray[0].name}`;
                } else if (filesArray.length > 1) {
                    promptElement.textContent = `${filesArray.length} files selected`;
                } else if (originalPromptText) {
                    promptElement.textContent = originalPromptText;
                }
            }
            
            if (filesArray.length > 0 && fileInfoId) {
                showFileInfo(fileInfoId, filesArray[0].name);
            } else if (filesArray.length === 0 && fileInfoId) {
                hideFileInfo(fileInfoId);
            }
        });
    }

    // --- TAB SWITCHING ---
    const tabBtns = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');

    /**
     * Retrieves PDF document options (page size, orientation, margin) from DOM elements.
     * @param {string} sizeId - The ID of the page size select element.
     * @param {string} orientationId - The ID of the page orientation select element.
     * @param {string} marginId - The ID of the page margin input element.
     * @param {object} [defaults={}] - Optional default values for orientation, size, and margin.
     * @param {string} [defaults.orientation='portrait'] - Default page orientation if not found or invalid.
     * @param {string} [defaults.size='a4'] - Default page size if not found or invalid.
     * @param {number} [defaults.margin=10] - Default page margin in mm if not found or invalid.
     * @returns {{orientation: string, size: string, margin: number}} An object containing the PDF options.
     */
    function getPdfOptions(sizeId, orientationId, marginId, defaults = {}) {
        const defaultOrientation = defaults.orientation || 'portrait';
        const defaultSize = defaults.size || 'a4';
        const defaultMargin = defaults.margin !== undefined ? defaults.margin : 10;

        const orientationValue = document.getElementById(orientationId)?.value;
        const sizeValue = document.getElementById(sizeId)?.value;
        const marginElement = document.getElementById(marginId);
        const marginValue = marginElement ? parseInt(marginElement.value) : null;

        return {
            orientation: orientationValue || defaultOrientation,
            size: sizeValue || defaultSize,
            margin: marginValue !== null && !isNaN(marginValue) ? marginValue : defaultMargin
        };
    }

    /**
     * Handles tab switching functionality.
     * When a tab button is clicked, it activates the corresponding tab content
     * and deactivates others. Also resets inputs and hides the download section.
     * @listens click on .tab-btn elements
     */
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
            resetAllInputsAndPreviews(); // Reset UI elements on tab change
            hideDownloadSection(); // Hide download section on tab change
        });
    });

    // --- DOWNLOAD SECTION ---
    const downloadSection = document.getElementById('download-section');
    const outputFilenameEl = document.getElementById('output-filename');
    const downloadBtn = document.getElementById('download-btn');
    const newConversionBtn = document.getElementById('new-conversion-btn');
    let currentBlobToDownload = null;
    let currentFilenameToDownload = '';

    /**
     * Shows the download section with the provided filename and blob.
     * @param {string} filename - The name for the file to be downloaded.
     * @param {Blob} blob - The Blob object representing the file content.
     */
    function showDownloadSection(filename, blob) {
        currentBlobToDownload = blob;
        currentFilenameToDownload = filename;
        if (outputFilenameEl) outputFilenameEl.textContent = filename;
        if (downloadSection) {
            downloadSection.classList.remove('hidden');
            downloadSection.scrollIntoView({ behavior: 'smooth' });
        }
    }

    /**
     * Hides the download section and clears current download data.
     */
    function hideDownloadSection() {
        if (downloadSection) downloadSection.classList.add('hidden');
        currentBlobToDownload = null;
        currentFilenameToDownload = '';
    }

    if (downloadBtn) {
        /**
         * Handles the click event for the main download button.
         * Uses FileSaver.js's saveAs to trigger the file download.
         * @listens click on #download-btn
         */
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
    
    const currentYearEl = document.getElementById('current-year');
    if (currentYearEl) {
        currentYearEl.textContent = new Date().getFullYear();
    }

    /**
     * Resets all file input elements, preview containers, global file variables,
     * file info displays, and upload area prompt texts to their initial states.
     */
    function resetAllInputsAndPreviews() {
        const inputs = document.querySelectorAll('input[type="file"]');
        inputs.forEach(input => input.value = '');
        
        const previews = document.querySelectorAll('.preview-container');
        previews.forEach(preview => preview.innerHTML = '');
        
        imageFiles = [];
        scannedImageFiles = [];
        excelFile = null;
        pptFile = null;
        pdfToEditFile = null;
        wordFileForPdf = null;
        pdfFileForWord = null;
        videoFileForAudio = null;
        
        hideFileInfo('pdf-file-info');
        hideFileInfo('word-file-info');
        hideFileInfo('video-file-info');
        hideFileInfo('excel-file-info');
        hideFileInfo('ppt-file-info');
        hideFileInfo('edit-pdf-file-info');
        
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
        /**
         * Handles the click event for the "Start New Conversion" button.
         * Hides the download section, resets all inputs and previews, and scrolls to the top.
         * @listens click on #new-conversion-btn
         */
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
        imageFiles = files; // Store globally for this converter
        displayImagePreviews(imageFiles, imagePreview, 'imageFiles');
    });

    /**
     * Displays image previews in a specified container.
     * Allows removal of individual images from the preview and the source array.
     * @param {File[]} files - An array of image files to display.
     * @param {HTMLElement} previewElement - The HTML element to display previews in.
     * @param {string} filesArrayName - The string name of the global array holding the files (e.g., 'imageFiles'). Used for removal.
     */
    function displayImagePreviews(files, previewElement, filesArrayName) {
        if (!previewElement) return;
        previewElement.innerHTML = ''; // Clear existing previews
        if (!files || files.length === 0) return;

        files.forEach((file, index) => {
            if (!file.type.match('image.*')) return; // Ensure it's an image
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
                removeBtn.title = `Remove ${file.name}`;
                /**
                 * Handles removal of an image from the preview and the corresponding global file array.
                 * @listens click
                 */
                removeBtn.onclick = () => {
                    // Access the global array by its name
                    if (window[filesArrayName]) {
                        window[filesArrayName].splice(index, 1); // Remove file from the array
                        // Re-display previews for the modified array
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

    /**
     * Converts multiple images to a single PDF document using jsPDF.
     * @async
     * @param {File[]} filesToConvert - An array of image files to convert.
     * @param {string} pageSizeId - The ID of the select element for page size.
     * @param {string} pageOrientationId - The ID of the select element for page orientation.
     * @param {string} pageMarginId - The ID of the input element for page margin.
     * @param {HTMLButtonElement} btnElement - The button element that triggered the conversion, used for UI feedback.
     * @param {object} [options={}] - Advanced options for PDF generation.
     * @param {string|null} [options.compressionLevelId=null] - ID of the compression level select element.
     * @param {string|null} [options.borderStyleId=null] - ID of the border style select element.
     * @param {string|null} [options.borderColorId=null] - ID of the border color input element.
     * @returns {Promise<void>} A promise that resolves when the conversion process is complete (success or failure).
     */
    async function convertMultipleImagesToPdfLogic(filesToConvert, pageSizeId, pageOrientationId, pageMarginId, btnElement, options = {}) {
        if (!filesToConvert || filesToConvert.length === 0) {
            alert('Please upload at least one image.');
            return;
        }

        btnElement.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processing...';
        btnElement.disabled = true;

        try {
            const { jsPDF } = window.jspdf;
            const pdfDocOptions = getPdfOptions(pageSizeId, pageOrientationId, pageMarginId);
            const doc = new jsPDF({ orientation: pdfDocOptions.orientation, unit: 'mm', format: pdfDocOptions.size });

            const { compressionLevelId = null, borderStyleId = null, borderColorId = null } = options;

            for (let i = 0; i < filesToConvert.length; i++) {
                const file = filesToConvert[i];
                if (i > 0) doc.addPage(pdfDocOptions.size, pdfDocOptions.orientation);

                const img = await new Promise((resolve, reject) => {
                    const reader = new FileReader();
                    reader.onload = e => {
                        const image = new Image();
                        image.onload = () => resolve(image);
                        image.onerror = (err) => reject(new Error(`Failed to load image: ${file.name}. Error: ${err.toString()}`));
                        image.src = e.target.result;
                    };
                    reader.onerror = (err) => reject(new Error(`FileReader error for ${file.name}. Error: ${err.toString()}`));
                    reader.readAsDataURL(file);
                });

                const imgWidth = img.width;
                const imgHeight = img.height;
                const pageWidth = doc.internal.pageSize.getWidth() - (pdfDocOptions.margin * 2);
                const pageHeight = doc.internal.pageSize.getHeight() - (pdfDocOptions.margin * 2);

                let ratio = Math.min(pageWidth / imgWidth, pageHeight / imgHeight);
                let newWidth = imgWidth * ratio;
                let newHeight = imgHeight * ratio;
                let x = pdfDocOptions.margin + (pageWidth - newWidth) / 2;
                let y = pdfDocOptions.margin + (pageHeight - newHeight) / 2;

                if (borderStyleId && document.getElementById(borderStyleId) && borderColorId && document.getElementById(borderColorId)) {
                    const borderStyle = document.getElementById(borderStyleId).value;
                    const borderColor = document.getElementById(borderColorId).value;
                    if (borderStyle !== 'none') {
                        const borderWidthPx = 0.5; 
                        doc.setDrawColor(borderColor);
                        doc.setLineWidth(borderWidthPx);
                        if (borderStyle === 'dotted') doc.setLineDashPattern([1, 1], 0);
                        else if (borderStyle === 'dashed') doc.setLineDashPattern([3, 1.5], 0);
                        else doc.setLineDashPattern([], 0); // Solid
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
        /**
         * Handles click event for the "Image to PDF" conversion button.
         * @listens click on #convert-to-pdf
         */
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
         /**
         * Handles click event for the "Scan to PDF" conversion button.
         * Uses the generic image to PDF logic.
         * @listens click on #convert-scan-to-pdf
         */
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
                // No advanced options passed for scan to PDF currently
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
        /**
         * Handles click event for the "PDF to Word" conversion button.
         * This is a simulated conversion.
         * @listens click on #convert-to-word
         */
        convertToWordBtn.addEventListener('click', function() {
            if (!pdfFileForWord) {
                alert('Please upload a PDF file.');
                return;
            }
            this.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processing...';
            this.disabled = true;
            const outputFormat = document.getElementById('word-format')?.value || 'docx';
            const fileName = pdfFileForWord.name.replace(/\.[^/.]+$/, '') + `_converted.${outputFormat}`;

            // Simulate processing delay
            setTimeout(() => {
                const wordBlob = new Blob([`Simulated ${outputFormat.toUpperCase()} content for ${pdfFileForWord.name}. Full client-side PDF to Word conversion is extremely complex and often requires server-side tools or advanced libraries.`], { type: 'application/octet-stream' });
                showDownloadSection(fileName, wordBlob);
                this.innerHTML = '<i class="fas fa-file-word"></i> Convert to Word';
                this.disabled = false;
            }, 2000);
        });
    }

    // --- WORD TO PDF ---
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
        /**
         * Handles click event for the "Word to PDF" conversion button.
         * Converts the Word document (.docx, .doc, .odt) to HTML using Mammoth.js,
         * then renders this HTML to a PDF using jsPDF's html() method.
         * @async
         * @listens click on #convert-word-to-pdf
         * @throws {Error} If file processing or PDF generation fails.
         */
        convertWordToPdfBtn.addEventListener('click', async function() {
            if (!wordFileForPdf) {
                alert('Please upload a Word file.');
                return;
            }
            this.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processing...';
            this.disabled = true;

            try {
                const arrayBuffer = await wordFileForPdf.arrayBuffer();
                const result = await mammoth.convertToHtml({ arrayBuffer });
                const htmlContent = result.value;

                const pdfOptions = getPdfOptions(
                    'word-page-size','word-page-orientation','word-page-margin', { margin: 15 }
                );

                const wrappedHtml = `
                    <style>
                        body { font-family: 'Poppins', sans-serif; } /* Match base font if possible */
                        p, li, h1, h2, h3, h4, h5, h6 { margin-bottom: 0.5em; line-height: 1.4; }
                        ul, ol { padding-left: 20px; margin-left: 0; }
                        table { border-collapse: collapse; width: 100%; margin-bottom: 1em; }
                        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
                        th { background-color: #f2f2f2; }
                        img { max-width: 100%; height: auto; }
                    </style>
                    <div style="margin: ${pdfOptions.margin}mm;">
                        ${htmlContent}
                    </div>`;

                const { jsPDF } = window.jspdf;
                const doc = new jsPDF({
                    orientation: pdfOptions.orientation, unit: 'mm', format: pdfOptions.size
                });

                if (typeof doc.html !== 'function') {
                    alert('jsPDF html method is not available. Please ensure you are using a full version of jsPDF.');
                    throw new Error('jsPDF html method not found.');
                }

                await doc.html(wrappedHtml, {
                    callback: function (docInstance) {
                        const pdfName = wordFileForPdf.name.replace(/\.[^/.]+$/, '') + '_converted.pdf';
                        const pdfBlob = docInstance.output('blob');
                        showDownloadSection(pdfName, pdfBlob);
                    },
                    x: 0, y: 0,
                    autoPaging: 'text',
                    html2canvas: { scale: 0.26, useCORS: true, logging: false }, // scale of 0.26 for A4 width ~210mm
                    width: doc.internal.pageSize.getWidth(),
                    windowWidth: doc.internal.pageSize.getWidth()
                });

            } catch (error) {
                console.error('Word to PDF Conversion error:', error);
                alert('An error occurred during Word to PDF conversion: ' + error.message);
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
        if (files.length > 0) { videoFileForAudio = files[0]; showFileInfo('video-file-info', videoFileForAudio.name); }
        else { videoFileForAudio = null; hideFileInfo('video-file-info'); }
    }, 'video-file-info');
    
    const volumeSlider = document.getElementById('volume');
    const volumeValue = document.getElementById('volume-value');
    if (volumeSlider && volumeValue) {
        volumeSlider.addEventListener('input', function() { volumeValue.textContent = this.value + '%'; });
    }

    if (convertVideoToAudioBtn) {
        /**
         * Handles click event for the "Video to Audio" extraction button.
         * This is a simulated conversion.
         * @listens click on #convert-video-to-audio
         */
        convertVideoToAudioBtn.addEventListener('click', function() {
            if (!videoFileForAudio) { alert('Please upload a video file.'); return; }
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

    // --- EXCEL TO PDF ---
    const excelUploadArea = document.getElementById('excel-upload-area');
    const excelInput = document.getElementById('excel-input');
    const convertExcelToPdfBtn = document.getElementById('convert-excel-to-pdf');

    setupDragAndDrop(excelUploadArea, excelInput, (files) => {
        if (files.length > 0) { excelFile = files[0]; showFileInfo('excel-file-info', excelFile.name); }
        else { excelFile = null; hideFileInfo('excel-file-info'); }
    }, 'excel-file-info');

    if (convertExcelToPdfBtn) {
        /**
         * Handles click event for the "Excel to PDF" conversion button.
         * Parses the Excel file and generates a PDF document with tables for each sheet using jsPDF and jsPDF-AutoTable.
         * @async
         * @listens click on #convert-excel-to-pdf
         * @throws {Error} If file processing or PDF generation fails.
         */
        convertExcelToPdfBtn.addEventListener('click', async function() {
            if (!excelFile) { alert('Please upload an Excel file.'); return; }
            this.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processing Excel...';
            this.disabled = true;
            const outputFileName = excelFile.name.replace(/\.[^/.]+$/, '') + '_converted.pdf';

            try {
                const arrayBuffer = await excelFile.arrayBuffer();
                const data = new Uint8Array(arrayBuffer);
                const workbook = XLSX.read(data, { type: 'array', cellDates: true });

                const { jsPDF } = window.jspdf;
                const pdfDocOptions = getPdfOptions(
                    'excel-page-size', 'excel-page-orientation', 'excel-page-margin',
                    { orientation: 'landscape', margin: 10 }
                );

                const doc = new jsPDF({ orientation: pdfDocOptions.orientation, unit: 'mm', format: pdfDocOptions.size });

                if (typeof doc.autoTable !== 'function') {
                     alert('Error: PDF Table generation library (jsPDF-AutoTable) is missing.');
                    throw new Error('jsPDF-AutoTable not loaded.');
                }

                workbook.SheetNames.forEach((sheetName, index) => {
                    if (index > 0) doc.addPage(pdfDocOptions.size, pdfDocOptions.orientation);

                    doc.setFontSize(12);
                    doc.text(sheetName, pdfDocOptions.margin, pdfDocOptions.margin);

                    const ws = workbook.Sheets[sheetName];
                    const sheetData = XLSX.utils.sheet_to_json(ws, { header: 1, defval: "", rawNumbers: false });

                    if (sheetData.length === 0) {
                        doc.setFontSize(10);
                        doc.text("Sheet is empty.", pdfDocOptions.margin, pdfDocOptions.margin + 10);
                        return;
                    }

                    const head = [sheetData[0]];
                    const body = sheetData.slice(1);
                    const includeGridlines = document.getElementById('include-gridlines')?.checked;

                    doc.autoTable({
                        head: head, body: body,
                        startY: pdfDocOptions.margin + 7,
                        margin: {
                            top: pdfDocOptions.margin + 7, left: pdfDocOptions.margin,
                            right: pdfDocOptions.margin, bottom: pdfDocOptions.margin
                        },
                        theme: includeGridlines ? 'grid' : 'striped',
                        styles: { fontSize: 8, cellPadding: 1, overflow: 'linebreak' },
                        headStyles: { fillColor: [22, 160, 133], fontSize: 9, fontStyle: 'bold' },
                        alternateRowStyles: { fillColor: [240, 240, 240] },
                        tableWidth: 'auto', showHead: 'everyPage', cellWidth: 'wrap',
                        didDrawPage: function (data) {
                            if (data.pageNumber > 1 || (index > 0 && data.pageNumber === 1 && doc.internal.getNumberOfPages() > index + 1) ) {
                                doc.setFontSize(12);
                                doc.text(sheetName + (data.pageNumber > 1 ? " (cont.)" : ""), pdfDocOptions.margin, pdfDocOptions.margin);
                            }
                        }
                    });
                });

                const pdfBlob = doc.output('blob');
                showDownloadSection(outputFileName, pdfBlob);

            } catch (error) {
                console.error('Excel to PDF Conversion error:', error);
                alert('An error occurred during Excel to PDF conversion: ' + error.message);
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
        if (files.length > 0) { pptFile = files[0]; showFileInfo('ppt-file-info', pptFile.name); }
        else { pptFile = null; hideFileInfo('ppt-file-info'); }
    }, 'ppt-file-info');

    if (convertPptToPdfBtn) {
        /**
         * Handles click event for the "PPT to PDF" conversion button.
         * This is a placeholder for a complex feature.
         * @listens click on #convert-ppt-to-pdf
         */
        convertPptToPdfBtn.addEventListener('click', function() {
            if (!pptFile) { alert('Please upload a PowerPoint file.'); return; }
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
        if (files.length > 0) { pdfToEditFile = files[0]; showFileInfo('edit-pdf-file-info', pdfToEditFile.name); }
        else { pdfToEditFile = null; hideFileInfo('edit-pdf-file-info'); }
    }, 'edit-pdf-file-info');

    if (applyPdfEditsBtn) {
        /**
         * Handles click event for the "Apply PDF Edits" button.
         * This is a placeholder for a complex PDF editing feature.
         * @async
         * @listens click on #apply-pdf-edits
         */
        applyPdfEditsBtn.addEventListener('click', async function() {
            if (!pdfToEditFile) { alert('Please upload a PDF file to edit.'); return; }
            this.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Applying Edits...';
            this.disabled = true;
            const fileName = 'edited_' + pdfToEditFile.name;
            
            try {
                // Simulate processing
                setTimeout(() => {
                    const pdfBlob = new Blob([`Simulated edited PDF for ${pdfToEditFile.name}. Actual PDF editing requires a library like PDF-lib.js and UI for editing tools.`], { type: 'application/pdf' });
                    showDownloadSection(fileName, pdfBlob);
                }, 2000);
            } catch (err) {
                console.error("PDF Editing Error:", err);
                alert("Could not process PDF for editing. " + err.message);
            } finally {
                this.innerHTML = '<i class="fas fa-save"></i> Apply Edits & Save PDF';
                this.disabled = false;
            }
        });
    }
});
