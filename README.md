# 🤖 Dattoham AI - Advanced Code Assistant

The world's most advanced **free** coding assistant with local Ollama integration, **surpassing Amazon Q and Claude Sonnet 4** performance with zero ongoing costs.

## ✨ Features That Beat Amazon Q

- **🔥 Superior Local AI**: Qwen 2.5 Coder 32B, DeepSeek V2, Code Llama 70B - **100% FREE**
- **🌳 Advanced Analysis**: Tree-sitter parsing for 20+ languages with AST extraction
- **⚡ Real-time Intelligence**: Instant code optimization and refactoring
- **🛡️ Enterprise Security**: Built-in vulnerability detection and SAST scanning
- **🧪 Smart Test Generation**: Comprehensive unit tests with edge cases
- **📊 Professional Code Review**: Deeper analysis than Amazon Q
- **🚀 Zero Latency**: Local inference beats cloud-based solutions
- **💰 Always Free**: No subscription fees, no usage limits

## 🚀 Quick Start

1. **Install Ollama**: Download from [ollama.ai](https://ollama.ai)
2. **Install Extension**: Search "Dattoham AI" in VS Code
3. **Start Coding**: Right-click code → Dattoham AI

## 🔧 Setup

### Install Required Models
```bash
ollama pull qwen2.5-coder:32b-instruct-q4_K_M
ollama pull qwen2.5:7b-instruct-q4_K_M
ollama pull deepseek-v2:16b-lite-instruct-q4_K_M
ollama pull codellama:70b-instruct-q4_K_M
```

### Supported Languages & Frameworks
- **Languages**: Python, TypeScript, JavaScript, Java, C++, Rust, Go, PHP, Ruby, C#
- **Frameworks**: React, Next.js, Node.js, Django, Flask, FastAPI, Express
- **Databases**: MongoDB, PostgreSQL, MySQL
- **Tools**: Git, Docker, Kubernetes, AWS, Azure

### Configuration
```json
{
  "dattoham-ai.ollamaUrl": "http://localhost:11434",
  "dattoham-ai.primaryModel": "qwen2.5-coder:32b-instruct-q4_K_M",
  "dattoham-ai.autoOptimize": true
}
```

## 🎯 Commands

- **Generate Code**: Create production-ready code
- **Optimize Code**: Improve performance and style
- **Explain Code**: Detailed code explanations
- **Debug Code**: Find and fix issues
- **Generate Tests**: Create comprehensive tests
- **Review Code**: Professional code review

## 🏗️ Architecture

```
src/
├── extension.ts      # Main extension entry
├── llmService.ts     # Ollama integration
├── codeAnalyzer.ts   # Tree-sitter analysis
├── optimizationEngine.ts # Code optimization
└── webview.ts        # UI interface
```

## 🤝 Contributing

1. Fork the repository
2. Create feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open Pull Request

## 📄 License

MIT License - see [LICENSE](LICENSE) file.

## 🙏 Acknowledgments

- Ollama team for local AI inference
- Tree-sitter for semantic parsing
- VS Code team for excellent extension APIs

---

**Made with ❤️ by Dattoham AI**