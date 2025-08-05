import * as vscode from 'vscode';
import axios from 'axios';

export interface ModelConfig {
    name: string;
    contextWindow: number;
    temperature: number;
    topP: number;
}

export interface ChatMessage {
    role: 'system' | 'user' | 'assistant';
    content: string;
}

export class LLMService {
    private ollamaUrl: string;
    private primaryModel: string;
    private fallbackModels: string[];
    private availableModels: Set<string> = new Set();

    constructor() {
        const config = vscode.workspace.getConfiguration('dattoham-ai');
        this.ollamaUrl = config.get('ollamaUrl') || 'http://localhost:11434';
        this.primaryModel = config.get('primaryModel') || 'qwen2.5-coder:32b-instruct-q4_K_M';
        this.fallbackModels = config.get('fallbackModels') || [
            'qwen2.5:7b-instruct-q4_K_M',
            'deepseek-v2:16b-lite-instruct-q4_K_M',
            'codellama:70b-instruct-q4_K_M'
        ];
    }

    async initialize(): Promise<void> {
        try {
            await this.checkOllamaConnection();
            await this.ensureModelsAvailable();
            vscode.window.showInformationMessage('Dattoham AI: Connected to Ollama successfully');
        } catch (error) {
            vscode.window.showErrorMessage(`Dattoham AI: Failed to connect to Ollama - ${error}`);
            this.showSetupInstructions();
        }
    }

    private async checkOllamaConnection(): Promise<void> {
        const response = await axios.get(`${this.ollamaUrl}/api/tags`);
        const models = response.data.models || [];
        this.availableModels = new Set(models.map((m: any) => m.name));
    }

    private async ensureModelsAvailable(): Promise<void> {
        const requiredModels = [this.primaryModel, ...this.fallbackModels];
        
        for (const model of requiredModels) {
            if (!this.availableModels.has(model)) {
                await this.downloadModel(model);
            }
        }
    }

    private async downloadModel(modelName: string): Promise<void> {
        vscode.window.showInformationMessage(`Downloading model: ${modelName}...`);
        
        try {
            await axios.post(`${this.ollamaUrl}/api/pull`, {
                name: modelName,
                stream: false
            });
            
            this.availableModels.add(modelName);
            vscode.window.showInformationMessage(`Model ${modelName} downloaded successfully`);
        } catch (error) {
            vscode.window.showErrorMessage(`Failed to download model ${modelName}: ${error}`);
        }
    }

    async generateResponse(messages: ChatMessage[], options: {
        model?: string;
        temperature?: number;
        maxTokens?: number;
        stream?: boolean;
    } = {}): Promise<string> {
        const model = options.model || this.getAvailableModel();
        
        if (!model) {
            throw new Error('No available models found');
        }

        const prompt = this.buildPrompt(messages);
        
        try {
            const response = await axios.post(`${this.ollamaUrl}/api/generate`, {
                model,
                prompt,
                stream: false,
                options: {
                    temperature: options.temperature || 0.7,
                    numPredict: options.maxTokens || 4096,
                    topP: 0.9,
                    repeatPenalty: 1.1
                }
            });

            return response.data.response;
        } catch (error) {
            console.error('LLM generation error:', error);
            throw new Error(`Failed to generate response: ${error}`);
        }
    }

    private getAvailableModel(): string | null {
        if (this.availableModels.has(this.primaryModel)) {
            return this.primaryModel;
        }
        
        for (const model of this.fallbackModels) {
            if (this.availableModels.has(model)) {
                return model;
            }
        }
        
        return null;
    }

    private buildPrompt(messages: ChatMessage[]): string {
        return messages.map(msg => {
            if (msg.role === 'system') {
                return `System: ${msg.content}`;
            } else if (msg.role === 'user') {
                return `Human: ${msg.content}`;
            } else {
                return `Assistant: ${msg.content}`;
            }
        }).join('\n\n');
    }

    buildContextualPrompt(action: string, context: {
        code: string;
        language: string;
        fileName: string;
        projectStructure?: any;
        dependencies?: string[];
        codeStyle?: any;
        frameworks?: any[];
        projectContext?: any;
    }): ChatMessage[] {
        const systemPrompt = this.getSystemPrompt(action, context);
        const userPrompt = this.getUserPrompt(action, context);

        return [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt }
        ];
    }

    private getSystemPrompt(action: string, context: any): string {
        const basePrompt = `You are Dattoham AI, an advanced coding assistant. You provide production-ready code with best practices, security considerations, and performance optimizations.

Language: ${context.language}
File: ${context.fileName}
Frameworks: ${context.frameworks?.map((f: any) => f.name).join(', ') || 'None detected'}
Project Context: ${JSON.stringify(context.projectContext || {})}
Dependencies: ${context.dependencies?.join(', ') || 'None detected'}
Project Structure: ${JSON.stringify(context.projectStructure || {})}

Guidelines:
- Write clean, maintainable, and well-documented code
- Follow language-specific best practices and conventions
- Consider security implications and performance
- Provide complete, runnable solutions
- Include error handling where appropriate`;

        const actionPrompts = {
            generate: 'Generate complete, production-ready code based on the user\'s requirements.',
            optimize: 'Analyze and optimize the provided code for performance, readability, and best practices.',
            explain: 'Provide detailed explanations of the code, including logic flow, patterns used, and potential improvements.',
            debug: 'Identify bugs, issues, and potential problems in the code. Provide fixes and explanations.',
            test: 'Generate comprehensive unit tests with good coverage and edge case handling.',
            review: 'Perform a thorough code review covering style, security, performance, and maintainability.'
        };

        return `${basePrompt}\n\nTask: ${actionPrompts[action as keyof typeof actionPrompts] || 'Assist with coding task'}`;
    }

    private getUserPrompt(action: string, context: any): string {
        if (action === 'generate') {
            return `Please generate code for the following requirements:\n\n${context.code}`;
        } else {
            return `Please ${action} the following code:\n\n\`\`\`${context.language}\n${context.code}\n\`\`\``;
        }
    }

    private showSetupInstructions(): void {
        const message = 'Ollama is not running. Would you like to see setup instructions?';
        vscode.window.showWarningMessage(message, 'Setup Instructions', 'Dismiss')
            .then(selection => {
                if (selection === 'Setup Instructions') {
                    vscode.env.openExternal(vscode.Uri.parse('https://ollama.ai/download'));
                }
            });
    }
}