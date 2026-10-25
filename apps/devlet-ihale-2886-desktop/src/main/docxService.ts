import { BrowserWindow } from 'electron'
import htmlDocx from 'html-docx-js'

/**
 * Prepares HTML for DOCX and renders it to a Buffer using html-docx-js.
 * We use an offscreen BrowserWindow to parse the DOM, base64 rasterize all images/logos
 * (including SVG graphics, institution logos and external resources),
 * and enforce explicit widths/heights so that MS Word renders logos flawlessly.
 */
export async function renderDocxBuffer(htmlContent: string): Promise<Buffer> {
  const win = new BrowserWindow({
    show: false,
    webPreferences: {
      offscreen: true,
      webSecurity: false,
      allowRunningInsecureContent: true,
      nodeIntegration: false,
      contextIsolation: true
    }
  })

  try {
    // 1. Load the HTML content
    await win.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(htmlContent)}`)

    // 2. Extract and prepare HTML using DOM manipulation
    const processedHtml = await win.webContents.executeJavaScript(`
      (async () => {
        // 1. Convert any standalone <svg> elements into rasterized <img> tags (MS Word does not render raw SVG)
        const svgs = Array.from(document.querySelectorAll('svg'));
        for (const svg of svgs) {
          try {
            const rect = svg.getBoundingClientRect();
            const width = Math.max(16, Math.round(rect.width || parseInt(svg.getAttribute('width') || '0', 10) || 40));
            const height = Math.max(16, Math.round(rect.height || parseInt(svg.getAttribute('height') || '0', 10) || 40));

            const svgXml = new XMLSerializer().serializeToString(svg);
            const svgBase64 = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svgXml);

            const img = new Image();
            img.crossOrigin = 'anonymous';

            await new Promise((resolve) => {
              img.onload = () => {
                try {
                  const canvas = document.createElement('canvas');
                  canvas.width = width * 2;
                  canvas.height = height * 2;
                  const ctx = canvas.getContext('2d');
                  if (ctx) {
                    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
                    const pngDataUrl = canvas.toDataURL('image/png');
                    const newImg = document.createElement('img');
                    newImg.src = pngDataUrl;
                    newImg.setAttribute('width', String(width));
                    newImg.setAttribute('height', String(height));
                    newImg.style.width = width + 'px';
                    newImg.style.height = height + 'px';
                    newImg.style.display = 'inline-block';
                    newImg.style.verticalAlign = 'middle';
                    svg.parentNode?.replaceChild(newImg, svg);
                  }
                } catch (e) {
                  console.warn('SVG canvas conversion failed', e);
                }
                resolve();
              };
              img.onerror = () => resolve();
              img.src = svgBase64;
              setTimeout(resolve, 800);
            });
          } catch (e) {
            console.warn('SVG processing error', e);
          }
        }

        // 2. Base64 encode all <img> tags and set explicit width/height
        const imgs = Array.from(document.querySelectorAll('img'));
        for (const img of imgs) {
          try {
            const rect = img.getBoundingClientRect();
            const explicitW = Math.round(rect.width || img.naturalWidth || parseInt(img.getAttribute('width') || '0', 10) || 120);
            const explicitH = Math.round(rect.height || img.naturalHeight || parseInt(img.getAttribute('height') || '0', 10) || 60);

            if (explicitW > 0) {
              img.setAttribute('width', String(explicitW));
              img.style.width = explicitW + 'px';
            }
            if (explicitH > 0) {
              img.setAttribute('height', String(explicitH));
              img.style.height = explicitH + 'px';
            }
            img.style.maxWidth = '100%';
            img.style.display = 'inline-block';

            // If SVG data URL or relative / remote URL, convert via Canvas or FileReader
            const src = img.src || '';
            if (src.startsWith('data:image/svg+xml') || src.endsWith('.svg')) {
              await new Promise((resolve) => {
                const canvas = document.createElement('canvas');
                canvas.width = (img.naturalWidth || explicitW || 120) * 2;
                canvas.height = (img.naturalHeight || explicitH || 60) * 2;
                const ctx = canvas.getContext('2d');
                if (ctx) {
                  try {
                    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
                    img.src = canvas.toDataURL('image/png');
                  } catch {}
                }
                resolve();
              });
            } else if (src.startsWith('http') || src.startsWith('dta-res') || src.startsWith('file:') || src.startsWith('blob:')) {
              try {
                const res = await fetch(src);
                const blob = await res.blob();
                const reader = new FileReader();
                await new Promise((resolve) => {
                  reader.onloadend = () => {
                    if (typeof reader.result === 'string') {
                      img.src = reader.result;
                    }
                    resolve();
                  };
                  reader.onerror = () => resolve();
                  reader.readAsDataURL(blob);
                  setTimeout(resolve, 1000);
                });
              } catch (fetchErr) {
                // Fallback to Canvas draw
                const canvas = document.createElement('canvas');
                canvas.width = (img.naturalWidth || explicitW) * 2;
                canvas.height = (img.naturalHeight || explicitH) * 2;
                const ctx = canvas.getContext('2d');
                if (ctx) {
                  try {
                    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
                    img.src = canvas.toDataURL('image/png');
                  } catch {}
                }
              }
            }
          } catch (e) {
            console.error('Failed to process image for DOCX', e);
          }
        }
        
        // 3. Remove non-printable elements like buttons, badges or interactive dropdowns
        const elementsToRemove = document.querySelectorAll(
          'button, .no-print, .print-hidden, [data-no-print="true"], script, link[rel="stylesheet"]'
        );
        elementsToRemove.forEach(el => el.remove());

        // 4. Return clean outer HTML
        return document.body ? document.body.innerHTML : document.documentElement.outerHTML;
      })()
    `)

    // 3. Generate DOCX Buffer with Microsoft Word friendly page styles
    const fullHtml = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body {
      font-family: Arial, "Helvetica Neue", Helvetica, sans-serif;
      font-size: 11pt;
      line-height: 1.35;
      color: #000000;
      background: #ffffff;
      margin: 1.5cm;
    }
    table {
      border-collapse: collapse;
      width: 100%;
      margin: 8pt 0;
    }
    th, td {
      border: 1pt solid #444444;
      padding: 4pt 6pt;
      font-size: 10pt;
      vertical-align: top;
    }
    img {
      display: inline-block;
      vertical-align: middle;
    }
    p {
      margin: 4pt 0;
    }
    h1, h2, h3, h4 {
      font-weight: bold;
      color: #000000;
      margin-top: 10pt;
      margin-bottom: 4pt;
    }
  </style>
</head>
<body>
  ${processedHtml}
</body>
</html>`

    const docxBlob = htmlDocx.asBlob(fullHtml)
    const docxBuffer = Buffer.from(await docxBlob.arrayBuffer())

    return docxBuffer
  } finally {
    if (!win.isDestroyed()) {
      win.destroy()
    }
  }
}
