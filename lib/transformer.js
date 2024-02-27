function ast2tex(ast) {
    let latex = "";

    // 遞歸處理AST中的每個節點
    function processNode(node) {
        if (node.type === "root") {
            node.children.forEach(child => processNode(child));
        }
        else if (node.type === "heading") {
            const content = node.children.map(child => processInline(child)).join("");
            if(node.level>3){
                latex += `\\textbf{${content}}\n`;
                return "";
            }
            const latexcommand = `\\${"sub".repeat(node.level)}section`;
            latex += latexcommand + `{${content}}\n`;
        }
        else if (node.type === "paragraph") {
            const content = node.children.map(child => processInline(child)).join("");
            latex += content + "\n";
        }
        else if (node.type === "list") {
            const listType = node.ordered ? "enumerate" : "itemize";
            latex += "\t".repeat(node.depth);
            latex += `\\begin{${listType}}\n`;
            node.children.forEach(child => processNode(child));
            latex += "\t".repeat(node.depth);
            latex += `\\end{${listType}}\n`;
        }
        else if (node.type === "listItem") {
            let content = ""; // 初始化項目內容為空
            node.children.forEach(child => {
                if (child.type !== "list") { // 非列表子節點，正常處理並加入到項目內容中
                    content += processInline(child);
                } else { // 遇到嵌套列表，先結束當前項目的內容
                    latex += "\t".repeat(node.depth+1);
                    latex += `\\item ${content }\n`;
                    content = ""; // 重置項目內容，因為嵌套列表將作為新的結構處理
                    processNode(child); // 直接進行遞歸處理嵌套列表
                }
            });
            if (content) { // 確保只有在還有項目內容時才添加它
                latex += "\t".repeat(node.depth+1);
                latex += `\\item ${content}\n`;
            }
        }
        else if (node.type === "blockquote") {
            // console.log(node)
        }
        else if (node.type === "display-code") {
            latex += processMathCodeEnvironment(node, 'lstlisting');
        }
        else if (node.type === "display-math") {
            latex += processMathCodeEnvironment(node, 'equation');
        }
        else if (node.type === "empty-line"){
            latex += "\n";
        }
        else if (node.type === "horizontal-rule"){
            latex += processHorizontalRule();
        }
        else {
            // console.log(node)
        }
    }

    processNode(ast);
    return latex;
}

// 處理行內元素
function processInline(node) {
    if (node.type === "text") {
        return node.value;
    }
    else if (node.type === "bold") {
        return `\\textbf{${node.value}}`;
    }
    else if (node.type === "italic") {
        return `\\textit{${node.value}}`;
    }
    else if (node.type === "bold-italic") {
        return `\\textbf{\\textit{${node.value}}`;
    }

    else if (node.type === "strikethrough") {
        return `\\sout{${node.value}}`;
    }
    else if (node.type === "inline-code") {
        return `\\lstinline{${node.value}}`;
    }
    else if (node.type === "inline-math") {
        return `$${node.value}$`;
    }
    else if (node.type === "display-math"){
        return processMathCodeEnvironment(node, 'equation');
    }
    else if (node.type === "display-code"){
        return processMathCodeEnvironment(node, 'lstlisting');
    }
    else if (node.type === 'image'){
        return processImageEnvironment(node);
    }
    else if (node.type === 'link'){
        return processLinkEnvironment(node);
    }
    else{
        return node.value;
    }
}

function processHorizontalRule(){
    return "\\vspace{5pt}\n\\hrule\n\\vspace{6pt}\n"
}

function processMathCodeEnvironment(node, command='', end=''){
    let latex = "";
    latex += `\\begin{${command}}`;
    if(node.language){
        latex += `% [ language = ${node.language} ]\n`;
    }else{
        latex += '\n';
    }
    latex += node.value;
    latex += `\n\\end{${command}}\n` + end;
    return latex;
}

function processImageEnvironment(node){
    let latex = "\\begin{figure}[htbp]\n";
    latex += `\\includegraphics{${node.url}}\n`;

    let captionText = "";
    if (node.title) captionText += `\\textbf{${node.title}}: `;
    if (node.text) captionText += `${node.text}`;
    if(captionText) latex += `\\caption{${captionText}}\n`;
    latex += `\\end{figure}`;
    return latex;
}

function processLinkEnvironment(node){
    let latex = "";
    latex += `\\href{${node.url}}{${node.text}}`;
    return latex;
}

function processQuoteEnvironment(node){
    let latex = "";
    latex += "\begin{quote}"
    latex += node.value;
    latex +="\end{quote}"
    return latex;
}



export { ast2tex };
