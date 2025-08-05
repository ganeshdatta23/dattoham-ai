import * as assert from 'assert';
import { performance } from 'perf_hooks';
import { AIEngine } from '../src/aiEngine';
import { LLMService } from '../src/llmService';
import { ModelManager } from '../src/modelManager';
import { CodeAnalyzer } from '../src/codeAnalyzer';

interface PerformanceMetrics {
    operation: string;
    duration: number;
    memoryUsage: number;
    success: boolean;
}

suite('Performance Benchmarks', () => {
    let aiEngine: AIEngine;
    const metrics: PerformanceMetrics[] = [];

    setup(() => {
        const modelManager = new ModelManager();
        const llmService = new LLMService();
        const codeAnalyzer = new CodeAnalyzer();
        aiEngine = new AIEngine(llmService, codeAnalyzer);
    });

    async function measurePerformance<T>(
        operation: string,
        fn: () => Promise<T>
    ): Promise<T> {
        const startTime = performance.now();
        const startMemory = process.memoryUsage().heapUsed;
        
        try {
            const result = await fn();
            const endTime = performance.now();
            const endMemory = process.memoryUsage().heapUsed;
            
            metrics.push({
                operation,
                duration: endTime - startTime,
                memoryUsage: endMemory - startMemory,
                success: true
            });
            
            return result;
        } catch (error) {
            const endTime = performance.now();
            metrics.push({
                operation,
                duration: endTime - startTime,
                memoryUsage: 0,
                success: false
            });
            throw error;
        }
    }

    test('Code generation performance', async function() {
        this.timeout(10000); // 10 second timeout
        
        const result = await measurePerformance('generateCode', async () => {
            return await aiEngine.generateCode('Create a simple function', {});
        });
        
        assert.ok(result.length > 0);
        const metric = metrics.find(m => m.operation === 'generateCode');
        assert.ok(metric);
        assert.ok(metric.duration < 5000); // Should complete within 5 seconds
    });

    test('Code optimization performance', async function() {
        this.timeout(10000);
        
        const testCode = `
        function inefficientSort(arr) {
            for (let i = 0; i < arr.length; i++) {
                for (let j = 0; j < arr.length - 1; j++) {
                    if (arr[j] > arr[j + 1]) {
                        let temp = arr[j];
                        arr[j] = arr[j + 1];
                        arr[j + 1] = temp;
                    }
                }
            }
            return arr;
        }`;
        
        const result = await measurePerformance('optimizeCode', async () => {
            return await aiEngine.optimizeCode(testCode, 'javascript');
        });
        
        assert.ok(result.length > 0);
        const metric = metrics.find(m => m.operation === 'optimizeCode');
        assert.ok(metric);
        assert.ok(metric.duration < 5000);
    });

    suiteTeardown(() => {
        // Export performance metrics for CI
        const report = {
            timestamp: new Date().toISOString(),
            metrics: metrics,
            summary: {
                totalOperations: metrics.length,
                successRate: metrics.filter(m => m.success).length / metrics.length,
                averageDuration: metrics.reduce((sum, m) => sum + m.duration, 0) / metrics.length,
                totalMemoryUsage: metrics.reduce((sum, m) => sum + m.memoryUsage, 0)
            }
        };
        
        console.log('📊 Performance Report:', JSON.stringify(report, null, 2));
        
        // Write to file for CI
        require('fs').writeFileSync('performance-report.json', JSON.stringify(report, null, 2));
    });
});