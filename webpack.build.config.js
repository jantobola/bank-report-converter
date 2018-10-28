const webpack = require('webpack');
const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const BabiliPlugin = require('babili-webpack-plugin');
const ExtractTextPlugin = require('extract-text-webpack-plugin');
const CleanWebpackPlugin = require('clean-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');

// Config directories
const MAIN_JS_PATH = path.resolve(__dirname, 'main.js');
const PACKAGE_JSON_PATH = path.resolve(__dirname, 'package.json');
const SRC_DIR = path.resolve(__dirname, 'src');
const RES_DIR = path.resolve(__dirname, 'res');
const OUTPUT_DIR = path.resolve(__dirname, 'dist');

// Any directories you will be adding code/files into, need to be added to this array so webpack will pick them up
const defaultInclude = [SRC_DIR];

module.exports = {
    entry: SRC_DIR + '/index.js',
    output: {
        path: OUTPUT_DIR,
        publicPath: './',
        filename: 'bundle.js'
    },
    module: {
        rules: [
            {
                test: /\.css$/,
                use: ExtractTextPlugin.extract({
                    fallback: 'style-loader',
                    use: 'css-loader'
                }),
                include: defaultInclude
            },
            {
                test: /\.jsx?$/,
                use: [{loader: 'babel-loader'}],
                include: defaultInclude
            },
            {
                test: /\.(jpe?g|png|gif)$/,
                use: [{loader: 'file-loader?name=img/[name]__[hash:base64:5].[ext]'}],
                include: defaultInclude
            },
            {
                test: /\.(eot|svg|ttf|woff|woff2)$/,
                use: [{loader: 'file-loader?name=font/[name]__[hash:base64:5].[ext]'}],
                include: defaultInclude
            }
        ]
    },
    target: 'electron-renderer',
    plugins: [
        new HtmlWebpackPlugin({
            title: "Money Report"
        }),
        new ExtractTextPlugin('bundle.css'),
        new webpack.DefinePlugin({
            'process.env.NODE_ENV': JSON.stringify('production')
        }),
        new CopyWebpackPlugin([
            { from: RES_DIR, to: path.join(OUTPUT_DIR, 'res'), force: true },
            { from: MAIN_JS_PATH, to: OUTPUT_DIR, force: true },
            { from: PACKAGE_JSON_PATH, to: OUTPUT_DIR, force: true }
        ], {}),
        new CleanWebpackPlugin([ 'dist' ], { beforeEmit: true }),
        new BabiliPlugin()
    ],
    stats: {
        colors: true,
        children: false,
        chunks: false,
        modules: false
    }
};
