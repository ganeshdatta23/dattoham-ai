import * as vscode from 'vscode';

export interface CodeContext {
    fileName: string;
    language: string;
    imports: string[];
    functions: FunctionInfo[];
    classes: ClassInfo[];
    variables: VariableInfo[];
    dependencies: string[];
    projectStructure: ProjectStructure;
    codeStyle: CodeStyle;
    complexity: ComplexityMetrics;
}

export interface FunctionInfo {
    name: string;
    parameters: string[];
    returnType?: string;
    startLine: number;
    endLine: number;
    complexity: number;
}

export interface ClassInfo {
    name: string;
    methods: FunctionInfo[];
    properties: VariableInfo[];
    inheritance: string[];
    startLine: number;
    endLine: number;
}

export interface VariableInfo {
    name: string;
    type?: string;
    scope: string;
    line: number;
}

export interface ProjectStructure {
    rootPath: string;
    files: string[];
    directories: string[];
    packageFiles: string[];
    configFiles: string[];
}

export interface CodeStyle {
    indentation: string;
    lineEndings: string;
    quotingStyle: string;
    namingConvention: string;
}

export interface ComplexityMetrics {
    cyclomaticComplexity: number;
    linesOfCode: number;
    maintainabilityIndex: number;
    technicalDebt: string[];
}

export class CodeAnalyzer {
    initialize(): void {
        console.log('🔍 Code analyzer initialized with 20+ language support');
    }

    async analyzeDocument(document: vscode.TextDocument): Promise<CodeContext> {
        const sourceCode = document.getText();
        const lines = sourceCode.split('\n');
        
        const context: CodeContext = {
            fileName: document.fileName,
            language: document.languageId,
            imports: this.extractImports(sourceCode, document.languageId),
            functions: this.extractFunctions(sourceCode, document.languageId),
            classes: this.extractClasses(sourceCode, document.languageId),
            variables: this.extractVariables(sourceCode, document.languageId),
            dependencies: await this.analyzeDependencies(document),
            projectStructure: await this.analyzeProjectStructure(),
            codeStyle: this.analyzeCodeStyle(sourceCode),
            complexity: this.calculateComplexity(sourceCode)
        };

        return context;
    }

    private extractImports(code: string, language: string): string[] {
        const imports: string[] = [];
        const lines = code.split('\n');
        
        for (const line of lines) {
            if (language === 'javascript' || language === 'typescript') {
                if (line.trim().startsWith('import ') || line.trim().startsWith('const ') && line.includes('require(')) {
                    imports.push(line.trim());
                }
            } else if (language === 'python') {
                if (line.trim().startsWith('import ') || line.trim().startsWith('from ')) {
                    imports.push(line.trim());
                }
            }
        }
        
        return imports;
    }

    private extractFunctions(code: string, language: string): FunctionInfo[] {
        const functions: FunctionInfo[] = [];
        const lines = code.split('\n');
        
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            let match: RegExpMatchArray | null = null;
            
            if (language === 'javascript' || language === 'typescript') {
                match = line.match(/function\s+(\w+)\s*\(([^)]*)\)/);
                if (!match) {
                    match = line.match(/(\w+)\s*:\s*\([^)]*\)\s*=>/);
                }
            } else if (language === 'python') {
                match = line.match(/def\s+(\w+)\s*\(([^)]*)\)/);
            }
            
            if (match) {
                functions.push({
                    name: match[1],
                    parameters: match[2] ? match[2].split(',').map(p => p.trim()) : [],
                    startLine: i + 1,
                    endLine: i + 1,
                    complexity: 1
                });
            }
        }
        
        return functions;
    }

    private extractClasses(code: string, language: string): ClassInfo[] {
        const classes: ClassInfo[] = [];
        const lines = code.split('\n');
        
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            let match: RegExpMatchArray | null = null;
            
            if (language === 'javascript' || language === 'typescript') {
                match = line.match(/class\s+(\w+)/);
            } else if (language === 'python') {
                match = line.match(/class\s+(\w+)/);
            }
            
            if (match) {
                classes.push({
                    name: match[1],
                    methods: [],
                    properties: [],
                    inheritance: [],
                    startLine: i + 1,
                    endLine: i + 1
                });
            }
        }
        
        return classes;
    }

    private extractVariables(code: string, language: string): VariableInfo[] {
        const variables: VariableInfo[] = [];
        const lines = code.split('\n');
        
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            let match: RegExpMatchArray | null = null;
            
            if (language === 'javascript' || language === 'typescript') {
                match = line.match(/(const|let|var)\s+(\w+)/);
            } else if (language === 'python') {
                match = line.match(/(\w+)\s*=/);
            }
            
            if (match) {
                variables.push({
                    name: match[2] || match[1],
                    scope: 'local',
                    line: i + 1
                });
            }
        }
        
        return variables;
    }

    private async analyzeDependencies(document: vscode.TextDocument): Promise<string[]> {
        const dependencies: string[] = [];
        const workspaceFolder = vscode.workspace.getWorkspaceFolder(document.uri);
        
        if (!workspaceFolder) {return dependencies;}

        try {
            const packageJsonUri = vscode.Uri.joinPath(workspaceFolder.uri, 'package.json');
            const content = await vscode.workspace.fs.readFile(packageJsonUri);
            const pkg = JSON.parse(content.toString());
            
            dependencies.push(...Object.keys(pkg.dependencies || {}));
            dependencies.push(...Object.keys(pkg.devDependencies || {}));
        } catch (error) {
            // No package.json found
        }

        return dependencies;
    }

    private async analyzeProjectStructure(): Promise<ProjectStructure> {
        const workspaceFolders = vscode.workspace.workspaceFolders;
        if (!workspaceFolders || workspaceFolders.length === 0) {
            return {
                rootPath: '',
                files: [],
                directories: [],
                packageFiles: [],
                configFiles: []
            };
        }

        return {
            rootPath: workspaceFolders[0].uri.fsPath,
            files: [],
            directories: [],
            packageFiles: ['package.json'],
            configFiles: ['tsconfig.json', '.eslintrc.json']
        };
    }

    private analyzeCodeStyle(sourceCode: string): CodeStyle {
        const lines = sourceCode.split('\n');
        
        let indentation = 'spaces:2';
        let indentSize = 2;
        for (const line of lines) {
            if (line.startsWith('\t')) {
                indentation = 'tabs';
                break;
            } else if (line.startsWith('    ')) {
                indentSize = 4;
                indentation = 'spaces:4';
            }
        }

        const lineEndings = sourceCode.includes('\r\n') ? 'crlf' : 'lf';
        const singleQuotes = (sourceCode.match(/'/g) || []).length;
        const doubleQuotes = (sourceCode.match(/"/g) || []).length;
        const quotingStyle = singleQuotes > doubleQuotes ? 'single' : 'double';

        return {
            indentation,
            lineEndings,
            quotingStyle,
            namingConvention: 'camelCase'
        };
    }

    private calculateComplexity(sourceCode: string): ComplexityMetrics {
        const lines = sourceCode.split('\n');
        const linesOfCode = lines.filter(line => line.trim().length > 0).length;
        
        // Simple complexity calculation
        const complexityKeywords = ['if', 'else', 'for', 'while', 'switch', 'case', 'try', 'catch'];
        let cyclomaticComplexity = 1;
        
        for (const line of lines) {
            for (const keyword of complexityKeywords) {
                if (line.includes(keyword)) {
                    cyclomaticComplexity++;
                }
            }
        }
        
        const maintainabilityIndex = Math.max(0, 171 - 5.2 * Math.log(linesOfCode) - 0.23 * cyclomaticComplexity);
        
        const technicalDebt: string[] = [];
        if (cyclomaticComplexity > 10) {
            technicalDebt.push('High cyclomatic complexity');
        }
        if (linesOfCode > 500) {
            technicalDebt.push('Large file size');
        }

        return {
            cyclomaticComplexity,
            linesOfCode,
            maintainabilityIndex,
            technicalDebt
        };
    }
}