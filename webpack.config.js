const packageJSON = require('./package.json');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');
const { ModuleFederationPlugin } = require('webpack').container;
const path = require('path');

const connectionConfig = {
  dependencies: [], // wait for the output of the injectables config
  mode: 'development',
  target: 'electron-renderer',
  devtool: 'eval',
  module: {
    rules: [
      // For newer versions of Webpack it should be
      {
        test: /\.(png|svg|jpg|jpeg|gif)$/i,
        type: 'asset/resource',
      },
      {
        test: /\.(js|jsx|tsx|ts)$/,
        exclude: /node_modules/,
        use: [
          {
            loader: 'babel-loader',
          },
          {
            loader: 'ts-loader',
            options: {
              configFile: path.resolve('./tsconfig.json'),
            },
          },
        ],
      },
    ],
  },
  resolve: {
    extensions: ['.tsx', '.ts', '.js', 'jsx'],
    modules: ['node_modules', 'src'],
    fallback: {
      mobx: false,
      'mobx-react-lite': false,
      '@hummhive/api-react-utils': false,
      '@hummhive/constants': false,
      '@hummhive/types': false,
      '@hummhive/ui-elements': false,
      '@hummhive/state': false,
      '@material-ui/core': false,
      inversify: false,
      moment: false,
      react: false,
      'react-dom': false,
      'react-icons/ai': false,
      'react-icons/bs': false,
      'react-icons/fi': false,
      'react-moment': false,
      'react-router-dom': false,
      'react-spring': false,
      'styled-components': false,
      'tweetnacl-util': false,
      uuid: false,
    },
  },
  plugins: [
    new CleanWebpackPlugin(),
    // new BundleAnalyzerPlugin(),
    new ModuleFederationPlugin({
      name: packageJSON.name,
      library: { type: 'umd', name: packageJSON.name },
      filename: 'remoteEntry.js',
      exposes: {
        './api': './src/api',
      },
      shared: {
        mobx: {
          requiredVersion: packageJSON.peerDependencies['mobx'],
        },
        'mobx-react-lite': {
          requiredVersion: packageJSON.peerDependencies['mobx-react-lite'],
        },
        '@hummhive/api-react-utils': {
          requiredVersion: false,
        },
        '@hummhive/constants': {
          requiredVersion: false,
        },
        '@hummhive/types': {
          requiredVersion: false,
        },
        '@hummhive/ui-elements': {
          requiredVersion: false,
        },
        '@hummhive/state': {
          requiredVersion: false,
        },
        '@hummhive/state/group': {
          requiredVersion: false,
        },
        '@hummhive/state/hive': {
          requiredVersion: false,
        },
        '@hummhive/state/invite': {
          requiredVersion: false,
        },
        '@hummhive/state/member': {
          requiredVersion: false,
        },
        '@hummhive/state/connectionInstall': {
          requiredVersion: false,
        },
        '@hummhive/state/connectionConfig': {
          requiredVersion: false,
        },
        '@hummhive/state/ui': {
          requiredVersion: false,
        },
        '@material-ui/core': {
          requiredVersion: false,
        },
        inversify: {
          requiredVersion: packageJSON.peerDependencies['inversify'],
        },
        'mime-types': {
          requiredVersion: false,
        },
        moment: {
          requiredVersion: false,
        },
        'react-icons/ai': {
          requiredVersion: false,
        },
        'react-icons/bs': {
          requiredVersion: false,
        },
        'react-icons/fi': {
          requiredVersion: false,
        },
        'react-moment': {
          requiredVersion: false,
        },
        'react-router-dom': {
          singleton: true,
          requiredVersion: packageJSON.peerDependencies['react-router-dom'],
        },
        'react-spring': {
          requiredVersion: false,
        },
        react: {
          singleton: true,
          requiredVersion: packageJSON.peerDependencies['react'],
        },
        'react-dom': {
          singleton: true,
          requiredVersion: packageJSON.peerDependencies['react-dom'],
        },
        'styled-components': {
          singleton: true,
          requiredVersion: packageJSON.peerDependencies['styled-components'],
        },
        'tweetnacl-util': {
          requiredVersion: false,
        },
        uuid: {
          requiredVersion: false,
        },
      },
    }),
  ],
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: '[name].js',
    library: packageJSON.name,
    libraryTarget: 'umd',
    globalObject: 'this',
    umdNamedDefine: true,
  },
};

module.exports = [connectionConfig];
