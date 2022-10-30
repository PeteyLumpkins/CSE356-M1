const path = require('path');
const ForkTsCheckerWebpackPlugin = require('fork-ts-checker-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const JavaScriptObfuscator = require('webpack-obfuscator');

module.exports = {
    entry: {
        crdt: './src/index.ts',
        quill: './src/quill.js',
    },
    output: {
        filename: '[name].js',
        path: path.resolve(__dirname, '../server/public/dist'),
    },
    mode: 'production',
    resolve: {
        extensions: ['.ts', '.js', '.json'],
    },
    module: {
        rules: [
            {
                test: /\.(ts|js)?$/,
                use: {
                    loader: 'babel-loader',
                },
                exclude: /node_modules/,
            },
        ]
    },
    plugins: [
        new ForkTsCheckerWebpackPlugin(),
        new HtmlWebpackPlugin({
            template: 'public/index.html'
        }),
        new JavaScriptObfuscator({
            rotateStringArray: true
        })
    ],
    performance: {
        hints: false,
        maxEntrypointSize: 512000,
        maxAssetSize: 512000
    }
};
