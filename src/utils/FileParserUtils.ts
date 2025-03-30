import * as path from 'path';
import * as fs from 'fs';
import * as crypto from 'crypto';

export class FileParserUtils {
    static getBasicClassInfo(content: string, filePath: string): 
        { package: string; className: string; filePath: string } {
        const packageMatch = content.match(/package\s+([\w.]+);/);
        const classMatch = content.match(/class\s+(\w+)/);
        
        return {
            package: packageMatch?.[1] || '',
            className: classMatch?.[1] || path.basename(filePath, '.java'),
            filePath
        };
    }

    static parseAnnotations(content: string): string[] {
        const matches = content.match(/@(\w+)/g) || [];
        return [...new Set(matches.map(m => m.substring(1)))];
    }

    static findDependencies(content: string): { field: string; type: string }[] {
        const dependencies: { field: string; type: string }[] = [];
        const regex = /@(?:Autowired|Inject)[^;]+?(\w+)\s+(\w+)\s*;/g;
        let match;
        
        while ((match = regex.exec(content)) !== null) {
            dependencies.push({
                type: match[1],
                field: match[2]
            });
        }
        return dependencies;
    }

    static parseMethods(content: string): { name: string; annotations: string[] }[] {
        const methods: { name: string; annotations: string[] }[] = [];
        const regex = /(@\w+.*?)?\s*(?:public|private|protected)?\s*(?:\w+\s+)?(\w+)\s*\([^)]*\)/g;
        let match;
        
        while ((match = regex.exec(content)) !== null) {
            const annotations = match[1] ? 
                [...match[1].matchAll(/@(\w+)/g)].map(m => m[1]) : [];
            methods.push({
                name: match[2],
                annotations
            });
        }
        return methods;
    }

    static async getFileHash(filePath: string): Promise<string> {
        const content = await fs.promises.readFile(filePath);
        return crypto.createHash('sha256').update(content).digest('hex');
    }
}