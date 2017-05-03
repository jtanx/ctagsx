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
            tag.description = tag.kind || ''
            tag.label = tag.file
            tag.detail = tag.address.pattern || `Line ${tag.address.lineNumber}`
            tag.file = path.join(path.dirname(result.tagsFile), tag.file)
            return tag
        })

        if (!options.length) {
            if (!result.tagsFile) {
                return vscode.window.showWarningMessage(`ctagsx: No tags file found`)
            }
            return vscode.window.showInformationMessage(`ctagsx: No tags found for ${tag}`)
        } else if (options.length === 1) {
            return revealCTags(options[0])
        } else {
            return vscode.window.showQuickPick(options).then(opt => revealCTags(opt))
        }
    })
    .catch(err => {
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

    let i = 0
    let found
    return eachLine(entry.file, line => {
        i += 1
        if ((matchWhole && line === pattern) || line.startsWith(pattern)) {
          found = true
          console.log(`ctagsx: Found ${pattern} at ${i}`)
          return false
        }
    })
    .then(() => {
        if (!found) {
            return 0
        }
        return i
    })
}

function openAndReveal(entry) {
    return vscode.workspace.openTextDocument(entry.file).then(doc => {
        vscode.window.showTextDocument(doc).then(editor => {
            if (entry.address.lineNumber > 0) {
                const lineSelection = new vscode.Selection(entry.address.lineNumber - 1, 0, entry.address.lineNumber - 1, 0)
                editor.selection = lineSelection
                editor.revealRange(lineSelection, vscode.TextEditorRevealType.InCenter)
            }
        })
    })
}

function revealCTags(entry) {
    if (!entry) {
        return
    }

    if (entry.address.lineNumber === 0) {
        return getLineNumber(entry).then(line => {
            entry.address.lineNumber = line
            return openAndReveal(entry)
        })
    } else {
        return openAndReveal(entry)
    }
}