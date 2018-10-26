import '../assets/css/App.css';
import React, {Component} from 'react';
import FileDrop from 'react-file-drop';
import {remote} from 'electron'
import csv from 'csvtojson';
import fs from 'fs';
import iconv from 'iconv-lite';
import os from 'os';

class App extends Component {

    state = {files: []};

    removeDuplicates(myArr, prop) {
        return myArr.filter((obj, pos, arr) => {
            return arr.map(mapObj => mapObj[prop]).indexOf(obj[prop]) === pos;
        });
    }

    parseReportsKB = async () => {
        let parserConfig = {
            delimiter: ";",
            noheader: true
        };
        let reports = [];
        let files = this.state.files;
        for (let i = 0; i < files.length; i++) {
            console.log("pruchod");
            let content = fs.readFileSync(files[i].path);
            let converted = iconv.decode(content, "iso-8859-2");
            let lines = converted.split(os.EOL);
            if (lines.length < 19) {
                continue;
            }
            lines = lines.slice(18, lines.length);
            content = lines.join(os.EOL);
            let result = await csv(parserConfig).fromString(content);
            console.log(result);
            let struct = result.map(r => {
                return {
                    date: r['field1']
                }
            });
            reports.push(struct);
        }
        return reports;
    };

    parseReportsEqua = async () => {

    };

    async createExcelFile(report, filename) {

    }

    handleDrop = (files, event) => {
        event.preventDefault();
        const fileList = [...files];
        let simpleFiles = fileList.filter(f => f.name.endsWith(".csv")).map(f => {
            return {name: f.name, path: f.path}
        });
        let newState = {files: this.removeDuplicates([...this.state.files, ...simpleFiles], "path")};
        this.setState(newState);
    };

    handleConvert = async () => {
        remote.dialog.showSaveDialog({defaultPath: "report.xlsx"}, async (filename) => {
            if (filename === undefined) {
                return;
            }
            let bank = this.refs.selectedBank.value;
            let reports;
            try {
                if (bank === "kb") {
                    reports = await this.parseReportsKB();
                } else if (bank === "equa") {
                    reports = await this.parseReportsEqua();
                }

                console.log(reports);

                await this.createExcelFile(reports, filename);
                remote.dialog.showMessageBox(
                    {type: "info", title: "Conversion Result", message: "Your Excel file has been generated.", buttons: ["OK"]}
                );
                this.setState({files: []});
            } catch (err) {
                remote.dialog.showMessageBox(
                    {type: "error", title: "Error occurerd", message: err.message, buttons: ["OK"]}
                );
            }
        })
    };

    render() {
        let fileNames = this.state.files.map(({name}) =>
            <li key={name}>{name}</li>
        );
        return (
            <FileDrop onDrop={this.handleDrop}>
                <div style={{position: 'fixed', margin: '0', padding: '0', top: '0', left: 0, width: '100%', height: '100%'}}>
                    <div style={{width: '80%', height: '85%', margin: '0 auto', textAlign: 'center'}}>
                        {this.state.files.length > 0
                            ? <h1>Files to convert:</h1>
                            : <h1>Drag & Drop CSV reports from your bank...</h1>
                        }
                        <div style={{textAlign: 'left'}}>
                            <ul>
                                {fileNames}
                            </ul>
                        </div>
                    </div>
                    <div style={{margin: '0 auto', width: '80%', textAlign: 'center'}}>
                        <select name="bank" ref="selectedBank" defaultValue="kb">
                            <option value="kb">Komerční Banka</option>
                            <option value="equa">Equa Bank</option>
                        </select>
                        &nbsp;&nbsp;
                        <button onClick={this.handleConvert} disabled={this.state.files.length === 0}>
                            Convert files to Excel
                        </button>
                    </div>
                </div>
            </FileDrop>
        );
    }
}

export default App;
