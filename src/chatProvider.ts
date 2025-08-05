import * as vscode from 'vscode';
import { LLMService } from './llmService';
import { ContextProvider } from './contextProvider';
import { ChatMessage } from './types';

export class ChatProvider implements vscode.WebviewViewProvider {
    private _view?: vscode.WebviewView;
    private chatHistory: ChatMessage[] = [];

    constructor(
        private readonly _extensionUri: vscode.Uri,
        private readonly llmService: LLMService,
        private readonly contextProvider: ContextProvider
    ) {}

    public resolveWebviewView(webviewView: vscode.WebviewView): void {
        this._view = webviewView;
        webviewView.webview.options = {
            enableScripts: true,
            localResourceRoots: [this._extensionUri]
        };
        webviewView.webview.html = this._getHtmlForWebview(webviewView.webview);
        
        webviewView.webview.onDidReceiveMessage(async (data) => {
            await this.handleMessage(data);
        });
    }

    private async handleMessage(data: any) {
        switch (data.type) {
            case 'chat':
                await this.handleChat(data.message);
                break;
            case 'clear':
                this.chatHistory = [];
                this.updateChat();
                break;
        }
    }

    private async handleChat(message: string) {
        const userMessage: ChatMessage = {
            role: 'user',
            content: message,
            timestamp: Date.now()
        };
        
        this.chatHistory.push(userMessage);
        this.updateChat();

        try {
            const context = await this.contextProvider.getProjectContext();
            const systemPrompt = this.buildSystemPrompt(context);
            
            const messages = [
                { role: 'system' as const, content: systemPrompt },
                ...this.chatHistory.slice(-10) // Keep last 10 messages for context
            ];

            const response = await this.llmService.generateResponse(messages);
            
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

    private buildSystemPrompt(context: any): string {
        return `You are Dattoham AI, an expert coding assistant. Current project context:
Language: ${context.language}
Framework: ${context.framework}
Dependencies: ${context.dependencies.join(', ')}

Provide concise, accurate coding assistance. Focus on best practices, security, and performance.`;
    }

    private updateChat() {
        if (this._view) {
            this._view.webview.postMessage({
                type: 'updateChat',
                messages: this.chatHistory
            });
        }
    }

    private showError(message: string) {
        if (this._view) {
            this._view.webview.postMessage({
                type: 'error',
                message
            });
        }
    }

    private _getHtmlForWebview(webview: vscode.Webview): string {
        return `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Dattoham AI Chat</title>
    <style>
        body { font-family: var(--vscode-font-family); padding: 10px; margin: 0; }
        .chat-container { display: flex; flex-direction: column; height: 100vh; }
        .messages { flex: 1; overflow-y: auto; padding: 10px 0; }
        .message { margin: 10px 0; padding: 10px; border-radius: 8px; }
        .user { background: var(--vscode-button-background); color: var(--vscode-button-foreground); margin-left: 20px; }
        .assistant { background: var(--vscode-editor-background); border: 1px solid var(--vscode-panel-border); }
        .input-container { display: flex; gap: 10px; padding: 10px 0; }
        .input { flex: 1; padding: 8px; background: var(--vscode-input-background); color: var(--vscode-input-foreground); border: 1px solid var(--vscode-input-border); border-radius: 4px; }
        .send-btn { padding: 8px 16px; background: var(--vscode-button-background); color: var(--vscode-button-foreground); border: none; border-radius: 4px; cursor: pointer; }
        .clear-btn { padding: 8px 12px; background: var(--vscode-button-secondaryBackground); color: var(--vscode-button-secondaryForeground); border: none; border-radius: 4px; cursor: pointer; }
        pre { background: var(--vscode-textCodeBlock-background); padding: 10px; border-radius: 4px; overflow-x: auto; }
    </style>
</head>
<body>
    <div class="chat-container">
        <div class="messages" id="messages"></div>
        <div class="input-container">
            <input type="text" class="input" id="messageInput" placeholder="Ask Dattoham AI anything..." />
            <button class="send-btn" onclick="sendMessage()">Send</button>
            <button class="clear-btn" onclick="clearChat()">Clear</button>
        </div>
    </div>
    
    <script>
        const vscode = acquireVsCodeApi();
        
        function sendMessage() {
            const input = document.getElementById('messageInput');
            const message = input.value.trim();
            if (message) {
                vscode.postMessage({ type: 'chat', message });
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
                div.className = \`message \${msg.role}\`;
                div.innerHTML = \`<pre>\${msg.content}</pre>\`;
                container.appendChild(div);
            });
            
            container.scrollTop = container.scrollHeight;
        }
        
        function showError(message) {
            const container = document.getElementById('messages');
            const div = document.createElement('div');
            div.className = 'message assistant';
            div.innerHTML = \`<pre style="color: var(--vscode-errorForeground);">\${message}</pre>\`;
            container.appendChild(div);
        }
    </script>
</body>
</html>`;
    }
}