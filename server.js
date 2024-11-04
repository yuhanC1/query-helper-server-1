const express = require('express');
const fs = require('fs');
const path = require('path');
const app = express();
const PORT = 3000;

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

// 启动服务器
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
