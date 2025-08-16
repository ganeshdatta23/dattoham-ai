import * as vscode from 'vscode';
import * as https from 'https';
import * as http from 'http';

export async function activate(context: vscode.ExtensionContext) {
    console.log('🤖 Dattoham AI - Copilot Style activated!');

    // Simple chat panel like Copilot
    const provider = new ChatViewProvider(context.extensionUri);
    
    context.subscriptions.push(
        vscode.window.registerWebviewViewProvider('dattoham-ai.chat', provider),
        vscode.commands.registerCommand('dattoham-ai.openChat', () => provider.focus())
    );
}

class ChatViewProvider implements vscode.WebviewViewProvider {
    private _view?: vscode.WebviewView;
    private messages: Array<{role: 'user' | 'assistant', content: string}> = [];

    constructor(private readonly _extensionUri: vscode.Uri) {}

    resolveWebviewView(webviewView: vscode.WebviewView) {
        this._view = webviewView;
        webviewView.webview.options = { enableScripts: true };
        webviewView.webview.html = this.getHtml();
        
        webviewView.webview.onDidReceiveMessage(async (data) => {
            if (data.type === 'chat') {
                this.messages.push({role: 'user', content: data.message});
                this.updateMessages();
                
                const response = await this.getAIResponse(data.message);
                this.messages.push({role: 'assistant', content: response});
                this.updateMessages();
            }
        });
    }

    focus() {
        this._view?.show?.(true);
    }

    private async getAIResponse(message: string): Promise<string> {
        const config = vscode.workspace.getConfiguration('dattoham-ai');
        let provider = config.get('aiProvider', '') as string;
        
        // If no provider set or key invalid, show selection
        if (!provider) {
            provider = await this.selectProvider();
            if (!provider) return 'No AI provider selected';
        }
        
        if (provider === 'gemini') {
            const result = await this.callGemini(message);
            if (result.includes('API error') || result.includes('Invalid')) {
                // Key failed, ask for new provider
                const newProvider = await this.selectProvider();
                if (newProvider === 'ollama') {
                    return await this.callOllama(message);
                } else if (newProvider === 'gemini') {
                    return await this.callGemini(message, true); // Force new key
                }
            }
            return result;
        } else {
            const result = await this.callOllama(message);
            if (result.includes('not running') || result.includes('Error')) {
                // Ollama failed, offer alternatives
                const newProvider = await this.selectProvider();
                if (newProvider === 'gemini') {
                    return await this.callGemini(message);
                }
            }
            return result;
        }
    }
    
    private async selectProvider(): Promise<string> {
        const choice = await vscode.window.showQuickPick([
            { label: '🦙 Ollama (Local)', value: 'ollama', description: 'Free local AI - requires Ollama installation' },
            { label: '🤖 Gemini (Cloud)', value: 'gemini', description: 'Google AI - requires API key' }
        ], {
            placeHolder: 'Select AI Provider'
        });
        
        if (choice) {
            const config = vscode.workspace.getConfiguration('dattoham-ai');
            await config.update('aiProvider', choice.value, true);
            return choice.value;
        }
        return '';
    }
    
    private async callOllama(prompt: string): Promise<string> {
        return new Promise((resolve) => {
            const data = JSON.stringify({
                model: 'qwen2.5-coder:7b',
                prompt,
                stream: false
            });
            
            const req = http.request({
                hostname: 'localhost',
                port: 11434,
                path: '/api/generate',
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Content-Length': data.length
                }
            }, (res) => {
                let body = '';
                res.on('data', (chunk) => body += chunk);
                res.on('end', () => {
                    try {
                        const result = JSON.parse(body);
                        resolve(result.response || 'No response from Ollama');
                    } catch {
                        resolve('Error parsing Ollama response');
                    }
                });
            });
            
            req.on('error', () => {
                resolve('Ollama not running. Install from https://ollama.ai and run: ollama pull qwen2.5-coder:7b');
            });
            req.write(data);
            req.end();
        });
    }
    
    private async callGemini(prompt: string, forceNewKey = false): Promise<string> {
        const config = vscode.workspace.getConfiguration('dattoham-ai');
        let apiKey = config.get('geminiApiKey', '') as string;
        
        if (!apiKey || forceNewKey) {
            if (forceNewKey) {
                await config.update('geminiApiKey', '', true); // Clear invalid key
            }
            apiKey = await vscode.window.showInputBox({
                prompt: forceNewKey ? 'Previous API key invalid. Enter new Gemini API Key:' : 'Enter Gemini API Key:',
                password: true,
                placeHolder: 'AIza...'
            }) || '';
            if (apiKey) {
                await config.update('geminiApiKey', apiKey, true);
            } else {
                return 'Gemini API key required';
            }
        }
        
        return new Promise((resolve) => {
            const data = JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }]
            });
            
            const req = https.request({
                hostname: 'generativelanguage.googleapis.com',
                path: `/v1beta/models/gemini-pro:generateContent?key=${apiKey}`,
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Content-Length': data.length
                }
            }, (res) => {
                let body = '';
                res.on('data', (chunk) => body += chunk);
                res.on('end', () => {
                    try {
                        const result = JSON.parse(body);
                        resolve(result.candidates?.[0]?.content?.parts?.[0]?.text || 'No response from Gemini');
                    } catch {
                        resolve('Gemini API error. Check your API key.');
                    }
                });
            });
            
            req.on('error', () => {
                resolve('Network error connecting to Gemini');
            });
            req.write(data);
            req.end();
        });
    }

    private updateMessages() {
        this._view?.webview.postMessage({type: 'update', messages: this.messages});
    }

    private getHtml(): string {
        return `<!DOCTYPE html>
<html>
<head>
    <style>
        body { font-family: var(--vscode-font-family); margin: 0; padding: 10px; }
        .messages { height: 300px; overflow-y: auto; border: 1px solid var(--vscode-panel-border); padding: 10px; margin-bottom: 10px; }
        .message { margin: 5px 0; padding: 8px; border-radius: 8px; }
        .user { background: var(--vscode-button-background); color: var(--vscode-button-foreground); text-align: right; }
        .assistant { background: var(--vscode-input-background); border: 1px solid var(--vscode-input-border); }
        .input-area { display: flex; gap: 5px; }
        input { flex: 1; padding: 8px; }
        button { padding: 8px 16px; }
    </style>
</head>
<body>
    <div class="messages" id="messages"></div>
    <div class="input-area">
        <input type="text" id="input" placeholder="Ask anything..." />
        <button onclick="send()">Send</button>
    </div>
    
    <script>
        const vscode = acquireVsCodeApi();
        
        function send() {
            const input = document.getElementById('input');
            const message = input.value.trim();
            if (message) {
                vscode.postMessage({type: 'chat', message});
                input.value = '';
            }
        }
        
        document.getElementById('input').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') send();
        });
        
        window.addEventListener('message', (event) => {
            if (event.data.type === 'update') {
                const container = document.getElementById('messages');
                container.innerHTML = '';
                event.data.messages.forEach(msg => {
                    const div = document.createElement('div');
                    div.className = 'message ' + msg.role;
                    div.textContent = msg.content;
                    container.appendChild(div);
                });
                container.scrollTop = container.scrollHeight;
            }
        });
    </script>
</body>
</html>`;
    }
}

export function deactivate() {}