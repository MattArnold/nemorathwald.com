const eleventyNavigationPlugin = require("@11ty/eleventy-navigation");


module.exports = function(eleventyConfig) {

  eleventyConfig.addPlugin(eleventyNavigationPlugin);
  eleventyConfig.addPassthroughCopy('src/img')


  const {
    DateTime
  } = require("luxon");

  // https://html.spec.whatwg.org/multipage/common-microsyntaxes.html#valid-date-string
    eleventyConfig.addFilter('htmlDateString', (dateObj) => {
      return DateTime.fromJSDate(dateObj, {
        zone: 'utc'
      }).toFormat('yy-MM-dd');
    });

    eleventyConfig.addFilter("readableDate", dateObj => {
      const { DateTime } = require("luxon");
      if (typeof dateObj === "string") {
        return DateTime.fromISO(dateObj, { zone: 'utc' }).toFormat("LLLL d, yyyy");
      }
      return DateTime.fromJSDate(dateObj, { zone: 'utc' }).toFormat("LLLL d, yyyy");
    });

  // Add a collection for blog posts
  eleventyConfig.addCollection('posts', function(collectionApi) {
    return collectionApi.getFilteredByGlob('src/blog/posts/*.md').sort((a, b) => b.date - a.date);
  });

  // Add a collection for all unique tags
  eleventyConfig.addCollection('allTags', function(collectionApi) {
    const tagSet = new Set();
    collectionApi.getFilteredByGlob('src/blog/posts/*.md').forEach(item => {
      if (Array.isArray(item.data.tags)) {
        item.data.tags.forEach(tag => tagSet.add(tag));
      }
    });
    return Array.from(tagSet).sort((a, b) => a.localeCompare(b, undefined, {sensitivity: 'base'}));
  });

  return {
    dir: { input: 'src', output: '_site' }
  };
};
