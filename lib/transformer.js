function ast2tex(ast) {
    const LaTeX_content = parseNode(ast, 0);
    const LaTeX = LaTeX_Template(LaTeX_content);
    return LaTeX;
}

function parseNode(node, depth=0) {
    if(depth>100) return "";
    // ----
    if (node.type === "root"){
        let latex = "";
        node.children.forEach(child=>{
            latex += parseNode(child, 0);
        });
        return latex;
    }
    else if (node.type === "heading") {
        let latex = "";
        const content = node.children.map(child => parseNode(child, depth+1)).join("");
        if(node.level>3){
            latex += `\\subsub{${content}} % H${node.level} title\n`;
            return latex;
        }
        const latexcommand = `\\${"sub".repeat(node.level-1)}section`;
        latex += latexcommand + `{${content}} % H${node.level} title\n`;
        return latex;
    }
    else if (node.type === "paragraph") {
        let latex = "";
        const content = node.children.map(child => parseNode(child, depth+1)).join("");
        latex += content + "\n";
        return latex;
    }
    else if (node.type === "list") {
        let latex = "";
        const listType = node.ordered ? "enumerate" : "itemize";
        node.children.forEach(child => {latex += parseNode(child, depth+1)});
        return processEnvironment(latex, listType, node.depth, false);
    }
    else if (node.type === "listItem") {
        let latex = "";
        let content = ""; // 初始化項目內容為空
        node.children.forEach(child => {
            if (child.type !== "list") { // 非列表子節點，正常處理並加入到項目內容中
                content += parseNode(child, depth+1);
            } else { // 遇到嵌套列表，先結束當前項目的內容
                latex += "\t".repeat(node.depth+1);
                latex += `\\item ${content }\n`;
                content = ""; // 重置項目內容，因為嵌套列表將作為新的結構處理
                latex += parseNode(child, depth+1); // 直接進行遞歸處理嵌套列表
            }
        });
        if (content) { // 確保只有在還有項目內容時才添加它
            latex += "\t".repeat(node.depth+1);
            latex += `\\item ${content}\n`;
        }
        return latex;
    }
    else if (node.type === "blockquote") {
        let latex = "";
        node.children.forEach(child => {latex += parseNode(child, depth+1);});
        return processEnvironment(latex, "quote", depth, true);
    }
    else if (node.type === "display-code") {
        return processMathCodeEnvironment(node, 'lstlisting');
    }
    else if (node.type === "display-math") {
        return processMathCodeEnvironment(node, 'equation');
    }
    else if (node.type === "empty-line"){
        return "\n";
    }
    else if (node.type === "horizontal-rule"){
        return processHorizontalRule();
    }
    else if (node.type === "text") {
        return node.value;
    }
    else if (node.type === "bold") {
        return `\\textbf{${node.value}}`;
    }
    else if (node.type === "italic") {
        return `\\textit{${node.value}}`;
    }
    else if (node.type === "bold-italic") {
        return `\\textbf{\\textit{${node.value}}}`;
    }
    else if (node.type === "strikethrough") {
        return `\\sout{${node.value}}`;
    }
    else if (node.type === "underline") {
        return `\\underline{${node.value}}`;
    }
    else if (node.type === "inline-code") {
        return `\\lstinline{${node.value}}`;
    }
    else if (node.type === "inline-math") {
        return `$${node.value}$`;
    }
    else if (node.type === 'image'){
        return processImageEnvironment(node);
    }
    else if (node.type === 'link'){
        return processLinkEnvironment(node);
    }
    else {
        return node.value;
    }
}

function processHorizontalRule(){
    return "\\vspace{5pt}\n\\hrule\n\\vspace{6pt}\n"
}

function processEnvironment(content, command='', tab=0, contentTab=false){
    const indent = "\t".repeat(tab);
    const contentIndent = contentTab? "\t" : "";
    return `${indent}\\begin{${command}}\n${contentIndent}${content}\n${indent}\\end{${command}}\n`;
}

function processMathCodeEnvironment(node, command=''){
    let latex = "";
    latex += `\n\\begin{${command}}`;
    if(node.language) latex += `% [ language = ${node.language} ]`;
    latex += `\n${node.value}\n\\end{${command}}\n`;
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

function LaTeX_Template(content){
return `
% Sets the document class and font size
\\documentclass[12pt]{article}
\\usepackage[a4paper, margin=1in]{geometry}

\\usepackage[utf8]{inputenc}    % Input encoding
\\usepackage[T1]{fontenc}       % Font encoding
\\usepackage{fontspec}          % font encoding

% Advanced math typesetting
\\usepackage{amsmath}
\\usepackage{amssymb}
\\usepackage{mathtools}
\\usepackage{physics}

% Symbols and Text
\\usepackage{bbold}     % bold font
\\usepackage{ulem}      % strikethrough
\\usepackage{listings}  % Source code listing
\\usepackage{import}    % Importing code and other documents

% graphics
\\usepackage[dvipsnames]{xcolor}
\\usepackage{graphicx}
\\usepackage{tikz}
\\usepackage{pgfplots}
\\usepackage{tcolorbox}

% figure
\\usepackage{float}
\\usepackage{subfigure}

\\usepackage{hyperref}  % Hyperlinks in the document
\\hypersetup{
    colorlinks=true,
    linkcolor=Blue,
    filecolor=red,
    urlcolor=Blue,
    citecolor=blue,
    pdftitle={Article},
    pdfauthor={Author},
}

\\usepackage{xeCJK}             % Chinese, Japanese, and Korean characters
\\setCJKfamilyfont{kai}{標楷體}
%================================================================================================
\\begin{document}

${content}

%================================================================================================
\\end{document}
`
}
module.exports = { ast2tex };
