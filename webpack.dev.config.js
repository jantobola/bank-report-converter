const webpack = require('webpack');
const path = require('path');
const {spawn} = require('child_process');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const CleanWebpackPlugin = require('clean-webpack-plugin');

// Config directories
const SRC_DIR = path.resolve(__dirname, 'src');
const RES_DIR = path.resolve(__dirname, 'res');
const OUTPUT_DIR = path.resolve(__dirname, 'dist');

// Any directories you will be adding code/files into, need to be added to this array so webpack will pick them up
const defaultInclude = [SRC_DIR];

module.exports = {
    entry: SRC_DIR + '/index.js',
    output: {
        path: OUTPUT_DIR,
        publicPath: '/',
        filename: 'bundle.js'
    },
    module: {
        rules: [
            {
                test: /\.css$/,
                use: [{loader: 'style-loader'}, {loader: 'css-loader'}],
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
            title: "Money Report (Development)"
        }),
        new webpack.DefinePlugin({
            'process.env.NODE_ENV': JSON.stringify('development')
        }),
        new CopyWebpackPlugin([{
            from: RES_DIR, to: path.join(OUTPUT_DIR, 'res'), force: true
        }], {}),
        new CleanWebpackPlugin([ 'dist' ], { beforeEmit: true })
    ],
    devtool: 'cheap-source-map',
    devServer: {
        contentBase: OUTPUT_DIR,
        stats: {
            colors: true,
            chunks: false,
            children: false
        },
        setup() {
            spawn(
                'electron',
                ['.'],
                {shell: true, env: process.env, stdio: 'inherit'}
            )
                .on('close', code => process.exit(0))
                .on('error', spawnError => console.error(spawnError));
        }
    }
};
