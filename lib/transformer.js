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