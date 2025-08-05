import * as vscode from 'vscode';

export interface DattohamPlugin {
    name: string;
    version: string;
    activate(context: vscode.ExtensionContext): void;
    deactivate(): void;
}

export class HelloWorldPlugin implements DattohamPlugin {
    name = 'Hello World Plugin';
    version = '1.0.0';

    activate(context: vscode.ExtensionContext) {
        console.log('🔌 Hello World Plugin activated!');
        
        const command = vscode.commands.registerCommand('dattoham-ai.helloWorld', () => {
            vscode.window.showInformationMessage('Hello from Dattoham AI Plugin! 🚀');
        });

        context.subscriptions.push(command);
    }

    deactivate() {
        console.log('🔌 Hello World Plugin deactivated');
    }
}

// Plugin registration
export function createPlugin(): DattohamPlugin {
    return new HelloWorldPlugin();
}

// Plugin metadata
export const pluginManifest = {
    name: 'hello-world',
    displayName: 'Hello World Plugin',
    description: 'Example plugin for Dattoham AI',
    version: '1.0.0',
    author: 'Dattoham AI Team',
    contributes: {
        commands: [
            {
                command: 'dattoham-ai.helloWorld',
                title: 'Hello World',
                category: 'Dattoham AI Plugin'
            }
        ]
    }
};