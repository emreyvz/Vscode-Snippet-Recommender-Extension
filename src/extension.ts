
import * as vscode from 'vscode';
const serp = require("serp");
import fetch from 'node-fetch';
const translate = require('translate-google')

export function activate(context: vscode.ExtensionContext) {

	let disposable = vscode.commands.registerCommand('snippet-suggest-by-text.fetchSnippet', async () => {
		const editor = vscode.window.activeTextEditor;
		if (editor) {
			const selection: any = editor.document.getText(editor.selection).toString();
			const language = editor.document.languageId;
			translate(selection, { to: 'en' }).then(async res => {
				var options = {
					host: "google.com",
					qs: {
						q: language + " " + res + " site:stackoverflow.com",
						retry: 3
					},
					num: 1
				};
				const links = await serp.search(options);			
				const stackOverflowPostId = links[0].url.match(/stackoverflow.com\/[a-zA-Z0-9-]+\/(\d+)/)[1];
				const url: string = `https://api.stackexchange.com/2.3/questions/${stackOverflowPostId}/answers?page=1&pagesize=1&order=desc&sort=creation&site=stackoverflow&filter=withbody`;
				const altUrl: string = `https://api.stackexchange.com/2.3/answers/${stackOverflowPostId}?page=1&pagesize=1&order=desc&sort=creation&site=stackoverflow&filter=withbody`;
				
				try {
					let response = await fetch(url);
					let data: any = await response.json();
					if (data.items.length < 1){
						response = await fetch(altUrl);
						data = await response.json();
					}		
					const commentBody = data.items[0].body;
					let comment: any = null;
					try {			
						comment = commentBody.replace("\n", "")
							.replace(/<\s*(\w+).*?>/, '<$1>')
							.replace(/[a-zA-Z0-9-]+="[a-zA-Z0-9- ]+"/g, '')
							.replace(/[a-zA-Z0-9-]+='[a-zA-Z0-9- ]+'/g, '')
							.replace(/[ ]+>/g, '>')
							.match(/<pre>.*?<\/pre>/ims)![0]
							.replace("<pre>", "")
							.replace("<code>", "")
							.replace("</pre>", "")
							.replace("</code>", "");
					} catch (error) {
						comment = commentBody.replace("\n", "")
							.replace(/<\s*(\w+).*?>/, '<$1>')
							.replace(/[a-zA-Z0-9-]+="[a-zA-Z0-9- ]+"/g, '')
							.replace(/[a-zA-Z0-9-]+='[a-zA-Z0-9- ]+'/g, '')
							.replace(/[ ]+>/g, '>')
							.replace(/<.*?>/, '')
							.replace(/<\/.*?>/, '');
					}

					const replacedValue = comment.replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&amp;/g,'&');

					editor.edit(editBuilder => {
						editBuilder.replace(editor.selection, replacedValue);
					});
				} catch (exception) {
					console.log(exception);
				}
			}).catch(err => {
				console.error(err)
			})
		}
	});

	context.subscriptions.push(disposable);
}


export function deactivate() { }
