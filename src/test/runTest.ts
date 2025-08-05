import * as path from 'path';
import { runTests, downloadAndUnzipVSCode } from '@vscode/test-electron';

async function main() {
    try {
        // Download VS Code if needed
        const vscodeExecutablePath = await downloadAndUnzipVSCode('stable');
        console.log('VS Code downloaded to:', vscodeExecutablePath);

        const extensionDevelopmentPath = path.resolve(__dirname, '../../../');
        const extensionTestsPath = path.resolve(__dirname, './suite/index');

        console.log('Extension development path:', extensionDevelopmentPath);
        console.log('Extension tests path:', extensionTestsPath);

        await runTests({
            vscodeExecutablePath,
            extensionDevelopmentPath,
            extensionTestsPath,
            launchArgs: ['--no-sandbox']
        });
        
        console.log('Tests completed successfully');
    } catch (err) {
        console.error('Failed to run tests:', err);
        process.exit(1);
    }
}

main();