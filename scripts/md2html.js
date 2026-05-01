const fs = require('fs');
const path = require('path');
const marked = require('marked');
const pkg = require('../package.json');

const config = {
  inputDir: './public/docs',
  outputDir: `./dist/${pkg.name}`,
}

const htmlTemplate = (title, body) => `<!doctype html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport"
        content="width=device-width, user-scalable=no, initial-scale=1.0, maximum-scale=1.0, minimum-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="ie=edge">
  <meta name="description"
        content="Rabbit-SQL 是国产极简 SQL 框架，支持动态 SQL 和 Spring Boot，是专为复杂查询而生的超轻量 SQL 框架，适用于对数据安全、审计要求极高的政务项目，可以通过静态 SQL 管理 + 参数化执行，实现最安全可控的数据访问，天然适配国产生态，兼容主流国产数据库（如达梦、人大金仓、OceanBase 等。">
  <meta name="referrer" content="always">
  <meta name="author" content="Cheng Yuxing">
  <meta name="applicable-device" content="pc,mobile">
  <meta property="og:site_name" content="Rabbit SQL - 极简国产 SQL 框架">
  <meta property="og:title" content="Rabbit SQL - 极简国产 SQL 框架">
  <meta property="og:description"
        content="Rabbit-SQL 是国产极简 SQL 框架，支持动态 SQL 和 Spring Boot，是专为复杂查询而生的超轻量 SQL 框架，适用于对数据安全、审计要求极高的政务项目，可以通过静态 SQL 管理 + 参数化执行，实现最安全可控的数据访问，天然适配国产生态，兼容主流国产数据库（如达梦、人大金仓、OceanBase 等。">
  <meta property="og:image" content="https://rabbitsql.cn/images/rabbit-sql.svg">
  <meta property="og:url" content="https://rabbitsql.cn">
  <meta property="og:type" content="website">
  <link rel="icon" type="image/svg+xml" href="https://rabbitsql.cn/images/rabbit-sql.svg">
  <title>Rabbit SQL - ${title}</title>
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
      fs.writeFileSync(outputPath, htmlTemplate(file.name.replace(/\.md$/, ''), htmlContent));
      console.log(`Completed: ${fullPath} --> ${outputPath}`);
    }
  });
}

convertMdFiles(config.inputDir);
