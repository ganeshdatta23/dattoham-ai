import * as vscode from 'vscode';
import { LLMService } from './llmService';
import { CodeAnalyzer } from './codeAnalyzer';

export class AIEngine {
    constructor(
        private llmService: LLMService,
        private codeAnalyzer: CodeAnalyzer
    ) {}

    async generateCode(prompt: string, context?: any): Promise<string> {
        const messages = [
            { role: 'system' as const, content: 'You are an expert programmer. Generate clean, efficient, production-ready code.' },
            { role: 'user' as const, content: prompt }
        ];
        return await this.llmService.generateResponse(messages);
    }

    async optimizeCode(code: string, language: string): Promise<string> {
        const messages = [
            { role: 'system' as const, content: 'Optimize this code for performance, readability, and best practices.' },
            { role: 'user' as const, content: `Language: ${language}\n\n${code}` }
        ];
        return await this.llmService.generateResponse(messages);
    }

    async explainCode(code: string, language: string): Promise<string> {
        const messages = [
            { role: 'system' as const, content: 'Explain this code in detail, including logic flow and patterns.' },
            { role: 'user' as const, content: `Language: ${language}\n\n${code}` }
        ];
        return await this.llmService.generateResponse(messages);
    }

    async debugCode(code: string, language: string): Promise<string> {
        const messages = [
            { role: 'system' as const, content: 'Find bugs and issues in this code. Provide fixes.' },
            { role: 'user' as const, content: `Language: ${language}\n\n${code}` }
        ];
        return await this.llmService.generateResponse(messages);
    }

    async generateTests(code: string, language: string): Promise<string> {
        const messages = [
            { role: 'system' as const, content: 'Generate comprehensive unit tests with good coverage.' },
            { role: 'user' as const, content: `Language: ${language}\n\n${code}` }
        ];
        return await this.llmService.generateResponse(messages);
    }

    async reviewCode(code: string, language: string): Promise<string> {
        const messages = [
            { role: 'system' as const, content: 'Perform thorough code review covering style, security, performance.' },
            { role: 'user' as const, content: `Language: ${language}\n\n${code}` }
        ];
        return await this.llmService.generateResponse(messages);
    }
}