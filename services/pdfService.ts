import type { Page, PublishingPreset, WorkbookElement, MasterPage, BookType, ExportOptions, TextStyle, DataVariable } from '../types';

declare const html2canvas: any;
declare const jspdf: any;

const DPI = 96;
const pxToPt = (px: number) => px * (72 / DPI);

const substituteVariables = (text: string, variables: DataVariable[]): string => {
  if (!text.includes('{{')) return text;
  let substitutedText = text;
  variables.forEach(variable => {
    const regex = new RegExp(`{{${variable.name}}}`, 'g');
    substitutedText = substitutedText.replace(regex, variable.value);
  });
  return substitutedText;
};

export const parsePageRange = (rangeStr: string, totalPages: number): number[] => {
    if (rangeStr.trim().toLowerCase() === 'all') {
        return Array.from({ length: totalPages }, (_, i) => i);
    }

    const indices = new Set<number>();
    const parts = rangeStr.split(',');

    for (const part of parts) {
        const trimmedPart = part.trim();
        if (trimmedPart.includes('-')) {
            const [start, end] = trimmedPart.split('-').map(Number);
            if (!isNaN(start) && !isNaN(end)) {
                for (let i = start; i <= end; i++) {
                    if (i >= 1 && i <= totalPages) {
                        indices.add(i - 1); // convert to 0-based index
                    }
                }
            }
        } else {
            const pageNum = Number(trimmedPart);
            if (!isNaN(pageNum) && pageNum >= 1 && pageNum <= totalPages) {
                indices.add(pageNum - 1); // convert to 0-based index
            }
        }
    }
    return Array.from(indices).sort((a, b) => a - b);
};


const addTrimMarks = (doc: any, preset: PublishingPreset, bleed: number) => {
    const bleedPt = pxToPt(bleed);
    const widthPt = pxToPt(preset.width);
    const heightPt = pxToPt(preset.height);
    const markLength = 12; // pt
    const markOffset = 6; // pt

    doc.setDrawColor(0, 0, 0);
    doc.setLineWidth(0.5);

    const L = bleedPt - markOffset;
    const R = bleedPt + widthPt + markOffset;
    const T = bleedPt - markOffset;
    const B = bleedPt + heightPt + markOffset;

    // Top-left corner
    doc.line(L, bleedPt, L - markLength, bleedPt);
    doc.line(bleedPt, T, bleedPt, T - markLength);

    // Top-right corner
    doc.line(R, bleedPt, R + markLength, bleedPt);
    doc.line(bleedPt + widthPt, T, bleedPt + widthPt, T - markLength);
    
    // Bottom-left corner
    doc.line(L, bleedPt + heightPt, L - markLength, bleedPt + heightPt);
    doc.line(bleedPt, B, bleedPt, B + markLength);

    // Bottom-right corner
    doc.line(R, bleedPt + heightPt, R + markLength, bleedPt + heightPt);
    doc.line(bleedPt + widthPt, B, bleedPt + widthPt, B + markLength);
};

const processTextFlows = (elements: WorkbookElement[], doc: any, textStyles: TextStyle[]): WorkbookElement[] => {
    const elementsById = new Map(elements.map(el => [el.id, el]));
    const processedIds = new Set<string>();
    const newElements: WorkbookElement[] = [];

    for (const element of elements) {
        if (processedIds.has(element.id) || element.type !== 'text' || element.previousElementId) {
            continue; // Skip if already processed, not text, or not the start of a chain
        }

        // It's the start of a chain (or a standalone text box)
        processedIds.add(element.id);
        const chain = [element];
        let current = element;
        while (current.nextElementId) {
            const nextElement = elementsById.get(current.nextElementId);
            if (!nextElement || processedIds.has(nextElement.id)) break;
            chain.push(nextElement);
            processedIds.add(nextElement.id);
            current = nextElement;
        }
        
        const fullText = chain.map(el => el.content).join(' ');
        let remainingText = fullText;

        for (const box of chain) {
            const appliedTextStyle = textStyles.find(ts => ts.id === box.textStyleId);
            const finalStyle = { ...appliedTextStyle?.style, ...box.style };
            
            doc.setFont(finalStyle.fontFamily || 'sans-serif', finalStyle.fontStyle || 'normal', finalStyle.fontWeight || 'normal');
            doc.setFontSize(pxToPt(finalStyle.fontSize || 16));
            doc.setLineHeightFactor(finalStyle.lineHeight || 1.5);
            doc.setCharSpace(pxToPt(finalStyle.letterSpacing || 0));

            const lines = doc.splitTextToSize(remainingText, pxToPt(box.width));
            const textHeight = lines.length * doc.getLineHeight();
            
            if (textHeight <= pxToPt(box.height)) {
                // All remaining text fits
                newElements.push({ ...box, content: remainingText });
                remainingText = '';
                break; // End of chain processing
            } else {
                // Text overflows, calculate what fits
                const linesThatFit = Math.floor(pxToPt(box.height) / doc.getLineHeight());
                const textForThisBox = lines.slice(0, linesThatFit).join('\n');
                const remainingLines = lines.slice(linesThatFit);
                
                // Reconstruct the remaining text string accurately
                let charsInBox = textForThisBox.length;
                if (textForThisBox.length < remainingText.length && /\s/.test(remainingText[charsInBox])) {
                    charsInBox++; // Account for the space that splitTextToSize uses
                }

                newElements.push({ ...box, content: textForThisBox });
                remainingText = remainingText.substring(charsInBox);
            }
        }
        
        // If there's still text left after the last box, it's overflowed and lost for PDF.
        // The UI shows this with the red plus, so it's expected.

    }
    
    // Add back all non-text elements and text elements that were not part of any flow
    for(const element of elements) {
        if(!processedIds.has(element.id) && element.type !== 'text'){
            newElements.push(element);
        } else if (element.type === 'text' && !element.nextElementId && !element.previousElementId) {
            newElements.push(element);
        }
    }

    return newElements;
};

const renderElementToDOM = (element: WorkbookElement, textStyles: TextStyle[], dataVariables: DataVariable[], pageNumber?: number): HTMLElement => {
    const elDiv = document.createElement('div');
    elDiv.style.position = 'absolute';
    elDiv.style.left = `${element.x}px`;
    elDiv.style.top = `${element.y}px`;
    elDiv.style.width = `${element.width}px`;
    elDiv.style.height = `${element.height}px`;
    elDiv.style.boxSizing = 'border-box';
    elDiv.style.overflow = 'hidden';
    elDiv.style.transform = `rotate(${element.rotation}deg)`;
    elDiv.style.transformOrigin = 'center center';


    let content = element.content;
    if (pageNumber && element.type === 'text' && content.includes('{{pageNumber}}')) {
        content = content.replace(/{{pageNumber}}/g, pageNumber.toString());
    }
    if (element.type === 'text' || element.type === 'textarea') {
        content = substituteVariables(content, dataVariables);
    }
    
    const appliedTextStyle = textStyles.find(ts => ts.id === element.textStyleId);
    const finalStyle = { ...appliedTextStyle?.style, ...element.style };


    switch(element.type) {
        case 'text':
            const textDecorations: string[] = [];
            if (finalStyle.underline) textDecorations.push('underline');
            if (finalStyle.strikethrough) textDecorations.push('line-through');
            
            elDiv.style.fontSize = `${finalStyle.fontSize}px`;
            elDiv.style.color = finalStyle.color || '#000';
            elDiv.style.fontWeight = finalStyle.fontWeight || 'normal';
            elDiv.style.fontStyle = finalStyle.fontStyle || 'normal';
            elDiv.style.textAlign = finalStyle.textAlign || 'left';
            elDiv.style.fontFamily = finalStyle.fontFamily || 'sans-serif';
            elDiv.style.textDecoration = textDecorations.join(' ');
            elDiv.style.whiteSpace = 'pre-wrap';
            elDiv.style.lineHeight = finalStyle.lineHeight?.toString() || 'normal';
            elDiv.style.letterSpacing = `${finalStyle.letterSpacing || 0}px`;
            elDiv.textContent = content;
            break;
        case 'image':
            const img = document.createElement('img');
            img.src = content;
            img.style.width = '100%';
            img.style.height = '100%';
            img.style.objectFit = 'cover';
            elDiv.appendChild(img);
            break;
        case 'textarea':
             elDiv.textContent = content;
             elDiv.style.padding = '0.5rem';
             elDiv.style.color = finalStyle.color || '#6b7280';
             elDiv.style.fontSize = `${finalStyle.fontSize}px`;
             break;
        case 'checkbox':
            elDiv.style.display = 'flex';
            elDiv.style.alignItems = 'center';
            elDiv.style.gap = '8px';
            const label = document.createElement('span');
            label.style.position = 'absolute';
            label.style.left = '28px'; // 20px box + 8px gap
            label.style.top = '50%';
            label.style.transform = 'translateY(-50%)';
            label.textContent = content;
            label.style.fontSize = `${finalStyle.fontSize}px`;
            label.style.color = finalStyle.color || '#000';
            elDiv.appendChild(label);
            break;
    }
    return elDiv;
};

const getQualityScale = (quality: ExportOptions['quality']) => {
    switch (quality) {
        case 'high': return 3;
        case 'medium': return 2;
        case 'low': return 1;
        default: return 2;
    }
};

export const exportToPdf = async (
  pages: Page[],
  masterPages: MasterPage[],
  textStyles: TextStyle[],
  dataVariables: DataVariable[],
  preset: PublishingPreset,
  bookType: BookType,
  options: ExportOptions,
  onProgress: (progress: { current: number; total: number }) => void
): Promise<void> => {
    const { jsPDF } = jspdf;
    
    const bookSettings = preset.bookTypes[bookType] || preset.bookTypes.paperback;
    const bleed = bookSettings.bleed;

    const pdfWidthPt = pxToPt(preset.width + bleed * 2);
    const pdfHeightPt = pxToPt(preset.height + bleed * 2);
  
    const doc = new jsPDF({
        orientation: pdfWidthPt > pdfHeightPt ? 'landscape' : 'portrait',
        unit: 'pt',
        format: [pdfWidthPt, pdfHeightPt]
    });

    const pageIndicesToExport = parsePageRange(options.pageRange, pages.length);

    const renderContainer = document.createElement('div');
    renderContainer.style.position = 'fixed';
    renderContainer.style.left = '-9999px';
    renderContainer.style.top = '-9999px';
    document.body.appendChild(renderContainer);

    try {
        for (let i = 0; i < pageIndicesToExport.length; i++) {
            const pageIndex = pageIndicesToExport[i];
            const page = pages[pageIndex];
            onProgress({ current: i + 1, total: pageIndicesToExport.length });
            
            const pageContainer = document.createElement('div');
            pageContainer.style.position = 'relative';
            pageContainer.style.width = `${preset.width}px`;
            pageContainer.style.height = `${preset.height}px`;
            pageContainer.style.backgroundColor = 'white';
            
            const elementsToRender = processTextFlows(page.elements, doc, textStyles);
            
            if (page.masterPageId) {
                const master = masterPages.find(m => m.id === page.masterPageId);
                if (master) {
                    master.elements.forEach(element => {
                        const domElement = renderElementToDOM(element, textStyles, dataVariables, pageIndex + 1);
                        pageContainer.appendChild(domElement);
                    });
                }
            }

            elementsToRender.forEach(element => {
                const domElement = renderElementToDOM(element, textStyles, dataVariables);
                pageContainer.appendChild(domElement);
            });

            const wrapper = document.createElement('div');
            wrapper.style.padding = `${bleed}px`;
            wrapper.style.backgroundColor = '#808080';
            wrapper.appendChild(pageContainer);
            renderContainer.appendChild(wrapper);

            const canvas = await html2canvas(wrapper, {
                scale: getQualityScale(options.quality),
                useCORS: true,
                allowTaint: true,
                logging: false,
                width: preset.width + bleed * 2,
                height: preset.height + bleed * 2,
            });

            renderContainer.removeChild(wrapper);

            const imgData = canvas.toDataURL('image/png');

            if (i > 0) {
                doc.addPage([pdfWidthPt, pdfHeightPt], pdfWidthPt > pdfHeightPt ? 'landscape' : 'portrait');
            }

            doc.addImage(imgData, 'PNG', 0, 0, pdfWidthPt, pdfHeightPt);

            const addInteractiveElementsForPage = (elements: WorkbookElement[]) => {
                elements.forEach(element => {
                    const xPt = pxToPt(element.x + bleed);
                    const yPt = pxToPt(element.y + bleed);
                    const widthPt = pxToPt(element.width);
                    const heightPt = pxToPt(element.height);

                    if (element.link && (element.type === 'text' || element.type === 'image')) {
                        try {
                            new URL(element.link);
                            doc.link(xPt, yPt, widthPt, heightPt, { url: element.link, rotation: element.rotation || 0 });
                        } catch (e) {
                            console.warn(`Skipping invalid URL for element ${element.id}: ${element.link}`);
                        }
                    }
                    
                    if (element.internalLinkPageNumber !== undefined && element.internalLinkPageNumber > 0) {
                         const targetPageIndex = pageIndicesToExport.indexOf(element.internalLinkPageNumber - 1);
                         if(targetPageIndex > -1) {
                            doc.link(xPt, yPt, widthPt, heightPt, { pageNumber: targetPageIndex + 1, magFactor: 'FitV', top: 0 });
                         }
                    }

                    if (element.type === 'textarea') {
                        const field = new jspdf.AcroForm.TextField();
                        field.value = substituteVariables(element.content, dataVariables);
                        field.multiline = true;
                        field.fontSize = pxToPt(element.style.fontSize || 14);
                        field.x = xPt;
                        field.y = yPt;
                        field.width = widthPt;
                        field.height = heightPt;
                        doc.addField(field);
                    }

                    if (element.type === 'checkbox') {
                        const field = new jspdf.AcroForm.CheckBox();
                        field.value = element.checked ? 'Yes' : 'Off';
                        field.x = xPt;
                        field.y = yPt + (heightPt - pxToPt(20)) / 2; 
                        field.width = pxToPt(20);
                        field.height = pxToPt(20);
                        doc.addField(field);
                    }
                });
            };

            if (page.masterPageId) {
                const master = masterPages.find(m => m.id === page.masterPageId);
                if (master) addInteractiveElementsForPage(master.elements);
            }
            addInteractiveElementsForPage(page.elements);
            
            if (bleed > 0) {
                addTrimMarks(doc, preset, bleed);
            }
        }
        
        doc.save('workbook.pdf');

    } catch (error) {
        console.error("Failed to generate PDF:", error);
        throw error;
    } finally {
        document.body.removeChild(renderContainer);
    }
};

export const exportToImages = async (
  pages: Page[],
  masterPages: MasterPage[],
  textStyles: TextStyle[],
  dataVariables: DataVariable[],
  preset: PublishingPreset,
  bookType: BookType,
  options: ExportOptions,
  onProgress: (progress: { current: number; total: number }) => void
): Promise<void> => {
  const { jsPDF } = jspdf;
  const doc = new jsPDF(); // Needed for text measurement
  const pageIndicesToExport = parsePageRange(options.pageRange, pages.length);

  const renderContainer = document.createElement('div');
  renderContainer.style.position = 'fixed';
  renderContainer.style.left = '-9999px';
  renderContainer.style.top = '-9999px';
  document.body.appendChild(renderContainer);

  try {
    for (let i = 0; i < pageIndicesToExport.length; i++) {
      const pageIndex = pageIndicesToExport[i];
      const page = pages[pageIndex];
      onProgress({ current: i + 1, total: pageIndicesToExport.length });

      const pageContainer = document.createElement('div');
      pageContainer.style.position = 'relative';
      pageContainer.style.width = `${preset.width}px`;
      pageContainer.style.height = `${preset.height}px`;
      pageContainer.style.backgroundColor = 'white';
      
      const elementsToRender = processTextFlows(page.elements, doc, textStyles);

      if (page.masterPageId) {
        const master = masterPages.find(m => m.id === page.masterPageId);
        if (master) {
          master.elements.forEach(element => {
            const domElement = renderElementToDOM(element, textStyles, dataVariables, pageIndex + 1);
            pageContainer.appendChild(domElement);
          });
        }
      }

      elementsToRender.forEach(element => {
        const domElement = renderElementToDOM(element, textStyles, dataVariables);
        pageContainer.appendChild(domElement);
      });

      renderContainer.appendChild(pageContainer);

      const canvas = await html2canvas(pageContainer, {
        scale: getQualityScale(options.quality),
        useCORS: true,
        allowTaint: true,
        logging: false,
      });

      renderContainer.removeChild(pageContainer);

      const imgData = canvas.toDataURL(options.format === 'jpeg' ? 'image/jpeg' : 'image/png', 0.9);
      const link = document.createElement('a');
      link.download = `page_${pageIndex + 1}.${options.format}`;
      link.href = imgData;
      link.click();

      await new Promise(resolve => setTimeout(resolve, 100));
    }
  } catch (error) {
    console.error("Failed to generate images:", error);
    throw error;
  } finally {
    document.body.removeChild(renderContainer);
  }
};