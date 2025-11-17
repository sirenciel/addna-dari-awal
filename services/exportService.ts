import JSZip from 'jszip';
import saveAs from 'file-saver';
import { AdConcept, TextStyle } from '../types';

// Helper to convert data URL to blob
export const dataURLtoBlob = (dataurl: string) => {
    const arr = dataurl.split(',');
    if (arr.length < 2) {
        return null;
    }
    const mimeMatch = arr[0].match(/:(.*?);/);
    if (!mimeMatch) {
        return null;
    }
    const mime = mimeMatch[1];
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) {
        u8arr[n] = bstr.charCodeAt(n);
    }
    return new Blob([u8arr], { type: mime });
}

// --- Fungsi Baru untuk Menggabungkan Teks ke Gambar ---

function parseTextShadow(shadow: string): { offsetX: number; offsetY: number; blur: number; color: string } {
    // Parser sederhana untuk '2px 2px 4px rgba(0,0,0,0.7)'
    const parts = shadow.match(/(-?\d*\.?\d+px)|(rgba?\(.+?\))/g);
    if (!parts || parts.length < 4) {
        return { offsetX: 0, offsetY: 0, blur: 0, color: 'transparent' };
    }
    return {
        offsetX: parseFloat(parts[0]),
        offsetY: parseFloat(parts[1]),
        blur: parseFloat(parts[2]),
        color: parts[3],
    };
}

const createFallbackStyle = (type: 'hook' | 'headline'): TextStyle => {
    if (type === 'hook') {
        return {
            fontFamily: 'Poppins',
            fontSize: 7, // vw
            fontWeight: '900',
            color: '#FFFFFF',
            top: 40,
            left: 10,
            width: 80,
            textAlign: 'center',
            textShadow: '3px 3px 6px rgba(0,0,0,0.8)',
            lineHeight: 1.1,
        };
    } else { // headline
        return {
            fontFamily: 'Montserrat',
            fontSize: 4, // vw
            fontWeight: '700',
            color: '#FFFFFF',
            top: 55,
            left: 10,
            width: 80,
            textAlign: 'center',
            textShadow: '2px 2px 4px rgba(0,0,0,0.7)',
            lineHeight: 1.2,
        };
    }
};


export const compositeTextOnImage = async (
    baseImageUrl: string,
    hook: { text?: string; style?: TextStyle },
    headline: { text?: string; style?: TextStyle }
): Promise<string> => {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.onload = () => {
            const canvas = document.createElement('canvas');
            canvas.width = img.naturalWidth;
            canvas.height = img.naturalHeight;
            const ctx = canvas.getContext('2d');
            if (!ctx) {
                return reject(new Error('Could not get canvas context'));
            }

            ctx.drawImage(img, 0, 0);

            const wrapText = (context: CanvasRenderingContext2D, text: string, x: number, y: number, maxWidth: number, lineHeight: number) => {
                const words = text.split(' ');
                let line = '';
                for (let n = 0; n < words.length; n++) {
                    const testLine = line + words[n] + ' ';
                    const metrics = context.measureText(testLine);
                    const testWidth = metrics.width;
                    if (testWidth > maxWidth && n > 0) {
                        context.fillText(line, x, y);
                        line = words[n] + ' ';
                        y += lineHeight;
                    } else {
                        line = testLine;
                    }
                }
                context.fillText(line, x, y);
            };

            const overlays = [];
            if (hook.text) {
                overlays.push({ text: hook.text, style: hook.style || createFallbackStyle('hook') });
            }
            if (headline.text) {
                overlays.push({ text: headline.text, style: headline.style || createFallbackStyle('headline') });
            }

            overlays.forEach(overlay => {
                const style = overlay.style;
                const fontSizePx = (style.fontSize / 100) * canvas.width; // Convert vw to pixels
                ctx.font = `${style.fontWeight} ${fontSizePx}px "${style.fontFamily}"`;
                ctx.fillStyle = style.color;
                ctx.textAlign = style.textAlign;

                const shadow = parseTextShadow(style.textShadow);
                ctx.shadowColor = shadow.color;
                ctx.shadowOffsetX = shadow.offsetX;
                ctx.shadowOffsetY = shadow.offsetY;
                ctx.shadowBlur = shadow.blur;

                const x = (style.left / 100) * canvas.width;
                const y = (style.top / 100) * canvas.height;
                const maxWidth = (style.width / 100) * canvas.width;
                const lineHeight = fontSizePx * style.lineHeight;
                
                let drawX = x;
                if(style.textAlign === 'center') {
                    drawX = x + maxWidth / 2;
                } else if(style.textAlign === 'right') {
                    drawX = x + maxWidth;
                }
                
                wrapText(ctx, overlay.text, drawX, y + fontSizePx, maxWidth, lineHeight);
            });
            
            resolve(canvas.toDataURL('image/jpeg', 0.95));
        };
        img.onerror = () => {
            reject(new Error('Failed to load image for canvas compositing'));
        };
        img.src = baseImageUrl;
    });
};


export const exportConceptsToZip = async (concepts: AdConcept[]) => {
    const zip = new JSZip();
    const csvData = [];
    
    // CSV Header
    csvData.push([
        'Ad Set Name',
        'Status',
        'Entry Point',
        'Persona',
        'Angle',
        'Trigger',
        'Format',
        'Placement',
        'Hook',
        'Headline',
        'Visual Prompt',
        'Image Files'
    ].join(','));

    for (const concept of concepts) {
        if (!concept.imageUrls || concept.imageUrls.length === 0) continue;
        
        const folderName = concept.adSetName.replace(/[/\\?%*:|"<>]/g, '-'); // Sanitize folder name
        const folder = zip.folder(folderName);
        if (!folder) continue;

        const imageFiles: string[] = [];

        for (let i = 0; i < concept.imageUrls.length; i++) {
            const imageUrl = concept.imageUrls[i];
            
            const currentSlide = (concept.placement === 'Carousel' && concept.carouselSlides) ? concept.carouselSlides[i] : concept;

            const compositedImage = await compositeTextOnImage(
                imageUrl,
                { text: currentSlide?.hook, style: concept.headlineStyle },
                { text: currentSlide?.headline, style: concept.textOverlayStyle }
            );

            const blob = dataURLtoBlob(compositedImage);

            if (blob) {
                const extension = 'jpeg'; // Composited image is always jpeg
                const filename = `image_${i + 1}.${extension}`;
                folder.file(filename, blob);
                imageFiles.push(`${folderName}/${filename}`);
            }
        }
        
        // Add concept data to CSV
        csvData.push([
            `"${concept.adSetName}"`,
            `"${concept.performanceData?.status || 'Pending'}"`,
            `"${concept.entryPoint}"`,
            `"${concept.personaDescription}"`,
            `"${concept.angle}"`,
            `"${concept.trigger.name}"`,
            `"${concept.format}"`,
            `"${concept.placement}"`,
            `"${concept.hook.replace(/"/g, '""')}"`,
            `"${concept.headline.replace(/"/g, '""')}"`,
            `"${concept.visualPrompt.replace(/"/g, '""')}"`,
            `"${imageFiles.join(', ')}"`
        ].join(','));
        
        // Add a text file with details inside each concept's folder
        let details = `Ad Set Name: ${concept.adSetName}\n`;
        details += `Status: ${concept.performanceData?.status || 'Pending'}\n`;
        details += `Entry Point: ${concept.entryPoint}\n\n`;
        details += `Persona: ${concept.personaDescription}\n`;
        details += `Angle: ${concept.angle}\n`;
        details += `Trigger: ${concept.trigger.name}\n`;
        details += `Format: ${concept.format}\n`;
        details += `Placement: ${concept.placement}\n\n`;
        details += `Hook: ${concept.hook}\n`;
        details += `Headline: ${concept.headline}\n\n`;
        details += `Visual Prompt:\n${concept.visualPrompt}\n`;
        
        folder.file('details.txt', details);
    }
    
    if (csvData.length > 1) { // more than just the header
        zip.file('summary.csv', csvData.join('\n'));

        const content = await zip.generateAsync({ type: 'blob' });
        saveAs(content, `Ad_Concepts_${new Date().toISOString().slice(0,10)}.zip`);
    } else {
        alert("Tidak ada konsep dengan gambar yang dipilih untuk diunduh.");
    }
};