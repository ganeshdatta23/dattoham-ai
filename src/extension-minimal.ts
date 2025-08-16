import * as vscode from 'vscode';
import * as https from 'https';
import * as http from 'http';

export async function activate(context: vscode.ExtensionContext) {
    console.log('🤖 Dattoham AI activated!');

    // Simple AI service
    class SimpleAI {
        async generateResponse(prompt: string): Promise<string> {
            const config = vscode.workspace.getConfiguration('dattoham-ai');
            const provider = config.get('aiProvider', 'ollama') as string;
            
            console.log(`Using provider: ${provider}`);
            
            try {
                if (provider === 'gemini') {
                    const apiKey = config.get('geminiApiKey', '') as string;
                    if (!apiKey) {
                        const key = await vscode.window.showInputBox({
                            prompt: 'Enter Gemini API Key (get from https://makersuite.google.com/app/apikey)',
                            password: true,
                            placeHolder: 'AIzaSy...'
                        });
                        if (key) {
                            await config.update('geminiApiKey', key, true);
                            return await this.callGemini(prompt, key);
                        }
                        throw new Error('Gemini API key is required');
                    }
                    return await this.callGemini(prompt, apiKey);
                } else {
                    return await this.callOllama(prompt);
                }
            } catch (error: any) {
                console.error(`AI Provider Error (${provider}):`, error);
                throw error;
            }
        }

        async callGemini(prompt: string, apiKey: string): Promise<string> {
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
                            if (res.statusCode === 401 || res.statusCode === 400) {
                                resolve('Invalid API key. Please check your Gemini API key.');
                                return;
                            }
                            const result = JSON.parse(body);
                            resolve(result.candidates?.[0]?.content?.parts?.[0]?.text || 'No response');
                        } catch {
                            resolve('Error parsing Gemini response');
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

        async callOllama(prompt: string): Promise<string> {
            return new Promise((resolve) => {
                // First check if Ollama is running
                const checkReq = http.request({
                    hostname: 'localhost',
                    port: 11434,
                    path: '/api/tags',
                    method: 'GET'
                }, (res) => {
                    if (res.statusCode !== 200) {
                        resolve('Ollama not running. Please start Ollama and install models.');
                        return;
                    }
                    
                    // Try to generate response
                    const data = JSON.stringify({
                        model: 'qwen2.5-coder:7b',
                        prompt,
                        stream: false
                    });
                    
                    const genReq = http.request({
                        hostname: 'localhost',
                        port: 11434,
                        path: '/api/generate',
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Content-Length': data.length
                        }
                    }, (genRes) => {
                        let body = '';
                        genRes.on('data', (chunk) => body += chunk);
                        genRes.on('end', () => {
                            try {
                                const result = JSON.parse(body);
                                resolve(result.response || 'No response from model');
                            } catch {
                                resolve('Model not found. Install with: ollama pull qwen2.5-coder:7b');
                            }
                        });
                    });
                    
                    genReq.on('error', () => {
                        resolve('Connection error. Please check Ollama is running.');
                    });
                    genReq.write(data);
                    genReq.end();
                });
                
                checkReq.on('error', () => {
                    resolve('Ollama not running. Please install and start Ollama from https://ollama.ai');
                });
                checkReq.end();
            });
        }
    }

    const ai = new SimpleAI();

    // Register commands
    const commands = [
        vscode.commands.registerCommand('dattoham-ai.generateCode', async () => {
            const editor = vscode.window.activeTextEditor;
            if (!editor) return;
            
            const selection = editor.selection;
            const text = editor.document.getText(selection);
            
            try {
                vscode.window.showInformationMessage('Generating code...');
                const response = await ai.generateResponse(`Generate code for: ${text}`);
                if (response) {
                    await editor.edit(editBuilder => {
                        editBuilder.replace(selection, response);
                    });
                    vscode.window.showInformationMessage('Code generated successfully!');
                } else {
                    vscode.window.showErrorMessage('No response from AI model');
                }
            } catch (error: any) {
                vscode.window.showErrorMessage(`Error: ${error.message || error}`);
                console.error('Generate code error:', error);
            }
        }),

        vscode.commands.registerCommand('dattoham-ai.explainCode', async () => {
            const editor = vscode.window.activeTextEditor;
            if (!editor) return;
            
            const selection = editor.selection;
            const text = editor.document.getText(selection);
            
            try {
                vscode.window.showInformationMessage('Analyzing code...');
                const response = await ai.generateResponse(`Explain this code: ${text}`);
                if (response) {
                    vscode.window.showInformationMessage(response.substring(0, 200) + '...');
                } else {
                    vscode.window.showErrorMessage('No response from AI model');
                }
            } catch (error: any) {
                vscode.window.showErrorMessage(`Error: ${error.message || error}`);
                console.error('Explain code error:', error);
            }
        }),

        vscode.commands.registerCommand('dattoham-ai.switchProvider', async () => {
            const config = vscode.workspace.getConfiguration('dattoham-ai');
            const current = config.get('aiProvider', 'ollama');
            const newProvider = current === 'ollama' ? 'gemini' : 'ollama';
            await config.update('aiProvider', newProvider, true);
            vscode.window.showInformationMessage(`Switched to ${newProvider.toUpperCase()}`);
        })
    ];

    context.subscriptions.push(...commands);

    // Status bar
    const statusBar = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right);
    statusBar.text = "$(robot) Dattoham AI";
    statusBar.command = 'dattoham-ai.switchProvider';
    statusBar.show();
    context.subscriptions.push(statusBar);

    vscode.window.showInformationMessage('Dattoham AI is ready!');
}

export function deactivate() {}