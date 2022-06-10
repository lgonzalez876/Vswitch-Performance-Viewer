// Webpack uses this to work with directories
const path = require('path');
var webpack = require('webpack');
// This is the main configuration object.
// Here, you write different options and tell Webpack what to do
module.exports = {


  resolve: {
      extensions: [ '.ts', '.js' ],
      fallback: { 
          "crypto": require.resolve("crypto-browserify"),
          "stream": require.resolve("stream-browserify"),
          "buffer": require.resolve("buffer")
    }
  },

  plugins: [
    // Work around for Buffer is undefined:
    // https://github.com/webpack/changelog-v5/issues/10
    new webpack.ProvidePlugin({
        Buffer: ['buffer', 'Buffer'],
    }),
    new webpack.ProvidePlugin({
        process: 'process/browser',
    }),
  ],



  target: 'node',
  // Path to your entry point. From this file Webpack will begin its work
  entry: './src/index.js',

  // Path and filename of your result bundle.
  // Webpack will bundle all JavaScript into this file
  output: {
    path: path.resolve(__dirname, 'dist'),
    publicPath: '',
    filename: 'main.js'
  },

  module: {
    rules: [
        {
            test: /\.js$/,
            exclude: /(node_modules)/,
            use: {
              loader: 'babel-loader',
              options: {
                presets: ['@babel/preset-env']
              }
            }
          }
    ]
  },
 

  // Default mode for Webpack is production.
  // Depending on mode Webpack will apply different things
  // on the final bundle. For now, we don't need production's JavaScript 
  // minifying and other things, so let's set mode to development
  mode: 'development'
};


