# 🧪 聊天界面测试指南

## 🚀 快速开始

开发服务器已运行在: **http://localhost:3001**

## 📍 测试页面

### 1. 主要页面
- **首页**: http://localhost:3001
- **聊天入口**: http://localhost:3001/chat  
- **新建对话**: http://localhost:3001/chat/new

### 2. 认证相关
- **登录**: http://localhost:3001/login
- **注册**: http://localhost:3001/register

## 🧪 测试流程

### Step 1: 登录系统
1. 访问 http://localhost:3001
2. 使用测试账号登录：
   - Email: `doctor@dental-rag.com`
   - Password: `password123`
   或
   - Email: `admin@dental-rag.com`
   - Password: `admin123`

### Step 2: 进入聊天界面
1. 登录后点击导航栏的 "Chat" 或直接访问 http://localhost:3001/chat
2. 系统会自动跳转到新建对话页面

### Step 3: 测试Excel上传
1. 在聊天界面点击 "Upload Patient Data" 按钮
2. 使用提供的测试文件：
   - 文件路径: `/Users/tourai/Downloads/小倉馨_ CR    　初診_polygon.xlsx`
   - 拖拽或选择文件上传
3. 验证数据提取：
   - 患者姓名: 小倉馨
   - 年龄: 26
   - 性别: 男性 → male
   - 测量数据: 30+ 项指标

### Step 4: 测试AI分析
1. 选择分析类型：
   - Comprehensive (综合分析)
   - OSA Risk Assessment (OSA风险评估)
   - Orthodontic Evaluation (正畸评估)
2. 点击 "Start Analysis" 开始分析
3. 观察AI响应，应包含：
   - 详细的分析报告
   - Meta分析结果（如果启用）
   - 相关文献引用（如果启用）

### Step 5: 测试对话功能
1. 在消息输入框输入问题
2. 按 Enter 发送（或点击发送按钮）
3. 验证消息显示和AI回复
4. 测试消息复制功能（点击复制图标）

## 🔍 功能验证清单

### Excel上传
- [ ] 文件拖拽上传工作正常
- [ ] 文件类型验证（只接受.xlsx/.xls）
- [ ] 数据提取准确（姓名、年龄、性别）
- [ ] 测量数据正确解析（30+项）
- [ ] 临床意义映射正确

### 聊天界面
- [ ] 消息发送和接收正常
- [ ] AI分析响应显示正确
- [ ] Meta分析结果可视化正常
- [ ] 文献引用可点击查看详情
- [ ] 会话ID保持一致

### UI响应式设计
- [ ] 桌面端显示正常
- [ ] 平板端显示正常
- [ ] 移动端显示正常

### 错误处理
- [ ] 网络错误提示友好
- [ ] 文件格式错误提示
- [ ] API错误处理正确

## 🐛 已知问题

### 1. CORS配置
后端API已配置允许所有来源（`*`），本地测试应该没有CORS问题。

### 2. 认证状态
如果遇到认证问题：
1. 清除浏览器cookies
2. 重新登录
3. 检查控制台是否有错误信息

### 3. API连接
确保后端API可访问：
- 测试端点: https://rag-doc.dentalbrain.app/health
- 应返回: `{"status": "healthy", ...}`

## 📊 测试数据

### 示例患者数据（来自Excel）
```json
{
  "name": "小倉馨",
  "age": 26,
  "gender": "male",
  "measurements": {
    "ANB": 1.45,
    "SNA": 81.89,
    "SNB": 83.34,
    "Overjet": -0.45,
    "Overbite": -0.11
  }
}
```

### 示例消息
1. "请分析这位患者的头影测定数据"
2. "这位患者有OSA风险吗？"
3. "请解释ANB角度的临床意义"
4. "推荐的治疗方案是什么？"

## 🛠️ 调试工具

### 浏览器开发者工具
1. 打开 F12 开发者工具
2. 查看 Network 标签页监控API调用
3. 查看 Console 标签页查看错误信息

### API测试
```bash
# 测试后端健康状态
curl https://rag-doc.dentalbrain.app/health

# 测试聊天API（需要正确的请求体）
curl -X POST https://rag-doc.dentalbrain.app/api/chat/analyze \
  -H "Content-Type: application/json" \
  -d '{"message": "测试消息", "analysis_type": "comprehensive"}'
```

## 📝 反馈记录

请记录发现的问题：
- [ ] 问题描述：
- [ ] 重现步骤：
- [ ] 预期结果：
- [ ] 实际结果：
- [ ] 错误信息（如果有）：

---

**提示**: 如需停止开发服务器，运行 `npm stop` 或按 Ctrl+C