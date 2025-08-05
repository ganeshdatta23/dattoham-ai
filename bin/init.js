#!/usr/bin/env node
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
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const projectTemplate = {
    'src/extension.ts': `import * as vscode from 'vscode';

export function activate(context: vscode.ExtensionContext) {
    console.log('🤖 Dattoham AI Extension activated!');
    
    const command = vscode.commands.registerCommand('dattoham-ai.hello', () => {
        vscode.window.showInformationMessage('Hello from Dattoham AI!');
    });
    
    context.subscriptions.push(command);
}

export function deactivate() {}`,
    'package.json': `{
  "name": "dattoham-ai-extension",
  "displayName": "Dattoham AI",
  "description": "World's most advanced free coding assistant",
  "version": "1.0.0",
  "engines": { "vscode": "^1.74.0" },
  "main": "./out/extension.js",
  "activationEvents": ["onStartupFinished"],
  "contributes": {
    "commands": [{
      "command": "dattoham-ai.hello",
      "title": "Hello Dattoham AI"
    }]
  },
  "scripts": {
    "compile": "tsc -p ./",
    "watch": "tsc -watch -p ./"
  },
  "devDependencies": {
    "@types/vscode": "^1.74.0",
    "typescript": "^4.9.4"
  }
}`,
    'tsconfig.json': `{
  "compilerOptions": {
    "module": "commonjs",
    "target": "ES2020",
    "outDir": "out",
    "lib": ["ES2020"],
    "sourceMap": true,
    "rootDir": "src",
    "strict": true
  }
}`,
    'README.md': `# Dattoham AI Extension

Generated with \`npx dattoham init\`

## Development

1. \`npm install\`
2. \`npm run compile\`
3. Press F5 to debug
`
};
function createProject(targetDir) {
    if (!fs.existsSync(targetDir)) {
        fs.mkdirSync(targetDir, { recursive: true });
    }
    Object.entries(projectTemplate).forEach(([filePath, content]) => {
        const fullPath = path.join(targetDir, filePath);
        const dir = path.dirname(fullPath);
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
        fs.writeFileSync(fullPath, content);
        console.log(`✅ Created ${filePath}`);
    });
    console.log(`\n🚀 Dattoham AI project created in ${targetDir}`);
    console.log('Next steps:');
    console.log('  cd', path.basename(targetDir));
    console.log('  npm install');
    console.log('  npm run compile');
}
// CLI execution
const targetDir = process.argv[2] || 'dattoham-ai-extension';
createProject(targetDir);
//# sourceMappingURL=init.js.map