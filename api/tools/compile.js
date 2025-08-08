import fs from "fs";
import path from "path";

const DIST_DIR = "./dist";

const importExportRegex = /\b(import|export)\b\s+([\s\S]*?)\s+from\s+['"](\.{1,2}\/[^'"]+)['"]/g;

function walk(dir, callback) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);

    if (stat.isDirectory()) {
      walk(fullPath, callback);
    } else if (file.endsWith(".js")) {
      callback(fullPath);
    }
  }
}

function fixImports(filePath) {
  let content = fs.readFileSync(filePath, "utf8");
  let modified = false;

  content = content.replace(importExportRegex, (match, keyword, clause, importPath) => {
    if (
      (importPath.startsWith("./") || importPath.startsWith("../")) &&
      !importPath.endsWith(".js") &&
      !importPath.endsWith(".json") &&
      !importPath.includes("?")
    ) {
      modified = true;
      return `${keyword} ${clause} from '${importPath}.js'`;
    }
    return match;
  });

  if (modified) {
    fs.writeFileSync(filePath, content, "utf8");
    console.log(`✔ Fixed imports in: ${filePath}`);
  }
}

walk(DIST_DIR, fixImports);
