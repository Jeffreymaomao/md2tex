function print(obj){
	console.log(JSON.stringify(obj,null,2));
}

function md2ast(markdown, config={}) {
    const tabSize = config.tabSize || 4;
    const lines = markdown.split('\n');
    const ast = { type: 'root', children: [] };

    let currentParent = ast;    // Current parent node for nested structures
    const parentsStack = [];    // Stack to keep track of parents for nested structures
    let isBlockMath = false;    // Track whether currently inside a block math expression
    let blockMathContent = '';  // Store the content of block math expressions

    // Regular Expression
    const regex_tab = new RegExp(`^(\t| {${tabSize}})*`);
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
            // 如果符合<標題>(heading)，例如：`# h1`、`## h2`, ... 
            const level = line.match(/^#*/)[0].length;
            currentParent.children.push({
                type: 'heading',
                level,
                children: [{ type: 'text', value: line.slice(level + 1).trim() }]
            });
        } 
        else if (regex_unorderedList_dash.test(line) || regex_unorderedList_star.test(line) || regex_orderedList.test(line)) {
            // 如果符合<列表>(list)，例如：`- list`、`* list`、`1. list`、...
        	const isOrdered = regex_orderedList.test(line); // 檢測無序或有序
        	// 創建<列表項目>
            const item = {
                type: 'listItem',
                depth: indentDepth,
                children: [{ 
                	type: 'text', 
                	value: line.substring(indentLength + (isOrdered ? 3:2)).trim()  // 有序列表项可能需要调整提取值的起始位置
                }]
            };
            // ---
            if (currentParent.type === 'list') {
	            // 如果父層是不是<列表>
	            const previousChild = currentParent.children[currentParent.children.length - 1]; // 取出前一個<列表項目>
            	if (previousChild && previousChild.depth < indentDepth){
		            // 如果前一個<列表項目>存在 and 目前深度比前一個更深 => 創建更深層<列表>
	            	const nestedList = { type: 'list', depth: indentDepth, ordered: isOrdered, children: [item] };
                    previousChild.children.push(nestedList);
	            	parentsStack.push(currentParent); // 保存當前的父層列表
				    currentParent = nestedList; // 將新的深層<列表>設置為當前父層列表
            	} else if (previousChild && previousChild.depth > indentDepth){
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
            	} else if (previousChild && previousChild.depth === indentDepth){
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
            // -----------------------------------------------------------------------------------------
            // console.log(` item : `, item)
            // console.log(` parentent : `, currentParent)
            // console.log(` ---------------------------- `)
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