import '../assets/css/App.css';
import React, { Component } from 'react';
import FileDrop from 'react-file-drop';
import fs from 'fs';
import {remote} from 'electron'

class App extends React.Component {

	state = {files: [], saveTo: null};

	removeDuplicates(myArr, prop) {
	    return myArr.filter((obj, pos, arr) => {
	        return arr.map(mapObj => mapObj[prop]).indexOf(obj[prop]) === pos;
	    });
	}

	handleDrop = (files, event) => {
		event.preventDefault();
    	const fileList = [...files];
    	let simpleFiles = fileList.map(f => { return { name: f.name, path: f.path } });
    	let newState = { files: this.removeDuplicates([...this.state.files, ...simpleFiles], "path"), saveTo: this.state.saveTo};
    	this.setState(newState);
  	};

  	handleConvert = (e) => {

  		remote.dialog.showSaveDialog({defaultPath: "report.xlsx"}, (filenames) => {
  			console.log(filenames);
  			
  			remote.dialog.showMessageBox(
  				{ type: "info", title: "Conversion Result", message: "Your Excel file has been generated.", buttons: ["OK"] }
  			);
  			this.setState({files: [], saveTo: null});
  		})
  	}

	render() {
		let fileNames = this.state.files.map( ({name}) =>
			<li key={name}>{name}</li> 
		);
		return (
	    	<FileDrop onDrop={this.handleDrop}>
	    		<div style={{ position: 'fixed', margin: '0', padding: '0', top: '0', left: 0, width: '100%', height: '100%' }}>
	    			<div style={{ width: '80%', height: '85%', margin: '0 auto', textAlign: 'center' }}>
		    			{
		    				this.state.files.length > 0 
		    				? 
		    				<h1>Files to convert:</h1> 
		    				: 
		    				<h1>Drag & Drop CSV reports from your bank...</h1>
		    			}
		    			<div style={{ textAlign: 'left' }}>
				      		<ul>
				    			{fileNames}
				    		</ul>
			    		</div>
	    			</div>
	    			<div style={{ margin: '0 auto', width: '80%', textAlign: 'center' }}>
	    				<button onClick={this.handleConvert} 
	    					disabled={this.state.files.length == 0}>Convert files to Excel</button>
	    			</div>
	    		</div>
	    	</FileDrop>
		);
	}
}

export default App;