function print(obj){
	console.log(JSON.stringify(obj,null,2));
}

function md2ast(markdown, config={}) {
    const tabSize = config.tabSize || 4;
    const lines = markdown.split('\n');
    const ast = { type: 'root', children: [] };

    // 在JavaScript中，物件是透過參考來存取的。所以可以直接修改 'currentParent.children'，這樣會修改原始父陣列中物件的 'children' 陣列，而不是它的副本。
    let currentParent  = ast; // Current parent node for nested structures
    const parentsStack = [];  // Stack to keep track of parents for nested structures
    let isDisplayMath = false; // Track whether currently inside a block math expression
    let isDisplayCode = false; // Track whether currently inside a code math expression
    let isBlockQuote  = false;
    let isTable       = false;
    let displayMathContent  = '';  // Store the content of block math expressions
    let displayCodeContent  = '';  // Store the content of block code expressions
    let displayCodeLanguage = '';
    let blockQuoteContent  = '';
    let currentQuoteLevel = 0;
    let currentTable = null;

    // 正則表達式 Regular Expression (display & enviroment)
    const regex_tab = new RegExp(`^(\t| {${tabSize}})*`);
    const regex_heading            = /^#{1,6} /;
    const regex_unorderedList_dash = /^(\t| )*- /;
    const regex_unorderedList_star = /^(\t| )*\* /;
    const regex_blockquote         = /^(\t| )*(>\s*)+/;
    const regex_orderedList        = /^(\t| )*\d+\. /;
    const regex_displayCode        = /^(\t| )*`{3}(\w*)$/;
    const regex_displayMath        = /^(?:>\s*)*\${2}/;
    const regex_horizontalRule     = /^\s*-{3}/;
    const regex_table              = /^(?:>\s*)*\|(.+)\|$/;
    const regex_tableSeparator     = /^(?:>\s*)*\|(\s*:?-+:?\s*\|)+\s*$/;
    const regex_tableAlignment     = /\|?\s*(:)?-+(:)?\s*/g;

    // 正則表達式 Regular Expression (inline)
    const regex_inline = [
        { regex: /\[!\[([^\]]*?)\]\((.*?)\)\]\((.*?)\s*("(.*?[^\\])")?\)/g, type: 'image-link'}, // image-link
        { regex: /!\[(.*?)\]\((.*?)\s*("(?:.*[^"])")?\s*\)/g, type: 'image' }, // image
        { regex: /\[(.*?)\]\((.*?)\s*("(?:.*[^"])")?\s*\)/g, type: 'link' }, // link


        { regex: /\$(.*?)\$/g,         type: 'inline-math' },   // inline math
        { regex: /`([^`]+)`/g,         type: 'inline-code' },   // inline math
        
        { regex: /\<u>(.*?)\<\/u>/g,   type: 'underline'},      // underline
        { regex: /\*\*\*(.*?)\*\*\*/g, type: 'bold-italic' },   // Bold italic
        { regex: /___(.*?)___/g,       type: 'bold-italic' },   // Bold italic with underscores
        { regex: /\*\*(.*?)\*\*/g,     type: 'bold' },          // Bold
        { regex: /__(.*?)__/g,         type: 'bold' },          // Bold with underscores
        { regex: /\*(.*?)\*/g,         type: 'italic' },        // Italic
        { regex: /_(.*?)_/g,           type: 'italic' },        // Italic with underscores
        { regex: /~~(.*?)~~/g,         type: 'strikethrough' }, // Strikethrough
    ];

    // 不需要創建新段落的類型
    const pushTypes = ['paragraph', 'display-math'];

    lines.forEach((line, index) => {
        const regexTabMathch = regex_tab.exec(line);
        const indentLength = regexTabMathch?regexTabMathch[0].length:0;
        const indentDepth = indentLength/tabSize;
        // --- START : heading ---
        if (regex_heading.test(line)) {

            // 如果符合<標題>(heading)，例如：`# h1`、`## h2`, ... 
            const level = line.match(/^#*/)[0].length;
            currentParent.children.push({
                type: 'heading',
                level,
                children: [...parseInlineContent(line.slice(level + 1).trim(), regex_inline)]
            });
        } 

        // --- START : list ---
        else if (regex_unorderedList_dash.test(line) || regex_unorderedList_star.test(line) || regex_orderedList.test(line)) {
            // 如果符合<列表>(list)，例如：`- list`、`* list`、`1. list`、...
        	const isOrdered = regex_orderedList.test(line); // 檢測無序或有序
        	// 創建<列表項目>
            // PS: 有序列表项可能需要调整提取值的起始位置
            const item = {
                type: 'listItem',
                depth: indentDepth,
                children: [...parseInlineContent(line.substring(indentLength + (isOrdered ? 3:2)).trim(), regex_inline)]
            };
            // ---
            if (currentParent.type === 'list') {
	            // 如果父層是不是<列表>
                // 取出前一個<列表項目>
                // const previousListItem = currentParent.children.slice().reverse().find(child => child.type === 'listItem'); // 另一個方法
                let previousListItem = null;
                for (let i = currentParent.children.length - 1; i >= 0; i--) {
                    const child = currentParent.children[i];
                    if (child.type === 'listItem') {
                        previousListItem = child;
                        break;
                    }
                }
                // 並檢測
            	if (previousListItem && previousListItem.depth < indentDepth){
		            // 如果前一個<列表項目>存在 and 目前深度比前一個更深 => 創建更深層<列表>
	            	const nestedList = { type: 'list', depth: indentDepth, ordered: isOrdered, children: [item] };
                    previousListItem.children.push(nestedList);
	            	parentsStack.push(currentParent); // 保存當前的父層列表
				    currentParent = nestedList; // 將新的深層<列表>設置為當前父層列表
            	} else if (previousListItem && previousListItem.depth > indentDepth){
            		// 如果前一個<列表項目>存在 and 目前深度比前一個更淺 => 退出父層到相同層級的<列表>
            		while(parentsStack.length > 0 && currentParent.depth >= indentDepth + 1) {
		                currentParent = parentsStack.pop(); // 移除最後一項，並將最後一項更新到目前的父層<項目>節點
		            }
                    if(currentParent.ordered === isOrdered){
                        // 如果父層有無序與當前相同 => 直接新層到該父層<列表>當中
            			currentParent.children.push(item);
            		} else {
                        // 如果父層有無序與當前不同 => ...

                        // 檢查父層是不是<列表>，如果是需要多退出一層
                        if(currentParent==='list') currentParent = parentsStack.pop();
                        // 再次檢查父層有無序與當前不同 => 檢查父層是不是<列表>，如果是需要再多退出一層
		                if(currentParent.ordered!==isOrdered) currentParent = parentsStack.pop();
                        // 此作法是為了：
                        // 如果父層非<列表> => 創建新的<列表>到該底層下
                        // 如果父層是<列表> => 創建新的<列表>到與該父層<項目>同等的節點
            			const list = { type: 'list', depth: indentDepth, ordered: isOrdered, children: [item] };
		                currentParent.children.push(list);
		                parentsStack.push(currentParent);
		                currentParent = list;
            		}
            	} else if (previousListItem && previousListItem.depth === indentDepth){
                    // 如果前一個<列表項目>存在 and 目前深度等於前一個
            		if(currentParent.ordered === isOrdered){
                        // 如果父層有無序與當前相同 => 直接新層到該父層<列表>當中
	        			currentParent.children.push(item);
	        		}else{
                        // 如果父層有無序與當前不同 => 退出一層，創建新的<列表>到該底層下
                        currentParent = parentsStack.pop();
	        			const list = { type: 'list', depth: indentDepth, ordered: isOrdered, children: [item] };
		                currentParent.children.push(list);
		                parentsStack.push(currentParent);
		                currentParent = list;
	        		}
            	} else {
            		// 如果前一個<列表項目>不存在 => 直接在目前的<列表>下創建新的<列表項目>
	                currentParent.children.push(item);
            	}
            } else {
                // 如果父層是不是<列表> => 創建新的列表
			    const list = { type: 'list', depth: indentDepth, ordered: isOrdered, children: [item] };
                currentParent.children.push(list);
                parentsStack.push(currentParent);
                currentParent = list;
            }
        }
        // --- START : displayCode ---
        else if (regex_displayCode.test(line)) {
            // 如果父層的深度存在的話
            if(currentParent.depth){
                // 退出到與現在相同的深度
                while(parentsStack.length > 0 && currentParent.depth >= indentDepth) {
                    currentParent = parentsStack.pop();
                }
            }
            if(!isDisplayCode) {
                // 開始紀錄<展式程式>內容
                isDisplayCode = true;
                const match = regex_displayCode.exec(line)||[];
                displayCodeLanguage = match[2]||"";
                displayCodeContent += line.trim().slice(3+displayCodeLanguage.length).trim() + '\n'; // Store the content
            } else {
                // 結束紀錄<展式程式>內容
                displayCodeContent += line.trim().slice(0, -3).trim() + '\n';
                // 在JavaScript中，物件是透過參考來存取的。所以可以直接修改 'previousChild.children'，這樣會修改原始父陣列中物件的 'children' 陣列，而不是它的副本。
                const previousChild = currentParent.children.length > 0 ? currentParent.children[currentParent.children.length - 1] : null;
                if(previousChild && pushTypes.includes(previousChild.type)){
                    previousChild.children.push({
                        type: 'display-code',
                        language: displayCodeLanguage,
                        value: displayCodeContent.trim()
                    });
                } else {
                    currentParent.children.push({
                        type: 'display-code',
                        language: displayCodeLanguage,
                        value: displayCodeContent.trim()
                    });
                }
                isDisplayCode = false;
                displayCodeContent = ''; // 重設<展式程式>內容
                displayCodeLanguage = '';
            }
        } else if (isDisplayCode) {
            // 如果是正在<展式程式>
            displayCodeContent += line.trim() + '\n';
        }

        // --- START : displayMath ---
        else if (regex_displayMath.test(line)) {
            let mathPadLength = 2;
            if(isBlockQuote){
                const currentLineMatch = line.match(regex_blockquote);
                mathPadLength += currentLineMatch?currentLineMatch[0].length:0;
            }
            // 如果父層的深度存在的話
            if(currentParent.depth){
                // 退出到與現在相同的深度
                while(parentsStack.length > 0 && currentParent.depth >= indentDepth) {
                    currentParent = parentsStack.pop();
                }
            }
            if(!isDisplayMath) {
                // 開始紀錄<展式數學>內容
                isDisplayMath = true;
                displayMathContent += line.trim().slice(mathPadLength).trim() + '\n'; // Store the content
            } else {
                // 結束紀錄<展式數學>內容
                displayMathContent += line.trim().slice(0, -mathPadLength).trim() + '\n';
                // 在JavaScript中，物件是透過參考來存取的。所以可以直接修改 'previousChild.children'，這樣會修改原始父陣列中物件的 'children' 陣列，而不是它的副本。
                const previousChild = currentParent.children.length > 0 ? currentParent.children[currentParent.children.length - 1] : null;
                if(previousChild && pushTypes.includes(previousChild.type)){
                    previousChild.children.push({
                        type: 'display-math',
                        value: displayMathContent.trim()
                    });
                } else {
                    currentParent.children.push({
                        type: 'display-math',
                        value: displayMathContent.trim()
                    });
                }
                isDisplayMath = false;
                displayMathContent = ''; // 重設<展式數學>內容
            }
        } else if (isDisplayMath) {
            // 如果是正在<展式數學>
            let mathPadLength = 0;
            if(isBlockQuote){
                const currentLineMatch = line.match(regex_blockquote);
                mathPadLength += currentLineMatch?currentLineMatch[0].length:0;
            }
            displayMathContent += line.slice(mathPadLength).trim() + '\n';
        }

        else if (regex_blockquote.test(line)) {
            const currentLineMatch = line.match(regex_blockquote);
            const previousLineMatch = index > 0 && lines[index-1].match(regex_blockquote);
            const currentQuoteLevel = currentLineMatch[0].split(">").length - 1;
            const previousQuoteLevel = previousLineMatch ? previousLineMatch[0].split(">").length - 1 : 0;

            isBlockQuote = true;

            if (currentQuoteLevel < previousQuoteLevel) {
                while(parentsStack.length > 1 && previousQuoteLevel >= currentQuoteLevel + 1) {
                    currentParent = parentsStack.pop();
                }
            } else if (currentQuoteLevel > previousQuoteLevel) {
                const quoteNode = {
                    type: 'blockquote',
                    children: []
                };
                currentParent.children.push(quoteNode);
                parentsStack.push(currentParent); // 保存当前父节点
                currentParent = quoteNode; // 更新当前父节点为新的引用块
            }

            let contentLine = line.substring(currentLineMatch[0].length).trim();
            if (contentLine) {
                // 如果行内有内容，则加入到当前引用块的子节点中
                currentParent.children.push(...parseInlineContent(contentLine, regex_inline));
            } else {
                currentParent.children.push({type: 'empty-line'})
            }

            let nextLine = lines[index + 1];
            let nextLineIsBlockQuote = nextLine && regex_blockquote.test(nextLine);
            if (!nextLineIsBlockQuote) {
                isBlockQuote = false;
                currentParent = parentsStack.pop(); // 返回上一层
            }
        }

        // --- START : table ---
        else if (regex_table.test(line) && regex_tableSeparator.test(lines[index + 1])) {
            // 表格开始
            if (!isTable) {
                isTable = true;
                currentTable = {
                    type: 'table',
                    header: [],
                    rows: []
                };
                // 解析标题行
                const headerLine = line.match(regex_table)[1].trim().split("|").map(h => parseInlineContent(h.trim(),regex_inline));
                currentTable.header = headerLine;
            }
        } else if(isTable && regex_tableSeparator.test(line)){

            let alignments = [];

            while ((match = regex_tableAlignment.exec(line)) !== null) {
                if (match[1] && match[2]) {
                    // 冒号在两边，居中对齐
                    alignments.push('center');
                } else if (match[1]) {
                    // 冒号在左边，左对齐
                    alignments.push('left');
                } else if (match[2]) {
                    // 冒号在右边，右对齐
                    alignments.push('right');
                } else {
                    // 无冒号，默认左对齐
                    alignments.push('left');
                }
            }
            if(currentTable) currentTable.alignments = alignments;
            // skip this line
            if(!lines[index+1]){
                // 如果 table 下一行為空，則儲存並結束
                isTable = false;
                currentParent.children.push(currentTable);
                currentTable = null;
            }
        } else if (isTable && regex_table.test(line)){
            const row = line.match(regex_table)[1].trim().split("|").map(cell => parseInlineContent(cell.trim(), regex_inline));
            currentTable.rows.push(row);

            if(!lines[index+1]){
                // 如果 table 下一行為空，則儲存並結束
                isTable = false;
                currentParent.children.push(currentTable);
                currentTable = null;
            }

        } else if (isTable && !regex_table.test(line)) {
            // 表格结束
            isTable = false;
            currentParent.children.push(currentTable);
            currentTable = null;
        }

        // --- START : empty ---
        else if (regex_horizontalRule.test(line)) {
            currentParent.children.push({type: 'horizontal-rule'});
        }

        // --- START : empty ---
        else if (line.trim() === '') {
            // 如果整行都是空
            if (currentParent !== ast) {
                currentParent = parentsStack.pop() || ast;
            } else {
                currentParent.children.push({type: "empty-line"});
            }
        }

        // --- START : paragraph ---
        else {
            // Treat all other lines as paragraphs with potential inline math
            const textParts = parseInlineContent(line, regex_inline);

            // 在JavaScript中，物件是透過參考來存取的。所以可以直接修改 'previousChild.children'，這樣會修改原始父陣列中物件的 'children' 陣列，而不是它的副本。
            const previousChild = currentParent.children.length > 0 ? currentParent.children[currentParent.children.length - 1] : null;

            // 檢測是否需要創建新的段落
            if(previousChild && previousChild.children && pushTypes.includes(previousChild.type)){
                previousChild.children.push(...textParts);
            } else {
                currentParent.children.push({
                    type: 'paragraph',
                    children: textParts
                });
            }
        }
        // --- END ---
    });

    return ast;
}

function parseInlineContent(line, regex_inline) {
    let textParts = [{ type: 'text', value: line }];
    regex_inline.forEach(styleRegex => {
        textParts = processTextParts(textParts, styleRegex.regex, styleRegex.type);
    });
    return textParts;
}

function processTextParts(textParts, regex, type) {
    // 對給定的文本片段數組進行處理，根據正則表達式、類型和是否為區塊進行分割和標記
    return textParts.flatMap(textPart => {
        // 使用flatMap來處理每個片段，以平坦化最終結果的數組結構
        if (textPart.type === 'text') {
            // 如果當前片段是普通文本類型，則對其進行分割和標記
            return splitSegment(textPart.value, regex, type);
        } else {
            // 如果當前片段已經是某種特定類型（不是普通文本），則直接返回該片段
            return [textPart];
        }
    });
}


function splitSegment(text, regex, type) {
    let parts = [], match; // 初始化要返回的部分數組和匹配結果
    let lastIndex = 0; // 用於記錄上一次匹配到的位置
    while ((match = regex.exec(text)) !== null) { // 當正則表達式在文本中找到匹配時
        if (match.index > lastIndex) {
            // 如果當前匹配的開始位置大於上一次匹配的結束位置，
            // 則將之間的文本作為普通文本類型推入parts數組
            parts.push({ type: 'text', value: text.slice(lastIndex, match.index) });
        }

        // 將匹配到的特定文本按照其類型推入parts數組
        if(type==='image-link') {
            const [fullMatch, altText, imageUrl, linkUrl, imageTitle] = match; // 解构赋值，提取所需信息
            parts.push({
                type: 'link',
                text: altText,
                image: {
                    url: imageUrl,
                    title: imageTitle ? imageTitle.slice(1, -1) : undefined // 移除标题的引号
                }
            });
        } else if((type === 'link' || type === 'image')){
            const [fullMatch, altText, url, title] = match; // 解构赋值，提取所需信息
            parts.push({
                type,
                text: altText,
                url,
                title: title ? title.slice(1, -1) : undefined // 移除标题的引号
            });
        } else {
            // 其他類型的是直接使用
            parts.push({ type, value: match[1] });
        }
        lastIndex = match.index + match[0].length; // 更新上一次匹配的結束位置
    }
    if (lastIndex < text.length) {
        // 如果最後一次匹配後還有剩餘的文本，將其作為普通文本類型推入parts數組
        parts.push({ type: 'text', value: text.slice(lastIndex) });
    }
    return parts; // 返回分割後的文本部分數組
}


module.exports = { md2ast };