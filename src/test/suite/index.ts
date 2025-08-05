import * as path from 'path';
import Mocha from 'mocha';

export function run(): Promise<void> {
    const mocha = new Mocha({
        ui: 'tdd',
        color: true
    });

    const testsRoot = path.resolve(__dirname, '..');
    
    // Add test files directly
    mocha.addFile(path.resolve(testsRoot, 'suite/extension.test.js'));

    return new Promise((c, e) => {
        mocha.run((failures: number) => {
            if (failures > 0) {
                e(new Error(`${failures} tests failed.`));
            } else {
                c();
            }
        });
    });
}