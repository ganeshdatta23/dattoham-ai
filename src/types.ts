export interface ProjectContext {
    language: string;
    framework: string;
    dependencies: string[];
    files: string[];
    gitStatus?: GitStatus;
    packageJson?: any;
    tsConfig?: any;
}

export interface GitStatus {
    branch: string;
    modified: string[];
    staged: string[];
    commits: string[];
}

export interface AIModel {
    name: string;
    contextWindow: number;
    specialization: string[];
    performance: 'fast' | 'balanced' | 'quality';
}

export interface CodeAnalysis {
    complexity: number;
    security: SecurityIssue[];
    performance: PerformanceIssue[];
    suggestions: string[];
}

export interface SecurityIssue {
    type: 'secret' | 'sql_injection' | 'xss' | 'path_traversal';
    line: number;
    severity: 'low' | 'medium' | 'high' | 'critical';
    message: string;
    fix?: string;
}

export interface PerformanceIssue {
    type: 'memory' | 'cpu' | 'io' | 'algorithm';
    line: number;
    impact: 'low' | 'medium' | 'high';
    suggestion: string;
}

export interface ChatMessage {
    role: 'system' | 'user' | 'assistant';
    content: string;
    timestamp: number;
}