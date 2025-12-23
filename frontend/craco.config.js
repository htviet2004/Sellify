module.exports = {
  devServer: (devServerConfig) => {
    devServerConfig.allowedHosts = "all"; // hoặc ['localhost']
    return devServerConfig;
  },
};
