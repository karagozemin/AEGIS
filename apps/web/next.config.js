/** @type {import('next').NextConfig} */
const path = require('path');
const webpack = require('webpack');

const nextConfig = {
  reactStrictMode: true,
  
  webpack: (config, { isServer }) => {
    if (!isServer) {
      // Client-side configuration
      config.resolve.fallback = { 
        fs: false, 
        net: false, 
        tls: false,
        crypto: false,
      };
      
      // Fix MetaMask SES lockdown issue with @multiformats/multiaddr
      config.plugins.push(
        new webpack.NormalModuleReplacementPlugin(
          /@multiformats\/multiaddr\/dist\/src\/errors\.js$/,
          path.resolve(__dirname, 'lib/multiaddr-errors-patch.js')
        )
      );
    } else {
      // Server-side configuration
      // Let iexec SDK use Node.js native modules
      config.externals = [
        ...config.externals,
        'iexec',
        'ipfs-http-client',
        '@iexec/dataprotector',
      ];
    }
    
    // Common for both client and server
    config.externals.push("pino-pretty", "lokijs", "encoding");
    
    config.resolve.alias = {
      ...config.resolve.alias,
      "@react-native-async-storage/async-storage": false,
    };
    
    return config;
  },
};

module.exports = nextConfig;
