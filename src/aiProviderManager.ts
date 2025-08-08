import * as vscode from 'vscode';
import { LLMService } from './llmService';
import { GeminiService } from './geminiService';

export class AIProviderManager {
    private llmService: LLMService;
    private geminiService: GeminiService;

    constructor(llmService: LLMService, geminiService: GeminiService) {
        this.llmService = llmService;
        this.geminiService = geminiService;
    }

    async generateResponse(messages: any, options: any = {}): Promise<string> {
        const config = vscode.workspace.getConfiguration('dattoham-ai');
        const provider = config.get('aiProvider', 'ollama') as string;
        const prompt = Array.isArray(messages) ? messages.map(m => m.content).join('\n') : messages;

        try {
            if (provider === 'gemini') {
                return await this.geminiService.generateResponse(prompt, options);
            } else {
                return await this.llmService.generateResponse(messages, options);
            }
        } catch (error: any) {
            if (provider === 'ollama' && error.message.includes('ECONNREFUSED')) {
                const choice = await vscode.window.showErrorMessage(
                    'Ollama not running. Switch to Gemini?',
                    'Use Gemini',
                    'Install Ollama'
                );
                
                if (choice === 'Use Gemini') {
                    await config.update('aiProvider', 'gemini', true);
                    return await this.geminiService.generateResponse(prompt, options);
                } else if (choice === 'Install Ollama') {
                    vscode.env.openExternal(vscode.Uri.parse('https://ollama.ai'));
                }
            }
            throw error;
        }
    }
}