const LaTeXDefaultTemplate = `
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
`

function LatexDocumentEnvironment(content){
return `
\\begin{document}
%================================================================================================
${content}
%================================================================================================
\\end{document}
`
}

module.exports = { LaTeXDefaultTemplate, LatexDocumentEnvironment };