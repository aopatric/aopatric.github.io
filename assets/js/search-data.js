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
  },{id: "nav-papers",
          title: "papers",
          description: "A collection of both my published work as well as the published work in which I am acknowledged.",
          section: "Navigation",
          handler: () => {
            window.location.href = "/papers/";
          },
        },{id: "nav-projects",
          title: "projects",
          description: "Things I&#39;m working on, things I&#39;ve worked on, things I&#39;ve completed.",
          section: "Navigation",
          handler: () => {
            window.location.href = "/projects/";
          },
        },{id: "nav-blog",
          title: "blog",
          description: "",
          section: "Navigation",
          handler: () => {
            window.location.href = "/blog";
          },
        },{id: "nav-cv",
          title: "cv",
          description: "",
          section: "Navigation",
          handler: () => {
            window.location.href = "/cv/";
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
            },},{id: "projects-finding-the-edge-of-stability-for-llm-post-training",
          title: 'Finding the Edge of Stability for LLM Post-Training',
          description: "Investigating an extension of the Edge of Stability phenomena in the context of language model post-training. Instruction tuning task built from the Alpaca dataset, using the Pythia model suite for pre-trained, non-instruction-tuned model organisms.",
          section: "Projects",handler: () => {
              window.location.href = "/projects/post-training-EoS/";
            },},{
        id: 'social-email',
        title: 'email',
        section: 'Socials',
        handler: () => {
          window.open("mailto:%61%6F%70%61%74%72%69%63@%61%6C%75%6D.%6D%69%74.%65%64%75", "_blank");
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
