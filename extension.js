const ctagz = require('ctagz')
const lineReader = require('line-reader')
const path = require('path')
const Promise = require('bluebird')
const vscode = require('vscode')
const eachLine = Promise.promisify(lineReader.eachLine)

// Called when the plugin is first activated
function activate(context) {
    console.log('ctagsx is live')

    let disposable = vscode.commands.registerCommand('extension.findCTags', () => findCTagsInDocument(context))
    context.subscriptions.push(disposable)

    disposable = vscode.commands.registerCommand('extension.findCTagsPrompt', () => findCTagsFromPrompt(context))
    context.subscriptions.push(disposable)

    disposable = vscode.commands.registerCommand('extension.ctagsJumpBack', () => jumpBack(context))
    context.subscriptions.push(disposable)

    disposable = vscode.commands.registerCommand('extension.ctagsClearJumpStack', () => clearJumpStack(context))
    context.subscriptions.push(disposable)
}
exports.activate = activate

// Called when the plugin is deactivated
function deactivate() {
    console.log('ctagsx is tombstoned')
}
exports.deactivate = deactivate

function findCTagsFromPrompt(context) {
    const options = {
        'prompt': 'Enter a tag to search for'
    }
    // TODO: Provide completion (jtanx/ctagz#2)
    return vscode.window.showInputBox(options).then(tag => {
        if (!tag) {
            return
        }
        return findCTags(context, tag)
    })
}

function findCTagsInDocument(context) {
    const editor = vscode.window.activeTextEditor
    if (!editor) {
        console.log('ctagsx: Cannot search - no active editor (file too large? https://github.com/Microsoft/vscode/issues/3147)')
        return
    }

    const tag = getTag(editor)
    if (!tag) {
        return
    }

    return findCTags(context, tag)
}

function findCTags(context, tag) {
    const editor = vscode.window.activeTextEditor
    let searchPath = vscode.workspace.rootPath

    if (editor && !editor.document.isUntitled && editor.document.uri.scheme === 'file') {
        searchPath = editor.document.fileName
    }

    if (!searchPath) {
        console.log('ctagsx: Could not get a path to search for tags file')
        if (editor) {
            console.log('ctagsx: Document is untitled? ', editor.document.isUntitled)
            console.log('ctagsx: Document URI:', editor.document.uri.toString())
        } else {
            console.log('ctagsx: Active text editor is undefined')
        }
        console.log('ctagsx: Workspace root: ', vscode.workspace.rootPath)
        return vscode.window.showWarningMessage(`ctagsx: No searchable path (no workspace folder open?)`)
    }

    ctagz.findCTagsBSearch(searchPath, tag)
    .then(result => {
        const options = result.results.map(tag => {
            if (!path.isAbsolute(tag.file)) {
                tag.file = path.join(path.dirname(result.tagsFile), tag.file)
            }
            tag.description = tag.kind || ''
            tag.label = tag.file
            tag.detail = tag.address.pattern || `Line ${tag.address.lineNumber}`
            return tag
        })

        if (!options.length) {
            if (!result.tagsFile) {
                return vscode.window.showWarningMessage(`ctagsx: No tags file found`)
            }
            return vscode.window.showInformationMessage(`ctagsx: No tags found for ${tag}`)
        } else if (options.length === 1) {
            return revealCTags(context, editor, options[0])
        } else {
            return vscode.window.showQuickPick(options).then(opt => {
                return revealCTags(context, editor, opt)
            })
        }
    })
    .catch(err => {
        console.log(err.stack)
        vscode.window.showErrorMessage(`ctagsx: Search failed: ${err}`)
    })
}

function jumpBack(context) {
    const stack = context.workspaceState.get('CTAGSX_JUMP_STACK', [])
    if (stack.length > 0) {
        const position = stack.pop()
        return context.workspaceState.update('CTAGSX_JUMP_STACK', stack).then(() => {
            const uri = vscode.Uri.parse(position.uri)
            const sel = new vscode.Selection(position.lineNumber, position.charPos, position.lineNumber, position.charPos)
            return openAndReveal(context, vscode.window.activeTextEditor, uri, sel)
        })
    }
}

function clearJumpStack(context) {
    return context.workspaceState.update('CTAGSX_JUMP_STACK', [])
}

function saveState(context, editor) {
    if (!editor) {
        // Can happen on manual entry with no editor open
        return Promise.resolve()
    }
    const currentPosition = {
        uri: editor.document.uri.toString(),
        lineNumber: editor.selection.active.line,
        charPos: editor.selection.active.character
    }

    const stack = context.workspaceState.get('CTAGSX_JUMP_STACK', [])
    if (stack.length > 0) {
        const lastPosition = stack[stack.length - 1]
        // As long as the jump position was roughly the same line, don't save to the stack
        if (lastPosition.uri === currentPosition.uri && lastPosition.lineNumber === currentPosition.lineNumber) {
            return Promise.resolve()
        } else if (stack.length > 50) {
            stack.shift()
        }
    }
    stack.push(currentPosition)
    console.log('ctagsx: Jump stack:', stack)

    return context.workspaceState.update('CTAGSX_JUMP_STACK', stack)
}

function getTag(editor) {
    const tag = editor.document.getText(editor.selection).trim()
    if (!tag) {
        const range = editor.document.getWordRangeAtPosition(editor.selection.active)
        if (range) {
            return editor.document.getText(range)
        }
    }
    return tag
}

function getLineNumber(entry) {
    let matchWhole = false
    let pattern = entry.address.pattern
    if (pattern.startsWith("^")) {
        pattern = pattern.substring(1, pattern.length)
    } else {
        console.error(`ctagsx: Unsupported pattern ${pattern}`)
        return Promise.resolve(0)
    }

    if (pattern.endsWith("$")) {
        pattern = pattern.substring(0, pattern.length - 1)
        matchWhole = true
    }

    let lineNumber = 0
    let charPos = 0
    let found
    return eachLine(entry.file, line => {
        lineNumber += 1
        if ((matchWhole && line === pattern) || line.startsWith(pattern)) {
          found = true
          charPos = Math.max(line.indexOf(entry.name), 0)
          console.log(`ctagsx: Found '${pattern}' at ${lineNumber}:${charPos}`)
          return false
        }
    })
    .then(() => {
        if (found) {
            return new vscode.Selection(lineNumber - 1, charPos, lineNumber - 1, charPos)
        }
    })
}

function getFileLineNumber(editor) {
    if (!editor) {
        // Can happen on manual entry with no editor open
        return Promise.resolve()
    }
    let pos = editor.selection.end.translate(0, 1)
    let range = editor.document.getWordRangeAtPosition(pos)
    if (range) {
        let text = editor.document.getText(range)
        if (text.match(/[0-9]+/)) {
            const lineNumber = Math.max(0, parseInt(text, 10) - 1)
            let charPos = 0

            pos = range.end.translate(0, 1)
            range = editor.document.getWordRangeAtPosition(pos)
            if (range) {
                text = editor.document.getText(range)
                if (text.match(/[0-9]+/)) {
                    charPos = Math.max(0, parseInt(text) - 1)
                }
            }
            console.log(`ctagsx: Resolved file position to line ${lineNumber + 1}, char ${charPos + 1}`)
            return Promise.resolve(new vscode.Selection(lineNumber, charPos, lineNumber, charPos))
        }
    }
    return Promise.resolve()
}

function openAndReveal(context, editor, document, sel, doSaveState) {
    if (doSaveState) {
        return saveState(context, editor).then(() => openAndReveal(context, editor, document, sel))
    }
    return vscode.workspace.openTextDocument(document).then(doc => {
        const showOptions = {
            viewColumn: vscode.ViewColumn.Active,
            preview: vscode.workspace.getConfiguration('ctagsx').get('openAsPreview'),
            selection: sel
        }
        return vscode.window.showTextDocument(doc, showOptions)
    })
}

function revealCTags(context, editor, entry) {
    if (!entry) {
        return
    }

    if (entry.address.lineNumber === 0) {
        return getLineNumber(entry).then(sel => {
            return openAndReveal(context, editor, entry.file, sel, true)
        })
    } else if (entry.kind === 'F') {
        return getFileLineNumber(editor).then(sel => {
            return openAndReveal(context, editor, entry.file, sel, true)
        })
    } else {
        const lineNumber = Math.max(0, entry.address.lineNumber - 1)
        const sel = new vscode.Selection(lineNumber, 0, lineNumber, 0)
        return openAndReveal(context, editor, entry.file, sel, true)
    }
}