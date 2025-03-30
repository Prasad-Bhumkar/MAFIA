"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.activate = activate;
exports.deactivate = deactivate;
const ExtensionMain_1 = require("./ExtensionMain");
const DocumentationCommand_1 = require("./commands/DocumentationCommand");
function activate(context) {
    // Initialize main extension functionality
    new ExtensionMain_1.ExtensionMain(context);
    // Register documentation generation command
    const docCommand = new DocumentationCommand_1.DocumentationCommand(context);
    context.subscriptions.push(docCommand.register());
    console.log('MAFIA extension is now active!');
}
function deactivate() {
    console.log('MAFIA extension is now deactivated');
}
//# sourceMappingURL=extension.js.map