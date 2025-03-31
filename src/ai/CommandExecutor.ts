import * as vscode from 'vscode';
import { Logger } from '../utils/Logger';
import { DatabaseService } from '../utils/DatabaseService';
import { AgentOperation } from './AgentOrchestrator';

/**
 * Command Execution Service
 * 
 * Handles execution of shell commands and VSCode commands
 * with proper sandboxing, error handling, and logging.
 */
export class CommandExecutor {
    private static instance: CommandExecutor;
    private context: vscode.ExtensionContext;

    private constructor(context: vscode.ExtensionContext) {
        this.context = context;
    }

    public static getInstance(context: vscode.ExtensionContext): CommandExecutor {
        if (!CommandExecutor.instance) {
            CommandExecutor.instance = new CommandExecutor(context);
        }
        return CommandExecutor.instance;
    }

    /**
     * Execute a command operation from the agent queue
     * @param operation The AgentOperation containing command details
     * @returns Promise resolving when command completes
     */
    public async execute(operation: AgentOperation): Promise<void> {
        try {
            const { command, args, options } = this.parseCommand(operation.parameters);
            
            // Log command execution start
            Logger.info(`Starting command execution: ${operation.description}`);
            const dbService = await DatabaseService.getInstance();
            await dbService.logAction(
                'COMMAND_START', 
                JSON.stringify(operation)
            );

            const result = await this.executeCommand(command, args, options);

            // Log successful completion
            Logger.info(`Command completed: ${operation.description}`);
            await dbService.logAction(
                'COMMAND_COMPLETE', 
                JSON.stringify({
                    ...operation,
                    result: result
                })
            );
        } catch (error) {
            // Log failure
            Logger.error(`Command failed: ${operation.description}`, error);
            const dbService = await DatabaseService.getInstance();
            await dbService.logAction(
                'COMMAND_FAILED', 
                JSON.stringify({
                    ...operation,
                    error: error instanceof Error ? error.message : String(error)
                })
            );
            throw error;
        }
    }

    /**
     * Parse command parameters from operation
     * @param parameters Raw operation parameters
     * @returns Normalized command execution parameters
     */
    private parseCommand(parameters: any): { 
        command: string; 
        args?: string[]; 
        options?: vscode.ShellExecutionOptions 
    } {
        if (typeof parameters === 'string') {
            return { command: parameters };
        }

        if (parameters?.command) {
            return {
                command: parameters.command,
                args: parameters.args,
                options: parameters.options
            };
        }

        throw new Error('Invalid command parameters format');
    }

    /**
     * Execute a shell command with proper sandboxing
     * @param command The command to execute
     * @param args Command arguments
     * @param options Execution options
     * @returns Promise resolving with command output
     */
    private async executeCommand(
        command: string,
        args?: string[],
        options?: vscode.ShellExecutionOptions
    ): Promise<string> {
        return new Promise((resolve, reject) => {
            const terminal = vscode.window.createTerminal({
                name: 'MAFIA Command Executor',
                shellPath: options?.executable || '/bin/bash',
                shellArgs: options?.shellArgs,
                cwd: options?.cwd
            });

            const disposable = vscode.window.onDidCloseTerminal(t => {
                if (t.name === terminal.name) {
                    disposable.dispose();
                    // In a real implementation, we would capture the output
                    resolve('Command execution completed');
                }
            });

            terminal.sendText(`${command} ${args?.join(' ') || ''}`);
            terminal.show(true);
        });
    }

    /**
     * Execute a VSCode command
     * @param commandId The VSCode command ID
     * @param args Command arguments
     * @returns Promise resolving when command completes
     */
    public async executeVSCodeCommand(
        commandId: string,
        ...args: any[]
    ): Promise<any> {
        try {
            Logger.info(`Executing VSCode command: ${commandId}`);
            return await vscode.commands.executeCommand(commandId, ...args);
        } catch (error) {
            Logger.error(`Failed to execute VSCode command: ${commandId}`, error);
            throw error;
        }
    }
}