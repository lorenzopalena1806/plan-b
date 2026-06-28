export const printTicket = (htmlContent: string) => {
  // Create an invisible iframe
  const iframe = document.createElement('iframe');
  iframe.style.position = 'fixed';
  iframe.style.right = '0';
  iframe.style.bottom = '0';
  iframe.style.width = '0';
  iframe.style.height = '0';
  iframe.style.border = '0';
  document.body.appendChild(iframe);

  const contentWindow = iframe.contentWindow;
  if (!contentWindow) return;

  const doc = contentWindow.document;

  // Thermal printer CSS (optimizing for 58mm/80mm rolls)
  const styles = `
    @page { margin: 0; size: auto; }
    body { 
      font-family: 'Courier New', Courier, monospace; 
      margin: 0; 
      padding: 10px;
      width: 100%;
      color: #000;
      background: #fff;
      font-size: 14px;
    }
    * {
      box-sizing: border-box;
    }
    .text-center { text-align: center; }
    .text-right { text-align: right; }
    .text-left { text-align: left; }
    .font-bold { font-weight: bold; }
    .text-lg { font-size: 1.2em; }
    .text-xl { font-size: 1.5em; }
    .text-2xl { font-size: 2em; }
    .mb-1 { margin-bottom: 5px; }
    .mb-2 { margin-bottom: 10px; }
    .mb-4 { margin-bottom: 20px; }
    .mt-4 { margin-top: 20px; }
    .border-b { border-bottom: 1px dashed #000; padding-bottom: 5px; }
    .border-t { border-top: 1px dashed #000; padding-top: 5px; }
    
    .flex { display: flex; }
    .justify-between { justify-content: space-between; }
    
    table { width: 100%; border-collapse: collapse; }
    th, td { text-align: left; padding: 2px 0; vertical-align: top; }
    .w-qty { width: 15%; font-weight: bold; }
    .w-price { width: 30%; text-align: right; }
    
    .comanda-item { font-size: 1.3em; margin-bottom: 10px; border-bottom: 1px solid #000; padding-bottom: 5px; }
    .comanda-qty { font-weight: bold; font-size: 1.5em; margin-right: 10px; }
    .comanda-notes { font-size: 0.8em; margin-left: 20px; font-style: italic; display: block; }
  `;

  // Write content to iframe
  doc.open();
  doc.write(`
    <html>
      <head>
        <title>Imprimir Ticket</title>
        <style>${styles}</style>
      </head>
      <body>
        ${htmlContent}
      </body>
    </html>
  `);
  doc.close();

  // Wait for images/fonts to load (if any), then print
  setTimeout(() => {
    contentWindow.focus();
    contentWindow.print();
    
    // Clean up iframe after a delay to ensure print dialog opened
    setTimeout(() => {
      document.body.removeChild(iframe);
    }, 1000);
  }, 250);
};
