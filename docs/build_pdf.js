const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const mdPath = path.join(__dirname, 'CASECONNECT_WORKFLOW.md');
const htmlPath = path.join(__dirname, 'generate_pdf_source.html');
const pdfPath = path.join(__dirname, 'CASECONNECT_WORKFLOW.pdf');
const desktopPdf = 'C:\\Users\\Yuvraj\\OneDrive\\Desktop\\CASECONNECT_WORKFLOW.pdf';

const mdContent = fs.readFileSync(mdPath, 'utf-8');

function renderMarkdownToHtml(md) {
  let lines = md.split(/\r?\n/);
  let html = [];
  let inCode = false;
  let codeLang = '';
  let inTable = false;
  let inList = false;

  for (let i = 0; i < lines.length; i++) {
    let line = lines[i];

    if (line.startsWith('```')) {
      if (inCode) {
        html.push(`</code></pre>`);
        inCode = false;
      } else {
        codeLang = line.replace('```', '').trim();
        html.push(`<pre class="code-block ${codeLang}"><code>`);
        inCode = true;
      }
      continue;
    }

    if (inCode) {
      const escaped = line
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
      html.push(escaped + '\n');
      continue;
    }

    if (line.trim().startsWith('|') && line.trim().endsWith('|')) {
      const cells = line.split('|').slice(1, -1).map(c => c.trim());
      if (cells.every(c => /^:?-+:?$/.test(c))) {
        continue;
      }

      if (!inTable) {
        html.push('<div class="table-container"><table>');
        html.push('<thead><tr>');
        cells.forEach(c => html.push(`<th>${formatInline(c)}</th>`));
        html.push('</tr></thead><tbody>');
        inTable = true;
      } else {
        html.push('<tr>');
        cells.forEach(c => html.push(`<td>${formatInline(c)}</td>`));
        html.push('</tr>');
      }
      continue;
    } else if (inTable) {
      html.push('</tbody></table></div>');
      inTable = false;
    }

    if (line.startsWith('# ')) {
      html.push(`<h1>${formatInline(line.substring(2))}</h1>`);
      continue;
    }
    if (line.startsWith('## ')) {
      html.push(`<h2>${formatInline(line.substring(3))}</h2>`);
      continue;
    }
    if (line.startsWith('### ')) {
      html.push(`<h3>${formatInline(line.substring(4))}</h3>`);
      continue;
    }
    if (line.startsWith('#### ')) {
      html.push(`<h4>${formatInline(line.substring(5))}</h4>`);
      continue;
    }

    if (/^---$|^\*\*\*$/.test(line.trim())) {
      html.push('<hr/>');
      continue;
    }

    if (/^[-*]\s+/.test(line)) {
      if (!inList) {
        html.push('<ul>');
        inList = true;
      }
      html.push(`<li>${formatInline(line.replace(/^[-*]\s+/, ''))}</li>`);
      continue;
    } else if (inList && !/^\d+\.\s+/.test(line) && line.trim() === '') {
      html.push('</ul>');
      inList = false;
    }

    if (/^\d+\.\s+/.test(line)) {
      const content = line.replace(/^\d+\.\s+/, '');
      html.push(`<div class="list-item-num"><b>${line.match(/^\d+\./)[0]}</b> ${formatInline(content)}</div>`);
      continue;
    }

    if (line.trim() === '') {
      continue;
    }

    html.push(`<p>${formatInline(line)}</p>`);
  }

  if (inTable) html.push('</tbody></table></div>');
  if (inList) html.push('</ul>');

  return html.join('\n');
}

function formatInline(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>');
}

const renderedBody = renderMarkdownToHtml(mdContent);

const completeHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>CaseConnect - Technical Workflow & Architecture Documentation</title>
  <style>
    @page {
      size: A4;
      margin: 14mm 14mm 14mm 14mm;
    }
    
    * {
      box-sizing: border-box;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }

    body {
      font-family: Arial, Helvetica, sans-serif;
      font-size: 9.5pt;
      line-height: 1.5;
      color: #0f172a;
      background: #ffffff;
      margin: 0;
      padding: 0;
    }

    h1, h2, h3, h4 {
      color: #0f172a;
      font-weight: bold;
      margin-top: 1.2rem;
      margin-bottom: 0.5rem;
      page-break-after: avoid;
    }

    h1 {
      font-size: 16pt;
      border-bottom: 2px solid #2563eb;
      padding-bottom: 0.3rem;
      color: #1e3a8a;
    }

    h2 {
      font-size: 13pt;
      border-bottom: 1px solid #cbd5e1;
      padding-bottom: 0.2rem;
      color: #1e40af;
    }

    h3 {
      font-size: 11pt;
      color: #334155;
    }

    h4 {
      font-size: 10pt;
      color: #475569;
    }

    p {
      margin-top: 0;
      margin-bottom: 0.6rem;
    }

    hr {
      border: 0;
      height: 1px;
      background: #cbd5e1;
      margin: 1.2rem 0;
    }

    ul, ol {
      margin-top: 0;
      margin-bottom: 0.6rem;
      padding-left: 1.4rem;
    }

    li {
      margin-bottom: 0.2rem;
    }

    .list-item-num {
      margin-bottom: 0.35rem;
      padding-left: 0.2rem;
    }

    code {
      font-family: Consolas, Courier, monospace;
      font-size: 8pt;
      background: #f1f5f9;
      color: #b91c1c;
      padding: 0.1rem 0.3rem;
      border-radius: 3px;
      border: 1px solid #e2e8f0;
    }

    pre.code-block {
      background: #0f172a;
      color: #f8fafc;
      padding: 0.75rem 1rem;
      border-radius: 4px;
      overflow-x: auto;
      font-family: Consolas, Courier, monospace;
      font-size: 7.5pt;
      line-height: 1.35;
      margin: 0.6rem 0;
      page-break-inside: avoid;
      white-space: pre-wrap;
      word-break: break-all;
    }

    pre.code-block code {
      background: transparent;
      color: #f8fafc;
      padding: 0;
      border: none;
      font-size: inherit;
    }

    .table-container {
      width: 100%;
      margin: 0.75rem 0;
      page-break-inside: avoid;
    }

    table {
      width: 100%;
      border-collapse: collapse;
      font-size: 8pt;
      margin-bottom: 0.4rem;
      page-break-inside: avoid;
    }

    th {
      background: #1e293b;
      color: #ffffff;
      font-weight: 600;
      text-align: left;
      padding: 5px 6px;
      border: 1px solid #334155;
    }

    td {
      padding: 4px 6px;
      border: 1px solid #e2e8f0;
      vertical-align: top;
    }

    tr:nth-child(even) td {
      background: #f8fafc;
    }

    .header-banner {
      background: #1e3a8a;
      color: #ffffff;
      padding: 1.1rem 1.4rem;
      border-radius: 6px;
      margin-bottom: 1.2rem;
    }

    .header-banner h1 {
      color: #ffffff !important;
      border: none !important;
      margin: 0 0 0.3rem 0 !important;
      font-size: 18pt !important;
    }

    .header-banner p {
      margin: 0;
      color: #bfdbfe;
      font-size: 9pt;
    }
  </style>
</head>
<body>
  <div class="header-banner">
    <h1>CaseConnect Regulatory Platform</h1>
    <p>Complete Technical Workflow, Architecture Blueprint & Operational Reference Manual</p>
  </div>

  ${renderedBody}
</body>
</html>
`;

fs.writeFileSync(htmlPath, completeHtml, 'utf-8');
console.log('Generated printable HTML source:', htmlPath);

const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';

if (!fs.existsSync(edgePath)) {
  console.error('Microsoft Edge not found at:', edgePath);
  process.exit(1);
}

console.log('Rendering PDF via Microsoft Edge Headless...');
const cmd = `"${edgePath}" --headless --disable-gpu --no-pdf-header-footer --print-to-pdf="${pdfPath}" "${htmlPath}"`;

try {
  execSync(cmd, { stdio: 'inherit' });
  if (fs.existsSync(pdfPath)) {
    const stats = fs.statSync(pdfPath);
    console.log(`PDF successfully created: ${pdfPath}`);
    console.log(`File size: ${(stats.size / 1024).toFixed(1)} KB`);
    fs.copyFileSync(pdfPath, desktopPdf);
    console.log(`Copied to Desktop: ${desktopPdf}`);
  } else {
    console.error('PDF file was not created');
    process.exit(1);
  }
} catch (e) {
  console.error('Error generating PDF:', e.message);
  process.exit(1);
}
