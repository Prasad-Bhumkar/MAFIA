import * as vscode from 'vscode';
import * as path from 'path';
import { ProjectScanner } from '../utils/ProjectScanner';
import { ProjectStructure } from '../utils/FileDetectorTypes';

export class ComponentVisualizer {
    constructor(private context: vscode.ExtensionContext) {}

    public async show(workspaceFolder: vscode.WorkspaceFolder): Promise<void> {
        const scanner = new ProjectScanner();
        const structure = await scanner.scanProject(workspaceFolder);
        
        const panel = vscode.window.createWebviewPanel(
            'componentVisualizer',
            'Component Visualizer',
            vscode.ViewColumn.One,
            {}
        );

        panel.webview.html = this.getVisualizationHtml(structure);
    }

    private generateDependencies(structure: ProjectStructure): Array<{source: string, target: string}> {
        const links: Array<{source: string, target: string}> = [];
        
        // Create controller-service dependencies
        structure.controllers.forEach(controller => {
            structure.services.forEach(service => {
                links.push({
                    source: controller.name, 
                    target: service.name
                });
            });
        });
        
        // Create service-repository dependencies
        structure.services.forEach(service => {
            structure.repositories.forEach(repo => {
                links.push({
                    source: service.name, 
                    target: repo.name
                });
            });
        });
        
        return links;
    }

    private getVisualizationHtml(structure: ProjectStructure): string {
        return `<!DOCTYPE html>
        <html>
        <head>
            <title>Component Relationships</title>
            <script src="https://d3js.org/d3.v7.min.js"></script>
            <script src="https://cdn.tailwindcss.com"></script>
            <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&display=swap" rel="stylesheet">
            <style>
                body { font-family: 'Inter', sans-serif; }
                .node { stroke: #fff; stroke-width: 1.5px; }
                .link { stroke: #9ca3af; stroke-opacity: 0.6; }
                .node text { pointer-events: none; font: 10px sans-serif; }
                #graph { width: 100%; height: 80vh; border: 1px solid #e5e7eb; border-radius: 0.5rem; }
            </style>
        </head>
        <body class="bg-gray-50 p-6">
            <div class="max-w-7xl mx-auto">
                <div class="flex justify-between items-center mb-6">
                    <h1 class="text-2xl font-bold text-gray-800">Component Relationships</h1>
                    <div class="flex space-x-2">
                        <button class="px-3 py-1 bg-blue-100 text-blue-800 rounded-md text-sm">Controllers: ${structure.controllers.length}</button>
                        <button class="px-3 py-1 bg-green-100 text-green-800 rounded-md text-sm">Services: ${structure.services.length}</button>
                        <button class="px-3 py-1 bg-purple-100 text-purple-800 rounded-md text-sm">Repositories: ${structure.repositories.length}</button>
                    </div>
                </div>
                <div id="graph" class="bg-white shadow-sm"></div>
            </div>
            <script>
                const data = {
                    nodes: [
                        ${structure.controllers.map(c => `{id: "${c.name}", group: 1, type: "controller"}`).join(',')},
                        ${structure.services.map(s => `{id: "${s.name}", group: 2, type: "service"}`).join(',')},
                        ${structure.repositories.map(r => `{id: "${r.name}", group: 3, type: "repository"}`).join(',')}
                    ],
                    links: ${JSON.stringify(this.generateDependencies(structure))}
                };

                const width = document.getElementById('graph').clientWidth;
                const height = document.getElementById('graph').clientHeight;

                const color = d3.scaleOrdinal()
                    .domain(["controller", "service", "repository"])
                    .range(["#ff7f0e", "#1f77b4", "#2ca02c"]);

                const simulation = d3.forceSimulation(data.nodes)
                    .force("link", d3.forceLink(data.links).id(d => d.id).distance(100))
                    .force("charge", d3.forceManyBody().strength(-300))
                    .force("x", d3.forceX(width / 2).strength(0.1))
                    .force("y", d3.forceY(height / 2).strength(0.1));

                const svg = d3.select("#graph")
                    .append("svg")
                    .attr("width", width)
                    .attr("height", height);

                const link = svg.append("g")
                    .selectAll("line")
                    .data(data.links)
                    .join("line")
                    .attr("class", "link")
                    .attr("stroke-width", 2);

                const node = svg.append("g")
                    .selectAll("circle")
                    .data(data.nodes)
                    .join("circle")
                    .attr("class", "node")
                    .attr("r", 10)
                    .attr("fill", d => color(d.type))
                    .call(drag(simulation));

                node.append("title")
                    .text(d => \`\${d.id} (\${d.type})\`);

                const label = svg.append("g")
                    .selectAll("text")
                    .data(data.nodes)
                    .join("text")
                    .attr("dy", -15)
                    .text(d => d.id);

                simulation.on("tick", () => {
                    link
                        .attr("x1", d => d.source.x)
                        .attr("y1", d => d.source.y)
                        .attr("x2", d => d.target.x)
                        .attr("y2", d => d.target.y);

                    node
                        .attr("cx", d => d.x)
                        .attr("cy", d => d.y);

                    label
                        .attr("x", d => d.x)
                        .attr("y", d => d.y);
                });

                function drag(simulation) {
                    function dragstarted(event) {
                        if (!event.active) simulation.alphaTarget(0.3).restart();
                        event.subject.fx = event.subject.x;
                        event.subject.fy = event.subject.y;
                    }
                    
                    function dragged(event) {
                        event.subject.fx = event.x;
                        event.subject.fy = event.y;
                    }
                    
                    function dragended(event) {
                        if (!event.active) simulation.alphaTarget(0);
                        event.subject.fx = null;
                        event.subject.fy = null;
                    }
                    
                    return d3.drag()
                        .on("start", dragstarted)
                        .on("drag", dragged)
                        .on("end", dragended);
                }
            </script>
        </body>
        </html>`;
    }

    private generateComponentList(structure: ProjectStructure): string {
        return `
            <h2>Controllers (${structure.controllers.length})</h2>
            ${structure.controllers.map(c => `<div class="component">${c.name}</div>`).join('')}
            
            <h2>Services (${structure.services.length})</h2>
            ${structure.services.map(s => `<div class="component">${s.name}</div>`).join('')}
            
            <h2>Repositories (${structure.repositories.length})</h2>
            ${structure.repositories.map(r => `<div class="component">${r.name}</div>`).join('')}
        `;
    }

    public async showFileAnalysis(analysis: FileAnalysisResult): Promise<void> {
        const panel = vscode.window.createWebviewPanel(
            'fileAnalysis',
            `Analysis: ${path.basename(analysis.filePath)}`,
            vscode.ViewColumn.One,
            {}
        );

        panel.webview.html = this.getFileAnalysisHtml(analysis);
    }

    public async showFolderAnalysis(analysis: FolderAnalysisResult): Promise<void> {
        const panel = vscode.window.createWebviewPanel(
            'folderAnalysis',
            `Analysis: ${path.basename(analysis.folderPath)}`,
            vscode.ViewColumn.One,
            {}
        );

        panel.webview.html = this.getFolderAnalysisHtml(analysis);
    }

    private getFileAnalysisHtml(analysis: FileAnalysisResult): string {
        return `<!DOCTYPE html>
        <html>
        <head>
            <title>File Analysis</title>
            <style>
                body { font-family: Arial, sans-serif; margin: 20px; }
                .metric { margin-bottom: 10px; }
                .dependency { color: #0066cc; }
            </style>
        </head>
        <body>
            <h1>${path.basename(analysis.filePath)}</h1>
            <div class="metric"><strong>Methods:</strong> ${analysis.metrics.complexity}</div>
            <div class="metric"><strong>Annotations:</strong> ${analysis.metrics.annotations}</div>
            <h2>Dependencies</h2>
            ${analysis.relationships.map(d => 
                `<div class="dependency">${d.field}: ${d.type}</div>`).join('')}
        </body>
        </html>`;
    }

    private getFolderAnalysisHtml(analysis: FolderAnalysisResult): string {
        return `<!DOCTYPE html>
        <html>
        <head>
            <title>Folder Analysis</title>
            <style>
                body { font-family: Arial, sans-serif; margin: 20px; }
                .summary-item { margin-bottom: 10px; }
            </style>
        </head>
        <body>
            <h1>${path.basename(analysis.folderPath)}</h1>
            <div class="summary-item"><strong>Files:</strong> ${analysis.summary.totalFiles}</div>
            <div class="summary-item"><strong>Methods:</strong> ${analysis.summary.totalMethods}</div>
            <div class="summary-item"><strong>Dependencies:</strong> ${analysis.summary.totalDependencies}</div>
        </body>
        </html>`;
    }
}

interface FileAnalysisResult {
    filePath: string;
    components: any[];
    relationships: Array<{field: string, type: string}>;
    metrics: {
        complexity: number;
        annotations: number;
    };
}

interface FolderAnalysisResult {
    folderPath: string;
    files: string[];
    summary: {
        totalFiles: number;
        totalMethods: number;
        totalDependencies: number;
    };
}
