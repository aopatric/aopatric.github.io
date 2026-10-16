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
        },{id: "post-intact-interpretable-activations-for-reward-hacking",
        
          title: "IntAct (Interpretable Activations for Reward Hacking)",
        
        description: "Short writeup about the first version of IntAct.",
        section: "Posts",
        handler: () => {
          
            window.location.href = "/blog/2026/intact/";
          
        },
      },{id: "post-finding-the-edge-of-stability-for-llm-post-training",
        
          title: "Finding the Edge of Stability for LLM Post-Training",
        
        description: "Revisit of my 6.7960 term project investigating the EoS phenomenon in language model post-training. Null result, but learned a ton.",
        section: "Posts",
        handler: () => {
          
            window.location.href = "/blog/2026/edge-of-stability/";
          
        },
      },{id: "post-fall-2026-checkpoint",
        
          title: "fall 2026 checkpoint",
        
        description: "What I&#39;ve been up to since graduating, and what&#39;s next.",
        section: "Posts",
        handler: () => {
          
            window.location.href = "/blog/2026/fall-update/";
          
        },
      },{id: "news-blog-post-detailing-my-revisit-of-the-edge-of-stability-in-language-model-post-training-is-live-read-it-here",
          title: 'Blog post detailing my revisit of the Edge of Stability in language model...',
          description: "",
          section: "News",},{id: "news-aopatric-toy-transformers-updated-to-include-one-layer-attention-only-walkthrough",
          title: 'aopatric/toy-transformers updated to include one-layer attention-only walkthrough.',
          description: "",
          section: "News",},{id: "news-made-a-blog-post-on-intact-my-library-for-handling-batch-quantities-of-activations-for-reward-hacking-in-qwen-read-it-here",
          title: 'Made a blog post on intact, my library for handling batch quantities of...',
          description: "",
          section: "News",},{
        id: 'social-github',
        title: 'GitHub',
        section: 'Socials',
        handler: () => {
          window.open("https://github.com/aopatric", "_blank");
        },
      },{
        id: 'social-email',
        title: 'email',
        section: 'Socials',
        handler: () => {
          window.open("mailto:%61%6F%70%61%74%72%69%63@%6D%69%74.%65%64%75", "_blank");
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
