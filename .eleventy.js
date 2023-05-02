const CleanCSS = require("clean-css");
const { DateTime } = require("luxon");
const { minify } = require("terser");
const pluginBundle = require("@11ty/eleventy-plugin-bundle");
const pluginSyntaxHighlight = require("@11ty/eleventy-plugin-syntaxhighlight");
const { EleventyRenderPlugin } = require("@11ty/eleventy");
const pluginNavigation = require("@11ty/eleventy-navigation");
const inclusiveLangPlugin = require("@11ty/eleventy-plugin-inclusive-language");

module.exports = function (eleventyConfig) {
  eleventyConfig.addFilter("cssmin", function (code) {
    return new CleanCSS({}).minify(code).styles;
  });

  eleventyConfig.addPassthroughCopy("src/assets");
  eleventyConfig.addPassthroughCopy("src/favicon.ico");
  eleventyConfig.addPassthroughCopy("src/apple-touch-icon.png");
  eleventyConfig.addPassthroughCopy("src/manifest.json");

  eleventyConfig.addPlugin(pluginBundle);
  eleventyConfig.addPlugin(pluginSyntaxHighlight);
  eleventyConfig.addPlugin(EleventyRenderPlugin);
  eleventyConfig.addPlugin(pluginNavigation);
  eleventyConfig.addPlugin(inclusiveLangPlugin);

  eleventyConfig.setServerOptions({
    // Whether the live reload snippet is used
    liveReload: true,

    // Whether DOM diffing updates are applied where possible instead of page reloads
    domDiff: true,

    // The starting port number
    // Will increment up to (configurable) 10 times if a port is already in use.
    port: 8080,

    // Additional files to watch that will trigger server updates
    // Accepts an Array of file paths or globs (passed to `chokidar.watch`).
    // Works great with a separate bundler writing files to your output folder.
    // e.g. `watch: ["_site/**/*.css"]`
    watch: [],

    // Show local network IP addresses for device testing
    showAllHosts: false,

    // Use a local key/certificate to opt-in to local HTTP/2 with https
    https: {
      // key: "./localhost.key",
      // cert: "./localhost.cert",
    },

    // Change the default file encoding for reading/serving files
    encoding: "utf-8",

    // Show the dev server version number on the command line
    showVersion: false,
  });

  eleventyConfig.addNunjucksAsyncFilter(
    "jsmin",
    async function (code, callback) {
      try {
        const minified = await minify(code);
        callback(null, minified.code);
      } catch (err) {
        console.error("Terser error: ", err);
        // Fail gracefully.
        callback(null, code);
      }
    }
  );

  //  https://github.com/11ty/eleventy/issues/580
  eleventyConfig.addNunjucksFilter("absoluteUrl", (href, base) => {
    let { URL } = require("url");
    return new URL(href, base).toString();
  });

  // https://moment.github.io/luxon/#/formatting
  // https://github.com/moment/luxon/blob/master/docs/formatting.md#the-basics
  // https://developer.mozilla.org/en-US/docs/Web/HTML/Element/time
  eleventyConfig.addFilter("readableDate", (dateObj) => {
    return DateTime.fromJSDate(dateObj, { setZone: true })
      .setZone("Pacific/Auckland")
      .setLocale("en")
      .toFormat("dd LLLL yyyy");
  });

  eleventyConfig.addFilter("readableYear", (dateObj) => {
    return DateTime.fromJSDate(dateObj, { setZone: true })
      .setZone("Pacific/Auckland")
      .setLocale("en")
      .toFormat("yyyy");
  });

  eleventyConfig.addFilter("readableTime", (dateObj) => {
    return DateTime.fromJSDate(dateObj, { setZone: true })
      .setZone("Pacific/Auckland")
      .setLocale("en")
      .toFormat("t")
      .toLocaleLowerCase();
  });

  eleventyConfig.addFilter("htmlDateString", (dateObj) => {
    return DateTime.fromJSDate(dateObj, { setZone: true })
      .setZone("Pacific/Auckland")
      .setLocale("en")
      .toFormat("yyyy-LL-dd");
  });

  eleventyConfig.addCollection("speakers", (collection) => {
    return collection.getFilteredByTag("speaker");
  });

  eleventyConfig.addCollection("team", (collection) => {
    return collection
      .getFilteredByTag("team")
      .sort((a, b) => a.data.order - b.data.order);
  });

  // https://chriskirknielsen.com/blog/manage-your-svg-files-with-eleventys-render-plugin/#updated-method
  eleventyConfig.addAsyncShortcode(
    "svg",
    async function (filename, svgOptions = {}) {
      const isNjk = svgOptions.hasOwnProperty("isNjk")
        ? svgOptions.isNjk
        : true;
      const filePath = `./src/_includes/svg/${filename}.svg${
        isNjk ? ".njk" : ""
      }`;
      const engine = svgOptions.hasOwnProperty("engine")
        ? svgOptions.engine
        : isNjk
        ? "njk"
        : "html"; // HTML engine for vanilla SVG if none is provided
      const content = eleventyConfig.nunjucksAsyncShortcodes.renderFile(
        filePath,
        svgOptions,
        engine
      );
      return await content; // The await required since this is an async function!
    }
  );

  return {
    dir: {
      input: "src",
      output: "dist",
      includes: "_includes",
    },
    passthroughFileCopy: true,
    templateFormats: ["css", "html", "njk", "md"],
    htmlTemplateEngine: "njk",
    markdownTemplateEngine: "njk",
  };
};
