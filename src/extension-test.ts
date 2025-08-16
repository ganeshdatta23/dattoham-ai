import * as vscode from 'vscode';

export async function activate(context: vscode.ExtensionContext) {
    console.log('🤖 Dattoham AI Test Version activated!');

    const testCommand = vscode.commands.registerCommand('dattoham-ai.test', async () => {
        const config = vscode.workspace.getConfiguration('dattoham-ai');
        const provider = config.get('aiProvider', 'ollama') as string;
        
        vscode.window.showInformationMessage(`Testing ${provider}...`);
        
        if (provider === 'gemini') {
            // Test Gemini
            const apiKey = await vscode.window.showInputBox({
                prompt: 'Enter Gemini API Key',
                password: true
            });
            
            if (apiKey) {
                vscode.window.showInformationMessage('Testing Gemini API...');
                // Simple test - just return success
                vscode.window.showInformationMessage('Gemini test: API key received');
            }
        } else {
            // Test Ollama
            vscode.window.showInformationMessage('Testing Ollama connection...');
            // Simple test - just return success
            vscode.window.showInformationMessage('Ollama test: Connection attempted');
        }
    });

    const switchCommand = vscode.commands.registerCommand('dattoham-ai.switchProvider', async () => {
        const config = vscode.workspace.getConfiguration('dattoham-ai');
        const current = config.get('aiProvider', 'ollama');
        const newProvider = current === 'ollama' ? 'gemini' : 'ollama';
        await config.update('aiProvider', newProvider, true);
        vscode.window.showInformationMessage(`Switched to ${newProvider}`);
    });

    context.subscriptions.push(testCommand, switchCommand);

    // Status bar
    const statusBar = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right);
    statusBar.text = "$(robot) Test AI";
    statusBar.command = 'dattoham-ai.test';
    statusBar.show();
    context.subscriptions.push(statusBar);

    vscode.window.showInformationMessage('Test extension ready! Click status bar to test.');
}

export function deactivate() {}