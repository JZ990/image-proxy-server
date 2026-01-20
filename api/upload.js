// api/upload.js
module.exports = async (req, res) => {
  // 1. 设置CORS头部（允许前端跨域调用）
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // 2. 处理浏览器发送的预检请求 (OPTIONS)
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // 3. 只处理POST请求
  if (req.method !== 'POST') {
    return res.status(405).json({ error: '仅支持 POST 请求' });
  }

  console.log('[INFO] 收到图片上传请求');

  try {
    // 4. 解析请求体 (前端发送的JSON)
    const { file, filename = 'upload.jpg', filetype = 'image/jpeg' } = req.body;
    
    if (!file) {
      console.error('[ERROR] 请求体中缺少 file 字段');
      return res.status(400).json({ error: '请求体中必须包含 file 字段（Base64编码的图片）' });
    }

    // 5. 从环境变量获取API令牌（您在Vercel中设置的）
    const API_TOKEN = process.env.API_TOKEN;
    if (!API_TOKEN) {
      console.error('[ERROR] 服务器环境变量 API_TOKEN 未设置');
      throw new Error('服务器配置错误：API令牌缺失');
    }

    console.log(`[INFO] 准备转发文件至目标API，文件名: ${filename}`);

    // 6. 转发请求到您的Coze工作流API
    const targetResponse = await fetch('https://s54tdxkb8v.coze.site/run', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${API_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ file, filename, filetype }),
    });

    const responseData = await targetResponse.json();
    console.log(`[INFO] 目标API响应状态: ${targetResponse.status}`);

    // 7. 将目标API的响应原样返回给前端
    res.status(targetResponse.status).json(responseData);

  } catch (error) {
    // 8. 捕获并记录所有内部错误
    console.error('[FATAL] 代理服务器内部错误:');
    console.error(error);
    
    // 返回清晰的错误信息，便于调试
    res.status(500).json({
      error: '代理服务器处理请求时失败',
      message: error.message,
      // 提示：生产环境中可考虑移除 details 字段
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};
