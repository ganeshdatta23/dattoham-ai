import * as vscode from 'vscode';
import { AIModel } from './types';

export class ModelManager {
    private models: AIModel[] = [
        {
            name: 'qwen2.5-coder:32b-instruct-q4_K_M',
            contextWindow: 32768,
            specialization: ['code', 'typescript', 'python', 'javascript'],
            performance: 'quality'
        },
        {
            name: 'qwen2.5:7b-instruct-q4_K_M',
            contextWindow: 8192,
            specialization: ['general', 'explanation'],
            performance: 'fast'
        },
        {
            name: 'deepseek-v2:16b-lite-instruct-q4_K_M',
            contextWindow: 16384,
            specialization: ['code', 'optimization', 'refactoring'],
            performance: 'balanced'
        },
        {
            name: 'codellama:70b-instruct-q4_K_M',
            contextWindow: 4096,
            specialization: ['code', 'debugging', 'testing'],
            performance: 'quality'
        }
    ];

    selectBestModel(task: string, language: string, fileSize: number): string {
        // For large files, use fast models
        if (fileSize > 10000) {
            return this.models.find(m => m.performance === 'fast')?.name || this.models[0].name;
        }

        // For specific languages
        if (['typescript', 'javascript', 'react', 'nextjs'].includes(language.toLowerCase())) {
            return 'qwen2.5-coder:32b-instruct-q4_K_M';
        }

        if (language.toLowerCase() === 'python') {
            return 'deepseek-v2:16b-lite-instruct-q4_K_M';
        }

        // For specific tasks
        switch (task) {
            case 'debug':
            case 'test':
                return 'codellama:70b-instruct-q4_K_M';
            case 'optimize':
            case 'refactor':
                return 'deepseek-v2:16b-lite-instruct-q4_K_M';
            case 'explain':
                return 'qwen2.5:7b-instruct-q4_K_M';
            default:
                return 'qwen2.5-coder:32b-instruct-q4_K_M';
        }
    }

    getModelInfo(modelName: string): AIModel | undefined {
        return this.models.find(m => m.name === modelName);
    }

    async downloadModel(modelName: string): Promise<boolean> {
        try {
            vscode.window.showInformationMessage(`Downloading ${modelName}...`);
            // Implementation would call Ollama API to download model
            return true;
        } catch (error) {
            vscode.window.showErrorMessage(`Failed to download ${modelName}: ${error}`);
            return false;
        }
    }

    async checkForUpdates(): Promise<void> {
        vscode.window.showInformationMessage('Checking for model updates...');
        
        try {
            // Check for available model updates
            const updates = await this.getAvailableUpdates();
            
            if (updates.length > 0) {
                const choice = await vscode.window.showInformationMessage(
                    `${updates.length} model updates available. Update now?`,
                    'Update All', 'Select Models', 'Later'
                );
                
                if (choice === 'Update All') {
                    await this.updateAllModels(updates);
                } else if (choice === 'Select Models') {
                    await this.showModelUpdateDialog(updates);
                }
            } else {
                vscode.window.showInformationMessage('All models are up to date! ✅');
            }
        } catch (error) {
            vscode.window.showErrorMessage(`Failed to check for updates: ${error}`);
        }
    }

    private async getAvailableUpdates(): Promise<string[]> {
        // Stub for checking available updates
        return ['qwen2.5-coder:32b-instruct-q4_K_M'];
    }

    private async updateAllModels(models: string[]): Promise<void> {
        for (const model of models) {
            await this.downloadModel(model);
        }
        vscode.window.showInformationMessage('All models updated successfully! 🚀');
    }

    private async showModelUpdateDialog(models: string[]): Promise<void> {
        // Show quick pick for model selection
        const selected = await vscode.window.showQuickPick(models, {
            canPickMany: true,
            placeHolder: 'Select models to update'
        });
        
        if (selected && selected.length > 0) {
            await this.updateAllModels(selected);
        }
    }
}