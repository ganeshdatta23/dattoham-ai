import * as vscode from 'vscode';

export class DiffViewer {
    async showDiff(original: string, modified: string, title: string) {
        const originalUri = vscode.Uri.parse(`untitled:Original-${title}`);
        const modifiedUri = vscode.Uri.parse(`untitled:Modified-${title}`);

        // Create temporary documents
        await vscode.workspace.fs.writeFile(originalUri, Buffer.from(original));
        await vscode.workspace.fs.writeFile(modifiedUri, Buffer.from(modified));

        // Show diff
        await vscode.commands.executeCommand('vscode.diff', originalUri, modifiedUri, `${title} - AI Suggestions`);
    }

    async showInlineComparison(original: string, modified: string, title: string) {
        const panel = vscode.window.createWebviewPanel(
            'dattohamDiff',
            `${title} - Comparison`,
            vscode.ViewColumn.Beside,
            { enableScripts: true }
        );

        panel.webview.html = this.getDiffHtml(original, modified, title);
    }

    private getDiffHtml(original: string, modified: string, title: string): string {
        return `<!DOCTYPE html>
<html>
<head>
    <title>${title} Comparison</title>
    <style>
        body { font-family: var(--vscode-font-family); padding: 20px; background: var(--vscode-editor-background); color: var(--vscode-editor-foreground); }
        .container { display: flex; gap: 20px; }
        .panel { flex: 1; }
        .panel h3 { color: var(--vscode-textLink-foreground); margin-bottom: 10px; }
        .code { background: var(--vscode-textCodeBlock-background); padding: 15px; border-radius: 4px; white-space: pre-wrap; font-family: monospace; max-height: 600px; overflow-y: auto; }
        .original { border-left: 3px solid #f85149; }
        .modified { border-left: 3px solid #3fb950; }
        .actions { margin: 20px 0; text-align: center; }
        .btn { padding: 10px 20px; margin: 0 10px; background: var(--vscode-button-background); color: var(--vscode-button-foreground); border: none; border-radius: 4px; cursor: pointer; }
    </style>
</head>
<body>
    <h1>${title} - AI Code Comparison</h1>
    
    <div class="actions">
        <button class="btn" onclick="applyChanges()">Apply Changes</button>
        <button class="btn" onclick="rejectChanges()">Keep Original</button>
    </div>
    
    <div class="container">
        <div class="panel">
            <h3>🔴 Original Code</h3>
            <div class="code original">${this.escapeHtml(original)}</div>
        </div>
        <div class="panel">
            <h3>🟢 AI Suggestion</h3>
            <div class="code modified">${this.escapeHtml(modified)}</div>
        </div>
    </div>
    
    <script>
        const vscode = acquireVsCodeApi();
        
        function applyChanges() {
            vscode.postMessage({ type: 'apply', code: \`${modified.replace(/`/g, '\\`')}\` });
        }
        
        function rejectChanges() {
            vscode.postMessage({ type: 'reject' });
        }
    </script>
</body>
</html>`;
    }

    private escapeHtml(text: string): string {
        return text
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }
}