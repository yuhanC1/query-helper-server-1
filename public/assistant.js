async function getResponse() {
    const query = document.getElementById("query").value;  // 获取用户输入
    const responseDiv = document.getElementById("response");

    // 显示“处理中”提示
    responseDiv.innerHTML = "Processing your request, please wait...";

    try {
        // 调用 ChatGPT API 获取查询结果
        const response = await fetch("https://api.openai.com/v1/chat/completions", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer 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`  // 替换为您的 API 密钥
            },
            body: JSON.stringify({
                model: "gpt-3.5-turbo",
                messages: [
                    { "role": "system", "content": "Provide a detailed answer with pros and cons in about 250 words, using bullet points and a balanced perspective." },
                    { "role": "user", "content": `Please provide a detailed answer to the following question including both pros and cons, different sides, and a balanced viewpoint in about 250 words: ${query}` }
                ]
            })
        });

        // 解析并显示 API 返回的数据
        const data = await response.json();
        const answer = data.choices[0].message.content;
        responseDiv.innerHTML = answer.replace(/\n/g, "<br>");

        // 记录搜索和结果
        logSearch(query, answer);

    } catch (error) {
        responseDiv.innerHTML = "An error occurred. Please try again.";
        console.error("Error:", error);
    }
}

// 将用户的搜索记录发送到后端
async function logSearch(query, result) {
    await fetch("http://localhost:3000/api/log", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            user_query: query,
            response_result: result,
            timestamp: new Date().toISOString()
        })
    });
}
