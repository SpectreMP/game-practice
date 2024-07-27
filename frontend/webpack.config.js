const path = require("path");
const HtmlWebpackPlugin = require("html-webpack-plugin");

const webpack = require('webpack')
const dotenv = require('dotenv')
dotenv.config();

module.exports = {
  entry: "./src/index.js",
  output: {
    filename: "main.js",
    path: path.resolve(__dirname, "build"),
    publicPath: "/",
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: path.join(__dirname, "src", "index.html"),
    }),
    new webpack.DefinePlugin({
      'process.env': JSON.stringify(process.env)
   })
  ],
  module: {
    rules: [
      {
        test: /.(js|jsx|tsx)$/,
        exclude: /node_modules/,
        use: [ "babel-loader" ],
      },
      {
        test: /\.css$/,
        test: /\.(sass|less|css)$/,
        use: ["style-loader", "css-loader", 'sass-loader'],
      },
    ],
  },
  resolve: {
    extensions: ["*", ".js", ".jsx", ".tsx"],
  },
  devServer: {
    historyApiFallback: true,
    static: {
      directory: path.join(__dirname, "dist"),
    },
    port: 3000,
  }
};