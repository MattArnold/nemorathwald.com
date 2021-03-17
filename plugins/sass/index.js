module.exports = {
  onPreBuild: async ({ utils: { run } }) => {
    await run.command(
      "sass scss/main.scss css/main.css"
    );
  },
};