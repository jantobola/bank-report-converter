import '../assets/css/App.css';

import React, {Component} from 'react';
import FileDrop from 'react-file-drop';
import {remote} from 'electron'
import csv from 'csvtojson';
import fs from 'fs';
import iconv from 'iconv-lite';
import os from 'os';
import XlsxTemplate from 'xlsx-template';
import moment from 'moment';
import path from 'path';

class App extends Component {

    state = {files: []};
    categories = App.loadCategories();

    removeDuplicates(myArr, prop) {
        return myArr.filter((obj, pos, arr) => {
            return arr.map(mapObj => mapObj[prop]).indexOf(obj[prop]) === pos;
        });
    }

    static loadCategories() {
        return JSON.parse(fs.readFileSync(App.getPath(["res", "categories.json"])).toString());
    }

    static getPath(paths) {
        let basePath = remote.app.getAppPath();
        return path.join(basePath, ...paths);
    }

    getCategory(generalDescription, originatorDescription) {
        for (let key in this.categories) {
            let category = this.categories[key];
            for (let tokens of category) {
                if (generalDescription.toLowerCase().indexOf(tokens.toLowerCase()) !== -1 ||
                    originatorDescription.toLowerCase().indexOf(tokens.toLowerCase()) !== -1) {
                    return key;
                }
            }
        }
        return "";
    }

    parseReportsKB = async () => {
        let parserConfig = {
            delimiter: ";",
            noheader: true
        };
        let reports = [];
        let files = this.state.files;
        for (let i = 0; i < files.length; i++) {
            let content = fs.readFileSync(files[i].path);
            let converted = iconv.decode(content, "iso-8859-2");
            let lines = converted.split(os.EOL);
            if (lines.length < 19) {
                continue;
            }
            let accountNumber = lines[3].split(';')[1].replace(/"/g, '').split(' ')[0].trim();
            lines = lines.slice(18, lines.length);
            content = lines.join(os.EOL);
            let result = await csv(parserConfig).fromString(content);
            let struct = result.map(r => {
                return {
                    date: r['field1'].trim(),
                    account: accountNumber,
                    beneficiaryAccount: r['field3'].trim(),
                    beneficiary: r['field4'].trim(),
                    amount: parseFloat(r['field5'].trim()),
                    systemDescription: r['field13'].trim(),
                    originatorDescription: r['field14'].trim(),
                    generalDescription: r['field16'].trim(),
                    category: this.getCategory(r['field16'].trim(), r['field14'].trim())
                }
            });
            reports.push(struct);
        }
        let result = [].concat(...reports);
        result.sort((a, b) => {
            return moment(a.date, "DD.MM.YYYY").toDate() - moment(b.date, "DD.MM.YYYY").toDate();
        });
        return result;
    };

    parseReportsEqua = async () => {

    };

    static createExcelFile(reports, filename) {
        let templateData = fs.readFileSync(App.getPath(["res", "template.xlsx"]));
        let template = new XlsxTemplate(templateData);
        let values = { data: reports };
        template.substitute(1, values);
        let data = template.generate({ type: 'nodebuffer' });
        fs.writeFileSync(filename, data);
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
                App.createExcelFile(reports, filename);
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
