import * as vscode from 'vscode';
import * as path from 'path';

export interface ProjectContext {
    files: string[];
    dependencies: string[];
    framework: string;
    language: string;
    structure: any;
}

export class ContextProvider {
    async getProjectContext(): Promise<ProjectContext> {
        const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
        if (!workspaceFolder) {
            return { files: [], dependencies: [], framework: 'unknown', language: 'unknown', structure: {} };
        }

        const files = await this.scanFiles(workspaceFolder.uri);
        const dependencies = await this.extractDependencies(workspaceFolder.uri);
        const framework = this.detectFramework(files);
        const language = this.detectLanguage(files);

        return { files, dependencies, framework, language, structure: {} };
    }

    private async scanFiles(uri: vscode.Uri): Promise<string[]> {
        const files: string[] = [];
        try {
            const entries = await vscode.workspace.fs.readDirectory(uri);
            for (const [name, type] of entries) {
                if (type === vscode.FileType.File && this.isCodeFile(name)) {
                    files.push(name);
                }
            }
        } catch (error) {
            console.error('Error scanning files:', error);
        }
        return files;
    }

    private async extractDependencies(uri: vscode.Uri): Promise<string[]> {
        const deps: string[] = [];
        try {
            const packageJson = vscode.Uri.joinPath(uri, 'package.json');
            const content = await vscode.workspace.fs.readFile(packageJson);
            const pkg = JSON.parse(content.toString());
            deps.push(...Object.keys(pkg.dependencies || {}));
        } catch (error) {
            // No package.json or error reading
        }
        return deps;
    }

    private detectFramework(files: string[]): string {
        if (files.some(f => f.includes('react'))) {return 'React';}
        if (files.some(f => f.includes('vue'))) {return 'Vue';}
        if (files.some(f => f.includes('angular'))) {return 'Angular';}
        if (files.some(f => f.includes('django'))) {return 'Django';}
        if (files.some(f => f.includes('flask'))) {return 'Flask';}
        return 'unknown';
    }

    private detectLanguage(files: string[]): string {
        const extensions = files.map(f => path.extname(f));
        if (extensions.includes('.ts') || extensions.includes('.tsx')) {return 'TypeScript';}
        if (extensions.includes('.js') || extensions.includes('.jsx')) {return 'JavaScript';}
        if (extensions.includes('.py')) {return 'Python';}
        if (extensions.includes('.java')) {return 'Java';}
        if (extensions.includes('.cpp') || extensions.includes('.c')) {return 'C++';}
        return 'unknown';
    }

    private isCodeFile(name: string): boolean {
        const codeExts = ['.js', '.ts', '.py', '.java', '.cpp', '.c', '.rs', '.go', '.php', '.rb', '.cs'];
        return codeExts.some(ext => name.endsWith(ext));
    }
}