"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.initializeFeatures = initializeFeatures;
const AIServiceV2_1 = require("./ai/AIServiceV2");
const testCommands_1 = require("./commands/testCommands");
function initializeFeatures(context) {
    const aiService = AIServiceV2_1.AIServiceV2.getInstance(context);
    (0, testCommands_1.registerTestCommands)(context, aiService);
    // Add other feature initializers here
}
//# sourceMappingURL=initFeatures.js.map