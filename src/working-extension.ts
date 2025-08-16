import * as vscode from 'vscode';
import * as https from 'https';

export function activate(context: vscode.ExtensionContext) {
    console.log('Dattoham AI Working Version activated!');

    // AI Service
    async function callGemini(prompt: string): Promise<string> {
        const config = vscode.workspace.getConfiguration('dattoham-ai');
        let apiKey = config.get('geminiApiKey', '') as string;
        
        if (!apiKey) {
            apiKey = await vscode.window.showInputBox({
                prompt: 'Enter your Gemini API Key (get from https://makersuite.google.com/app/apikey)',
                password: true,
                placeHolder: 'AIzaSy...',
                validateInput: (value) => {
                    if (!value || value.length < 20) {
                        return 'Please enter a valid Gemini API key';
                    }
                    return null;
                }
            }) || '';
            
            if (!apiKey) throw new Error('Gemini API key is required');
            await config.update('geminiApiKey', apiKey, true);
        }

        return new Promise((resolve, reject) => {
            const data = JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }]
            });

            const req = https.request({
                hostname: 'generativelanguage.googleapis.com',
                path: `/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Content-Length': data.length
                }
            }, (res) => {
                let body = '';
                res.on('data', chunk => body += chunk);
                res.on('end', () => {
                    try {
                        const result = JSON.parse(body);
                        if (result.error) {
                            if (result.error.message.includes('API key not valid')) {
                                // Clear invalid API key
                                vscode.workspace.getConfiguration('dattoham-ai').update('geminiApiKey', '', true);
                                reject(new Error('Invalid API key. Please enter a valid Gemini API key.'));
                            } else {
                                reject(new Error(`Gemini API Error: ${result.error.message}`));
                            }
                        } else if (result.candidates?.[0]?.content?.parts?.[0]?.text) {
                            resolve(result.candidates[0].content.parts[0].text);
                        } else {
                            reject(new Error('No response from Gemini API'));
                        }
                    } catch (e) {
                        reject(new Error('Failed to parse Gemini response'));
                    }
                });
            });

            req.on('error', reject);
            req.setTimeout(30000, () => reject(new Error('Timeout')));
            req.write(data);
            req.end();
        });
    }

    // Generate Code Command
    const generateCode = vscode.commands.registerCommand('dattoham-ai.generateCode', async () => {
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            vscode.window.showErrorMessage('No active editor');
            return;
        }

        const selection = editor.selection;
        const selectedText = editor.document.getText(selection);
        
        if (!selectedText.trim()) {
            vscode.window.showErrorMessage('Please select some text first');
            return;
        }

        try {
            vscode.window.showInformationMessage('Generating code...');
            const prompt = `Generate code for: ${selectedText}. Provide only the code, no explanations.`;
            const response = await callGemini(prompt);
            
            await editor.edit(editBuilder => {
                editBuilder.replace(selection, response.trim());
            });
            
            vscode.window.showInformationMessage('Code generated successfully!');
        } catch (error: any) {
            vscode.window.showErrorMessage(`Error: ${error.message}`);
        }
    });

    // Explain Code Command
    const explainCode = vscode.commands.registerCommand('dattoham-ai.explainCode', async () => {
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            vscode.window.showErrorMessage('No active editor');
            return;
        }

        const selection = editor.selection;
        const selectedText = editor.document.getText(selection);
        
        if (!selectedText.trim()) {
            vscode.window.showErrorMessage('Please select some code first');
            return;
        }

        try {
            vscode.window.showInformationMessage('Analyzing code...');
            const prompt = `Explain this code in simple terms: ${selectedText}`;
            const response = await callGemini(prompt);
            
            // Show in information message (truncated) and output channel (full)
            const outputChannel = vscode.window.createOutputChannel('Dattoham AI');
            outputChannel.clear();
            outputChannel.appendLine('Code Explanation:');
            outputChannel.appendLine('================');
            outputChannel.appendLine(response);
            outputChannel.show();
            
            vscode.window.showInformationMessage('Code explanation shown in Output panel');
        } catch (error: any) {
            vscode.window.showErrorMessage(`Error: ${error.message}`);
        }
    });

    // Chat Command
    const openChat = vscode.commands.registerCommand('dattoham-ai.openChat', () => {
        const panel = vscode.window.createWebviewPanel(
            'dattohamChat',
            'Dattoham AI Chat',
            vscode.ViewColumn.Beside,
            { enableScripts: true }
        );

        panel.webview.html = getChatHTML();
        
        panel.webview.onDidReceiveMessage(async (message) => {
            if (message.type === 'chat') {
                try {
                    const response = await callGemini(message.text);
                    panel.webview.postMessage({
                        type: 'response',
                        text: response
                    });
                } catch (error: any) {
                    panel.webview.postMessage({
                        type: 'error',
                        text: error.message
                    });
                }
            }
        });
    });

    context.subscriptions.push(generateCode, explainCode, openChat);

    // Status bar
    const statusBar = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right);
    statusBar.text = "$(robot) Dattoham AI";
    statusBar.command = 'dattoham-ai.openChat';
    statusBar.show();
    context.subscriptions.push(statusBar);

    vscode.window.showInformationMessage('Dattoham AI is ready! Select code and use commands.');
}

function getChatHTML(): string {
    return `<!DOCTYPE html>
<html>
<head>
    <style>
        body { font-family: var(--vscode-font-family); padding: 20px; }
        .messages { height: 400px; overflow-y: auto; border: 1px solid #ccc; padding: 10px; margin-bottom: 10px; }
        .message { margin: 10px 0; padding: 10px; border-radius: 5px; }
        .user { background: #007acc; color: white; text-align: right; }
        .ai { background: #f0f0f0; color: black; }
        .error { background: #ff6b6b; color: white; }
        input { width: 70%; padding: 10px; }
        button { padding: 10px 20px; }
    </style>
</head>
<body>
    <h2>🤖 Dattoham AI Chat</h2>
    <div id="messages" class="messages"></div>
    <input type="text" id="input" placeholder="Ask anything..." />
    <button onclick="sendMessage()">Send</button>
    
    <script>
        const vscode = acquireVsCodeApi();
        
        function addMessage(text, type) {
            const messages = document.getElementById('messages');
            const div = document.createElement('div');
            div.className = 'message ' + type;
            div.textContent = text;
            messages.appendChild(div);
            messages.scrollTop = messages.scrollHeight;
        }
        
        function sendMessage() {
            const input = document.getElementById('input');
            const text = input.value.trim();
            if (text) {
                addMessage(text, 'user');
                vscode.postMessage({ type: 'chat', text });
                input.value = '';
            }
        }
        
        document.getElementById('input').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') sendMessage();
        });
        
        window.addEventListener('message', event => {
            const message = event.data;
            if (message.type === 'response') {
                addMessage(message.text, 'ai');
            } else if (message.type === 'error') {
                addMessage('Error: ' + message.text, 'error');
            }
        });
    </script>
</body>
</html>`;
}

export function deactivate() {}