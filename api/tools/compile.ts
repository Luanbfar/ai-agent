import fs from "fs";
import path from "path";

const DIST_DIR = "./src";

const importExportRegex = /\b(import|export)\b\s+([\s\S]*?)\s+from\s+['"](\.{1,2}\/[^'"]+)['"]/g;

function walk(dir: fs.PathLike, callback: { (filePath: any): void; (arg0: string): void }) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir as string, file);
    const stat = fs.statSync(fullPath);

    if (stat.isDirectory()) {
      walk(fullPath, callback);
    } else if (file.endsWith(".ts")) {
      callback(fullPath);
    }
  }
}

function fixImports(filePath: fs.PathOrFileDescriptor) {
  let content = fs.readFileSync(filePath, "utf8");
  let modified = false;

  content = content.replace(importExportRegex, (match, keyword, clause, importPath) => {
    if (
      (importPath.startsWith("./") || importPath.startsWith("../")) &&
      !importPath.endsWith(".ts") &&
      !importPath.endsWith(".json") &&
      !importPath.includes("?")
    ) {
      modified = true;
      return `${keyword} ${clause} from '${importPath}.ts'`;
    }
    return match;
  });

  if (modified) {
    fs.writeFileSync(filePath, content, "utf8");
    console.log(`✔ Fixed imports in: ${filePath}`);
  }
}

walk(DIST_DIR, fixImports);
