import * as vscode from 'vscode';
import { LLMService } from './llmService';
import { CodeAnalyzer } from './codeAnalyzer';
import { OptimizationEngine } from './optimizationEngine';
import { FrameworkDetector } from './frameworkDetector';
import { ContextProvider } from './contextProvider';

export class WebviewProvider implements vscode.WebviewViewProvider {
    private _view?: vscode.WebviewView;

    constructor(
        private readonly _extensionUri: vscode.Uri,
        private readonly llmService: LLMService,
        private readonly codeAnalyzer: CodeAnalyzer,
        private readonly optimizationEngine: OptimizationEngine,
        private readonly frameworkDetector: FrameworkDetector,
        private readonly contextProvider: ContextProvider
    ) {}

    public resolveWebviewView(webviewView: vscode.WebviewView): void {
        this._view = webviewView;
        webviewView.webview.options = {
            enableScripts: true,
            localResourceRoots: [this._extensionUri]
        };
        webviewView.webview.html = this._getHtmlForWebview(webviewView.webview);
        
        webviewView.webview.onDidReceiveMessage(async (data) => {
            await this.handleMessage(data);
        });
    }

    public show() {
        if (this._view) {
            this._view.show?.(true);
        }
    }

    public async executeAction(action: string, context: any) {
        if (!this._view) {return;}
        
        this._view.webview.postMessage({
            type: 'setLoading',
            loading: true,
            action
        });

        try {
            const editor = vscode.window.activeTextEditor;
            if (editor) {
                const codeContext = await this.codeAnalyzer.analyzeDocument(editor.document);
                const frameworks = await this.frameworkDetector.detectFrameworks();
                const projectContext = await this.contextProvider.getProjectContext();
                const messages = this.llmService.buildContextualPrompt(action, {
                    ...context,
                    projectStructure: codeContext.projectStructure,
                    dependencies: codeContext.dependencies,
                    codeStyle: codeContext.codeStyle,
                    frameworks,
                    projectContext
                });
                
                const response = await this.llmService.generateResponse(messages);
                
                this._view.webview.postMessage({
                    type: 'response',
                    action,
                    response,
                    context
                });
            }
        } catch (error) {
            this._view.webview.postMessage({
                type: 'error',
                message: `Error: ${error}`
            });
        } finally {
            this._view.webview.postMessage({
                type: 'setLoading',
                loading: false
            });
        }
    }

    private async handleMessage(data: any) {
        switch (data.type) {
            case 'request':
                await this.executeAction(data.action, data.context);
                break;
            case 'applyCode':
                await this.applyCodeToEditor(data.code);
                break;
        }
    }

    private async applyCodeToEditor(code: string) {
        const editor = vscode.window.activeTextEditor;
        if (editor) {
            const selection = editor.selection;
            await editor.edit(editBuilder => {
                if (selection.isEmpty) {
                    editBuilder.insert(selection.start, code);
                } else {
                    editBuilder.replace(selection, code);
                }
            });
        }
    }

    private _getHtmlForWebview(webview: vscode.Webview): string {
        return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Dattoham AI</title>
    <style>
        body { font-family: var(--vscode-font-family); padding: 10px; }
        .header { text-align: center; margin-bottom: 20px; }
        .logo { font-size: 24px; font-weight: bold; color: var(--vscode-textLink-foreground); }
        .actions { display: grid; gap: 10px; margin-bottom: 20px; }
        .action-btn { padding: 10px; background: var(--vscode-button-background); color: var(--vscode-button-foreground); border: none; border-radius: 4px; cursor: pointer; }
        .action-btn:hover { background: var(--vscode-button-hoverBackground); }
        .response { background: var(--vscode-editor-background); padding: 15px; border-radius: 4px; margin: 10px 0; }
        .loading { text-align: center; color: var(--vscode-descriptionForeground); }
        .apply-btn { background: var(--vscode-button-secondaryBackground); color: var(--vscode-button-secondaryForeground); padding: 5px 10px; margin-top: 10px; border: none; border-radius: 3px; cursor: pointer; }
        pre { background: var(--vscode-textCodeBlock-background); padding: 10px; border-radius: 4px; overflow-x: auto; }
    </style>
</head>
<body>
    <div class="header">
        <div class="logo">🤖 Dattoham AI</div>
        <div>Advanced Code Assistant</div>
    </div>
    
    <div class="actions">
        <button class="action-btn" onclick="executeAction('generate')">Generate Code</button>
        <button class="action-btn" onclick="executeAction('optimize')">Optimize Code</button>
        <button class="action-btn" onclick="executeAction('explain')">Explain Code</button>
        <button class="action-btn" onclick="executeAction('debug')">Debug Code</button>
        <button class="action-btn" onclick="executeAction('test')">Generate Tests</button>
        <button class="action-btn" onclick="executeAction('review')">Review Code</button>
    </div>
    
    <div id="output"></div>
    
    <script>
        const vscode = acquireVsCodeApi();
        
        function executeAction(action) {
            document.getElementById('output').innerHTML = '<div class="loading">Processing...</div>';
            vscode.postMessage({ type: 'request', action, context: {} });
        }
        
        function applyCode(code) {
            vscode.postMessage({ type: 'applyCode', code });
        }
        
        window.addEventListener('message', event => {
            const message = event.data;
            const output = document.getElementById('output');
            
            switch (message.type) {
                case 'response':
                    output.innerHTML = \`
                        <div class="response">
                            <h3>\${message.action.charAt(0).toUpperCase() + message.action.slice(1)} Result</h3>
                            <pre>\${message.response}</pre>
                            <button class="apply-btn" onclick="applyCode(\\\`\${message.response}\\\`)">Apply to Editor</button>
                        </div>
                    \`;
                    break;
                case 'error':
                    output.innerHTML = \`<div class="response" style="color: var(--vscode-errorForeground);">\${message.message}</div>\`;
                    break;
                case 'setLoading':
                    if (message.loading) {
                        output.innerHTML = '<div class="loading">Processing...</div>';
                    }
                    break;
            }
        });
    </script>
</body>
</html>`;
    }
}