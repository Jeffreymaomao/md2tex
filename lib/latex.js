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

\\usepackage{xeCJK}               % Chinese, Japanese, and Korean characters
\\setCJKfamilyfont{kai}{標楷體}    % Chinese font

\\usepackage{subfiles}  % Best loaded last in the preamble
\\usepackage{titlesec}  % fortitle

\\titleclass{\\subsubsubsection}{straight}[\\subsection]

\\newcounter{subsubsubsection}[subsubsection]
\\renewcommand\\thesubsubsubsection{\\thesubsubsection.\\arabic{subsubsubsection}}
\\renewcommand\\theparagraph{\\thesubsubsubsection.\\arabic{paragraph}} % optional; useful if paragraphs are to be numbered

\\titleformat{\\subsubsubsection}
  {\\normalfont\\normalsize\\bfseries}{\\thesubsubsubsection}{1em}{}
\\titlespacing*{\\subsubsubsection}
{0pt}{3.25ex plus 1ex minus .2ex}{1.5ex plus .2ex}

\\makeatletter
\\
renewcommand\\paragraph{
    \\@startsection{paragraph}{5}{\\z@}{3.25ex\\@plus1ex\\@minus.2ex}{-1em}{\\normalfont\\normalsize\\bfseries}
}
\\renewcommand\\subparagraph{
    \\@startsection{subparagraph}{6}{\\parindent}{3.25ex\\@plus1ex\\@minus.2ex}{-1em}{\\normalfont\\normalsize\\bfseries}
}
\\def\\toclevel@subsubsubsection{4}
\\def\\toclevel@paragraph{5}
\\def\\toclevel@paragraph{6}
\\def\\l@subsubsubsection{\\@dottedtocline{4}{7em}{4em}}
\\def\\l@paragraph{\\@dottedtocline{5}{10em}{5em}}
\\def\\l@subparagraph{\\@dottedtocline{6}{14em}{6em}}
\\makeatother

\\setcounter{secnumdepth}{4}
\\setcounter{tocdepth}{4}
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