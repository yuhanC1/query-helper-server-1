const express = require('express');
const fs = require('fs');
const path = require('path');
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3'); // 使用 v3 的 S3 客户端
const app = express();
const PORT = process.env.PORT || 3000;

// 从环境变量中读取 OpenAI 和 AWS API 密钥
const apiKey = process.env.OPENAI_API_KEY;
const s3 = new S3Client({
    region: process.env.AWS_REGION,
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
    }
});

// 定义日志文件路径
const logFilePath = path.join(__dirname, 'search_logs.json');

// 中间件解析 JSON 数据
app.use(express.json());

// 提供静态文件
app.use(express.static(path.join(__dirname, 'public')));

// 上传日志文件到 S3 的函数（使用 AWS SDK v3）
async function uploadLogToS3() {
    try {
        const fileContent = fs.readFileSync(logFilePath);

        const params = {
            Bucket: process.env.S3_BUCKET_NAME,
            Key: `logs/search_logs_${Date.now()}.json`, // 生成唯一文件名
            Body: fileContent
        };

        const command = new PutObjectCommand(params);
        const response = await s3.send(command);
        console.log("Log file successfully uploaded to S3:", response);

        // 上传成功后清空本地日志文件
        fs.truncate(logFilePath, 0, (err) => {
            if (err) console.error("Error clearing log file:", err);
        });
    } catch (error) {
        console.error("Error uploading to S3:", error);
    }
}

// 路由：记录搜索内容
app.post('/api/log', (req, res) => {
    const { user_query, response_result, timestamp, version } = req.body;

    // 保存记录到文件中，包含 version 信息
    const logData = { user_query, response_result, timestamp, version };
    fs.appendFile(logFilePath, JSON.stringify(logData) + '\n', (err) => {
        if (err) {
            console.error('Error writing to file', err);
            res.status(500).send({ status: 'error', message: 'Failed to log search' });
        } else {
            res.send({ status: 'success', message: 'Search logged successfully' });
            // 每次记录成功后上传到 S3
            uploadLogToS3();
        }
    });
});

// 路由 1：处理 Version 1 查询并调用 OpenAI API
app.post('/api/version1', async (req, res) => {
    const { query } = req.body;

    try {
        // 调用 OpenAI API，使用 Version 1 指令
        const response = await fetch("https://api.openai.com/v1/chat/completions", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                model: "gpt-3.5-turbo",
                temperature: 0.1,
                messages: [
                    { "role": "system", "content": "Provide a detailed answer with pros and cons in about 250 words, using bullet points and a balanced perspective." },
                    { "role": "user", "content": query }
                ]
            })
        });

        const data = await response.json();
        if (response.ok) {
            // 记录日志，包含 version 信息
            await fetch('http://localhost:3000/api/log', {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    user_query: query,
                    response_result: data,
                    timestamp: new Date().toISOString(),
                    version: "version1"
                })
            });
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

// 路由 2：处理 Version 2 查询并调用 OpenAI API
app.post('/api/version2', async (req, res) => {
    const { query } = req.body;

    try {
        // 调用 OpenAI API，使用 Version 2 指令
        const response = await fetch("https://api.openai.com/v1/chat/completions", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                model: "gpt-3.5-turbo",
                temperature: 0.1,
                messages: [
                    { "role": "system", "content": "Please provide the most relevant and accurate answer in about 250 words (in bullet points)." },
                    { "role": "user", "content": query }
                ]
            })
        });

        const data = await response.json();
        if (response.ok) {
            // 记录日志，包含 version 信息
            await fetch('http://localhost:3000/api/log', {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    user_query: query,
                    response_result: data,
                    timestamp: new Date().toISOString(),
                    version: "version2"
                })
            });
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
