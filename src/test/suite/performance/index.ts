import * as path from 'path';
import Mocha from 'mocha';

export function run(): Promise<void> {
    const mocha = new Mocha({
        ui: 'tdd',
        color: true,
        timeout: 30000
    });

    const testsRoot = path.resolve(__dirname, '..');
    
    // Add performance test files directly
    mocha.addFile(path.resolve(testsRoot, 'suite/performance/performance.test.js'));

    return new Promise((c, e) => {
        mocha.run((failures: number) => {
            if (failures > 0) {
                e(new Error(`${failures} performance tests failed.`));
            } else {
                c();
            }
        });
    });
}