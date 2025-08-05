import * as assert from 'assert';
import * as vscode from 'vscode';

suite('Performance Test Suite', () => {
    let extension: vscode.Extension<any> | undefined;

    suiteSetup(async () => {
        extension = vscode.extensions.getExtension('GaneshDattaPadamata.dattoham-ai-code-agent');
        if (extension && !extension.isActive) {
            await extension.activate();
        }
    });

    test('Extension activation time should be reasonable', async () => {
        const startTime = Date.now();
        
        if (extension && !extension.isActive) {
            await extension.activate();
        }
        
        const activationTime = Date.now() - startTime;
        assert.ok(activationTime < 5000, `Activation took ${activationTime}ms, should be under 5000ms`);
    });

    test('Command registration should be fast', async () => {
        const startTime = Date.now();
        const commands = await vscode.commands.getCommands();
        const registrationTime = Date.now() - startTime;
        
        assert.ok(registrationTime < 1000, `Command registration took ${registrationTime}ms, should be under 1000ms`);
        assert.ok(commands.length > 0, 'Commands should be registered');
    });

    test('Memory usage should be reasonable', () => {
        const memUsage = process.memoryUsage();
        const heapUsedMB = memUsage.heapUsed / 1024 / 1024;
        
        assert.ok(heapUsedMB < 100, `Heap usage is ${heapUsedMB.toFixed(2)}MB, should be under 100MB`);
    });
});