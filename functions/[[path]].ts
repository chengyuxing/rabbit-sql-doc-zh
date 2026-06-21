// functions/[[path]].ts

export function onRequest(context: any) {
  const {request, env, params, waitUntil, next} = context;
  const url = new URL(request.url);
  const path = url.pathname;

  // 静态资源白名单 - 这些路径直接返回原始请求
  const staticExtensions = [
    '.js', '.css', '.png', '.jpg', '.jpeg', '.gif',
    '.svg', '.ico', '.woff', '.woff2', '.ttf', '.eot',
    '.json', '.xml', '.txt', '.map', '.webp', '.avif',
    '.txt'
  ];

  const isStaticAsset = staticExtensions.some(ext => path.endsWith(ext));
  const isAssetFolder = /^(\/datas\/|\/documents\/|\/guides\/|\/images\/|\/static-pages\/)/.test(path);

  // 如果是静态资源，直接放行
  if (isStaticAsset || isAssetFolder) {
    return next();
  }

  // 如果是 HTML 文件请求（比如 /query.html），检查文件是否存在
  if (path.endsWith('.html')) {
    // 尝试获取静态文件，如果不存在则返回 index.html
    try {
      return next();
    } catch (e) {
      // 文件不存在，返回 index.html
      return context.env.ASSETS.fetch(new Request(request.url.replace(path, '/index.html'), request));
    }
  }

  // 其他所有请求都返回 index.html（SPA 路由回退）
  try {
    // 尝试获取实际文件
    return next();
  } catch (e) {
    // 文件不存在，返回 index.html
    return context.env.ASSETS.fetch(new Request(request.url.replace(path, '/index.html'), request));
  }
}
