// Mock test runner for CI compatibility
import * as fs from 'fs';
import * as path from 'path';

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

function validatePackageJson(): boolean {
    try {
        const packagePath = path.resolve(__dirname, '../../../package.json');
        const packageContent = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
        
        const commands = packageContent.contributes?.commands || [];
        const commandIds = commands.map((cmd: any) => cmd.command);
        
        console.log('✅ Package.json validation:');
        console.log(`   Found ${commands.length} commands in package.json`);
        
        for (const expectedCmd of EXPECTED_COMMANDS) {
            if (commandIds.includes(expectedCmd)) {
                console.log(`   ✅ ${expectedCmd}`);
            } else {
                console.log(`   ❌ ${expectedCmd} - MISSING`);
                return false;
            }
        }
        
        return true;
    } catch (error) {
        console.error('❌ Package.json validation failed:', error);
        return false;
    }
}

function validateExtensionStructure(): boolean {
    try {
        const extensionPath = path.resolve(__dirname, '../extension.js');
        const extensionExists = fs.existsSync(extensionPath);
        
        console.log('✅ Extension structure validation:');
        console.log(`   Extension file exists: ${extensionExists}`);
        
        if (!extensionExists) {
            console.log('   ❌ Extension file not found');
            return false;
        }
        
        const extensionContent = fs.readFileSync(extensionPath, 'utf8');
        const hasActivateFunction = extensionContent.includes('function activate');
        const hasDeactivateFunction = extensionContent.includes('function deactivate');
        
        console.log(`   Has activate function: ${hasActivateFunction}`);
        console.log(`   Has deactivate function: ${hasDeactivateFunction}`);
        
        return hasActivateFunction && hasDeactivateFunction;
    } catch (error) {
        console.error('❌ Extension structure validation failed:', error);
        return false;
    }
}

async function runMockTests(): Promise<void> {
    console.log('🧪 Running Mock Extension Tests...\n');
    
    const packageValidation = validatePackageJson();
    const structureValidation = validateExtensionStructure();
    
    console.log('\n📊 Test Results:');
    console.log(`   Package.json validation: ${packageValidation ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`   Extension structure: ${structureValidation ? '✅ PASS' : '❌ FAIL'}`);
    
    if (packageValidation && structureValidation) {
        console.log('\n🎉 All mock tests passed!');
        process.exit(0);
    } else {
        console.log('\n❌ Some tests failed!');
        process.exit(1);
    }
}

runMockTests();