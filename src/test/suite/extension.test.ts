import * as assert from 'assert';
import * as vscode from 'vscode';

const EXPECTED_COMMANDS = [
    'dattoham-ai.generateCode',
    'dattoham-ai.optimizeCode',
    'dattoham-ai.explainCode',
    'dattoham-ai.debugCode',
    'dattoham-ai.generateTests',
    'dattoham-ai.reviewCode',
    'dattoham-ai.openWebview',
    'dattoham-ai.securityScan',
    'dattoham-ai.generateDiagram',
    'dattoham-ai.refactorCode',
    'dattoham-ai.addComments',
    'dattoham-ai.sendFeedback',
    'dattoham-ai.updateModels'
];

suite('Extension Test Suite', () => {
    let extension: vscode.Extension<any> | undefined;

    suiteSetup(async () => {
        extension = vscode.extensions.getExtension('GaneshDattaPadamata.dattoham-ai-code-agent');
        if (extension && !extension.isActive) {
            await extension.activate();
        }
    });

    test('Extension should be present', () => {
        assert.ok(extension, 'Extension should be found');
    });

    test('Extension should activate without errors', async () => {
        assert.ok(extension, 'Extension should exist');
        if (extension && !extension.isActive) {
            await extension.activate();
        }
        assert.ok(extension?.isActive, 'Extension should be active');
    });

    test('All 13 commands should be registered', async () => {
        const commands = await vscode.commands.getCommands();
        const dattohamCommands = commands.filter(cmd => cmd.startsWith('dattoham-ai.'));
        
        assert.strictEqual(dattohamCommands.length, EXPECTED_COMMANDS.length, 
            `Expected ${EXPECTED_COMMANDS.length} commands, found ${dattohamCommands.length}`);
        
        for (const expectedCmd of EXPECTED_COMMANDS) {
            assert.ok(dattohamCommands.includes(expectedCmd), 
                `Command ${expectedCmd} should be registered`);
        }
    });

    test('Commands should execute without throwing', async () => {
        // Test non-destructive commands
        const safeCommands = ['dattoham-ai.openWebview'];
        
        for (const cmd of safeCommands) {
            try {
                await vscode.commands.executeCommand(cmd);
                assert.ok(true, `Command ${cmd} executed successfully`);
            } catch (error) {
                assert.fail(`Command ${cmd} threw error: ${error}`);
            }
        }
    });
});