function ast2tex(ast) {
    // Function to convert an AST node to a LaTeX string
    function nodeToTex(node) {
        switch (node.type) {
            case 'root':
                return node.children.map(nodeToTex).join("\n");
            case 'heading':
                return '\\' + 'section'.padStart(node.level*3 + 'section'.length, 'sub') + `{${node.children.map(nodeToTex).join("")}}`;
            case 'list':
                const listType = node.ordered ? 'enumerate' : 'itemize';
                return `\n\\begin{${listType}}\n${node.children.map(nodeToTex).join("\n")}\n\\end{${listType}}`;
            case 'listItem':
                return `  \\item ${node.children.map(nodeToTex).join("")}`;
            case 'display-math':
                return `\\[${node.value}\\]`;
            case 'text':
                return node.value; // Simple text node
                // Handle other types (inline elements) here
            default:
                return ''; // Return an empty string for unhandled types
        }
    }
    // Convert the top-level AST to LaTeX
    return nodeToTex(ast);
}


function ast2md(ast) {
    let markdown = '';

    function traverse(node, indent = 0) {
        switch (node.type) {
            case 'root':
                node.children.forEach(child => traverse(child, indent));
                break;
            case 'heading':
                markdown += '#'.repeat(node.depth) + ' ' + node.children[0].value + '\n\n';
                break;
            case 'paragraph':
                markdown += '\n'; // Add newline before paragraph
                node.children.forEach(child => {
                    switch (child.type) {
                        case 'text':
                            markdown += child.value.trim() + ' '; // Add space after each text node
                            break;
                        case 'math':
                            markdown += child.block ? '$$' + child.value + '$$' : '$' + child.value + '$';
                            break;
                        default:
                            break;
                    }
                });
                markdown += '\n'; // Remove extra newline after paragraph
                break;
            case 'list':
                node.children.forEach(child => traverse(child, indent));
                // markdown += '\n'; // Remove extra newline after list
                break;
            case 'listItem':
                markdown += ' '.repeat(indent) + '- ';
                node.children.forEach(child => traverse(child, indent + 2)); // Increase indent for child items
                markdown += '\n'; // Remove extra newline after list item
                break;
            default:
                break;
        }
    }

    traverse(ast);
    return markdown;
}

export { ast2md, ast2tex };
