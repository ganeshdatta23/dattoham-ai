import * as vscode from 'vscode';
import { GitStatus } from './types';

export class GitIntegration {
    async getGitStatus(): Promise<GitStatus | undefined> {
        try {
            const gitExtension = vscode.extensions.getExtension('vscode.git')?.exports;
            if (!gitExtension) {return undefined;}

            const repo = gitExtension.getRepository(vscode.workspace.workspaceFolders?.[0]?.uri);
            if (!repo) {return undefined;}

            const branch = repo.state.HEAD?.name || 'main';
            const modified = repo.state.workingTreeChanges.map((c: any) => c.uri.fsPath);
            const staged = repo.state.indexChanges.map((c: any) => c.uri.fsPath);
            
            // Get recent commits
            const commits = await this.getRecentCommits(repo);

            return { branch, modified, staged, commits };
        } catch (error) {
            console.error('Git integration error:', error);
            return undefined;
        }
    }

    private async getRecentCommits(repo: any): Promise<string[]> {
        try {
            const log = await repo.log({ maxEntries: 5 });
            return log.map((commit: any) => `${commit.hash.substring(0, 7)}: ${commit.message}`);
        } catch {
            return [];
        }
    }

    async getDiff(filePath: string): Promise<string> {
        try {
            const gitExtension = vscode.extensions.getExtension('vscode.git')?.exports;
            const repo = gitExtension?.getRepository(vscode.Uri.file(filePath));
            
            if (!repo) {return '';}
            
            const diff = await repo.diffWithHEAD(filePath);
            return diff || '';
        } catch {
            return '';
        }
    }
}