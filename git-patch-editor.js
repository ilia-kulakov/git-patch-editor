const fs = require('fs');

const SRC_PATCH_FILE = 'inheritance.patch';
const DST_PATCH_FILE = 'inheritance-modified.patch';
const HUNK_PREFIX = 'diff --git';
const HUNK_POSTFIX = '-- ';
const HUNK_BLOCK_PREFIX = '@@ ';


transformPatch(SRC_PATCH_FILE, DST_PATCH_FILE);


function transformPatch(srcFileName, dstFileName) {
    if(!fs.existsSync(srcFileName)) {
        console.error(`ERROR: File ${srcFileName} not found`);
        return;
    }

    const originalContent = fs.readFileSync(SRC_PATCH_FILE, {encoding:'utf8'});
    const transformedContent = transformPatchContent(originalContent);
    fs.writeFileSync(dstFileName, transformedContent, {encoding: "utf8"});
}

function transformPatchContent(patchContent) {
    let originallines = patchContent.split(/\r?\n|\r|\n/g);
    let transformedLines = [];
    let hunkLines = [];
    for(let line of originallines) {
        if(line.startsWith(HUNK_PREFIX)) {
            transformedLines.push(...transformHunk(hunkLines));
            hunkLines = [];
            hunkLines.push(line);
        } else if(line.startsWith(HUNK_POSTFIX)) {
            transformedLines.push(...transformHunk(hunkLines));
            hunkLines = [];
            transformedLines.push(line);
        } else {
            if(!hunkLines.length) {
                transformedLines.push(line);
            } else {
                hunkLines.push(line);
            }            
        }
    }

    transformedLines.push(...transformHunk(hunkLines));

    return transformedLines.join('\n');
}

function transformHunk(hunkLines) {
    let transformedHunkLines = [];
    let blockLines = [];
    for(let line of hunkLines) {
        if(line.startsWith(HUNK_BLOCK_PREFIX)) {
            transformedHunkLines.push(...transformBlock(blockLines));
            blockLines = [];
            blockLines.push(line);
        } else {
            if(!blockLines.length) {
                transformedHunkLines.push(line);
            } else {
                blockLines.push(line);
            }            
        }
    }
    
    transformedHunkLines.push(...transformBlock(blockLines));

    return transformedHunkLines
}

function transformBlock(blockLines) {
    
    if(blockLines.length == 0) {
        return blockLines;
    }

    const idPattern = /@@\s+-(\d+),(\d+)\s+\+(\d+),(\d+)\s+@@/;
    let identifiers = idPattern.exec(blockLines[0]);
    let negLine = parseInt(identifiers[1]);
    let negContent = parseInt(identifiers[2]);
    let posLine = parseInt(identifiers[3]);
    let posContent = parseInt(identifiers[4]);

    if(isNaN(negLine) || isNaN(negContent) || isNaN(posLine) || isNaN(posContent)) {
        console.log(`ERROR: Wrong hunk block identifiers ${JSON.stringify(blockLines)}`);
        return blockLines;
    }

    const nodePattern = /^[+-]{1}\s+<[^\s]+\/>$/;
    let transformedBlockLines = [];
    let changesRemain = false;
    for(let i = 1; i < blockLines.length; i++) {
        let line = blockLines[i];
        if(line.startsWith('-')) {
            if( line.match(nodePattern)) {
                transformedBlockLines.push(line.replace(/^-/, ' '));
                posContent++;
            } else {
                transformedBlockLines.push(line);
                changesRemain = true;
            }
        } else if(line.startsWith('+')) {
            if( line.match(nodePattern)) {
                posContent--;
            } else {
                transformedBlockLines.push(line);
                changesRemain = true;
            }
        } else {
            transformedBlockLines.push(line);
        }
    }

    if(!changesRemain) {
        return [];
    }

    transformedBlockLines.unshift(`@@ -${negLine},${negContent} +${posLine},${posContent} @@`);
    return transformedBlockLines;
}