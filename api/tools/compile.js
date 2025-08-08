import fs from 'fs';
import path from 'path';
const DIST_DIR = './dist';

const importExportRegex = /(import|export)([\s\S]*?)from\s+['"](\.\/[^'"]+)['"]/g;
function walk(dir, callback) {
    for (const file of fs.readdirSync(dir)) {
        const fullPath = path.join(dir.toString(), file);
        if (fs.statSync(fullPath).isDirectory()) {
            walk(fullPath, callback);
        }
        else if (file.endsWith('.js')) {
            callback(fullPath);
        }
    }
}
function fixImports(filePath) {
    let content = fs.readFileSync(filePath, 'utf8');
    let modified = false;
    content = content.replace(importExportRegex, (match, keyword, middle, importPath) => {
        if (importPath.startsWith('./') &&
            !importPath.endsWith('.js') &&
            !importPath.endsWith('.json') &&
            !importPath.includes('?')) {
            modified = true;
            return `${keyword}${middle}from '${importPath}.js'`;
        }
        return match;
    });
    if (modified) {
        fs.writeFileSync(filePath, content, 'utf8');
        console.log(`✔ Fixed imports in: ${filePath}`);
    }
}

walk(DIST_DIR, fixImports);