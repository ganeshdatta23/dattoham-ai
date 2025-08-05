import * as assert from 'assert';
import * as vscode from 'vscode';
import { AIEngine } from '../src/aiEngine';
import { LLMService } from '../src/llmService';
import { ModelManager } from '../src/modelManager';
import { CodeAnalyzer } from '../src/codeAnalyzer';
import { SecurityScanner } from '../src/securityScanner';

suite('Dattoham AI Extension Tests', () => {
    let aiEngine: AIEngine;
    let securityScanner: SecurityScanner;

    setup(() => {
        const modelManager = new ModelManager();
        const llmService = new LLMService();
        const codeAnalyzer = new CodeAnalyzer();
        aiEngine = new AIEngine(llmService, codeAnalyzer);
        securityScanner = new SecurityScanner();
    });

    test('Extension should be present', () => {
        assert.ok(vscode.extensions.getExtension('dattoham-ai'));
    });

    test('AIEngine should generate code', async () => {
        const result = await aiEngine.generateCode('Create a hello world function', {});
        assert.ok(result.length > 0);
        assert.ok(result.includes('hello') || result.includes('Hello'));
    });

    test('SecurityScanner should detect SQL injection', async () => {
        const testCode = 'SELECT * FROM users WHERE id = " + userId';
        const document = await vscode.workspace.openTextDocument({
            content: testCode,
            language: 'javascript'
        });
        
        const issues = await securityScanner.scanDocument(document);
        assert.ok(issues.length > 0);
        assert.ok(issues.some(issue => issue.type === 'sql_injection'));
    });

    test('SecurityScanner should detect hardcoded secrets', async () => {
        const testCode = 'const password = "secret123"';
        const document = await vscode.workspace.openTextDocument({
            content: testCode,
            language: 'javascript'
        });
        
        const issues = await securityScanner.scanDocument(document);
        assert.ok(issues.some(issue => issue.type === 'secret'));
    });

    test('Commands should be registered', async () => {
        const commands = await vscode.commands.getCommands();
        assert.ok(commands.includes('dattoham-ai.generateCode'));
        assert.ok(commands.includes('dattoham-ai.optimizeCode'));
        assert.ok(commands.includes('dattoham-ai.securityScan'));
    });
});