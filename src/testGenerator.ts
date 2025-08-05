import * as vscode from 'vscode';
import { LLMService } from './llmService';
import { CodeContext } from './codeAnalyzer';

export class TestGenerator {
    constructor(private llmService: LLMService) {}

    async generateTests(code: string, language: string, context: CodeContext): Promise<string> {
        const framework = this.detectTestFramework(language, context);
        const prompt = this.buildTestPrompt(code, language, framework, context);
        
        const messages = [
            { role: 'system' as const, content: 'You are an expert test engineer. Generate comprehensive unit tests with mocks, edge cases, and good coverage.' },
            { role: 'user' as const, content: prompt }
        ];

        return await this.llmService.generateResponse(messages);
    }

    private detectTestFramework(language: string, context: CodeContext): string {
        const deps = context.dependencies;
        
        switch (language) {
            case 'javascript':
            case 'typescript':
                if (deps.includes('jest')) {return 'Jest';}
                if (deps.includes('mocha')) {return 'Mocha';}
                if (deps.includes('vitest')) {return 'Vitest';}
                return 'Jest'; // Default
            
            case 'python':
                if (deps.includes('pytest')) {return 'pytest';}
                return 'unittest';
            
            case 'java':
                return 'JUnit 5';
            
            case 'csharp':
                return 'xUnit';
            
            default:
                return 'Standard';
        }
    }

    private buildTestPrompt(code: string, language: string, framework: string, context: CodeContext): string {
        return `Generate comprehensive unit tests for this ${language} code using ${framework}.

Requirements:
- Test all public methods and functions
- Include edge cases and error scenarios
- Use mocks for external dependencies
- Aim for 90%+ code coverage
- Follow ${framework} best practices
- Include setup/teardown if needed

Dependencies available: ${context.dependencies.join(', ')}

Code to test:
\`\`\`${language}
${code}
\`\`\`

Generate complete test file with imports and proper structure.`;
    }

    async generateMockData(functionName: string, parameters: string[], language: string): Promise<string> {
        const prompt = `Generate realistic mock data for testing function "${functionName}" with parameters: ${parameters.join(', ')} in ${language}.

Include:
- Valid test data
- Edge cases (null, empty, boundary values)
- Invalid data for error testing
- Complex objects if needed

Return as ${language} code.`;

        const messages = [
            { role: 'system' as const, content: 'Generate realistic mock data for testing.' },
            { role: 'user' as const, content: prompt }
        ];

        return await this.llmService.generateResponse(messages);
    }
}