"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const assert = __importStar(require("assert"));
const vscode = __importStar(require("vscode"));
const aiEngine_1 = require("../src/aiEngine");
const llmService_1 = require("../src/llmService");
const modelManager_1 = require("../src/modelManager");
const codeAnalyzer_1 = require("../src/codeAnalyzer");
const securityScanner_1 = require("../src/securityScanner");
suite('Dattoham AI Extension Tests', () => {
    let aiEngine;
    let securityScanner;
    setup(() => {
        const modelManager = new modelManager_1.ModelManager();
        const llmService = new llmService_1.LLMService(modelManager);
        const codeAnalyzer = new codeAnalyzer_1.CodeAnalyzer();
        aiEngine = new aiEngine_1.AIEngine(llmService, codeAnalyzer);
        securityScanner = new securityScanner_1.SecurityScanner();
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
//# sourceMappingURL=extension.test.js.map