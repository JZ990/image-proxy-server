// api/upload.js - 适配新版Coze工作流（输入base64_str，输出url）
module.exports = async (req, res) => {
  // 1. 设置CORS头部（允许前端跨域调用）
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // 2. 处理预检请求
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // 3. 只处理POST请求
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  console.log('[INFO] 收到上传请求');

  try {
    // 4. 解析前端请求体 (您的前端发送的是 {file, filename, filetype})
    const { file: base64Content, filename, filetype } = req.body;
    
    if (!base64Content) {
      console.error('[ERROR] 请求体中缺少 file 字段（Base64字符串）');
      return res.status(400).json({ error: '请求体中必须包含 file 字段（Base64编码的文件内容）' });
    }

    // 5. 从环境变量获取新Coze工作流的API令牌
    const API_TOKEN = process.env.API_TOKEN;
    if (!API_TOKEN) {
      console.error('[ERROR] 服务器环境变量 API_TOKEN 未设置');
      throw new Error('服务器配置错误：API令牌缺失');
    }

    console.log(`[INFO] 准备转发Base64数据至新Coze工作流，原始文件名: ${filename || '未提供'}`);

    // 6. 关键转换：将数据转发到您的新Coze工作流端点
    // 新工作流期望格式：{"base64_str": "..."}
    const targetResponse = await fetch('https://j4t6xchp77.coze.site/run', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${API_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        base64_str: base64Content // 将前端的 file 字段值，映射到新工作流的 base64_str 字段
      }),
    });

    const responseData = await targetResponse.json();
    console.log(`[INFO] Coze 工作流响应状态: ${targetResponse.status}`);

    // 7. 将Coze工作流的响应原样返回给前端
    // 注意：请根据您新工作流的实际返回JSON结构，确认文件URL的字段名（例如可能是 url, fileUrl, download_url 等）
    // 您的前端代码会尝试从多个常见字段名中读取
    res.status(targetResponse.status).json(responseData);

  } catch (error) {
    // 8. 捕获并记录所有内部错误
    console.error('[FATAL] 代理服务器内部错误:');
    console.error(error);
    
    res.status(500).json({
      error: '代理服务器处理请求时失败',
      message: error.message,
    });
  }
};
