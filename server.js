const express = require('express');
const fs = require('fs');
const path = require('path');
//const fetch = require('node-fetch'); // 确保已安装 node-fetch
const app = express();
const PORT = process.env.PORT || 3000;

// 从环境变量中读取 OpenAI API 密钥
const apiKey = process.env.OPENAI_API_KEY;
//const apiKey = 'sk-DPfc0d2IHs3jXBRkgMaztuFdJJigTrEpuU1KDiNqReT3BlbkFJoRQn4IOzWZI6_iRi6Hd693gU8-AC0Qhr9XWdp3hSYA';
// 中间件解析 JSON 数据
app.use(express.json());

// 提供静态文件
app.use(express.static(path.join(__dirname, 'public')));

// 路由：记录搜索内容
app.post('/api/log', (req, res) => {
    const { user_query, response_result, timestamp } = req.body;

    // 保存记录到文件中
    const logData = { user_query, response_result, timestamp };
    fs.appendFile('search_logs.json', JSON.stringify(logData) + '\n', (err) => {
        if (err) {
            console.error('Error writing to file', err);
            res.status(500).send({ status: 'error', message: 'Failed to log search' });
        } else {
            res.send({ status: 'success', message: 'Search logged successfully' });
        }
    });
});

// 路由：处理查询并调用 OpenAI API
app.post('/api/chat', async (req, res) => {
    const { query } = req.body;

    try {
        // 调用 OpenAI API
        const response = await fetch("https://api.openai.com/v1/chat/completions", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                model: "gpt-3.5-turbo",
                messages: [
                    { "role": "system", "content": "Provide a detailed answer with pros and cons in about 250 words, using bullet points and a balanced perspective." },
                    { "role": "user", "content": query }
                ]
            })
        });

        const data = await response.json();
        if (response.ok) {
            res.json(data); // 将 API 返回的数据直接发送回前端
        } else {
            console.error("Error from OpenAI API:", data);
            res.status(500).json({ error: "Error from OpenAI API", details: data });
        }
    } catch (error) {
        console.error("Error calling OpenAI API:", error);
        res.status(500).json({ error: "Failed to fetch response from OpenAI API" });
    }
});

// 启动服务器
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
