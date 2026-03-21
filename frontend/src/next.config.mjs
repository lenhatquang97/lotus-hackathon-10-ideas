import { config } from "dotenv";
config({ path: "../.env" });

/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ["@met4citizen/talkinghead"],
  webpack: (config, { webpack }) => {
    // TalkingHead uses dynamic import() for lipsync modules like:
    //   import('./lipsync-' + lang + '.mjs')
    // Webpack can't resolve these in node_modules by default.
    // ContextReplacementPlugin tells webpack where to find them.
    config.plugins.push(
      new webpack.ContextReplacementPlugin(
        /[@/\\]met4citizen[/\\]talkinghead[/\\]modules/,
        /^\.\/lipsync-.*\.mjs$/
      )
    );
    return config;
  },
};

export default nextConfig;
