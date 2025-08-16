import * as vscode from 'vscode';
import { LLMService } from './llmService';
import { ChatMessage } from './types';

export class ChatWindow {
    private panel?: vscode.WebviewPanel;
    private chatHistory: ChatMessage[] = [];

    constructor(private llmService: LLMService) {}

    public show() {
        if (this.panel) {
            this.panel.reveal();
            return;
        }

        this.panel = vscode.window.createWebviewPanel(
            'dattohamChat',
            'Dattoham AI Chat',
            vscode.ViewColumn.Beside,
            {
                enableScripts: true,
                retainContextWhenHidden: true
            }
        );

        this.panel.webview.html = this.getWebviewContent();
        
        this.panel.webview.onDidReceiveMessage(async (message) => {
            switch (message.type) {
                case 'chat':
                    await this.handleChat(message.text);
                    break;
                case 'clear':
                    this.chatHistory = [];
                    this.updateChat();
                    break;
            }
        });

        this.panel.onDidDispose(() => {
            this.panel = undefined;
        });
    }

    private async handleChat(text: string) {
        const userMessage: ChatMessage = {
            role: 'user',
            content: text,
            timestamp: Date.now()
        };

        this.chatHistory.push(userMessage);
        this.updateChat();

        try {
            const response = await this.llmService.generateResponse([
                { role: 'system', content: 'You are Dattoham AI, a helpful coding assistant.' },
                ...this.chatHistory.slice(-10)
            ]);

            const assistantMessage: ChatMessage = {
                role: 'assistant',
                content: response,
                timestamp: Date.now()
            };

            this.chatHistory.push(assistantMessage);
            this.updateChat();
        } catch (error) {
            this.showError(`Error: ${error}`);
        }
    }

    private updateChat() {
        if (this.panel) {
            this.panel.webview.postMessage({
                type: 'updateChat',
                messages: this.chatHistory
            });
        }
    }

    private showError(message: string) {
        if (this.panel) {
            this.panel.webview.postMessage({
                type: 'error',
                message
            });
        }
    }

    private getWebviewContent(): string {
        return `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Dattoham AI Chat</title>
    <style>
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { 
            font-family: var(--vscode-font-family); 
            background: var(--vscode-editor-background);
            color: var(--vscode-editor-foreground);
            height: 100vh;
            display: flex;
            flex-direction: column;
        }
        .header {
            padding: 16px;
            border-bottom: 1px solid var(--vscode-panel-border);
            background: var(--vscode-sideBar-background);
        }
        .logo { 
            font-size: 18px; 
            font-weight: bold; 
            color: var(--vscode-textLink-foreground); 
        }
        .messages {
            flex: 1;
            overflow-y: auto;
            padding: 16px;
            display: flex;
            flex-direction: column;
            gap: 16px;
        }
        .message {
            max-width: 80%;
            padding: 12px 16px;
            border-radius: 12px;
            word-wrap: break-word;
        }
        .user {
            align-self: flex-end;
            background: var(--vscode-button-background);
            color: var(--vscode-button-foreground);
        }
        .assistant {
            align-self: flex-start;
            background: var(--vscode-input-background);
            border: 1px solid var(--vscode-input-border);
        }
        .input-container {
            padding: 16px;
            border-top: 1px solid var(--vscode-panel-border);
            display: flex;
            gap: 8px;
        }
        .input {
            flex: 1;
            padding: 12px;
            background: var(--vscode-input-background);
            color: var(--vscode-input-foreground);
            border: 1px solid var(--vscode-input-border);
            border-radius: 6px;
            outline: none;
        }
        .send-btn {
            padding: 12px 20px;
            background: var(--vscode-button-background);
            color: var(--vscode-button-foreground);
            border: none;
            border-radius: 6px;
            cursor: pointer;
        }
        .send-btn:hover {
            background: var(--vscode-button-hoverBackground);
        }
        .clear-btn {
            padding: 12px 16px;
            background: var(--vscode-button-secondaryBackground);
            color: var(--vscode-button-secondaryForeground);
            border: none;
            border-radius: 6px;
            cursor: pointer;
        }
        pre {
            background: var(--vscode-textCodeBlock-background);
            padding: 8px;
            border-radius: 4px;
            overflow-x: auto;
            margin: 8px 0;
        }
        code {
            background: var(--vscode-textCodeBlock-background);
            padding: 2px 4px;
            border-radius: 3px;
        }
    </style>
</head>
<body>
    <div class="header">
        <div class="logo">🤖 Dattoham AI</div>
        <div style="font-size: 12px; opacity: 0.7;">Advanced Coding Assistant</div>
    </div>
    
    <div class="messages" id="messages"></div>
    
    <div class="input-container">
        <input type="text" class="input" id="messageInput" placeholder="Ask anything about code..." />
        <button class="send-btn" onclick="sendMessage()">Send</button>
        <button class="clear-btn" onclick="clearChat()">Clear</button>
    </div>
    
    <script>
        const vscode = acquireVsCodeApi();
        
        function sendMessage() {
            const input = document.getElementById('messageInput');
            const text = input.value.trim();
            if (text) {
                vscode.postMessage({ type: 'chat', text });
                input.value = '';
            }
        }
        
        function clearChat() {
            vscode.postMessage({ type: 'clear' });
        }
        
        document.getElementById('messageInput').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') sendMessage();
        });
        
        window.addEventListener('message', event => {
            const message = event.data;
            if (message.type === 'updateChat') {
                updateMessages(message.messages);
            } else if (message.type === 'error') {
                showError(message.message);
            }
        });
        
        function updateMessages(messages) {
            const container = document.getElementById('messages');
            container.innerHTML = '';
            
            messages.forEach(msg => {
                const div = document.createElement('div');
                div.className = 'message ' + msg.role;
                div.textContent = msg.content;
                container.appendChild(div);
            });
            
            container.scrollTop = container.scrollHeight;
        }
        
        function showError(message) {
            const container = document.getElementById('messages');
            const div = document.createElement('div');
            div.className = 'message assistant';
            div.textContent = message;
            div.style.color = 'var(--vscode-errorForeground)';
            container.appendChild(div);
            container.scrollTop = container.scrollHeight;
        }
    </script>
</body>
</html>`;
    }
}