// Mock performance test for CI compatibility
import * as fs from 'fs';
import * as path from 'path';

function validatePerformanceMetrics(): boolean {
    try {
        const packagePath = path.resolve(__dirname, '../../../package.json');
        const packageContent = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
        
        console.log('⚡ Performance validation:');
        
        // Check package size (should be reasonable)
        const packageStats = fs.statSync(packagePath);
        const packageSizeKB = packageStats.size / 1024;
        console.log(`   Package.json size: ${packageSizeKB.toFixed(2)}KB`);
        
        // Check number of dependencies
        const deps = Object.keys(packageContent.dependencies || {});
        const devDeps = Object.keys(packageContent.devDependencies || {});
        console.log(`   Production dependencies: ${deps.length}`);
        console.log(`   Development dependencies: ${devDeps.length}`);
        
        // Check if extension has reasonable activation events
        const activationEvents = packageContent.activationEvents || [];
        console.log(`   Activation events: ${activationEvents.length}`);
        
        // Performance criteria
        const performanceOK = packageSizeKB < 50 && deps.length < 10 && devDeps.length < 20;
        
        return performanceOK;
    } catch (error) {
        console.error('❌ Performance validation failed:', error);
        return false;
    }
}

function validateMemoryFootprint(): boolean {
    const memUsage = process.memoryUsage();
    const heapUsedMB = memUsage.heapUsed / 1024 / 1024;
    
    console.log('💾 Memory validation:');
    console.log(`   Heap used: ${heapUsedMB.toFixed(2)}MB`);
    console.log(`   RSS: ${(memUsage.rss / 1024 / 1024).toFixed(2)}MB`);
    
    return heapUsedMB < 50; // Should use less than 50MB
}

async function runPerformanceTests(): Promise<void> {
    console.log('⚡ Running Mock Performance Tests...\n');
    
    const performanceValidation = validatePerformanceMetrics();
    const memoryValidation = validateMemoryFootprint();
    
    console.log('\n📊 Performance Test Results:');
    console.log(`   Performance metrics: ${performanceValidation ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`   Memory footprint: ${memoryValidation ? '✅ PASS' : '❌ FAIL'}`);
    
    if (performanceValidation && memoryValidation) {
        console.log('\n🚀 All performance tests passed!');
        process.exit(0);
    } else {
        console.log('\n❌ Some performance tests failed!');
        process.exit(1);
    }
}

runPerformanceTests();