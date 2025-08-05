import * as vscode from 'vscode';
import { SecurityIssue } from './types';

export class SecurityScanner {
    private secretPatterns = [
        { pattern: /(?:password|pwd|pass)\s*[:=]\s*["']([^"']+)["']/gi, type: 'secret' as const },
        { pattern: /(?:api[_-]?key|apikey)\s*[:=]\s*["']([^"']+)["']/gi, type: 'secret' as const },
        { pattern: /(?:secret|token)\s*[:=]\s*["']([^"']+)["']/gi, type: 'secret' as const },
        { pattern: /sk-[a-zA-Z0-9]{48}/g, type: 'secret' as const },
        { pattern: /ghp_[a-zA-Z0-9]{36}/g, type: 'secret' as const }
    ];

    private sqlPatterns = [
        /SELECT\s+.*\s+FROM\s+.*\s+WHERE\s+.*\+/gi,
        /INSERT\s+INTO\s+.*\s+VALUES\s*\(.*\+/gi,
        /UPDATE\s+.*\s+SET\s+.*\+/gi,
        /DELETE\s+FROM\s+.*\s+WHERE\s+.*\+/gi
    ];

    private xssPatterns = [
        /innerHTML\s*=\s*.*\+/gi,
        /document\.write\s*\(.*\+/gi,
        /eval\s*\(/gi,
        /dangerouslySetInnerHTML/gi
    ];

    async scanDocument(document: vscode.TextDocument): Promise<SecurityIssue[]> {
        const issues: SecurityIssue[] = [];
        const text = document.getText();
        const lines = text.split('\n');

        lines.forEach((line, index) => {
            // Check for secrets
            this.secretPatterns.forEach(({ pattern, type }) => {
                const matches = line.match(pattern);
                if (matches) {
                    issues.push({
                        type,
                        line: index + 1,
                        severity: 'critical',
                        message: 'Hardcoded secret detected',
                        fix: 'Use environment variables or secure storage'
                    });
                }
            });

            // Check for SQL injection
            this.sqlPatterns.forEach(pattern => {
                if (pattern.test(line)) {
                    issues.push({
                        type: 'sql_injection',
                        line: index + 1,
                        severity: 'high',
                        message: 'Potential SQL injection vulnerability',
                        fix: 'Use parameterized queries or prepared statements'
                    });
                }
            });

            // Check for XSS
            this.xssPatterns.forEach(pattern => {
                if (pattern.test(line)) {
                    issues.push({
                        type: 'xss',
                        line: index + 1,
                        severity: 'high',
                        message: 'Potential XSS vulnerability',
                        fix: 'Sanitize user input and use safe DOM manipulation'
                    });
                }
            });

            // Check for path traversal
            if (/\.\.[\/\\]/.test(line)) {
                issues.push({
                    type: 'path_traversal',
                    line: index + 1,
                    severity: 'medium',
                    message: 'Potential path traversal vulnerability',
                    fix: 'Validate and sanitize file paths'
                });
            }
        });

        return issues;
    }

    async scanProject(): Promise<SecurityIssue[]> {
        const issues: SecurityIssue[] = [];
        const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
        
        if (!workspaceFolder) {return issues;}

        // Scan common sensitive files
        const sensitiveFiles = ['.env', 'config.json', 'secrets.json'];
        
        for (const file of sensitiveFiles) {
            try {
                const uri = vscode.Uri.joinPath(workspaceFolder.uri, file);
                const document = await vscode.workspace.openTextDocument(uri);
                const fileIssues = await this.scanDocument(document);
                issues.push(...fileIssues);
            } catch (error) {
                // File doesn't exist, continue
            }
        }

        return issues;
    }

    generateSecurityReport(issues: SecurityIssue[]): string {
        if (issues.length === 0) {
            return '✅ No security issues found!';
        }

        const critical = issues.filter(i => i.severity === 'critical').length;
        const high = issues.filter(i => i.severity === 'high').length;
        const medium = issues.filter(i => i.severity === 'medium').length;
        const low = issues.filter(i => i.severity === 'low').length;

        let report = `🔒 Security Scan Results\n\n`;
        report += `Critical: ${critical} | High: ${high} | Medium: ${medium} | Low: ${low}\n\n`;

        issues.forEach((issue, index) => {
            const severity = issue.severity.toUpperCase();
            report += `${index + 1}. [${severity}] Line ${issue.line}: ${issue.message}\n`;
            if (issue.fix) {
                report += `   Fix: ${issue.fix}\n`;
            }
            report += '\n';
        });

        return report;
    }
}