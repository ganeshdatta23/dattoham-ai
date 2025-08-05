"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const assert = __importStar(require("assert"));
const perf_hooks_1 = require("perf_hooks");
const aiEngine_1 = require("../src/aiEngine");
const llmService_1 = require("../src/llmService");
const modelManager_1 = require("../src/modelManager");
const codeAnalyzer_1 = require("../src/codeAnalyzer");
suite('Performance Benchmarks', () => {
    let aiEngine;
    const metrics = [];
    setup(() => {
        const modelManager = new modelManager_1.ModelManager();
        const llmService = new llmService_1.LLMService(modelManager);
        const codeAnalyzer = new codeAnalyzer_1.CodeAnalyzer();
        aiEngine = new aiEngine_1.AIEngine(llmService, codeAnalyzer);
    });
    async function measurePerformance(operation, fn) {
        const startTime = perf_hooks_1.performance.now();
        const startMemory = process.memoryUsage().heapUsed;
        try {
            const result = await fn();
            const endTime = perf_hooks_1.performance.now();
            const endMemory = process.memoryUsage().heapUsed;
            metrics.push({
                operation,
                duration: endTime - startTime,
                memoryUsage: endMemory - startMemory,
                success: true
            });
            return result;
        }
        catch (error) {
            const endTime = perf_hooks_1.performance.now();
            metrics.push({
                operation,
                duration: endTime - startTime,
                memoryUsage: 0,
                success: false
            });
            throw error;
        }
    }
    test('Code generation performance', async function () {
        this.timeout(10000); // 10 second timeout
        const result = await measurePerformance('generateCode', async () => {
            return await aiEngine.generateCode('Create a simple function', {});
        });
        assert.ok(result.length > 0);
        const metric = metrics.find(m => m.operation === 'generateCode');
        assert.ok(metric);
        assert.ok(metric.duration < 5000); // Should complete within 5 seconds
    });
    test('Code optimization performance', async function () {
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
//# sourceMappingURL=performance.test.js.map