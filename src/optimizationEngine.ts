import * as vscode from 'vscode';
import { CodeContext } from './codeAnalyzer';

export interface OptimizationSuggestion {
    type: 'performance' | 'security' | 'style' | 'maintainability';
    severity: 'error' | 'warning' | 'info';
    message: string;
    line: number;
    fix?: string;
}

export class OptimizationEngine {
    async analyzeDocument(document: vscode.TextDocument): Promise<OptimizationSuggestion[]> {
        const suggestions: OptimizationSuggestion[] = [];
        const text = document.getText();
        const lines = text.split('\n');

        // Performance checks
        suggestions.push(...this.checkPerformance(lines));
        
        // Security checks
        suggestions.push(...this.checkSecurity(lines, document.languageId));
        
        // Style checks
        suggestions.push(...this.checkStyle(lines));

        return suggestions;
    }

    private checkPerformance(lines: string[]): OptimizationSuggestion[] {
        const suggestions: OptimizationSuggestion[] = [];
        
        lines.forEach((line, index) => {
            // Check for inefficient loops
            if (line.includes('for') && line.includes('.length')) {
                suggestions.push({
                    type: 'performance',
                    severity: 'warning',
                    message: 'Cache array length in loop condition',
                    line: index + 1,
                    fix: 'Store array.length in a variable before the loop'
                });
            }
            
            // Check for synchronous operations
            if (line.includes('readFileSync') || line.includes('writeFileSync')) {
                suggestions.push({
                    type: 'performance',
                    severity: 'warning',
                    message: 'Use async file operations',
                    line: index + 1,
                    fix: 'Replace with async version (readFile/writeFile)'
                });
            }
        });

        return suggestions;
    }

    private checkSecurity(lines: string[], language: string): OptimizationSuggestion[] {
        const suggestions: OptimizationSuggestion[] = [];
        
        lines.forEach((line, index) => {
            // SQL injection check
            if (line.includes('SELECT') && line.includes('+')) {
                suggestions.push({
                    type: 'security',
                    severity: 'error',
                    message: 'Potential SQL injection vulnerability',
                    line: index + 1,
                    fix: 'Use parameterized queries'
                });
            }
            
            // Hardcoded credentials
            if (line.includes('password') && line.includes('=')) {
                suggestions.push({
                    type: 'security',
                    severity: 'error',
                    message: 'Hardcoded credentials detected',
                    line: index + 1,
                    fix: 'Use environment variables or secure storage'
                });
            }
        });

        return suggestions;
    }

    private checkStyle(lines: string[]): OptimizationSuggestion[] {
        const suggestions: OptimizationSuggestion[] = [];
        
        lines.forEach((line, index) => {
            // Long lines
            if (line.length > 120) {
                suggestions.push({
                    type: 'style',
                    severity: 'info',
                    message: 'Line too long',
                    line: index + 1,
                    fix: 'Break line into multiple lines'
                });
            }
            
            // Missing semicolons (JavaScript/TypeScript)
            if (line.trim() && !line.trim().endsWith(';') && !line.trim().endsWith('{') && !line.trim().endsWith('}')) {
                suggestions.push({
                    type: 'style',
                    severity: 'info',
                    message: 'Missing semicolon',
                    line: index + 1,
                    fix: 'Add semicolon at end of statement'
                });
            }
        });

        return suggestions;
    }
}