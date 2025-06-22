// get the ninja-keys element
const ninja = document.querySelector('ninja-keys');

// add the home and posts menu items
ninja.data = [{
    id: "nav-about",
    title: "about",
    section: "Navigation",
    handler: () => {
      window.location.href = "/";
    },
  },{id: "nav-bookshelf",
          title: "bookshelf",
          description: "",
          section: "Navigation",
          handler: () => {
            window.location.href = "/books/";
          },
        },{id: "nav-blog",
          title: "blog",
          description: "",
          section: "Navigation",
          handler: () => {
            window.location.href = "/blog/";
          },
        },{id: "nav-projects",
          title: "projects",
          description: "A few things I&#39;ve worked on. Slightly behind real-time, these are clean write-ups about completed projects.",
          section: "Navigation",
          handler: () => {
            window.location.href = "/projects/";
          },
        },{id: "nav-repositories",
          title: "repositories",
          description: "A few repos I&#39;d like to highlight.",
          section: "Navigation",
          handler: () => {
            window.location.href = "/repositories/";
          },
        },{id: "nav-cv",
          title: "cv",
          description: "",
          section: "Navigation",
          handler: () => {
            window.location.href = "/cv/";
          },
        },{id: "post-a-first-blog-post",
        
          title: "a first blog post",
        
        description: "My first post.",
        section: "Posts",
        handler: () => {
          
            window.location.href = "/blog/2025/post/";
          
        },
      },{id: "books-the-alignment-problem",
          title: 'The Alignment Problem',
          description: "",
          section: "Books",handler: () => {
              window.location.href = "/books/alignment/";
            },},{id: "books-principles-of-mathematical-analysis",
          title: 'Principles of Mathematical Analysis',
          description: "",
          section: "Books",handler: () => {
              window.location.href = "/books/baby_rudin/";
            },},{id: "books-designing-machine-learning-systems",
          title: 'Designing Machine Learning Systems',
          description: "",
          section: "Books",handler: () => {
              window.location.href = "/books/dmls/";
            },},{id: "books-probability-theory-and-examples",
          title: 'Probability Theory and Examples',
          description: "",
          section: "Books",handler: () => {
              window.location.href = "/books/durrett/";
            },},{id: "books-probabilistic-machine-learning",
          title: 'Probabilistic Machine Learning',
          description: "",
          section: "Books",handler: () => {
              window.location.href = "/books/probml/";
            },},{id: "news-updated-the-website",
          title: 'Updated the website!',
          description: "",
          section: "News",},{id: "news-obrag-version-0-1-0-is-now-out-on-pypi",
          title: 'OBRAG version 0.1.0 is now out on PyPI!',
          description: "",
          section: "News",},{id: "projects-obrag",
          title: 'OBRAG',
          description: "A local Obsidian-based RAG agent for querying your aggregated knowledge base.",
          section: "Projects",handler: () => {
              window.location.href = "/projects/obrag/";
            },},{
        id: 'social-email',
        title: 'email',
        section: 'Socials',
        handler: () => {
          window.open("mailto:%61%6F%70%61%74%72%69%63@%6D%69%74.%65%64%75", "_blank");
        },
      },{
        id: 'social-github',
        title: 'GitHub',
        section: 'Socials',
        handler: () => {
          window.open("https://github.com/aopatric", "_blank");
        },
      },{
        id: 'social-linkedin',
        title: 'LinkedIn',
        section: 'Socials',
        handler: () => {
          window.open("https://www.linkedin.com/in/angel-patricio", "_blank");
        },
      },{
      id: 'light-theme',
      title: 'Change theme to light',
      description: 'Change the theme of the site to Light',
      section: 'Theme',
      handler: () => {
        setThemeSetting("light");
      },
    },
    {
      id: 'dark-theme',
      title: 'Change theme to dark',
      description: 'Change the theme of the site to Dark',
      section: 'Theme',
      handler: () => {
        setThemeSetting("dark");
      },
    },
    {
      id: 'system-theme',
      title: 'Use system default theme',
      description: 'Change the theme of the site to System Default',
      section: 'Theme',
      handler: () => {
        setThemeSetting("system");
      },
    },];
