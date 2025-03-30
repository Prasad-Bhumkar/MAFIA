"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ArchitectureValidator = void 0;
const DependencyMapper_1 = require("./DependencyMapper");
class ArchitectureValidator {
    constructor(context) {
        this.dependencyMapper = new DependencyMapper_1.DependencyMapper(context);
    }
    async validateArchitecture(uri) {
        const dependencies = await this.dependencyMapper.analyzeDependencies(uri);
        const violations = this.checkArchitectureRules(dependencies);
        return {
            isValid: violations.length === 0,
            violations,
            score: this.calculateArchitectureScore(dependencies)
        };
    }
    checkArchitectureRules(dependencies) {
        const violations = [];
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
    findCircularDependencies(dependencies) {
        // Implementation of cycle detection
        return [];
    }
    calculateArchitectureScore(dependencies) {
        // Score based on dependency health
        return 0.8; // Placeholder
    }
}
exports.ArchitectureValidator = ArchitectureValidator;
//# sourceMappingURL=ArchitectureValidator.js.map