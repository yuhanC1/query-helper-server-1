async function getResponse() {
    const query = document.getElementById("query").value;  // 获取用户输入
    const responseDiv = document.getElementById("response");

    // 显示“处理中”提示
    responseDiv.innerHTML = "Processing your request, please wait...";

    try {
        // 调用后端的代理路由，而不是直接请求 OpenAI API
        const response = await fetch("/api/chat", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ query: query })
        });

        // 解析并显示后端返回的数据
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
    await fetch("/api/log", {
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
