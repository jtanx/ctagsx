const ctagz = require('ctagz')
const lineReader = require('line-reader')
const path = require('path')
const Promise = require('bluebird')
const vscode = require('vscode')
const eachLine = Promise.promisify(lineReader.eachLine)

// Called when the plugin is first activated
function activate(context) {
    console.log('ctagsx is live')

    const disposable = vscode.commands.registerCommand('extension.findCTags', () => findCTags(context))
    context.subscriptions.push(disposable)
}
exports.activate = activate

// Called when the plugin is deactivated
function deactivate() {
    console.log('ctagsx is tombstoned')
}
exports.deactivate = deactivate

function findCTags(/* context */) {
    const editor = vscode.window.activeTextEditor
    if (!editor) {
        console.log('ctagsx: Cannot search - no active editor (file too large? https://github.com/Microsoft/vscode/issues/3147)')
        return
    }

    const tag = getTag(editor)
    if (!tag) {
        return
    }

    ctagz.findCTagsBSearch(editor.document.fileName, tag)
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
            return revealCTags(editor, options[0])
        } else {
            return vscode.window.showQuickPick(options).then(opt => revealCTags(editor, opt))
        }
    })
    .catch(err => {
        console.log(err.stack)
        vscode.window.showErrorMessage(`ctagsx: Search failed: ${err}`)
    })
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

function revealCTags(editor, entry) {
    if (!entry) {
        return
    }

    const openAndReveal = (sel) => {
        return vscode.workspace.openTextDocument(entry.file).then(doc => {
            return vscode.window.showTextDocument(doc, editor.viewColumn).then(editor => {
                if (sel) {
                    editor.selection = sel
                    editor.revealRange(sel, vscode.TextEditorRevealType.InCenter)
                }
            })
        })
    }

    if (entry.address.lineNumber === 0) {
        return getLineNumber(entry).then(sel => {
            return openAndReveal(sel)
        })
    } else if (entry.kind === 'F') {
        return getFileLineNumber(editor).then(sel => {
            return openAndReveal(sel)
        })
    } else {
        const lineNumber = Math.max(0, entry.address.lineNumber - 1)
        const sel = new vscode.Selection(lineNumber, 0, lineNumber, 0)
        return openAndReveal(sel)
    }
}