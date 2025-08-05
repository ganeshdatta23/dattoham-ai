import * as vscode from 'vscode';
import * as path from 'path';

export interface FrameworkInfo {
    name: string;
    version?: string;
    configFiles: string[];
    dependencies: string[];
    patterns: string[];
}

export class FrameworkDetector {
    async detectFrameworks(): Promise<FrameworkInfo[]> {
        const frameworks: FrameworkInfo[] = [];
        const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
        
        if (!workspaceFolder) {return frameworks;}

        // Check for React/Next.js
        if (await this.hasFile(workspaceFolder.uri, 'next.config.js') || 
            await this.hasFile(workspaceFolder.uri, 'next.config.ts')) {
            frameworks.push({
                name: 'Next.js',
                configFiles: ['next.config.js', 'next.config.ts'],
                dependencies: ['next', 'react', 'react-dom'],
                patterns: ['pages/', 'app/', 'components/']
            });
        } else if (await this.hasDependency(workspaceFolder.uri, 'react')) {
            frameworks.push({
                name: 'React',
                configFiles: ['package.json'],
                dependencies: ['react', 'react-dom'],
                patterns: ['src/', 'components/', 'hooks/']
            });
        }

        // Check for Node.js
        if (await this.hasFile(workspaceFolder.uri, 'package.json')) {
            frameworks.push({
                name: 'Node.js',
                configFiles: ['package.json'],
                dependencies: ['express', 'fastify', 'koa'],
                patterns: ['server.js', 'app.js', 'index.js']
            });
        }

        // Check for Python frameworks
        if (await this.hasFile(workspaceFolder.uri, 'requirements.txt') ||
            await this.hasFile(workspaceFolder.uri, 'pyproject.toml')) {
            
            if (await this.hasDependency(workspaceFolder.uri, 'django')) {
                frameworks.push({
                    name: 'Django',
                    configFiles: ['settings.py', 'manage.py'],
                    dependencies: ['django'],
                    patterns: ['models.py', 'views.py', 'urls.py']
                });
            }
            
            if (await this.hasDependency(workspaceFolder.uri, 'flask')) {
                frameworks.push({
                    name: 'Flask',
                    configFiles: ['app.py', 'main.py'],
                    dependencies: ['flask'],
                    patterns: ['routes/', 'templates/']
                });
            }

            if (await this.hasDependency(workspaceFolder.uri, 'fastapi')) {
                frameworks.push({
                    name: 'FastAPI',
                    configFiles: ['main.py'],
                    dependencies: ['fastapi', 'uvicorn'],
                    patterns: ['routers/', 'models/']
                });
            }
        }

        // Check for TypeScript
        if (await this.hasFile(workspaceFolder.uri, 'tsconfig.json')) {
            frameworks.push({
                name: 'TypeScript',
                configFiles: ['tsconfig.json'],
                dependencies: ['typescript'],
                patterns: ['.ts', '.tsx']
            });
        }

        // Check for MongoDB
        if (await this.hasDependency(workspaceFolder.uri, 'mongodb') ||
            await this.hasDependency(workspaceFolder.uri, 'mongoose')) {
            frameworks.push({
                name: 'MongoDB',
                configFiles: [],
                dependencies: ['mongodb', 'mongoose'],
                patterns: ['models/', 'schemas/']
            });
        }

        return frameworks;
    }

    private async hasFile(workspaceUri: vscode.Uri, fileName: string): Promise<boolean> {
        try {
            const fileUri = vscode.Uri.joinPath(workspaceUri, fileName);
            await vscode.workspace.fs.stat(fileUri);
            return true;
        } catch {
            return false;
        }
    }

    private async hasDependency(workspaceUri: vscode.Uri, depName: string): Promise<boolean> {
        try {
            const packageJsonUri = vscode.Uri.joinPath(workspaceUri, 'package.json');
            const content = await vscode.workspace.fs.readFile(packageJsonUri);
            const pkg = JSON.parse(content.toString());
            
            return !!(pkg.dependencies?.[depName] || pkg.devDependencies?.[depName]);
        } catch {
            // Try requirements.txt for Python
            try {
                const reqUri = vscode.Uri.joinPath(workspaceUri, 'requirements.txt');
                const content = await vscode.workspace.fs.readFile(reqUri);
                return content.toString().includes(depName);
            } catch {
                return false;
            }
        }
    }

    getFrameworkSpecificPrompts(frameworks: FrameworkInfo[]): string {
        const prompts: string[] = [];
        
        for (const framework of frameworks) {
            switch (framework.name) {
                case 'React':
                    prompts.push('Use React hooks, functional components, and modern React patterns.');
                    break;
                case 'Next.js':
                    prompts.push('Follow Next.js conventions: pages/app router, SSR/SSG patterns, API routes.');
                    break;
                case 'Node.js':
                    prompts.push('Use async/await, proper error handling, and Node.js best practices.');
                    break;
                case 'TypeScript':
                    prompts.push('Use proper TypeScript types, interfaces, and type safety.');
                    break;
                case 'Django':
                    prompts.push('Follow Django patterns: models, views, templates, URL routing.');
                    break;
                case 'Flask':
                    prompts.push('Use Flask blueprints, decorators, and proper request handling.');
                    break;
                case 'FastAPI':
                    prompts.push('Use FastAPI async patterns, Pydantic models, and dependency injection.');
                    break;
                case 'MongoDB':
                    prompts.push('Use MongoDB queries, aggregation pipelines, and proper schema design.');
                    break;
            }
        }
        
        return prompts.join(' ');
    }
}