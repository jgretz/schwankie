import autoprefixer from 'autoprefixer';
import HtmlWebpackPlugin from 'html-webpack-plugin';
import {EnvironmentPlugin, HotModuleReplacementPlugin} from 'webpack';

export default {
  mode: 'development',
  entry: {
    main: [
      'babel-polyfill',
      'webpack-hot-middleware/client?reload=true',
      './app/index.js',
    ],
  },
  output: {
    publicPath: '/',
  },
  devtool: 'eval-source-map',
  plugins: [
    new EnvironmentPlugin({API_BASE_URL: 'http://localhost:4000/api/'}),
    new HotModuleReplacementPlugin(),
    new HtmlWebpackPlugin({template: 'app/index.ejs'}),
  ],
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /(node_modules|babelHelpers)/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: [
              [
                'env',
                {
                  modules: false,
                  forceAllTransforms: true,
                },
              ],
              'react',
            ],
            plugins: [
              'transform-decorators-legacy',
              'react-hot-loader/babel',
              'syntax-dynamic-import',
              'transform-object-rest-spread',
              'external-helpers',
            ],
          },
        },
      },
      {
        test: /\.scss$/,
        use: [
          'style-loader',
          {
            loader: 'css-loader',
            options: {
              sourceMap: true,
              importLoaders: 2,
            },
          },
          {
            loader: 'postcss-loader',
            options: {
              sourceMap: true,
              plugins: [autoprefixer],
            },
          },
          {
            loader: 'sass-loader',
            options: {
              sourceMap: true,
            },
          },
        ],
      },
      {
        test: /\.css$/,
        use: [
          'style-loader',
          {
            loader: 'css-loader',
            options: {
              sourceMap: true,
            },
          },
        ],
      },
      {
        test: /\.eot(\?v=\d+.\d+.\d+)?$/,
        use: ['file-loader'],
      },
      {
        test: /\.woff(2)?(\?v=[0-9]\.[0-9]\.[0-9])?$/,
        use: ['file-loader'],
      },
      {
        test: /\.ttf(\?v=\d+\.\d+\.\d+)?$/,
        use: ['file-loader'],
      },
      {
        test: /\.otf(\?v=\d+\.\d+\.\d+)?$/,
        use: ['file-loader'],
      },
      {
        test: /\.svg(\?v=\d+\.\d+\.\d+)?$/,
        use: ['file-loader'],
      },
      {
        test: /\.(jpe?g|png|gif)$/i,
        use: ['file-loader'],
      },
    ],
  },
};
