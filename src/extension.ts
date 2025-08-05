import * as vscode from 'vscode';
import { LLMService } from './llmService';
import { ModelManager } from './modelManager';
import { CodeAnalyzer } from './codeAnalyzer';
import { FrameworkDetector } from './frameworkDetector';
import { ContextProvider } from './contextProvider';
import { GitIntegration } from './gitIntegration';
import { SecurityScanner } from './securityScanner';
import { OptimizationEngine } from './optimizationEngine';
import { TestGenerator } from './testGenerator';
import { ChatProvider } from './chatProvider';
import { WebviewProvider } from './webview';
import { DiagramGenerator } from './diagramGenerator';
import { DiffViewer } from './diffViewer';
import { AIEngine } from './aiEngine';
import { TelemetryService } from './telemetryService';
import { FeedbackService } from './feedbackService';

export async function activate(context: vscode.ExtensionContext) {
    console.log('🤖 Dattoham AI - World\'s most advanced free coding assistant activated!');

    // Initialize core services
    const telemetryService = new TelemetryService();
    const modelManager = new ModelManager();
    const llmService = new LLMService();
    const codeAnalyzer = new CodeAnalyzer();
    const frameworkDetector = new FrameworkDetector();
    const contextProvider = new ContextProvider();
    const gitIntegration = new GitIntegration();
    const securityScanner = new SecurityScanner();
    const optimizationEngine = new OptimizationEngine();
    const testGenerator = new TestGenerator(llmService);
    const diagramGenerator = new DiagramGenerator();
    const diffViewer = new DiffViewer();
    const aiEngine = new AIEngine(llmService, codeAnalyzer);
    const feedbackService = new FeedbackService();
    
    // Initialize UI providers
    const chatProvider = new ChatProvider(context.extensionUri, llmService, contextProvider);
    const webviewProvider = new WebviewProvider(context.extensionUri, llmService, codeAnalyzer, optimizationEngine, frameworkDetector, contextProvider);

    // Initialize services
    llmService.initialize();
    codeAnalyzer.initialize();

    // Register commands
    const commands = [
        vscode.commands.registerCommand('dattoham-ai.generateCode', async () => {
            await handleCommand('generate', webviewProvider);
        }),
        vscode.commands.registerCommand('dattoham-ai.optimizeCode', async () => {
            await handleCommand('optimize', webviewProvider);
        }),
        vscode.commands.registerCommand('dattoham-ai.explainCode', async () => {
            await handleCommand('explain', webviewProvider);
        }),
        vscode.commands.registerCommand('dattoham-ai.debugCode', async () => {
            await handleCommand('debug', webviewProvider);
        }),
        vscode.commands.registerCommand('dattoham-ai.generateTests', async () => {
            await handleCommand('test', webviewProvider);
        }),
        vscode.commands.registerCommand('dattoham-ai.reviewCode', async () => {
            await handleCommand('review', webviewProvider);
        }),
        vscode.commands.registerCommand('dattoham-ai.openWebview', () => {
            webviewProvider.show();
        }),
        vscode.commands.registerCommand('dattoham-ai.securityScan', async () => {
            const editor = vscode.window.activeTextEditor;
            if (editor) {
                const issues = await securityScanner.scanDocument(editor.document);
                const report = securityScanner.generateSecurityReport(issues);
                vscode.window.showInformationMessage('Security scan complete');
            }
        }),
        vscode.commands.registerCommand('dattoham-ai.generateDiagram', async () => {
            const editor = vscode.window.activeTextEditor;
            if (editor) {
                const context = await codeAnalyzer.analyzeDocument(editor.document);
                const diagram = diagramGenerator.generateClassDiagram(context);
                await diagramGenerator.showDiagram(diagram, 'Class Diagram');
            }
        }),
        vscode.commands.registerCommand('dattoham-ai.refactorCode', async () => {
            await handleCommand('refactor', webviewProvider);
        }),
        vscode.commands.registerCommand('dattoham-ai.addComments', async () => {
            await handleCommand('comment', webviewProvider);
        }),
        vscode.commands.registerCommand('dattoham-ai.sendFeedback', async () => {
            await feedbackService.showFeedbackForm();
        }),
        vscode.commands.registerCommand('dattoham-ai.updateModels', async () => {
            await modelManager.checkForUpdates();
        }),

    ];

    // Register webview providers
    context.subscriptions.push(
        vscode.window.registerWebviewViewProvider('dattoham-ai.webview', webviewProvider),
        vscode.window.registerWebviewViewProvider('dattoham-ai.chat', chatProvider),
        ...commands
    );

    // Auto-optimization on save
    const config = vscode.workspace.getConfiguration('dattoham-ai');
    if (config.get('autoOptimize')) {
        context.subscriptions.push(
            vscode.workspace.onDidSaveTextDocument(async (document) => {
                if (isCodeFile(document)) {
                    const suggestions = await optimizationEngine.analyzeDocument(document);
                    if (suggestions.length > 0) {
                        showOptimizationSuggestions(suggestions);
                    }
                }
            })
        );
    }

    // Status bar item
    const statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
    statusBarItem.text = "$(robot) Dattoham AI";
    statusBarItem.command = 'dattoham-ai.openWebview';
    statusBarItem.tooltip = 'Open Dattoham AI Assistant';
    statusBarItem.show();
    context.subscriptions.push(statusBarItem);
}

async function handleCommand(action: string, webviewProvider: WebviewProvider) {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
        vscode.window.showErrorMessage('No active editor found');
        return;
    }

    const selection = editor.selection;
    const selectedText = editor.document.getText(selection);
    
    webviewProvider.show();
    webviewProvider.executeAction(action, {
        code: selectedText || editor.document.getText(),
        language: editor.document.languageId,
        fileName: editor.document.fileName,
        selection: !selection.isEmpty
    });
}

function isCodeFile(document: vscode.TextDocument): boolean {
    const codeExtensions = ['.js', '.ts', '.py', '.java', '.cpp', '.c', '.rs', '.go', '.php', '.rb', '.cs'];
    return codeExtensions.some(ext => document.fileName.endsWith(ext));
}

function showOptimizationSuggestions(suggestions: any[]) {
    const message = `Found ${suggestions.length} optimization opportunities`;
    vscode.window.showInformationMessage(message, 'View Suggestions', 'Dismiss')
        .then(selection => {
            if (selection === 'View Suggestions') {
                vscode.commands.executeCommand('dattoham-ai.openWebview');
            }
        });
}

export function deactivate() {
    console.log('Dattoham AI Code Agent deactivated');
}