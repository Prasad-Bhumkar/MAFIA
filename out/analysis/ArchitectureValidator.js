"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ArchitectureValidator = void 0;
const DependencyMapper_1 = require("./DependencyMapper");
class ArchitectureValidator {
    constructor(context) {
        this.dependencyMapper = new DependencyMapper_1.DependencyMapper(context);
    }
    validateArchitecture(uri) {
        return __awaiter(this, void 0, void 0, function* () {
            const dependencies = yield this.dependencyMapper.analyzeDependencies(uri);
            const violations = this.checkArchitectureRules(dependencies);
            return {
                isValid: violations.length === 0,
                violations,
                score: this.calculateArchitectureScore(dependencies)
            };
        });
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
                data.dependencies.some(dep => { var _a; return ((_a = dependencies[dep]) === null || _a === void 0 ? void 0 : _a.type) === 'repository'; })) {
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