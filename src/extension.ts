import * as vscode from 'vscode';
import { GeminiService } from './geminiService';
import { WebviewProvider } from './webview';
import { ChatProvider } from './chatProvider';
import { LLMService } from './llmService';
import { CodeAnalyzer } from './codeAnalyzer';
import { OptimizationEngine } from './optimizationEngine';
import { SecurityScanner } from './securityScanner';
import { DiagramGenerator } from './diagramGenerator';
import { FeedbackService } from './feedbackService';
import { ModelManager } from './modelManager';
import { FrameworkDetector } from './frameworkDetector';
import { ContextProvider } from './contextProvider';
import { ChatWindow } from './chatWindow';

export async function activate(context: vscode.ExtensionContext) {
    console.log('🤖 Dattoham AI -  most advanced free coding assistant activated!');

    // Initialize services
    const llmService = new LLMService();
    const codeAnalyzer = new CodeAnalyzer();
    const optimizationEngine = new OptimizationEngine();
    const securityScanner = new SecurityScanner();
    const diagramGenerator = new DiagramGenerator();
    const feedbackService = new FeedbackService();
    const modelManager = new ModelManager();
    const frameworkDetector = new FrameworkDetector();
    const contextProvider = new ContextProvider();
    
    // Initialize webview providers
    const webviewProvider = new WebviewProvider(
        context.extensionUri,
        llmService,
        codeAnalyzer,
        optimizationEngine,
        frameworkDetector,
        contextProvider
    );
    
    const chatProvider = new ChatProvider(
        context.extensionUri,
        llmService,
        contextProvider
    );
    
    const chatWindow = new ChatWindow(llmService);
    
    // Initialize components
    codeAnalyzer.initialize();
    
    // Initialize LLM service lazily to avoid startup errors
    llmService.initialize().catch(() => {
        // Silently handle connection errors - will show message when user tries to use it
    });

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
        vscode.commands.registerCommand('dattoham-ai.switchProvider', async () => {
            const config = vscode.workspace.getConfiguration('dattoham-ai');
            const current = config.get('aiProvider', 'ollama');
            const newProvider = current === 'ollama' ? 'gemini' : 'ollama';
            await config.update('aiProvider', newProvider, true);
            vscode.window.showInformationMessage(`Switched to ${newProvider.toUpperCase()} provider`);
        }),
        vscode.commands.registerCommand('dattoham-ai.openChat', () => {
            chatWindow.show();
        }),

    ];

    // Register webview providers
    context.subscriptions.push(
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
    statusBarItem.command = 'dattoham-ai.openChat';
    statusBarItem.tooltip = 'Open Dattoham AI Chat';
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