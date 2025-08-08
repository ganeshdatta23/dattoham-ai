import * as vscode from 'vscode';
import axios from 'axios';

export interface GeminiOptions {
    temperature?: number;
    maxTokens?: number;
}

export class GeminiService {
    private apiKey: string = '';
    private baseUrl = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent';

    constructor() {
        this.loadConfig();
    }

    private loadConfig(): void {
        const config = vscode.workspace.getConfiguration('dattoham-ai');
        this.apiKey = config.get('geminiApiKey', '');
    }

    async generateResponse(prompt: string, options: GeminiOptions = {}): Promise<string> {
        if (!this.apiKey) {
            const apiKey = await vscode.window.showInputBox({
                prompt: 'Enter your Gemini API Key',
                password: true,
                placeHolder: 'Get your key from https://makersuite.google.com/app/apikey'
            });
            
            if (!apiKey) {
                throw new Error('Gemini API key is required');
            }
            
            this.apiKey = apiKey;
            await vscode.workspace.getConfiguration('dattoham-ai').update('geminiApiKey', apiKey, true);
        }

        try {
            const response = await axios.post(`${this.baseUrl}?key=${this.apiKey}`, {
                contents: [{
                    parts: [{ text: prompt }]
                }],
                generationConfig: {
                    temperature: options.temperature || 0.7,
                    maxOutputTokens: options.maxTokens || 4096
                }
            });

            return response.data.candidates[0].content.parts[0].text;
        } catch (error: any) {
            if (error.response?.status === 401) {
                vscode.window.showErrorMessage('Invalid Gemini API key. Please check your key.');
                await vscode.workspace.getConfiguration('dattoham-ai').update('geminiApiKey', '', true);
                this.apiKey = '';
            }
            throw new Error(`Gemini API error: ${error.message}`);
        }
    }
}