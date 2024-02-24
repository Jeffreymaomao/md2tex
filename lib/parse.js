const tabSize = 4;

function print(obj){
	console.log(JSON.stringify(obj,null,2));
}

function md2ast(markdown) {
    const lines = markdown.split('\n');
    const ast = { type: 'root', children: [] };

    let currentParent = ast; // Current parent node for nested structures
    const parentsStack = []; // Stack to keep track of parents for nested structures
    let isBlockMath = false; // Track whether currently inside a block math expression
    let blockMathContent = ''; // Store the content of block math expressions

    // Regular Expression
    const regex_tab = new RegExp(`^(\\t| {${tabSize}})*`);
    const regex_heading = /^#{1,6} /;
    const regex_unorderedList_dash = /^(\t| )*- /;
    const regex_unorderedList_star = /^(\t| )*\* /;
    const regex_orderedList = /^(\t| )*\d+\. /;
    const regex_blockMath =  new RegExp(`^(\t| {${tabSize})*\$\$`);
    const regex_inlineMath = /^\$(?!\$)(.*?)\$(?!\$)/;


    lines.forEach(line => {
        const regexTabMathch = regex_tab.exec(line);
        const indentLength = regexTabMathch?regexTabMathch[0].length:0;
        const indentDepth = indentLength/tabSize;

        if (regex_heading.test(line)) {
            // Match headings
            const level = line.match(/^#*/)[0].length;
            currentParent.children.push({
                type: 'heading',
                level,
                children: [{ type: 'text', value: line.slice(level + 1).trim() }]
            });
        } 
        else if (regex_unorderedList_dash.test(line) || regex_unorderedList_star.test(line) || regex_orderedList.test(line)) {
        	const isOrdered = regex_orderedList.test(line);
            // -----------------------------------------------------------------------------------------
        	// 先創建列表項目
            const item = {
                type: 'listItem',
                depth: indentDepth,
                children: [{ 
                	type: 'text', 
                	value: line.substring(indentLength + (isOrdered ? 3:2)).trim()  // 有序列表项可能需要调整提取值的起始位置
                }]
            };
            if (currentParent.type === 'list') {
	            // 檢查父層是不是列表
	            const previousChild = currentParent.children[currentParent.children.length - 1];
            	if (previousChild && previousChild.depth < indentDepth){
		            // 如果前一個列表項目存在 而且 目前深度比前一個更深 則 創建更深層列表
	            	const nestedList = { type: 'list', depth: indentDepth, ordered: isOrdered, children: [item] };
	            	if (previousChild.type === 'listItem') {
	            		if (!previousChild.children) previousChild.children = [];
				        previousChild.children.push(nestedList);
	            	}else{
	            		// 如果沒有合適的previousChild
	            		currentParent.children.push(nestedList); // 直接在当前父列表中添加新的嵌套列表
	            	}
	            	parentsStack.push(currentParent); // 保存當前的父層列表
				    currentParent = nestedList; // 將新的嵌套列表設置為當前父層列表
            	} else if (previousChild && previousChild.depth > indentDepth){
            		// 如果前一個列表項目存在 而且 目前深度比前一個更淺 則 退出列表到列表
            		while(parentsStack.length > 0 && currentParent.depth >= indentDepth + 1) {
		                currentParent = parentsStack.pop(); // 移除最後一項，並將最後一項更新到目前的父層項目
		            }
            		if(currentParent.ordered === isOrdered){
            			currentParent.children.push(item);
            		} else {
		                currentParent = parentsStack.pop();
            			const list = { type: 'list', depth: indentDepth, ordered: isOrdered, children: [item] };
		                currentParent.children.push(list);
		                parentsStack.push(currentParent);
		                currentParent = list;
            		}
            	} else if (previousChild && previousChild.depth === indentDepth){
            		if(currentParent.ordered === isOrdered){
	        			currentParent.children.push(item);
	        		}else{
	        			const list = { type: 'list', depth: indentDepth, ordered: isOrdered, children: [item] };
		                currentParent.children.push(list);
		                parentsStack.push(currentParent);
		                currentParent = list;
	        		}
            	} else {
            		// previousChild not exist 
	                currentParent.children.push(item);
            	}
            } else {
            	// 与当前列表ordered状态不同或当前父元素不是列表时，创建新的列表
			    const list = { type: 'list', depth: indentDepth, ordered: isOrdered, children: [item] };
                currentParent.children.push(list);
                parentsStack.push(currentParent);
                currentParent = list;
            }
            // -----------------------------------------------------------------------------------------
        }

        else if (regex_blockMath.test(line)) {
            if(!isBlockMath) {
                // Start of block math expression
                isBlockMath = true;
                blockMathContent += line.trim().slice(2).trim() + '\n'; // Store the content
            } else {
                // End of block math expression
                blockMathContent += line.trim().slice(0, -2).trim() + '\n';
                currentParent.children.push({
                    type: 'paragraph',
                    children: [{
                        type: 'math',
                        block: true,
                        value: blockMathContent.trim()
                    }]
                });
                isBlockMath = false;
                blockMathContent = ''; // Reset block math content
            }
        } else if (isBlockMath) {
            // Inside block math expression
            blockMathContent += line.trim() + '\n';
        } else if (line.trim() === '') {
            // Handle empty line
            if (currentParent !== ast) {
                currentParent = parentsStack.pop() || ast;
            }
        } else {
            // Treat all other lines as paragraphs with potential inline math
            const mathRegex = /\$(.*?)\$/g; // Regex to find inline math
            let match;
            const textParts = [];
            let lastIndex = 0;

            while ((match = mathRegex.exec(line)) !== null) {
                if (match.index > lastIndex) {
                    textParts.push({ type: 'text', value: line.slice(lastIndex, match.index) });
                }
                textParts.push({ type: 'math', block: false, value: match[1] });
                lastIndex = match.index + match[0].length;
            }
            if (lastIndex < line.length) {
                textParts.push({ type: 'text', value: line.slice(lastIndex) });
            }

            currentParent.children.push({
                type: 'paragraph',
                children: textParts
            });
        }
    });

    return ast;
}

export { md2ast };