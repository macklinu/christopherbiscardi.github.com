const path = require(`path`);
const slugify = require("slugify");

exports.createPages = ({ graphql, actions }) => {
  const { createPage } = actions;
  return new Promise((resolve, reject) => {
    resolve(
      graphql(
        `
          {
            allMdx {
              edges {
                node {
                  id
                  fields {
                    slug
                    webmentionMatchURL
                  }
                  frontmatter {
                    slug
                    url
                    title
                    tags
                  }
                  parent {
                    ... on File {
                      name
                    }
                  }
                }
              }
            }
          }
        `
      ).then(result => {
        if (result.errors) {
          console.log(result.errors);
          reject(result.errors);
        }

        // Create blog posts pages.
        result.data.allMdx.edges.forEach(({ node }) => {
          const { frontmatter, parent, fields } = node;
          createPage({
            path: fields.slug,
            component: require.resolve("./src/blog-post"),
            context: {
              id: node.id,
              webmentionMatchURL: node.fields.webmentionMatchURL
            }
          });
        });
      })
    );
  });
};

exports.onCreateWebpackConfig = ({
  stage,
  rules,
  loaders,
  plugins,
  actions
}) => {
  actions.setWebpackConfig({
    module: {
      rules: [
        {
          test: /\.js$/,
          include: /@sens8/,
          use: [loaders.js()]
        }
      ]
    }
  });
};

exports.onCreateBabelConfig = ({ actions, stage }) => {
  actions.setBabelPreset({
    name: `@emotion/babel-preset-css-prop`,
    stage
  });
};

exports.onCreateNode = ({ node, actions, getNode }) => {
  const { createNodeField } = actions;

  if (node.internal.type === `Mdx`) {
    const { frontmatter } = node;
    const parent = getNode(node.parent);

    const slug =
      frontmatter.url ||
      `/post/${frontmatter.slug ||
        slugify(frontmatter.title, { lower: true, remove: /[*+~.()'"!:@]/g }) ||
        slugify(parent.name, { lower: true, remove: /[*+~.()'"!:@]/g })}`;

    createNodeField({
      name: `slug`,
      node,
      value: slug
    });

    createNodeField({
      name: `webmentionMatchURL`,
      node,
      value: `https://www.christopherbiscardi.com${slug}/`
    });
  }
};
