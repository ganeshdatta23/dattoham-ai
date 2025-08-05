import * as vscode from 'vscode';
import { CodeContext } from './codeAnalyzer';

export class DiagramGenerator {
    generateClassDiagram(context: CodeContext): string {
        let mermaid = 'classDiagram\n';
        
        context.classes.forEach(cls => {
            mermaid += `    class ${cls.name} {\n`;
            
            cls.properties.forEach(prop => {
                mermaid += `        ${prop.type || 'any'} ${prop.name}\n`;
            });
            
            cls.methods.forEach(method => {
                const params = method.parameters.join(', ');
                mermaid += `        ${method.name}(${params})\n`;
            });
            
            mermaid += '    }\n';
        });

        return mermaid;
    }

    generateFlowchart(functions: any[]): string {
        let mermaid = 'flowchart TD\n';
        
        functions.forEach((func, index) => {
            const nodeId = `A${index}`;
            mermaid += `    ${nodeId}[${func.name}]\n`;
            
            if (func.complexity > 5) {
                mermaid += `    ${nodeId} --> B${index}[High Complexity]\n`;
                mermaid += `    B${index} --> C${index}[Consider Refactoring]\n`;
            }
        });

        return mermaid;
    }

    generateArchitectureDiagram(context: any): string {
        let mermaid = 'graph TB\n';
        
        if (context.framework === 'React') {
            mermaid += '    A[Components] --> B[State Management]\n';
            mermaid += '    B --> C[API Layer]\n';
            mermaid += '    C --> D[Backend Services]\n';
        } else if (context.framework === 'Node.js') {
            mermaid += '    A[Routes] --> B[Controllers]\n';
            mermaid += '    B --> C[Services]\n';
            mermaid += '    C --> D[Database]\n';
        } else {
            mermaid += '    A[Entry Point] --> B[Core Logic]\n';
            mermaid += '    B --> C[Data Layer]\n';
        }

        return mermaid;
    }

    async showDiagram(diagramCode: string, title: string) {
        const panel = vscode.window.createWebviewPanel(
            'dattohamDiagram',
            title,
            vscode.ViewColumn.Beside,
            { enableScripts: true }
        );

        panel.webview.html = this.getDiagramHtml(diagramCode, title);
    }

    private getDiagramHtml(diagramCode: string, title: string): string {
        return `<!DOCTYPE html>
<html>
<head>
    <title>${title}</title>
    <script src="https://cdn.jsdelivr.net/npm/mermaid/dist/mermaid.min.js"></script>
    <style>
        body { font-family: var(--vscode-font-family); padding: 20px; background: var(--vscode-editor-background); color: var(--vscode-editor-foreground); }
        .diagram { text-align: center; margin: 20px 0; }
        h1 { color: var(--vscode-textLink-foreground); }
    </style>
</head>
<body>
    <h1>${title}</h1>
    <div class="diagram">
        <div class="mermaid">
${diagramCode}
        </div>
    </div>
    
    <script>
        mermaid.initialize({ 
            startOnLoad: true,
            theme: 'dark',
            themeVariables: {
                primaryColor: '#007ACC',
                primaryTextColor: '#FFFFFF',
                primaryBorderColor: '#007ACC',
                lineColor: '#CCCCCC'
            }
        });
    </script>
</body>
</html>`;
    }
}