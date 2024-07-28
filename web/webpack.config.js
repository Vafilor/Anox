const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = (webpackEnv, argv) => {
    const isEnvDevelopment = argv.mode === 'development';
    const isEnvProduction = argv.mode === 'production';

    // TODO how can I tell ts-loader to include source maps based on dev environment only?
    // make sure to remove it from tsconfig.json
    // ForkTsCheckerWebpackPlugin
    return {
        entry: './src/index.tsx',
        module: {
            rules: [
                {
                    test: /\.tsx?$/,
                    use: 'ts-loader',
                    exclude: /node_modules/,
                },
                {
                    test: /\.(png|svg|jpg|jpeg|gif)$/i,
                    type: 'asset/resource',
                },
                {
                    test: /\.css$/i,
                    use: [
                        "style-loader",
                        "css-loader",
                        {
                            loader: "postcss-loader",
                            options: {
                                postcssOptions: {
                                    plugins: []
                                }
                            }
                        }
                    ]
                }
            ],
        },
        devtool: isEnvDevelopment ? 'inline-source-map' : false,
        resolve: {
            alias: {
                "@": path.resolve(__dirname, "src")
            },
            extensions: ['.tsx', '.ts', '.js'],
        },
        plugins: [
            new HtmlWebpackPlugin({
                title: "Anox",
                template: './src/index.html'
            })
        ],
        output: {
            filename: '[name].bundle.js',
            path: path.resolve(__dirname, 'dist'),
            publicPath: '/',
            clean: true
        },
        devServer: {
            static: './dist',
            historyApiFallback: true
        },
        optimization: {
            runtimeChunk: 'single'
        }
    };
}