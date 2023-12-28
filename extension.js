const vscode = require('vscode');
const { exec } = require('child_process');
const path = require('path');

let diagnostics;
let runningProcess;

function activate(context) {
	exec('gcc --version', (error) => {
		if (error) {
			vscode.window.showErrorMessage('Không tìm thấy trình biên dịch, vui lòng cài theo hướng dẫn sau.');
			vscode.commands.executeCommand('markdown.showPreview', vscode.Uri.joinPath(context.extensionUri, 'Guide.md'));
		}
	});

	exec('g++ --version', (error) => {
		if (error) {
			vscode.window.showErrorMessage('Không tìm thấy trình biên dịch, vui lòng cài theo hướng dẫn sau.');
			vscode.commands.executeCommand('markdown.showPreview', vscode.Uri.joinPath(context.extensionUri, 'Guide.md'));
		}
	});

	const buildButton = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left);
	buildButton.text = "$(debug-start) Chạy";
	buildButton.tooltip = "Nhấn vào đây để chạy code của bạn";
	buildButton.command = "extension.buildCode";
	buildButton.icon = "$(debug-start)";
	buildButton.show();
	context.subscriptions.push(buildButton);

	const stopButton = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left);
	stopButton.text = "$(debug-stop) Dừng";
	stopButton.tooltip = "Nhấn vào đây để dừng quá trình";
	stopButton.command = "extension.stopCode";
	stopButton.icon = "$(debug-stop)";
	stopButton.hide();
	context.subscriptions.push(stopButton);

	const config = vscode.workspace.getConfiguration('C_Cpp');
	if (config.get('debugShortcut') !== false) {
		config.update('debugShortcut', false, vscode.ConfigurationTarget.Global);
	}

	const stopCommand = vscode.commands.registerCommand('extension.stopCode', () => {
		if (runningProcess) {
			runningProcess.kill();
			vscode.commands.executeCommand("setContext", "extension.buildCode.isCodeRunning", false);
			runningProcess = null;
		}
	});
	context.subscriptions.push(stopCommand);

	const disposable = vscode.commands.registerCommand('extension.buildCode', () => {
		const activeEditor = vscode.window.activeTextEditor;
		if (activeEditor) {
			const filePath = activeEditor.document.fileName;
			if (filePath.endsWith('.cpp') || filePath.endsWith('.c')) {
				buildButton.hide();
				vscode.commands.executeCommand("setContext", "extension.buildCode.isCodeRunning", true);
				stopButton.show();

				const text = activeEditor.document.getText();
				const trimmedText = text.replace(/^[\r\n]+|[\r\n]+$/g, '');
				activeEditor.edit(editBuilder => {
					const start = new vscode.Position(0, 0);
					const end = activeEditor.document.lineAt(activeEditor.document.lineCount - 1).range.end;
					const range = new vscode.Range(start, end);
					editBuilder.replace(range, trimmedText);
				});
				vscode.commands.executeCommand('editor.action.formatDocument');
				vscode.commands.executeCommand('workbench.action.files.save');

				const outputFilePath = path.join(path.dirname(filePath), path.basename(filePath, path.extname(filePath)));
				const buildCommand = filePath.endsWith('.cpp') ? `g++ ${filePath} -o ${outputFilePath}` : `gcc ${filePath} -o ${outputFilePath}`;
				vscode.commands.executeCommand('workbench.action.closePanel');

				runningProcess = exec(buildCommand, (error, stdout, stderr) => {
					let buildSuccessful = true;

					if (error) {
						buildButton.icon = "$(debug-start)";
						vscode.commands.executeCommand("setContext", "extension.buildCode.isCodeRunning", false);
						buildButton.show();
						stopButton.hide();
						buildSuccessful = false;
						vscode.window.showErrorMessage(`Lỗi: ${error.message}`);

						const errorLineRegex = /(\d+):\d+: error: ([^]+?)(\n\s+at\s+\S+\s+\S+\s+\S+)*\n/g;
						let match;

						while ((match = errorLineRegex.exec(stderr)) !== null) {
							const lineNumber = parseInt(match[1]) - 1;
							const errorMessage = match[2];
							const diagnostic = new vscode.Diagnostic(
								new vscode.Range(lineNumber, 0, lineNumber, 0),
								errorMessage,
								vscode.DiagnosticSeverity.Error
							);
							diagnostics.set(vscode.window.activeTextEditor.document.uri, [diagnostic]);
						}

						if (buildSuccessful) {
							diagnostics.delete(vscode.window.activeTextEditor.document.uri);
						}
					} else {
						buildButton.icon = "$(debug-start)";
						vscode.commands.executeCommand("setContext", "extension.buildCode.isCodeRunning", false);
						buildButton.show();
						stopButton.hide();
						buildSuccessful = true;
						vscode.window.showInformationMessage('Biên dịch thành công');
						setTimeout(() => {
							vscode.commands.executeCommand("notifications.clearAll");
						}, 4000);
						if (buildSuccessful) {
							diagnostics.delete(vscode.window.activeTextEditor.document.uri);
						}

						const terminalCommand = `start cmd.exe /K "${outputFilePath}.exe"`;
						if (runningProcess) {
							exec(terminalCommand, (terminalError) => {
								if (terminalError) {
									buildSuccessful = false;
									vscode.window.showErrorMessage(`Lỗi khi chạy chương trình: ${terminalError.message}`);

									if (buildSuccessful) {
										diagnostics.delete(vscode.window.activeTextEditor.document.uri);
									}
								}
							});
						}
					}
				});
			} else {
				vscode.window.showErrorMessage('Chỉ build được code C với C++ thôi.');
			}
		} else {
			vscode.window.showErrorMessage('Vui lòng mở file code trước.');
		}
	});

	context.subscriptions.push(disposable);

	vscode.window.onDidChangeActiveTextEditor((editor) => {
		if (editor && (editor.document.fileName.endsWith('.cpp') || editor.document.fileName.endsWith('.c'))) {
			buildButton.show();
		} else {
			buildButton.hide();
		}
	});

	diagnostics = vscode.languages.createDiagnosticCollection('compilation');
}

function deactivate() { }

module.exports = {
	activate,
	deactivate
};