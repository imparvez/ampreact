import fs from 'fs';
import { join } from 'path';
import jade from 'jade';
import fm from 'front-matter';
import MarkdownIt from 'markdown-it';

const md = new MarkdownIt();

// A folder with Jade/Markdown/HTML content pages
const CONTENT_DIR = join(__dirname, './content');

// Extract 'front matter' metadata and generate HTML
const parseContent = (path, fileContent, extension) => {
  const fmContent = fm(fileContent);
  let htmlContent;
  switch (extension) {
    case '.jade':
      htmlContent = jade.render(fmContent.body);
      break;
    case '.md':
      htmlContent = md.render(fmContent.body);
      break;
    case '.html':
      htmlContent = fmContent.body;
      break;
    default:
      return null;
  }
  const smth = Object.assign({ path, content: htmlContent }, fmContent.attributes);
  return smth;
};

const fileExists = filename => new Promise(resolve => {
  fs.exists(filename, resolve);
});

async function resolveExtension(path, extension) {
  let fileNameBase = join(CONTENT_DIR, `${path === '/' ? '/index' : path}`);
  let ext = extension;
  if (!ext.startsWith('.')) {
    ext = `.${extension}`;
  }

  let fileName = fileNameBase + ext;

  if (!(await fileExists(fileName))) {
    fileNameBase = join(CONTENT_DIR, `${path}/index`);
    fileName = fileNameBase + ext;
  }

  if (!(await fileExists(fileName))) {
    return { success: false };
  }

  return { success: true, fileName };
}

async function resolveFileName(path) {
  const extensions = ['.jade', '.md', '.html'];

  for (const extension of extensions) {
    const maybeFileName = await resolveExtension(path, extension);
    if (maybeFileName.success) {
      return { success: true, fileName: maybeFileName.fileName, extension };
    }
  }

  return { success: false, fileName: null, extension: null };
}

const content = async path => {
  const { success, fileName, extension } = await resolveFileName(path);
  if (!success) return null;
  const source = await new Promise((resolve, reject) => {
    fs.readFile(fileName, { encoding: 'utf8' }, (err, data) =>
      err ? reject(err) : resolve(data)
    );
  });
  return parseContent(path, source, extension);
};

export default content;
