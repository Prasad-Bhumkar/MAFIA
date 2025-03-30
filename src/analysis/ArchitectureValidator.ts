import * as vscode from 'vscode';
import { DependencyMapper } from './DependencyMapper';

export class ArchitectureValidator {
    private dependencyMapper: DependencyMapper;

    constructor(context: vscode.ExtensionContext) {
        this.dependencyMapper = new DependencyMapper(context);
    }

    public async validateArchitecture(uri: vscode.Uri): Promise<ValidationResult> {
        const dependencies = await this.dependencyMapper.analyzeDependencies(uri);
        const violations = this.checkArchitectureRules(dependencies);
        
        return {
            isValid: violations.length === 0,
            violations,
            score: this.calculateArchitectureScore(dependencies)
        };
    }

    private checkArchitectureRules(dependencies: DependencyMap): string[] {
        const violations: string[] = [];
        
        // Check for circular dependencies
        const circular = this.findCircularDependencies(dependencies);
        if (circular.length > 0) {
            violations.push(`Circular dependencies found: ${circular.join(', ')}`);
        }

        // Check layer violations
        for (const [component, data] of Object.entries(dependencies)) {
            if (data.type === 'controller' && 
                data.dependencies.some(dep => dependencies[dep]?.type === 'repository')) {
                violations.push(`Controller ${component} directly accesses repository`);
            }
        }

        return violations;
    }

    private findCircularDependencies(dependencies: DependencyMap): string[] {
        // Implementation of cycle detection
        return [];
    }

    private calculateArchitectureScore(dependencies: DependencyMap): number {
        // Score based on dependency health
        return 0.8; // Placeholder
    }
}

interface ValidationResult {
    isValid: boolean;
    violations: string[];
    score: number;
}

interface DependencyMap {
    [component: string]: {
        dependencies: string[];
        type: 'service' | 'controller' | 'repository' | 'config';
        stability: number;
    };
}