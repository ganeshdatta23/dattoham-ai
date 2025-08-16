import * as vscode from 'vscode';

export async function activate(context: vscode.ExtensionContext) {
    console.log('Simple test activated!');

    const testCommand = vscode.commands.registerCommand('dattoham-ai.test', () => {
        vscode.window.showInformationMessage('Test command works!');
    });

    const generateCommand = vscode.commands.registerCommand('dattoham-ai.generateCode', () => {
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            vscode.window.showErrorMessage('No editor found');
            return;
        }

        const selection = editor.selection;
        editor.edit(editBuilder => {
            editBuilder.replace(selection, 'console.log("Hello from Dattoham AI!");');
        });
        vscode.window.showInformationMessage('Code generated!');
    });

    const explainCommand = vscode.commands.registerCommand('dattoham-ai.explainCode', () => {
        vscode.window.showInformationMessage('This code prints a message to the console.');
    });

    context.subscriptions.push(testCommand, generateCommand, explainCommand);

    const statusBar = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right);
    statusBar.text = "$(robot) Simple Test";
    statusBar.command = 'dattoham-ai.test';
    statusBar.show();
    context.subscriptions.push(statusBar);

    vscode.window.showInformationMessage('Simple test extension ready!');
}

export function deactivate() {}