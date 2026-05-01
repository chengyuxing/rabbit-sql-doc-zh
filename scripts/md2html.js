const fs = require('fs');
const path = require('path');
const marked = require('marked');
const pkg = require('../package.json');

const config = {
  inputDir: './public/docs',
  outputDir: `./dist/${pkg.name}`,
}

const htmlTemplate = body => `<!doctype html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport"
        content="width=device-width, user-scalable=no, initial-scale=1.0, maximum-scale=1.0, minimum-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="ie=edge">
  <title>Document</title>
</head>
<body>
${body}
</body>
</html>`;

if (!fs.existsSync(config.outputDir)) {
  fs.mkdirSync(config.outputDir, {recursive: true});
}

function convertMdFiles(dir) {
  const files = fs.readdirSync(dir, {withFileTypes: true});
  files.forEach(file => {
    const fullPath = path.join(dir, file.name);
    if (file.isDirectory()) {
      convertMdFiles(path.join(fullPath));
    } else if (file.isFile() && file.name.endsWith('.md')) {
      const mdContent = fs.readFileSync(fullPath, 'utf8');
      const htmlContent = marked.parse(mdContent);

      const outputName = fullPath.replace(/\.md$/, '.html');
      const outputPath = path.join(config.outputDir, path.relative("public", outputName));
      fs.writeFileSync(outputPath, htmlTemplate(htmlContent));
      console.log(`Completed: ${fullPath} --> ${outputPath}`);
    }
  });
}

convertMdFiles(config.inputDir);
